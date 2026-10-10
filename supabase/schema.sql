-- ============================================================================
--  The Bloom Herald, Supabase schema
--  Run this in the Supabase SQL editor (Dashboard → SQL → New query → Run).
--
--  ⚠️  DESTRUCTIVE FIRST STEP: this drops the tables from the previous
--      project (applications, crocpad, crocpad_proofs, shuffler_campaigns).
--      Everything in them is permanently removed. If you want a backup,
--      export those tables first. The rest of the file (idempotent) then
--      builds the Bloom Terminal schema.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 0. Clear the old project
-- ---------------------------------------------------------------------------
drop table if exists public.applications      cascade;
drop table if exists public.crocpad           cascade;
drop table if exists public.crocpad_proofs    cascade;
drop table if exists public.shuffler_campaigns cascade;

-- ---------------------------------------------------------------------------
-- 1. Extensions + enums
-- ---------------------------------------------------------------------------
create extension if not exists pgcrypto;

do $$ begin
  create type eligibility_status as enum ('pending', 'eligible');
exception when duplicate_object then null; end $$;

do $$ begin
  create type mission_type as enum ('social', 'onchain', 'network', 'terminal');
exception when duplicate_object then null; end $$;

do $$ begin
  create type user_mission_status as enum ('pending', 'completed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type worker_class as enum ('scout', 'analyst', 'momentum', 'sentinel');
exception when duplicate_object then null; end $$;

do $$ begin
  create type worker_status as enum ('created', 'configured', 'ready', 'active', 'paused');
exception when duplicate_object then null; end $$;

do $$ begin
  create type referral_status as enum ('invited', 'connected', 'wallet_pending', 'active', 'eligible');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 2. updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Profiles (one row per authenticated X user)
--    Keyed to auth.users. Social identity + bound wallet + eligibility.
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id                 uuid primary key references auth.users(id) on delete cascade,
  x_user_id          text,
  x_username         text unique,
  x_profile_image    text,
  wallet_address     text,
  wallet_verified    boolean not null default false,
  eligibility_status eligibility_status not null default 'pending',
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index if not exists profiles_x_username_idx on public.profiles (lower(x_username));

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 4. Reward accounts (one per profile)
-- ---------------------------------------------------------------------------
create table if not exists public.reward_accounts (
  user_id           uuid primary key references public.profiles(id) on delete cascade,
  base_balance      numeric(20,4) not null default 0,
  locked_balance    numeric(20,4) not null default 0,
  claimable_balance numeric(20,4) not null default 0,
  claimed_total     numeric(20,4) not null default 0,
  multiplier        numeric(6,3)  not null default 1.0,
  updated_at        timestamptz   not null default now()
);

drop trigger if exists reward_accounts_updated_at on public.reward_accounts;
create trigger reward_accounts_updated_at before update on public.reward_accounts
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- 5. Missions (modular; edited from the backend) + user progress
-- ---------------------------------------------------------------------------
create table if not exists public.missions (
  id          uuid primary key default gen_random_uuid(),
  key         text unique not null,         -- stable code the app references
  title       text not null,
  description text,
  type        mission_type not null,
  reward      integer not null default 0,
  active      boolean not null default true,
  sort_order  integer not null default 0,
  start_date  timestamptz,
  end_date    timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.user_missions (
  user_id           uuid not null references public.profiles(id) on delete cascade,
  mission_id        uuid not null references public.missions(id) on delete cascade,
  status            user_mission_status not null default 'pending',
  completed_at      timestamptz,
  verification_data jsonb,
  primary key (user_id, mission_id)
);

-- ---------------------------------------------------------------------------
-- 6. Workers
-- ---------------------------------------------------------------------------
create table if not exists public.workers (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  class       worker_class not null,
  category    text not null,
  asset       text not null,
  status      worker_status not null default 'ready',
  base_earned numeric(20,4) not null default 0,
  created_at  timestamptz not null default now(),
  deployed_at timestamptz,
  paused_at   timestamptz
);
create index if not exists workers_user_idx on public.workers (user_id);

-- ---------------------------------------------------------------------------
-- 7. NFTs (Bloom NFT ownership + multiplier)
-- ---------------------------------------------------------------------------
create table if not exists public.nfts (
  token_id    text primary key,
  owner_id    uuid references public.profiles(id) on delete set null,
  owner_wallet text,
  collection  text,
  multiplier  numeric(6,3) not null default 1.25,
  traits      jsonb,
  minted_at   timestamptz not null default now()
);
create index if not exists nfts_owner_idx on public.nfts (owner_id);

-- ---------------------------------------------------------------------------
-- 8. Referrals (the agent network)
-- ---------------------------------------------------------------------------
create table if not exists public.referrals (
  id                uuid primary key default gen_random_uuid(),
  referrer_id       uuid not null references public.profiles(id) on delete cascade,
  referred_user_id  uuid not null references public.profiles(id) on delete cascade,
  status            referral_status not null default 'invited',
  created_at        timestamptz not null default now(),
  activated_at      timestamptz,
  unique (referred_user_id)   -- a user can be referred only once
);
create index if not exists referrals_referrer_idx on public.referrals (referrer_id);

-- ---------------------------------------------------------------------------
-- 9. Auto-provision profile + reward account on signup, pulling X metadata
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := new.raw_user_meta_data;
begin
  insert into public.profiles (id, x_user_id, x_username, x_profile_image)
  values (
    new.id,
    coalesce(meta->>'provider_id', meta->>'sub'),
    coalesce(meta->>'user_name', meta->>'preferred_username', meta->>'screen_name'),
    coalesce(meta->>'avatar_url', meta->>'picture')
  )
  on conflict (id) do nothing;

  insert into public.reward_accounts (user_id)
  values (new.id)
  on conflict (user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 10. Resolve a referrer by handle (used to attribute a referral at signup).
--     SECURITY DEFINER so a new user can look up the inviter without broad
--     read access to the profiles table.
-- ---------------------------------------------------------------------------
create or replace function public.resolve_referrer(handle text)
returns uuid language sql security definer set search_path = public stable as $$
  select id from public.profiles
  where lower(x_username) = lower(handle)
  limit 1;
$$;

-- ---------------------------------------------------------------------------
-- 11. Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles        enable row level security;
alter table public.reward_accounts enable row level security;
alter table public.missions        enable row level security;
alter table public.user_missions   enable row level security;
alter table public.workers         enable row level security;
alter table public.nfts            enable row level security;
alter table public.referrals       enable row level security;

-- profiles: owner reads/updates own row; also read profiles of people you referred
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (
    id = auth.uid()
    or id in (select referred_user_id from public.referrals where referrer_id = auth.uid())
  );
drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- reward_accounts: owner only
drop policy if exists reward_select_own on public.reward_accounts;
create policy reward_select_own on public.reward_accounts
  for select using (user_id = auth.uid());
drop policy if exists reward_update_own on public.reward_accounts;
create policy reward_update_own on public.reward_accounts
  for update using (user_id = auth.uid()) with check (user_id = auth.uid());

-- missions: readable by everyone (incl. anon landing page), no client writes
drop policy if exists missions_read_all on public.missions;
create policy missions_read_all on public.missions
  for select using (true);

-- user_missions: owner CRUD
drop policy if exists user_missions_all_own on public.user_missions;
create policy user_missions_all_own on public.user_missions
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- workers: owner CRUD
drop policy if exists workers_all_own on public.workers;
create policy workers_all_own on public.workers
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- nfts: owner reads/inserts own
drop policy if exists nfts_select_own on public.nfts;
create policy nfts_select_own on public.nfts
  for select using (owner_id = auth.uid());
drop policy if exists nfts_insert_own on public.nfts;
create policy nfts_insert_own on public.nfts
  for insert with check (owner_id = auth.uid());

-- referrals: inviter or invitee can read; invitee row created for self
drop policy if exists referrals_select_related on public.referrals;
create policy referrals_select_related on public.referrals
  for select using (referrer_id = auth.uid() or referred_user_id = auth.uid());
drop policy if exists referrals_insert_self on public.referrals;
create policy referrals_insert_self on public.referrals
  for insert with check (referred_user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 12. Seed the initial missions (safe to re-run)
-- ---------------------------------------------------------------------------
insert into public.missions (key, title, description, type, reward, sort_order) values
  ('follow',        'Follow Bloom on X',        'Follow @bloomterminal to stay in the loop.',      'social',  50, 1),
  ('repost',        'Repost the announcement',  'Amplify the launch post to your network.',        'social',  50, 2),
  ('comment',       'Comment on the pinned post','Leave a comment to verify engagement.',          'social',  25, 3),
  ('bind-wallet',   'Bind your wallet',         'Connect a wallet so rewards can be allocated.',   'onchain', 100, 4),
  ('invite-agents', 'Deploy 2 agents',          'Invite two users and get them active.',           'network', 150, 5)
on conflict (key) do nothing;

-- ============================================================================
--  Done. Tables: profiles, reward_accounts, missions, user_missions, workers,
--  nfts, referrals. RLS is on; the browser anon key can only touch the
--  signed-in user's own rows (plus public missions and referred-agent status).
-- ============================================================================
