// Supabase Edge Function: crypto
// ------------------------------
// Public proxy for a live crypto markets feed (CoinGecko). Mirrors the shape
// rh-tokens returns so the Watcher can switch between tokenized stocks and
// crypto with one toggle. CoinGecko gives 24h change + a 7d sparkline inline,
// so crypto needs no snapshot cron.
//
// No key required on the free tier, but server IPs can get rate-limited. If
// that happens, add a free CoinGecko demo key:
//   supabase secrets set COINGECKO_API_KEY=CG-xxxx
//
// Deploy (public):  supabase functions deploy crypto --no-verify-jwt

const CG_BASE = "https://api.coingecko.com/api/v3";
const CG_KEY = Deno.env.get("COINGECKO_API_KEY") ?? "";
const TTL = 60 * 1000; // 1 min; keeps us inside the free rate budget
const PER_PAGE = 50; // top N by market cap
const SPARK_POINTS = 40;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};

interface CgCoin {
  id: string;
  symbol: string;
  name: string;
  image?: string;
  current_price?: number;
  market_cap?: number;
  total_volume?: number;
  high_24h?: number;
  low_24h?: number;
  price_change_percentage_24h?: number;
  last_updated?: string;
  sparkline_in_7d?: { price?: number[] };
}

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
  marketCap: number | null;
}

let cache: { at: number; data: Token[] } | null = null;

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function downsample(arr: number[], n: number): number[] {
  if (!Array.isArray(arr) || arr.length <= n) return Array.isArray(arr) ? arr : [];
  const out: number[] = [];
  const step = (arr.length - 1) / (n - 1);
  for (let i = 0; i < n; i++) out.push(arr[Math.round(i * step)]);
  return out;
}

function map(c: CgCoin): Token {
  return {
    symbol: (c.symbol ?? "").toUpperCase(),
    name: c.name ?? c.symbol ?? "",
    logoUrl: c.image ?? null,
    bid: null,
    ask: null,
    mid: num(c.current_price),
    dailyHigh: num(c.high_24h),
    dailyLow: num(c.low_24h),
    volume: num(c.total_volume),
    halted: false,
    isin: null,
    contractAddress: null,
    chainId: null,
    generatedAt: c.last_updated ?? null,
    change24h: num(c.price_change_percentage_24h),
    spark: downsample(c.sparkline_in_7d?.price ?? [], SPARK_POINTS),
    marketCap: num(c.market_cap),
  };
}

async function getCoins(): Promise<Token[]> {
  if (cache && Date.now() - cache.at < TTL) return cache.data;
  const url =
    `${CG_BASE}/coins/markets?vs_currency=usd&order=market_cap_desc` +
    `&per_page=${PER_PAGE}&page=1&sparkline=true&price_change_percentage=24h`;
  const res = await fetch(url, {
    headers: {
      accept: "application/json",
      ...(CG_KEY ? { "x-cg-demo-api-key": CG_KEY } : {}),
    },
  });
  if (!res.ok) throw new Error(`coingecko ${res.status}`);
  const json = await res.json();
  if (!Array.isArray(json)) throw new Error("unexpected coingecko payload");
  const data = (json as CgCoin[]).map(map).filter((t) => t.symbol && t.mid != null);
  cache = { at: Date.now(), data };
  return data;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "content-type": "application/json", "cache-control": "public, max-age=30" },
    });
  try {
    const tokens = await getCoins();
    return json({ tokens, count: tokens.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    // serve stale if we have it, so a transient rate-limit doesn't blank the page
    if (cache) return json({ tokens: cache.data, count: cache.data.length, generatedAt: new Date(cache.at).toISOString(), stale: true });
    return json({ error: "crypto feed unavailable", detail: String(err) }, 502);
  }
});
