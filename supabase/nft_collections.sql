-- Bloom Terminal, NFT collection cache
-- ------------------------------------
-- The `nfts` Edge Function keeps this table fresh in the background (every
-- ~15 min) by pulling every Robinhood Chain collection + stats from OpenSea.
-- The Watcher then reads the whole table instantly, sorted by floor. Public
-- read (this is public market data); only the service role writes.
--
-- Run once in the Supabase SQL editor, then redeploy the nfts function.

create table if not exists public.nft_collections (
  slug            text primary key,
  name            text,
  image           text,
  floor           double precision,
  floor_symbol    text,
  one_day_volume  double precision,
  total_volume    double precision,
  owners          double precision,
  items           double precision,
  updated_at      timestamptz not null default now()
);

create index if not exists nft_collections_floor on public.nft_collections (floor desc nulls last);
create index if not exists nft_collections_updated on public.nft_collections (updated_at desc);

alter table public.nft_collections enable row level security;

drop policy if exists "nft_collections read" on public.nft_collections;
create policy "nft_collections read"
  on public.nft_collections for select
  to anon, authenticated
  using (true);
