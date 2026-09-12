-- FK Wallet - kartlara güncel borç ve bu ayki ekstre tutarı alanları ekler.
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın (ilk migration'dan sonra).

alter table public.cards
  add column if not exists current_balance numeric(12,2) not null default 0,
  add column if not exists statement_amount numeric(12,2);

alter table public.cards drop constraint if exists cards_current_balance_check;
alter table public.cards
  add constraint cards_current_balance_check check (current_balance >= 0);

alter table public.cards drop constraint if exists cards_statement_amount_check;
alter table public.cards
  add constraint cards_statement_amount_check check (statement_amount is null or statement_amount >= 0);
