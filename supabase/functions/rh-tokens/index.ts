// Supabase Edge Function: rh-tokens
// ---------------------------------
// Public proxy for Robinhood Chain's tokenized-stock feed. The browser can't
// call api.robinhood.com directly (CORS), so the Watcher page calls this
// instead. No API key is needed for this feed, it's a plain read-through
// proxy with a short in-memory cache so we don't hammer the upstream.
//
// Endpoints (GET):
//   /rh-tokens            → all active tokens, each merged with its live quote
//   /rh-tokens?symbol=NVDA → a single token + quote (used for detail/refresh)
//
// Deploy:  supabase functions deploy rh-tokens --no-verify-jwt
//   (--no-verify-jwt keeps the Watcher public, anyone can read prices.)

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const RH_BASE = "https://api.robinhood.com/rhj";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
const SPARK_POINTS = 40;
const ASSETS_TTL = 5 * 60 * 1000; // asset list barely changes
const QUOTE_TTL = 15 * 1000; // prices: 15s, matches upstream cache
const PRICE_CONCURRENCY = 12; // stay well under the 60 req/s budget

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

// ---- upstream shapes (only the fields we use) ----
interface RhDeployment {
  contractAddress: string;
  chainId: number;
  networkName: string;
}
interface RhAsset {
  id: string;
  tokenSymbol: string;
  tokenName: string;
  logoUrl?: string;
  status: string;
  isin?: string;
  deployments?: RhDeployment[];
  tradingCapabilities?: {
    market?: { whole?: string; fractional?: string };
  };
}
interface RhQuote {
  tokenSymbol: string;
  bid?: number;
  ask?: number;
  currency?: string;
  dailyHigh?: number;
  dailyLow?: number;
  dailyTradingVolume?: number;
  isTradingHalt?: boolean;
  generatedAt?: string;
}

// ---- normalized shape returned to the frontend ----
interface Token {
  symbol: string;
  name: string;
  logoUrl: string | null;
  bid: number | null;
  ask: number | null;
  mid: number | null;
  dailyHigh: number | null;
  dailyLow: number | null;
  volume: number | null;
  halted: boolean;
  isin: string | null;
  contractAddress: string | null;
  chainId: number | null;
  generatedAt: string | null;
  change24h: number | null;
  spark: number[];
}

// ---- tiny module-level cache (survives while the instance is warm) ----
let assetsCache: { at: number; data: RhAsset[] } | null = null;
const quoteCache = new Map<string, { at: number; data: RhQuote | null }>();

async function getAssets(): Promise<RhAsset[]> {
  if (assetsCache && Date.now() - assetsCache.at < ASSETS_TTL) return assetsCache.data;
  const res = await fetch(`${RH_BASE}/assets`, { headers: { accept: "application/json" } });
  if (!res.ok) throw new Error(`assets upstream ${res.status}`);
  const json = await res.json();
  const data: RhAsset[] = Array.isArray(json?.assets) ? json.assets : [];
  assetsCache = { at: Date.now(), data };
  return data;
}

async function getQuote(symbol: string): Promise<RhQuote | null> {
  const cached = quoteCache.get(symbol);
  if (cached && Date.now() - cached.at < QUOTE_TTL) return cached.data;
  try {
    const res = await fetch(`${RH_BASE}/prices/${encodeURIComponent(symbol)}`, {
      headers: { accept: "application/json" },
    });
    if (!res.ok) throw new Error(String(res.status));
    const json = await res.json();
    const q: RhQuote | null = Array.isArray(json?.quotes) ? json.quotes[0] ?? null : null;
    quoteCache.set(symbol, { at: Date.now(), data: q });
    return q;
  } catch {
    // keep any stale value rather than nothing; else cache the miss briefly
    quoteCache.set(symbol, { at: Date.now(), data: cached?.data ?? null });
    return cached?.data ?? null;
  }
}

