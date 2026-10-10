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
}

/** Load the signed-in user's profile row (created by the handle_new_user trigger). */
export async function loadProfile(userId: string): Promise<ProfileRow | null> {
  if (!supabase) return null;
  const { data } = await supabase
    .from("profiles")
    .select("id, x_username, x_profile_image, wallet_address, wallet_verified, eligibility_status")
    .eq("id", userId)
    .maybeSingle();
  return (data as ProfileRow) ?? null;
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
export async function attributeReferral(userId: string, myHandle: string | null) {
  if (!supabase) return;
  const ref = getRef();
  if (!ref) return;
  if (myHandle && ref.toLowerCase() === myHandle.toLowerCase()) {
    clearRef();
    return;
  }
  try {
    const { data: existing } = await supabase
      .from("referrals")
      .select("id")
      .eq("referred_user_id", userId)
      .maybeSingle();
    if (existing) {
      clearRef();
      return;
    }
    const { data: referrerId } = await supabase.rpc("resolve_referrer", { handle: ref });
    if (referrerId && referrerId !== userId) {
      await supabase
        .from("referrals")
        .insert({ referrer_id: referrerId, referred_user_id: userId, status: "connected" });
    }
  } catch {
    /* best-effort attribution */
  }
  clearRef();
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
