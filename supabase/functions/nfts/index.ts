// Supabase Edge Function: nfts
// ----------------------------
// NFT collections on Robinhood Chain, from OpenSea's API v2.
//
// The chain has more collections than we can stat on every page load (OpenSea
// gives floor/volume only per-collection), so this function keeps a Supabase
// table (nft_collections) warm in the background: a list request reads the
// WHOLE table instantly (sorted by floor), and triggers a refresh when the
// data is stale. ?slug=<slug> returns one collection's live detail.
//
// Needs a free OpenSea key:  supabase secrets set OPENSEA_API_KEY=xxxx
// Needs the table:           run supabase/nft_collections.sql once.
// Deploy (public reads):     supabase functions deploy nfts --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const OS = "https://api.opensea.io/api/v2";
const KEY = Deno.env.get("OPENSEA_API_KEY") ?? "";
const CHAIN_OVERRIDE = Deno.env.get("OPENSEA_CHAIN") ?? "";
const SEED_SLUG = Deno.env.get("OPENSEA_SEED") || "robindoodnft";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

const FRESH_TTL = 15 * 60 * 1000; // refresh the table at most this often
const MAX_PAGES = 60; // collections pages (100 each) = safety cap
const STATS_CONCURRENCY = 10;

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, apikey, content-type, x-client-info",
};
const osHeaders = () => ({ accept: "application/json", "x-api-key": KEY });
const sb = SUPABASE_URL && SERVICE_KEY ? createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } }) : null;

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
  floorUsd?: number | null;
  oneDayVolumeUsd?: number | null;
  totalVolumeUsd?: number | null;
  // detail-only extras
  sevenDayVolume?: number | null;
  sevenDayVolumeUsd?: number | null;
  thirtyDayVolume?: number | null;
  sales?: number | null;
  description?: string | null;
}

function num(v: unknown): number | null {
  const n = typeof v === "string" ? parseFloat(v) : typeof v === "number" ? v : NaN;
  return Number.isFinite(n) ? n : null;
}

// ---- USD normalization (floors/volumes come in ETH, USDG, ... ) ----
const STABLES = new Set(["USDG", "USDC", "USDT", "DAI", "USD", "GUSD"]);
let ethCache: { usd: number; at: number } | null = null;

async function getEthUsd(): Promise<number | null> {
  if (ethCache && Date.now() - ethCache.at < 5 * 60 * 1000) return ethCache.usd;
  try {
    const r = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot", { headers: { accept: "application/json" } });
    if (r.ok) {
      const j = await r.json();
      const p = num(j?.data?.amount);
      if (p) { ethCache = { usd: p, at: Date.now() }; return p; }
    }
  } catch { /* ignore */ }
  return ethCache?.usd ?? null;
}

function toUsd(amount: number | null, symbol: string | null, eth: number | null): number | null {
  if (amount == null) return null;
  const s = (symbol ?? "").toUpperCase();
  if (STABLES.has(s)) return amount;
  if (s === "ETH" || s === "WETH") return eth != null ? amount * eth : null;
  return null; // unknown token: can't price in USD
}

/** Attach USD-normalized figures so the Watcher can rank across currencies. */
function priceUsd(c: NftCollection, eth: number | null): NftCollection {
  return {
    ...c,
    floorUsd: toUsd(c.floor, c.floorSymbol, eth),
    oneDayVolumeUsd: toUsd(c.oneDayVolume, c.floorSymbol, eth),
    totalVolumeUsd: toUsd(c.totalVolume, c.floorSymbol, eth),
    sevenDayVolumeUsd: toUsd(c.sevenDayVolume ?? null, c.floorSymbol, eth),
  };
}

/** Drop dead/empty collections (the "just minted, 2 owners, no trades" noise). */
function isReal(c: NftCollection): boolean {
  return (c.owners ?? 0) >= 10 || (c.oneDayVolumeUsd ?? 0) >= 1 || (c.totalVolumeUsd ?? 0) >= 5;
}