/** Fetch quotes for many symbols without blowing the rate budget. */
async function getQuotes(symbols: string[]): Promise<Map<string, RhQuote | null>> {
  const out = new Map<string, RhQuote | null>();
  for (let i = 0; i < symbols.length; i += PRICE_CONCURRENCY) {
    const chunk = symbols.slice(i, i + PRICE_CONCURRENCY);
    const results = await Promise.all(chunk.map((s) => getQuote(s)));
    chunk.forEach((s, j) => out.set(s, results[j]));
  }
  return out;
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

function merge(asset: RhAsset, q: RhQuote | null): Token {
  const dep = asset.deployments?.[0] ?? null;
  const bid = num(q?.bid);
  const ask = num(q?.ask);
  const mid = bid != null && ask != null ? (bid + ask) / 2 : bid ?? ask;
  return {
    symbol: asset.tokenSymbol,
    name: (asset.tokenName ?? asset.tokenSymbol).replace(/\s*[•·]\s*Robinhood Token\s*$/i, "").trim(),
    logoUrl: asset.logoUrl ?? null,
    bid,
    ask,
    mid,
    dailyHigh: num(q?.dailyHigh),
    dailyLow: num(q?.dailyLow),
    volume: num(q?.dailyTradingVolume),
    halted: Boolean(q?.isTradingHalt),
    isin: asset.isin ?? null,
    contractAddress: dep?.contractAddress ?? null,
    chainId: dep?.chainId ?? null,
    generatedAt: q?.generatedAt ?? null,
    change24h: null,
    spark: [],
  };
}

/** Evenly sample an array down to at most n points, keeping first and last. */
function downsample(arr: number[], n: number): number[] {
  if (arr.length <= n) return arr;
  const out: number[] = [];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

/**
 * Attach 24h change + sparkline from price_history (written by rh-snapshot).
 * Best-effort: if the table/RPC isn't there yet, tokens keep change=null,
 * spark=[] and the Watcher simply shows no trend until history accrues.
 */
async function enrich(tokens: Token[]): Promise<void> {
  if (!SUPABASE_URL || !ANON_KEY) return;
  try {
    const sb = createClient(SUPABASE_URL, ANON_KEY, { auth: { persistSession: false } });
    const { data, error } = await sb.rpc("price_series_24h");
    if (error || !Array.isArray(data)) return;
    const series = new Map<string, { first: number; points: number[] }>();
    for (const r of data as { symbol: string; first_mid: number | null; points: number[] | null }[]) {
      if (r.first_mid == null) continue;
      series.set(r.symbol, { first: r.first_mid, points: (r.points ?? []).filter((p) => p != null) });
    }
    for (const t of tokens) {
      const s = series.get(t.symbol);
      if (!s) continue;
      const points = t.mid != null ? [...s.points, t.mid] : s.points;
      t.spark = downsample(points, SPARK_POINTS);
      if (t.mid != null && s.first) t.change24h = ((t.mid - s.first) / s.first) * 100;
    }
  } catch {
    // no history yet, leave defaults
  }
}

function isActive(a: RhAsset): boolean {
  if (a.status && a.status !== "ASSET_STATUS_ACTIVE") return false;
  return Boolean(a.tokenSymbol);
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "content-type": "application/json", "cache-control": "public, max-age=15" },
    });

  try {
    const url = new URL(req.url);
    const one = url.searchParams.get("symbol");

    const assets = (await getAssets()).filter(isActive);

    if (one) {
      const asset = assets.find((a) => a.tokenSymbol.toUpperCase() === one.toUpperCase());
      if (!asset) return json({ error: "unknown symbol" }, 404);
      const q = await getQuote(asset.tokenSymbol);
      return json({ token: merge(asset, q), generatedAt: new Date().toISOString() });
    }

    const quotes = await getQuotes(assets.map((a) => a.tokenSymbol));
    const tokens = assets
      .map((a) => merge(a, quotes.get(a.tokenSymbol) ?? null))
      .sort((x, y) => (y.volume ?? 0) - (x.volume ?? 0));

    await enrich(tokens);

    return json({ tokens, count: tokens.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    return json({ error: "feed unavailable", detail: String(err) }, 502);
  }
});
