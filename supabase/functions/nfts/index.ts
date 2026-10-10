// Supabase Edge Function: nfts
// ----------------------------
// NFT collections on Robinhood Chain, from OpenSea's API v2 (which indexes
// the chain). Lists the chain's collections, pulls floor / volume / owners
// for each, and returns a normalized list the Watcher renders as cards.
//
// Needs a free OpenSea API key (https://docs.opensea.io, request an API key):
//   supabase secrets set OPENSEA_API_KEY=xxxxxxxx
//
// Deploy (public reads):  supabase functions deploy nfts --no-verify-jwt

const OS = "https://api.opensea.io/api/v2";
const KEY = Deno.env.get("OPENSEA_API_KEY") ?? "";
const CHAIN_OVERRIDE = Deno.env.get("OPENSEA_CHAIN") ?? "";
// A known Robinhood Chain collection, used to discover the chain slug.
const SEED_SLUG = Deno.env.get("OPENSEA_SEED") || "robindoodnft";
const TTL = 5 * 60 * 1000;
const CHAIN_TTL = 60 * 60 * 1000;
const MAX_COLLECTIONS = 48; // cap stats lookups
const STATS_CONCURRENCY = 6;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const osHeaders = () => ({ accept: "application/json", "x-api-key": KEY });

interface NftCollection {
  slug: string;
  name: string;
  image: string | null;
  floor: number | null;
  floorSymbol: string | null;
  oneDayVolume: number | null;
  totalVolume: number | null;
  owners: number | null;
  items: number | null;
  url: string;
}

let chainCache: { slug: string; at: number } | null = null;
let listCache: { at: number; data: NftCollection[] } | null = null;

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

/** Discover OpenSea's chain slug for Robinhood Chain from a seed collection. */
async function resolveChain(): Promise<string> {
  if (CHAIN_OVERRIDE) return CHAIN_OVERRIDE;
  if (chainCache && Date.now() - chainCache.at < CHAIN_TTL) return chainCache.slug;
  try {
    const r = await fetch(`${OS}/collections/${SEED_SLUG}`, { headers: osHeaders() });
    if (r.ok) {
      const j = await r.json();
      const chain: string | undefined = j?.contracts?.[0]?.chain;
      if (chain) {
        chainCache = { slug: chain, at: Date.now() };
        return chain;
      }
    }
  } catch { /* fall through */ }
  return "robinhood"; // best-effort fallback
}

interface OsCollection {
  collection: string; // slug
  name?: string;
  image_url?: string;
  total_supply?: number;
}

async function listCollections(chain: string): Promise<OsCollection[]> {
  const out: OsCollection[] = [];
  let next = "";
  for (let i = 0; i < 3 && out.length < MAX_COLLECTIONS; i++) {
    const url = `${OS}/collections?chain=${encodeURIComponent(chain)}&limit=100${next ? `&next=${next}` : ""}`;
    const r = await fetch(url, { headers: osHeaders() });
    if (!r.ok) break;
    const j = await r.json();
    const rows: OsCollection[] = j?.collections ?? [];
    out.push(...rows);
    next = j?.next ?? "";
    if (!next) break;
  }
  return out.slice(0, MAX_COLLECTIONS);
}

async function fetchStats(c: OsCollection): Promise<NftCollection | null> {
  try {
    const r = await fetch(`${OS}/collections/${c.collection}/stats`, { headers: osHeaders() });
    const s = r.ok ? await r.json() : null;
    const total = s?.total ?? {};
    const oneDay = (s?.intervals ?? []).find((x: { interval?: string }) => x.interval === "one_day");
    return {
      slug: c.collection,
      name: c.name ?? c.collection,
      image: c.image_url ?? null,
      floor: num(total.floor_price),
      floorSymbol: typeof total.floor_price_symbol === "string" ? total.floor_price_symbol : null,
      oneDayVolume: num(oneDay?.volume),
      totalVolume: num(total.volume),
      owners: num(total.num_owners),
      items: num(c.total_supply),
      url: `https://opensea.io/collection/${c.collection}`,
    };
  } catch {
    return null;
  }
}

async function getCollections(): Promise<NftCollection[]> {
  if (listCache && Date.now() - listCache.at < TTL) return listCache.data;
  const chain = await resolveChain();
  const base = await listCollections(chain);

  const stats: NftCollection[] = [];
  for (let i = 0; i < base.length; i += STATS_CONCURRENCY) {
    const chunk = base.slice(i, i + STATS_CONCURRENCY);
    const res = await Promise.all(chunk.map(fetchStats));
    for (const r of res) if (r) stats.push(r);
  }

  // Rank by recent activity, then all-time, then owners, so live collections surface.
  stats.sort(
    (a, b) =>
      (b.oneDayVolume ?? 0) - (a.oneDayVolume ?? 0) ||
      (b.totalVolume ?? 0) - (a.totalVolume ?? 0) ||
      (b.owners ?? 0) - (a.owners ?? 0)
  );

  listCache = { at: Date.now(), data: stats };
  return stats;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "content-type": "application/json", "cache-control": "public, max-age=120" },
    });

  if (!KEY) {
    return json({ error: "NFT feed needs an OpenSea API key. Set OPENSEA_API_KEY in Supabase secrets." }, 503);
  }
  try {
    const collections = await getCollections();
    return json({ collections, count: collections.length, generatedAt: new Date().toISOString() });
  } catch (err) {
    if (listCache) {
      return json({ collections: listCache.data, count: listCache.data.length, generatedAt: new Date(listCache.at).toISOString(), stale: true });
    }
    return json({ error: "nft feed unavailable", detail: String(err) }, 502);
  }
});