let chainCache: { slug: string; at: number } | null = null;
async function resolveChain(): Promise<string> {
  if (CHAIN_OVERRIDE) return CHAIN_OVERRIDE;
  if (chainCache && Date.now() - chainCache.at < 60 * 60 * 1000) return chainCache.slug;
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
  return "robinhood";
}

interface OsCollection { collection: string; name?: string; image_url?: string; total_supply?: number; description?: string }

async function listAllCollections(chain: string): Promise<OsCollection[]> {
  const out: OsCollection[] = [];
  let next = "";
  for (let i = 0; i < MAX_PAGES; i++) {
    // The `next` cursor can contain characters that must be URL-encoded,
    // otherwise page 2 400s and we silently stop at the newest 100.
    const url = `${OS}/collections?chain=${encodeURIComponent(chain)}&limit=100${next ? `&next=${encodeURIComponent(next)}` : ""}`;
    const r = await fetch(url, { headers: osHeaders() });
    if (!r.ok) break;
    const j = await r.json();
    const rows: OsCollection[] = j?.collections ?? [];
    out.push(...rows);
    next = j?.next ?? "";
    if (!next || !rows.length) break;
  }
  return out;
}

async function statsFor(c: OsCollection): Promise<NftCollection | null> {
  try {
    const r = await fetch(`${OS}/collections/${c.collection}/stats`, { headers: osHeaders() });
    const s = r.ok ? await r.json() : null;
    const total = s?.total ?? {};
    const intervals: { interval?: string; volume?: number }[] = s?.intervals ?? [];
    const byInt = (k: string) => num(intervals.find((x) => x.interval === k)?.volume);
    return {
      slug: c.collection,
      name: c.name ?? c.collection,
      image: c.image_url ?? null,
      floor: num(total.floor_price),
      floorSymbol: typeof total.floor_price_symbol === "string" ? total.floor_price_symbol : null,
      oneDayVolume: byInt("one_day"),
      totalVolume: num(total.volume),
      owners: num(total.num_owners),
      items: num(c.total_supply),
      url: `https://opensea.io/collection/${c.collection}`,
      sevenDayVolume: byInt("seven_day"),
      thirtyDayVolume: byInt("thirty_day"),
      sales: num(total.sales),
      description: typeof c.description === "string" ? c.description : null,
    };
  } catch {
    return null;
  }
}

async function mapLimit<T, R>(items: T[], limit: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = [];
  for (let i = 0; i < items.length; i += limit) {
    const res = await Promise.all(items.slice(i, i + limit).map(fn));
    out.push(...res);
  }
  return out;
}

let refreshing = false;

/**
 * Full refresh: pull every collection + stats, upserting progressively so a
 * long index survives an early exit (partial data persists, next run resumes).
 */
async function refreshAll(): Promise<void> {
  if (!sb || refreshing) return;
  refreshing = true;
  try {
    const chain = await resolveChain();
    const base = await listAllCollections(chain);
    for (let i = 0; i < base.length; i += STATS_CONCURRENCY) {
      const chunk = base.slice(i, i + STATS_CONCURRENCY);
      const res = (await Promise.all(chunk.map(statsFor))).filter((x): x is NftCollection => !!x);
      if (!res.length) continue;
      const now = new Date().toISOString();
      const rows = res.map((c) => ({
        slug: c.slug, name: c.name, image: c.image, floor: c.floor, floor_symbol: c.floorSymbol,
        one_day_volume: c.oneDayVolume, total_volume: c.totalVolume, owners: c.owners, items: c.items, updated_at: now,
      }));
      await sb.from("nft_collections").upsert(rows, { onConflict: "slug" });
    }
  } finally {
    refreshing = false;
  }
}

type Row = {
  slug: string; name: string | null; image: string | null; floor: number | null; floor_symbol: string | null;
  one_day_volume: number | null; total_volume: number | null; owners: number | null; items: number | null; updated_at: string;
};

