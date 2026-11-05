// Whitelist application: fully public, no sign-in. Submits the applicant's X
// handle, wallet and the two engagement links to the `whitelist` table via
// submit_whitelist() (see supabase/whitelist.sql).

import { supabase } from "./supabase";

export const X_LINK_RE = /^https?:\/\/(x\.com|twitter\.com)\/[^/]+\/status\/\d+/i;
export const EVM_RE = /^0x[0-9a-fA-F]{40}$/;

export interface WhitelistInput {
  wallet: string;
  quote: string;
  comment: string;
}

/** Submit the application. Public, no auth. Handle is derived from the quote link. */
export async function submitWhitelist(
  i: WhitelistInput
): Promise<{ ok: boolean; error?: string }> {
  if (!supabase) return { ok: false, error: "Not connected." };
  try {
    const { data, error } = await supabase.rpc("submit_whitelist", {
      p_wallet: i.wallet.trim(),
      p_quote: i.quote.trim(),
      p_comment: i.comment.trim(),
    });
    if (error) {
      const m = error.message?.toLowerCase() ?? "";
      if (m.includes("failed to fetch") || m.includes("networkerror")) {
        return { ok: false, error: "Can't reach the server, try again shortly." };
      }
      if (error.code === "PGRST202" || m.includes("could not find the function")) {
        return { ok: false, error: "Whitelist isn't set up yet on the server." };
      }
      return { ok: false, error: error.message };
    }
    return (data ?? { ok: false, error: "No response." }) as { ok: boolean; error?: string };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
