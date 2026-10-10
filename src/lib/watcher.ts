// Watcher data access. Talks to the `rh-tokens` Supabase Edge Function, which
// proxies Robinhood Chain's tokenized-stock feed (see supabase/functions/
// rh-tokens). This stays public, no sign-in needed to read prices.

import { env } from "./config";

/** Which market the Watcher is showing. */
export type Market = "stocks" | "crypto";

export interface Token {
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
  /** Percent change over the last 24h (null until history accrues). */
  change24h: number | null;
  /** Downsampled mids for the row sparkline. */
  spark: number[];
  /** USD market cap (crypto only; null for stocks). */
  marketCap?: number | null;
}

export interface TokensResponse {
  tokens: Token[];
  count: number;
  generatedAt: string;
}

export interface NftCollection {
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
  // USD-normalized (floors/volumes come in mixed tokens: ETH, USDG, ...)
  floorUsd?: number | null;
  oneDayVolumeUsd?: number | null;
  totalVolumeUsd?: number | null;
  // present on the detail endpoint
  sevenDayVolume?: number | null;
  sevenDayVolumeUsd?: number | null;
  thirtyDayVolume?: number | null;
  sales?: number | null;
  description?: string | null;
}

export interface NftsResponse {
  collections: NftCollection[];
  count: number;
  generatedAt: string;
}

const FN = (name: string) => (env.supabaseUrl ? `${env.supabaseUrl}/functions/v1/${name}` : "");
const ENDPOINT: Record<Market, string> = { stocks: "rh-tokens", crypto: "crypto" };

export class WatcherError extends Error {}

/** Live markets for the chosen side: tokenized stocks or crypto. */
export async function fetchTokens(market: Market = "stocks", signal?: AbortSignal): Promise<TokensResponse> {
  const url = FN(ENDPOINT[market]);
  if (!url) {
    throw new WatcherError(
      "Price feed isn't wired up yet. Set VITE_SUPABASE_URL and deploy the feed functions."
    );
  }
  const res = await fetch(url, {
    signal,
    headers: env.supabaseAnonKey
      ? { apikey: env.supabaseAnonKey, authorization: `Bearer ${env.supabaseAnonKey}` }
      : {},
  });
  if (!res.ok) {
    throw new WatcherError(`Feed returned ${res.status}. The watcher is taking a short break.`);
  }
  const data = (await res.json()) as TokensResponse & { error?: string };
  if (data.error) throw new WatcherError(data.error);
  return data;
}

/** NFT collections on Robinhood Chain (via the nfts Edge Function / OpenSea). */
export async function fetchNfts(signal?: AbortSignal): Promise<NftsResponse> {
  const url = FN("nfts");
  if (!url) throw new WatcherError("Set VITE_SUPABASE_URL and deploy the nfts function.");
  const res = await fetch(url, {
    signal,
    headers: env.supabaseAnonKey
      ? { apikey: env.supabaseAnonKey, authorization: `Bearer ${env.supabaseAnonKey}` }
      : {},
  });
  const data = (await res.json().catch(() => ({}))) as NftsResponse & { error?: string };
  if (!res.ok || data.error) {
    throw new WatcherError(data.error ?? `Feed returned ${res.status}.`);
  }
  return data;
}

/** Live detail for a single collection (adds 7d/30d volume, sales, description). */
export async function fetchNftDetail(slug: string, signal?: AbortSignal): Promise<NftCollection> {
  const base = FN("nfts");
  if (!base) throw new WatcherError("NFT feed isn't configured.");
  const res = await fetch(`${base}?slug=${encodeURIComponent(slug)}`, {
    signal,
    headers: env.supabaseAnonKey
      ? { apikey: env.supabaseAnonKey, authorization: `Bearer ${env.supabaseAnonKey}` }
      : {},
  });
  const data = (await res.json().catch(() => ({}))) as { collection?: NftCollection; error?: string };
  if (!res.ok || data.error || !data.collection) {
    throw new WatcherError(data.error ?? `Detail returned ${res.status}.`);
  }
  return data.collection;
}

// ---- display helpers ----

const DASH = "-";

/** Price with sensible decimals: more for sub-dollar tokens. */
export function fmtUsd(v: number | null): string {
  if (v == null) return DASH;
  const digits = v < 1 ? 4 : 2;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

export function fmtCompact(v: number | null): string {
  if (v == null) return DASH;
  return v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

/** Compact USD, e.g. "$1.2B". For market cap / crypto volume. */
export function fmtUsdCompact(v: number | null | undefined): string {
  if (v == null) return DASH;
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

/** Signed percent, e.g. "+1.24%" / "-0.80%". */
export function fmtPct(v: number | null): string {
  if (v == null) return DASH;
  const sign = v > 0 ? "+" : "";
  return `${sign}${v.toFixed(2)}%`;
}

/** A native-token amount with its symbol, e.g. "0.0042 ETH". */
export function fmtNative(v: number | null, symbol: string | null): string {
  if (v == null) return DASH;
  const s =
    v >= 1 ? v.toLocaleString("en-US", { maximumFractionDigits: 3 })
    : v >= 0.0001 ? v.toFixed(4)
    : v.toPrecision(2);
  return symbol ? `${s} ${symbol}` : s;
}

/** Plain integer with grouping, e.g. "1,662". */
export function fmtInt(v: number | null): string {
  if (v == null) return DASH;
  return Math.round(v).toLocaleString("en-US");
}

/** Spread as a percent of mid, a rough liquidity tell. */
export function spreadPct(t: Token): number | null {
  if (t.bid == null || t.ask == null || !t.mid) return null;
  return ((t.ask - t.bid) / t.mid) * 100;
}

/** Where the mid sits in the day's range, 0 (at low) to 1 (at high). */
export function rangePos(t: Token): number | null {
  if (t.dailyLow == null || t.dailyHigh == null || t.mid == null || t.dailyHigh <= t.dailyLow) {
    return null;
  }
  return Math.max(0, Math.min(1, (t.mid - t.dailyLow) / (t.dailyHigh - t.dailyLow)));
}
