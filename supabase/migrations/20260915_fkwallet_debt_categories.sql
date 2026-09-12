-- FK Wallet - kişisel borçlara kategori ekler (kişi, kira, fatura, kredi/taksit, diğer).
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın.

alter table public.personal_debts
  add column if not exists category text not null default 'other';

alter table public.personal_debts drop constraint if exists personal_debts_category_check;
alter table public.personal_debts
  add constraint personal_debts_category_check
  check (category in ('person', 'rent', 'bill', 'loan', 'other'));
