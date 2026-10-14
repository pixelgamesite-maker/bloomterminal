// Supabase Edge Function: diag (TEMPORARY)
// ----------------------------------------
// Read-only referral diagnostics. Reports counts + whether key fields are
// populated, with usernames masked so no PII leaks. Delete after debugging:
//   supabase functions delete diag
//
// Deploy:  supabase functions deploy diag --no-verify-jwt

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL") ?? "";
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const cors = { "Access-Control-Allow-Origin": "*", "content-type": "application/json" };

function mask(s: string | null): string {
  if (!s) return "(null)";
  return s.length <= 2 ? s[0] + "*" : s.slice(0, 2) + "*".repeat(Math.min(s.length - 2, 4));
}

Deno.serve(async () => {
  const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
  const out: Record<string, unknown> = {};
  try {
    const { data: profiles, count: pc } = await sb
      .from("profiles")
      .select("id, x_username, x_user_id, wallet_verified", { count: "exact" })
      .limit(50);
    out.profilesCount = pc;
    const byId = new Map((profiles ?? []).map((p) => [p.id as string, p]));

    // Auth users vs profiles: an auth user with no profile = FK error source.
    const { data: authData } = await sb.auth.admin.listUsers({ perPage: 100 });
    const authUsers = authData?.users ?? [];
    out.authUsersCount = authUsers.length;
    out.authUsersMissingProfile = authUsers
      .filter((u) => !byId.has(u.id))
      .map((u) => ({ username: mask((u.user_metadata?.user_name as string) ?? null) }));

    // Referrals WITH direction (masked handles).
    const { data: refs, count: rc } = await sb
      .from("referrals")
      .select("referrer_id, referred_user_id, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(20);
    out.referralsCount = rc;
    out.referrals = (refs ?? []).map((r) => ({
      referrer: mask((byId.get(r.referrer_id as string)?.x_username as string) ?? null),
      referred: mask((byId.get(r.referred_user_id as string)?.x_username as string) ?? null),
      referrerHasProfile: byId.has(r.referrer_id as string),
      referredHasProfile: byId.has(r.referred_user_id as string),
      status: r.status,
    }));
  } catch (err) {
    out.error = String(err);
  }
  return new Response(JSON.stringify(out, null, 2), { headers: cors });
});
