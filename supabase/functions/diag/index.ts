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
      .limit(8);
    out.profilesCount = pc;
    out.profilesWithUsername = (profiles ?? []).filter((p) => p.x_username).length;
    out.profileSample = (profiles ?? []).map((p) => ({
      username: mask(p.x_username),
      hasXUserId: Boolean(p.x_user_id),
      walletVerified: p.wallet_verified,
    }));

    const { data: refs, count: rc } = await sb
      .from("referrals")
      .select("referrer_id, referred_user_id, status, created_at", { count: "exact" })
      .order("created_at", { ascending: false })
      .limit(8);
    out.referralsCount = rc;
    out.referralSample = (refs ?? []).map((r) => ({
      status: r.status,
      hasReferrer: Boolean(r.referrer_id),
      hasReferred: Boolean(r.referred_user_id),
      selfReferral: r.referrer_id === r.referred_user_id,
    }));

    // Does resolve_referrer find anyone for the first real username?
    const firstUser = (profiles ?? []).find((p) => p.x_username)?.x_username ?? null;
    if (firstUser) {
      const { data: resolved, error } = await sb.rpc("resolve_referrer", { handle: firstUser });
      out.resolveTest = { input: mask(firstUser), resolvedToSomeId: Boolean(resolved), error: error?.message ?? null };
    } else {
      out.resolveTest = "no username to test";
    }
  } catch (err) {
    out.error = String(err);
  }
  return new Response(JSON.stringify(out, null, 2), { headers: cors });
});
