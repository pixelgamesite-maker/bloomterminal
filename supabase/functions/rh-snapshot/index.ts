// Supabase Edge Function: rh-snapshot
// -----------------------------------
// Writes one price_history row per token, capturing the current mid/bid/ask.
// Meant to be called on a schedule (every ~5 min). It pulls the already
// normalized list from the public rh-tokens function, so there's a single
// source of truth for the feed, then bulk-inserts with the service role.
//
// Deploy (keep it NON-public so only the cron's service-role JWT can call it):
//   supabase functions deploy rh-snapshot
//
// Scheduling: see supabase/price_history.sql.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

interface Token {
  symbol: string;
  mid: number | null;
  bid: number | null;
  ask: number | null;
}

Deno.serve(async () => {
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

  try {
    // 1. current feed from the public proxy
    const res = await fetch(`${SUPABASE_URL}/functions/v1/rh-tokens`, {
      headers: { apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
    });
    if (!res.ok) throw new Error(`rh-tokens ${res.status}`);
    const { tokens } = (await res.json()) as { tokens: Token[] };

    const rows = (tokens ?? [])
      .filter((t) => t.mid != null)
      .map((t) => ({ symbol: t.symbol, mid: t.mid, bid: t.bid, ask: t.ask }));

    if (rows.length === 0) return json({ inserted: 0, note: "no priced tokens" });

    // 2. persist
    const sb = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
    const { error } = await sb.from("price_history").insert(rows);
    if (error) throw error;

    // 3. light retention: ~2% of runs, trim anything older than 30 days
    if (Math.random() < 0.02) {
      const cutoff = new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString();
      await sb.from("price_history").delete().lt("captured_at", cutoff);
    }

    return json({ inserted: rows.length, at: new Date().toISOString() });
  } catch (err) {
    return json({ error: String(err) }, 500);
  }
});