function rowToCollection(r: Row): NftCollection {
  return {
    slug: r.slug, name: r.name ?? r.slug, image: r.image, floor: r.floor, floorSymbol: r.floor_symbol,
    oneDayVolume: r.one_day_volume, totalVolume: r.total_volume, owners: r.owners, items: r.items,
    url: `https://opensea.io/collection/${r.slug}`,
  };
}

function background(p: Promise<unknown>) {
  // Keep the instance alive to finish the refresh after responding.
  const er = (globalThis as unknown as { EdgeRuntime?: { waitUntil?: (p: Promise<unknown>) => void } }).EdgeRuntime;
  if (er?.waitUntil) er.waitUntil(p);
  else p.catch(() => {});
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...cors, "content-type": "application/json", "cache-control": "public, max-age=60" },
    });

  if (!KEY) {
    return json({ error: "NFT feed needs an OpenSea API key. Set OPENSEA_API_KEY in Supabase secrets." }, 503);
  }

  const eth = await getEthUsd();
  const url = new URL(req.url);
  const slug = url.searchParams.get("slug");
  const force = url.searchParams.get("refresh") === "1";

  // ---- detail: live single collection ----
  if (slug) {
    try {
      const rc = await fetch(`${OS}/collections/${slug}`, { headers: osHeaders() });
      const col = rc.ok ? await rc.json() : null;
      const detail = await statsFor({
        collection: slug,
        name: col?.name,
        image_url: col?.image_url,
        total_supply: col?.total_supply,
        description: col?.description,
      });
      if (!detail) return json({ error: "collection not found" }, 404);
      return json({ collection: priceUsd(detail, eth), generatedAt: new Date().toISOString() });
    } catch (err) {
      return json({ error: "detail unavailable", detail: String(err) }, 502);
    }
  }

  // ---- list: whole table, sorted by floor ----
  try {
    if (!sb) {
      // No DB configured: fall back to a live top slice so the tab still works.
      const chain = await resolveChain();
      const base = (await listAllCollections(chain)).slice(0, 50);
      const live = (await mapLimit(base, STATS_CONCURRENCY, statsFor))
        .filter((x): x is NftCollection => !!x)
        .map((c) => priceUsd(c, eth))
        .filter(isReal);
      live.sort((a, b) => (b.floorUsd ?? -1) - (a.floorUsd ?? -1));
      return json({ collections: live, count: live.length, generatedAt: new Date().toISOString(), source: "live" });
    }

    // Force a full re-index (used after a fix / to repopulate). Progressive
    // upserts mean even a partial run improves the table.
    if (force) {
      await refreshAll();
    }

    const { data, error } = await sb
      .from("nft_collections")
      .select("*")
      .order("floor", { ascending: false, nullsFirst: false })
      .limit(2000);
    if (error) throw error;

    const rows = (data as Row[]) ?? [];
    const collections = rows.map(rowToCollection).map((c) => priceUsd(c, eth)).filter(isReal);
    const newest = rows.reduce((m, r) => Math.max(m, Date.parse(r.updated_at)), 0);
    const stale = !rows.length || Date.now() - newest > FRESH_TTL;

    if (!rows.length) {
      // Cold start: fill now so the first visitor sees data.
      await refreshAll();
      const { data: d2 } = await sb
        .from("nft_collections").select("*").order("floor", { ascending: false, nullsFirst: false }).limit(2000);
      const c2 = ((d2 as Row[]) ?? []).map(rowToCollection).map((c) => priceUsd(c, eth)).filter(isReal);
      return json({ collections: c2, count: c2.length, generatedAt: new Date().toISOString(), source: "fresh" });
    }

    if (stale) background(refreshAll());
    return json({ collections, count: collections.length, generatedAt: new Date(newest).toISOString(), refreshing: stale });
  } catch (err) {
    return json({ error: "nft feed unavailable", detail: String(err) }, 502);
  }
});
