// Community claim: talks to the claim_* RPCs (see supabase/claim.sql).
// Public, no sign-in. The allowlist lives server-side; we only ever see the
// wallet we asked about.

import { supabase } from "./supabase";

export interface ClaimResult {
  ok: boolean;
  error?: string;
  eligible?: boolean;
  communities?: string[];
  claimed?: boolean; // already claimed (check) / just claimed (spot)
  already?: boolean; // claim_spot: was already claimed
  taken?: number;
  total?: number;
  remaining?: number;
}

export interface ClaimStats {
  taken: number;
  total: number;
  remaining: number;
}

export const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

export async function claimStats(): Promise<ClaimStats> {
  if (!supabase) return { taken: 0, total: 1000, remaining: 1000 };
  const { data } = await supabase.rpc("claim_stats");
  return (data as ClaimStats) ?? { taken: 0, total: 1000, remaining: 1000 };
}

export async function claimCheck(wallet: string): Promise<ClaimResult> {
  if (!supabase) return { ok: false, error: "Claim isn't configured yet." };
  const { data, error } = await supabase.rpc("claim_check", { p_wallet: wallet });
  if (error) return { ok: false, error: error.message };
  return (data as ClaimResult) ?? { ok: false, error: "No response." };
}

export async function claimSpot(wallet: string): Promise<ClaimResult> {
  if (!supabase) return { ok: false, error: "Claim isn't configured yet." };
  const { data, error } = await supabase.rpc("claim_spot", { p_wallet: wallet });
  if (error) return { ok: false, error: error.message };
  return (data as ClaimResult) ?? { ok: false, error: "No response." };
}

// ---- communities (images live in /public/communities) ----
export interface Community {
  name: string;
  img: string;
}

export const COMMUNITIES: Community[] = [
  { name: "Argonauts", img: "/communities/Argonauts.AVIF" },
  { name: "Blokyz", img: "/communities/Blokyz.AVIF" },
  { name: "Clay", img: "/communities/Clay.AVIF" },
  { name: "Crawlers", img: "/communities/Crawlers.AVIF" },
  { name: "Credits", img: "/communities/Credits.AVIF" },
  { name: "Farming", img: "/communities/Farming.AVIF" },
  { name: "Fugz", img: "/communities/Fugz.AVIF" },
  { name: "God", img: "/communities/God.AVIF" },
  { name: "Gremlin", img: "/communities/Gremlin.WEBP" },
  { name: "Internet", img: "/communities/Internet.AVIF" },
  { name: "MonkeyHood", img: "/communities/MonkeyHood.AVIF" },
  { name: "Mutual", img: "/communities/Mutual.PNG" },
  { name: "Normies", img: "/communities/Normies.AVIF" },
  { name: "Pyopyopyopyo", img: "/communities/Pyopyopyopyo.AVIF" },
  { name: "Quotrons", img: "/communities/Quotrons.AVIF" },
  { name: "Rare", img: "/communities/Rare.AVIF" },
  { name: "Rekt", img: "/communities/Rekt.WEBP" },
  { name: "Slippy", img: "/communities/Slippy.AVIF" },
  { name: "Vaultlings", img: "/communities/Vaultlings.AVIF" },
  { name: "Yield", img: "/communities/Yield.AVIF" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const byKey = new Map(COMMUNITIES.map((c) => [norm(c.name), c]));

/** Image + canonical name for a community name coming back from the RPC. */
export function communityOf(name: string): Community {
  return byKey.get(norm(name)) ?? { name, img: "" };
}
