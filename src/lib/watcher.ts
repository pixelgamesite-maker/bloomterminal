// Watcher data access. Talks to the `rh-tokens` Supabase Edge Function, which
// proxies Robinhood Chain's tokenized-stock feed (see supabase/functions/
// rh-tokens). This stays public — no sign-in needed to read prices.

import { env } from "./config";

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
}

export interface TokensResponse {
  tokens: Token[];
  count: number;
  generatedAt: string;
}

const FN_URL = env.supabaseUrl ? `${env.supabaseUrl}/functions/v1/rh-tokens` : "";

export class WatcherError extends Error {}

/** All active tokenized stocks with live quotes, best-volume first. */
export async function fetchTokens(signal?: AbortSignal): Promise<TokensResponse> {
  if (!FN_URL) {
    throw new WatcherError(
      "Price feed isn't wired up yet. Set VITE_SUPABASE_URL and deploy the rh-tokens function."
    );
  }
  const res = await fetch(FN_URL, {
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

// ---- display helpers ----

export function fmtUsd(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

export function fmtCompact(v: number | null): string {
  if (v == null) return "—";
  return v.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 1 });
}

/** Spread as a percent of mid — a rough liquidity tell. */
export function spreadPct(t: Token): number | null {
  if (t.bid == null || t.ask == null || !t.mid) return null;
  return ((t.ask - t.bid) / t.mid) * 100;
}
