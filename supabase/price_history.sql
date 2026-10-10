-- Bloom Terminal, price history
-- ------------------------------
-- Periodic snapshots of each token's price so the Watcher can show a 24h
-- change and an intraday sparkline. Written by the `rh-snapshot` Edge
-- Function (service role), read by `rh-tokens` and anyone (prices are public).
--
-- Run this once in the Supabase SQL editor. Then deploy the functions and
-- set up the 5-minute cron at the bottom.

create table if not exists public.price_history (
  id          bigint generated always as identity primary key,
  symbol      text not null,
  mid         double precision,
  bid         double precision,
  ask         double precision,
  captured_at timestamptz not null default now()
);

create index if not exists price_history_symbol_time
  on public.price_history (symbol, captured_at desc);
create index if not exists price_history_time
  on public.price_history (captured_at desc);

alter table public.price_history enable row level security;

-- Prices are public information: anyone may read. Writes happen only through
-- the service role (which bypasses RLS), so there is no insert/update policy.
drop policy if exists "price_history read" on public.price_history;
create policy "price_history read"
  on public.price_history for select
  to anon, authenticated
  using (true);

-- Optional retention: drop snapshots older than 30 days. Safe to run anytime;
-- schedule it daily if you like (see cron note below).
-- delete from public.price_history where captured_at < now() - interval '30 days';


-- Per-symbol 24h series in a single round-trip. Returns one row per symbol:
-- the earliest mid in the window (for % change) and the ordered mids (the
-- Watcher downsamples these into a sparkline). rh-tokens calls this.
create or replace function public.price_series_24h()
returns table (symbol text, first_mid double precision, points double precision[])
language sql
stable
as $$
  select
    symbol,
    (array_agg(mid order by captured_at))[1] as first_mid,
    array_agg(mid order by captured_at)       as points
  from public.price_history
  where captured_at >= now() - interval '24 hours'
    and mid is not null
  group by symbol;
$$;

grant execute on function public.price_series_24h() to anon, authenticated;


-- ===========================================================================
-- SCHEDULING THE SNAPSHOTS
-- ===========================================================================
-- Two ways to call rh-snapshot every 5 minutes. Pick ONE.
--
-- OPTION A (no SQL, recommended): Supabase Dashboard
--   Integrations -> Cron -> Create job
--     Name:     rh-snapshot-5min
--     Schedule: */5 * * * *
--     Type:     Supabase Edge Function  ->  rh-snapshot
--   The dashboard handles auth for you. Done.
--
-- OPTION B (SQL via pg_cron + pg_net):
--   1. Dashboard -> Database -> Extensions: enable `pg_cron` and `pg_net`.
--   2. Store your SERVICE ROLE key in Vault (Dashboard -> Project Settings ->
--      Vault, or SQL below). Never hard-code it in this file.
--        select vault.create_secret('PASTE_SERVICE_ROLE_KEY', 'service_role_key');
--   3. Schedule the job (replace the URL only if your project ref differs):
--
--   select cron.schedule(
--     'rh-snapshot-5min',
--     '*/5 * * * *',
--     $$
--     select net.http_post(
--       url     := 'https://xllmacobisbbmyggbkwo.supabase.co/functions/v1/rh-snapshot',
--       headers := jsonb_build_object(
--         'Content-Type',  'application/json',
--         'Authorization', 'Bearer ' || (
--           select decrypted_secret from vault.decrypted_secrets
--           where name = 'service_role_key'
--         )
--       )
--     );
--     $$
--   );
--
--   To stop it later:  select cron.unschedule('rh-snapshot-5min');
