import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { env, isBackendConfigured } from "./config";

/*
 * Supabase client. Null until VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY are
 * set in .env.local — the app then uses real X OAuth. PKCE flow + session
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
