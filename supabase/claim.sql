-- Bloom Terminal, community claim
-- -------------------------------
-- A public claim page (/claim): paste a wallet, see the community you're
-- eligible for, claim one of 1000 first-come-first-serve spots.
--
-- SETUP (once, in the Supabase SQL editor):
--   1. Run this whole file (creates the tables + functions).
--   2. Import the eligibility CSV into `claim_allowlist`:
--      Table editor -> claim_allowlist -> Insert -> Import data from CSV.
--      Map the CSV's "Holder address" column to `wallet` and
--      "Communities" to `community`. (A wallet may appear in several rows.)
--
-- Access is only through the SECURITY DEFINER functions below (granted to
-- anon), so the browser can check/claim without exposing the full list.

create table if not exists public.claim_allowlist (
  wallet    text not null,
  community text not null
);
create index if not exists claim_allowlist_wallet_idx on public.claim_allowlist (lower(wallet));

create table if not exists public.claims (
  wallet      text primary key,          -- stored lowercase
  communities text[] not null default '{}',
  claimed_at  timestamptz not null default now()
);

alter table public.claim_allowlist enable row level security;
alter table public.claims          enable row level security;
-- no policies: reach these only through the functions below.

-- Total number of spots.
create or replace function public.claim_spots_total() returns int
  language sql immutable as $$ select 1000 $$;

-- Check a wallet: is it eligible, which communities, already claimed, spots left.
create or replace function public.claim_check(p_wallet text)
returns jsonb language plpgsql security definer set search_path = public stable as $$
declare
  w     text := lower(btrim(coalesce(p_wallet, '')));
  comms text[];
  taken int;
begin
  if w !~ '^0x[0-9a-f]{40}$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid wallet address.');
  end if;
  select array_agg(distinct community order by community) into comms
    from public.claim_allowlist where lower(wallet) = w;
  select count(*) into taken from public.claims;
  return jsonb_build_object(
    'ok', true,
    'eligible', coalesce(array_length(comms, 1), 0) > 0,
    'communities', coalesce(comms, '{}'),
    'claimed', exists (select 1 from public.claims where wallet = w),
    'taken', taken,
    'total', claim_spots_total(),
    'remaining', greatest(claim_spots_total() - taken, 0)
  );
end $$;

-- Claim a spot. First come first serve; the advisory lock makes the cap exact.
create or replace function public.claim_spot(p_wallet text)
returns jsonb language plpgsql security definer set search_path = public volatile as $$
declare
  w     text := lower(btrim(coalesce(p_wallet, '')));
  comms text[];
  taken int;
begin
  if w !~ '^0x[0-9a-f]{40}$' then
    return jsonb_build_object('ok', false, 'error', 'Enter a valid wallet address.');
  end if;

  perform pg_advisory_xact_lock(982451653); -- serialize concurrent claims

  select array_agg(distinct community order by community) into comms
    from public.claim_allowlist where lower(wallet) = w;
  if coalesce(array_length(comms, 1), 0) = 0 then
    return jsonb_build_object('ok', false, 'error', 'This wallet is not on the list.');
  end if;

  select count(*) into taken from public.claims;

  if exists (select 1 from public.claims where wallet = w) then
    return jsonb_build_object('ok', true, 'already', true, 'communities', comms,
      'taken', taken, 'total', claim_spots_total(), 'remaining', greatest(claim_spots_total() - taken, 0));
  end if;

  if taken >= claim_spots_total() then
    return jsonb_build_object('ok', false, 'error', 'All 1000 spots are claimed.',
      'taken', taken, 'total', claim_spots_total(), 'remaining', 0);
  end if;

  insert into public.claims (wallet, communities) values (w, comms);
  taken := taken + 1;
  return jsonb_build_object('ok', true, 'claimed', true, 'communities', comms,
    'taken', taken, 'total', claim_spots_total(), 'remaining', greatest(claim_spots_total() - taken, 0));
end $$;

-- Lightweight counter for the page header.
create or replace function public.claim_stats()
returns jsonb language sql security definer set search_path = public stable as $$
  select jsonb_build_object(
    'taken', (select count(*) from public.claims),
    'total', claim_spots_total(),
    'remaining', greatest(claim_spots_total() - (select count(*) from public.claims), 0)
  );
$$;

grant execute on function public.claim_spots_total()      to anon, authenticated;
grant execute on function public.claim_check(text)        to anon, authenticated;
grant execute on function public.claim_spot(text)         to anon, authenticated;
grant execute on function public.claim_stats()            to anon, authenticated;
