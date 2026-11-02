-- Bloom Terminal, claim allowlist import
-- ---------------------------------------
-- Use this when the direct CSV import into `claim_allowlist` fails with
-- "the data you are trying to import is incompatible with your data structure".
-- That happens because the sheet has extra columns and/or the Communities
-- cell holds several comma-separated names. We import the CSV into its OWN
-- auto-created table first, then copy just the two columns we need.
--
-- STEP 1 (Table editor, no SQL):
--   Table editor -> New table -> "Import data from CSV" (or "via spreadsheet").
--   Upload the CSV. Let Supabase create a NEW table named exactly:  claim_import
--   Do NOT try to map it onto claim_allowlist. Just let it build the columns
--   from the file's own header row and hit Save/Import.
--
-- STEP 2 (SQL editor):
--   Run everything below. It reads "Holder address" and "Communities" from
--   claim_import, lowercases the wallet, splits multi-community cells on commas
--   into separate rows, drops blanks, and fills claim_allowlist.
--   If your header names differ, change the two quoted names on the SELECT.

-- make sure the destination exists (safe to run even if it already does)
create table if not exists public.claim_allowlist (
  wallet    text not null,
  community text not null
);
create index if not exists claim_allowlist_wallet_idx
  on public.claim_allowlist (lower(wallet));

-- start clean so re-running never doubles the rows
truncate table public.claim_allowlist;

insert into public.claim_allowlist (wallet, community)
select
  lower(btrim(w."Holder address"))     as wallet,
  btrim(c.community)                   as community
from public.claim_import w
cross join lateral (
  -- split "Credits, Rare" -> two rows; a single value -> one row
  select btrim(part) as community
  from unnest(string_to_array(w."Communities", ',')) as part
) c
where w."Holder address" is not null
  and btrim(w."Holder address") <> ''
  and lower(btrim(w."Holder address")) ~ '^0x[0-9a-f]{40}$'  -- valid EVM wallets only
  and btrim(c.community) <> '';

-- sanity check: how many wallets / rows landed
select
  count(*)                         as total_rows,
  count(distinct wallet)           as unique_wallets,
  count(distinct community)        as communities
from public.claim_allowlist;

-- the distinct community names, so you can confirm they match the image map
select community, count(*) as wallets
from public.claim_allowlist
group by community
order by wallets desc;

-- once you've confirmed the numbers look right, you can drop the staging table:
--   drop table public.claim_import;
