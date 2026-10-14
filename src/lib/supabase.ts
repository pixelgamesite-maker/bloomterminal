import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isBackendConfigured } from "./config";
import { getRef, clearRef } from "./referral";

/*
 * Supabase client. Null until VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are
 * set in .env.local, the app then uses real X OAuth. PKCE flow + session
 * detection in the URL handles the OAuth redirect back from X automatically.
 */
export const supabase: SupabaseClient | null = isBackendConfigured
  ? createClient(env.supabaseUrl, env.supabaseAnonKey, {
      auth: {
        flowType: "pkce",
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

export interface ProfileRow {
  id: string;
  x_username: string | null;
  x_profile_image: string | null;
  wallet_address: string | null;
  wallet_verified: boolean;
  eligibility_status: "pending" | "eligible";
  completed_tasks: string[] | null;
}

/** Load the signed-in user's profile row (created by the handle_new_user trigger). */
export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, x_username, x_profile_image, wallet_address, wallet_verified, eligibility_status, completed_tasks")
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
}

/** Persist the set of completed task keys (social tasks) to the profile. */
export async function saveCompletedTasks(userId: string, keys: string[]) {
  if (!supabase) return;
  try {
    await supabase.from("profiles").update({ completed_tasks: keys }).eq("id", userId);
  } catch {
    /* best-effort */
  }
}

// --- Worker (agent) persistence ---
import type { MarketKind, Worker, WorkerClass, WorkerStatus } from "./types";

interface WorkerRow {
  id: string;
  name: string;
  class: WorkerClass;
  category: string;
  asset: string;
  status: WorkerStatus;
  base_earned: number;
  created_at: string;
  deployed_at: string | null;
}

function rowToWorker(r: WorkerRow): Worker {
  return {
    id: r.id,
    name: r.name,
    class: r.class,
    kind: r.category as MarketKind,
    asset: r.asset,
    status: r.status,
    createdAt: Date.parse(r.created_at) || Date.now(),
    deployedAt: r.deployed_at ? Date.parse(r.deployed_at) : null,
    baseEarned: Number(r.base_earned) || 0,
  };
}

/** The user's agent, if they've already picked one (one-time, locked). */
export async function loadWorker(userId: string): Promise<Worker | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("workers")
    .select("id, name, class, category, asset, status, base_earned, created_at, deployed_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  return data ? rowToWorker(data as WorkerRow) : null;
}

/** Persist a newly chosen agent; returns the stored id (or null on failure). */
export async function insertWorker(
  userId: string,
  w: { name: string; cls: WorkerClass; kind: MarketKind; asset: string }
): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("workers")
    .insert({
      user_id: userId,
      name: w.name,
      class: w.cls,
      category: w.kind,
      asset: w.asset,
      status: "active",
      deployed_at: new Date().toISOString(),
    })
    .select("id")
    .single();
  if (error) return null;
  return (data as { id: string }).id;
}

/** Update an agent's run status (active/paused). */
export async function updateWorkerStatus(workerId: string, status: WorkerStatus) {
  if (!supabase) return;
  try {
    await supabase.from("workers").update({ status }).eq("id", workerId);
  } catch {
    /* best-effort */
  }
}

export interface InviteRow {
  handle: string;
  walletVerified: boolean;
  eligible: boolean;
}

/**
 * On first sign-in through a referral link, attribute it: resolve the
 * inviter's id from their handle and insert a row into `referrals`.
 * Safe to call on every sign-in, it no-ops if already attributed.
 */
export async function attributeReferral(_userId: string, myHandle: string | null) {
  if (!supabase) return;
  const ref = getRef();
  const log = (...a: unknown[]) => console.log("[referral]", ...a);
  if (!ref) {
    log("no pending referral code; nothing to attribute");
    return;
  }
  if (myHandle && ref.toLowerCase() === myHandle.toLowerCase()) {
    log("self-referral ignored", { ref, myHandle });
    clearRef();
    return;
  }
  try {
    const { data, error } = await supabase.rpc("link_referral", { code: ref });
    if (error) {
      log("link_referral error; keeping ref for retry", error.message);
      return; // keep ref so a later load can retry
    }
    const res = (data ?? {}) as { ok: boolean; error?: string };
    if (res.ok) {
      log("attributed ✓", { referredBy: ref });
    } else {
      log("not attributed", res.error);
      // "already linked" / "own code" / "no such code" are terminal, stop retrying.
    }
  } catch (e) {
    log("unexpected error", e);
    return; // keep ref for a retry
  }
  clearRef();
}

/** The handle of whoever referred this user, or null if not referred. */
export async function loadReferredBy(userId: string): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("referrals")
    .select("referrer:profiles!referrals_referrer_id_fkey ( x_username )")
    .eq("referred_user_id", userId)
    .maybeSingle();
  const row = data as { referrer: { x_username: string | null } | null } | null;
  return row?.referrer?.x_username ?? null;
}

/**
 * Attribute a referral from a code the user TYPED IN (the reliable path, no
 * link / localStorage needed). The code is the inviter's handle.
 */
export async function submitReferralCode(
  _userId: string,
  code: string,
  _myHandle: string | null
): Promise<{ ok: boolean; error?: string; inviter?: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  const ref = code.replace(/^@/, "").trim();
  if (!ref) return { ok: false, error: "Enter a code." };
  try {
    // One trusted call: ensures our profile exists, sets direction from
    // auth.uid(), inserts the referral. Avoids the FK error and reversal.
    const { data, error } = await supabase.rpc("link_referral", { code: ref });
    if (error) return { ok: false, error: error.message };
    const res = (data ?? {}) as { ok: boolean; error?: string; inviter?: string };
    if (res.ok) clearRef();
    return res;
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/** The people this user referred, with whether they've bound a wallet / are eligible. */
export async function loadInvites(userId: string): Promise<InviteRow[]> {
  if (!supabase) return [];
  const { data } = await supabase
    .from("referrals")
    .select(
      "created_at, referred:profiles!referrals_referred_user_id_fkey ( x_username, wallet_verified, eligibility_status )"
    )
    .eq("referrer_id", userId)
    .order("created_at", { ascending: true });

  type Row = {
    referred: { x_username: string | null; wallet_verified: boolean; eligibility_status: string } | null;
  };
  return ((data as Row[] | null) ?? []).map((r) => ({
    handle: r.referred?.x_username ?? "friend",
    walletVerified: Boolean(r.referred?.wallet_verified),
    eligible: r.referred?.eligibility_status === "eligible",
  }));
}

/** Push the user's eligibility to their profile so their inviter can see it. */
export async function pushEligibility(userId: string, eligible: boolean) {
  if (!supabase) return;
  try {
    await supabase
      .from("profiles")
      .update({ eligibility_status: eligible ? "eligible" : "pending" })
      .eq("id", userId);
  } catch {
    /* no-op */
  }
}
