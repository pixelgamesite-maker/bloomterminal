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

// Turn a Supabase/network failure into something a human can act on.
function explain(error: { message?: string; code?: string } | null): string {
  const m = (error?.message ?? "").toLowerCase();
  if (m.includes("failed to fetch") || m.includes("networkerror") || m.includes("load failed")) {
    return "Can't reach the server. The claim backend may be paused or blocked, try again shortly, or in a browser without ad/privacy blockers.";
  }
  if ((error?.code ?? "") === "PGRST202" || m.includes("could not find the function")) {
    return "Claim isn't set up yet on the server. (claim.sql hasn't been run.)";
  }
  if (m.includes("permission denied")) {
    return "The claim backend isn't open to the public yet (permissions).";
  }
  return error?.message ?? "Something went wrong.";
}

export async function claimStats(): Promise<ClaimStats> {
  if (!supabase) return { taken: 0, total: 1000, remaining: 1000 };
  try {
    const { data } = await supabase.rpc("claim_stats");
    return (data as ClaimStats) ?? { taken: 0, total: 1000, remaining: 1000 };
  } catch {
    return { taken: 0, total: 1000, remaining: 1000 };
  }
}

export async function claimCheck(wallet: string): Promise<ClaimResult> {
  if (!supabase) return { ok: false, error: "Claim isn't configured yet." };
  try {
    const { data, error } = await supabase.rpc("claim_check", { p_wallet: wallet });
    if (error) return { ok: false, error: explain(error) };
    return (data as ClaimResult) ?? { ok: false, error: "No response." };
  } catch (e) {
    return { ok: false, error: explain({ message: String(e) }) };
  }
}

export async function claimSpot(wallet: string): Promise<ClaimResult> {
  if (!supabase) return { ok: false, error: "Claim isn't configured yet." };
  try {
    const { data, error } = await supabase.rpc("claim_spot", { p_wallet: wallet });
    if (error) return { ok: false, error: explain(error) };
    return (data as ClaimResult) ?? { ok: false, error: "No response." };
  } catch (e) {
    return { ok: false, error: explain({ message: String(e) }) };
  }
}

// ---- communities (images live in /public/communities) ----
export interface Community {
  name: string;
  img: string;
}

// Display names match the real community names in the allowlist sheet.
export const COMMUNITIES: Community[] = [
  { name: "Argonauts", img: "/communities/Argonauts.AVIF" },
  { name: "Clay Stonkz", img: "/communities/Clay.AVIF" },
  { name: "Crawlers", img: "/communities/Crawlers.AVIF" },
  { name: "Credits", img: "/communities/Credits.AVIF" },
  { name: "Farming Season", img: "/communities/Farming.AVIF" },
  { name: "Fugz", img: "/communities/Fugz.AVIF" },
  { name: "God Pull", img: "/communities/God.AVIF" },
  { name: "Gremlin Cartel", img: "/communities/Gremlin.WEBP" },
  { name: "Internet Monkes", img: "/communities/Internet.AVIF" },
  { name: "Monkey Hood", img: "/communities/MonkeyHood.AVIF" },
  { name: "NPC", img: "/communities/Normies.AVIF" },
  { name: "Original Blokyz", img: "/communities/Blokyz.AVIF" },
  { name: "Pyopyopyopyo", img: "/communities/Pyopyopyopyo.AVIF" },
  { name: "Quotrons", img: "/communities/Quotrons.AVIF" },
  { name: "Rare Friends", img: "/communities/Rare.AVIF" },
  { name: "Rekt Tradooor", img: "/communities/Rekt.WEBP" },
  { name: "Slippy Club", img: "/communities/Slippy.AVIF" },
  { name: "The Mutual Fun", img: "/communities/Mutual.PNG" },
  { name: "Vaultlings", img: "/communities/Vaultlings.AVIF" },
  { name: "Yield Field Deeds", img: "/communities/Yield.AVIF" },
];

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const byKey = new Map(COMMUNITIES.map((c) => [norm(c.name), c]));

// Also resolve the short forms (and a couple of spelling variants) in case a
// name comes back trimmed differently from the sheet.
const ALIASES: Record<string, string> = {
  blokyz: "Original Blokyz",
  clay: "Clay Stonkz",
  farming: "Farming Season",
  god: "God Pull",
  gremlin: "Gremlin Cartel",
  internet: "Internet Monkes",
  monkeyhood: "Monkey Hood",
  normies: "NPC",
  rare: "Rare Friends",
  rekt: "Rekt Tradooor",
  slippy: "Slippy Club",
  mutual: "The Mutual Fun",
  yield: "Yield Field Deeds",
};
for (const [alias, canonical] of Object.entries(ALIASES)) {
  const c = byKey.get(norm(canonical));
  if (c) byKey.set(alias, c);
}

/** Image + canonical name for a community name coming back from the RPC. */
export function communityOf(name: string): Community {
  return byKey.get(norm(name)) ?? { name, img: "" };
}
