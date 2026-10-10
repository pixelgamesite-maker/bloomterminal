// Supabase Edge Function: crypto
// ------------------------------
// The "crypto" side of the Watcher = tokens that actually live on Robinhood
// Chain (the Pons launchpad ecosystem), priced from their on-chain DEX pools.
// Data comes from GeckoTerminal's public on-chain API (no key), which indexes
// Robinhood Chain's DEXes. We list the network's top pools by 24h volume,
// dedupe to one row per token, and normalize to the same shape rh-tokens uses.
//
// Deploy (public):  supabase functions deploy crypto --no-verify-jwt

const GT = "https://api.geckoterminal.com/api/v2";
const NET_OVERRIDE = Deno.env.get("ONCHAIN_NETWORK") ?? ""; // e.g. "robinhood"
const LIST_TTL = 60 * 1000;
const NET_TTL = 60 * 60 * 1000;
const PAGES = 3; // 20 pools/page
const SPARK_POINTS = 40;
// tokens we don't want to show as "coins" (quote/wrapped/stable assets)
const QUOTES = new Set(["WETH", "ETH", "USDG", "USDC", "USDT", "DAI", "WBTC"]);

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const GT_HEADERS = { accept: "application/json;version=20230302" };

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

let netCache: { slug: string; at: number } | null = null;
let listCache: { at: number; data: Token[] } | null = null;

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Find GeckoTerminal's network slug for Robinhood Chain (cached). */
async function resolveNetwork(): Promise<string> {
  if (netCache && Date.now() - netCache.at < NET_TTL) return netCache.slug;
  if (NET_OVERRIDE) {
    netCache = { slug: NET_OVERRIDE, at: Date.now() };
    return NET_OVERRIDE;
  }
  // Try the obvious slug first (cheap), confirm it has pools.
  for (const guess of ["robinhood", "robinhood-chain", "robinhoodchain"]) {
    try {
      const r = await fetch(`${GT}/networks/${guess}/pools?page=1`, { headers: GT_HEADERS });
      if (r.ok) {
        const j = await r.json();
        if (Array.isArray(j?.data) && j.data.length) {
          netCache = { slug: guess, at: Date.now() };
          return guess;
        }
      }
    } catch { /* keep trying */ }
  }
  // Otherwise scan the network directory for anything named "robinhood".
  for (let page = 1; page <= 15; page++) {
    const r = await fetch(`${GT}/networks?page=${page}`, { headers: GT_HEADERS });
    if (!r.ok) break;
    const j = await r.json();
    const rows: { id: string; attributes?: { name?: string } }[] = j?.data ?? [];
    if (!rows.length) break;
    const hit = rows.find(
      (n) => /robin\s*hood/i.test(n.attributes?.name ?? "") || /robinhood/i.test(n.id ?? "")
    );
    if (hit) {
      netCache = { slug: hit.id, at: Date.now() };
      return hit.id;
    }
  }
  throw new Error("Robinhood Chain not found on GeckoTerminal");
}

type GtIncluded = { id: string; type: string; attributes?: Record<string, unknown> };

async function fetchPools(net: string): Promise<Token[]> {
  const byToken = new Map<string, { t: Token; liq: number }>();

  for (let page = 1; page <= PAGES; page++) {
    const url =
      `${GT}/networks/${net}/pools?page=${page}&include=base_token` +
      `&sort=h24_volume_usd_desc`;
    const r = await fetch(url, { headers: GT_HEADERS });
    if (!r.ok) break;
    const j = await r.json();
    const pools: GtIncluded[] = j?.data ?? [];
    const included: GtIncluded[] = j?.included ?? [];
    if (!pools.length) break;

    const tokenById = new Map<string, GtIncluded>();
    for (const inc of included) if (inc.type === "token") tokenById.set(inc.id, inc);

    for (const p of pools) {
      const a = (p.attributes ?? {}) as Record<string, unknown>;
      const rel = (p as unknown as { relationships?: { base_token?: { data?: { id?: string } } } })
        .relationships;
      const baseId = rel?.base_token?.data?.id;
      const tok = baseId ? tokenById.get(baseId) : undefined;
      const ta = (tok?.attributes ?? {}) as Record<string, unknown>;

      const symbol = String(ta.symbol ?? "").toUpperCase();
      if (!symbol || QUOTES.has(symbol)) continue;

      const price = num(a.base_token_price_usd);
      if (price == null) continue;

      const liq = num(a.reserve_in_usd) ?? 0;
      const pc = (a.price_change_percentage ?? {}) as Record<string, unknown>;
      const vol = (a.volume_usd ?? {}) as Record<string, unknown>;
      const addr = String(ta.address ?? "");

      const token: Token = {
        symbol,
        name: String(ta.name ?? symbol),
        logoUrl: typeof ta.image_url === "string" && !ta.image_url.includes("missing") ? ta.image_url : null,
        bid: null,
        ask: null,
        mid: price,
        dailyHigh: null,
        dailyLow: null,
        volume: num(vol.h24),
        halted: false,
        isin: null,
        contractAddress: addr || null,
        chainId: 4663,
        generatedAt: null,
        change24h: num(pc.h24),
        spark: [],
        marketCap: num(a.market_cap_usd) ?? num(a.fdv_usd),
      };

      const key = addr || symbol;
      const prev = byToken.get(key);
      if (!prev || liq > prev.liq) byToken.set(key, { t: token, liq });
    }
  }

  return [...byToken.values()]
    .map((x) => x.t)
    .sort((a, b) => (b.volume ?? 0) - (a.volume ?? 0));
}

async function getList(): Promise<Token[]> {
  if (listCache && Date.now() - listCache.at < LIST_TTL) return listCache.data;
  const net = await resolveNetwork();
  const data = await fetchPools(net);
  listCache = { at: Date.now(), data };
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
    const tokens = await getList();
    return json({ tokens, count: tokens.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    if (listCache) {
      return json({ tokens: listCache.data, count: listCache.data.length, generatedAt: new Date(listCache.at).toISOString(), stale: true });
    }
    return json({ error: "crypto feed unavailable", detail: String(err) }, 502);
  }
});
