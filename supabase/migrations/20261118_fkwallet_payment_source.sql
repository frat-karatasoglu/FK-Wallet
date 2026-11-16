-- FK Wallet: giderlerde ve kart ödemelerinde "Nereden ödendi?" (nakit / hesap / kredi kartı).
-- Supabase Dashboard > SQL Editor'da (FK Wallet projesinde) bir kez çalıştırılır.
--
-- Alanların anlamı harekete göre:
--   income       : account_id = paranın yattığı hesap (boşsa nakit)
--   expense      : payment_source = cash | account (account_id) | card (card_id)
--   card_payment : card_id = borcu ödenen kart; payment_source = cash | account (account_id)
-- payment_source boş olan eski giderler/kart ödemeleri hiçbir bakiyeyi etkilemez.

alter table public.transactions
  add column if not exists payment_source text;

-- Kredi kartıyla yapılan gider de karta bağlanabilsin.
alter table public.transactions drop constraint if exists transactions_card_id_requires_card_payment;
alter table public.transactions
  add constraint transactions_card_id_requires_card_payment
  check (card_id is null or type in ('card_payment', 'expense'));

-- Hesap artık giderin/kart ödemesinin çıktığı yer de olabilir.
alter table public.transactions drop constraint if exists transactions_account_id_requires_income;

alter table public.transactions drop constraint if exists transactions_payment_source_check;
alter table public.transactions
  add constraint transactions_payment_source_check
  check (
    payment_source is null
    or (payment_source = 'cash' and type <> 'income')
    or (payment_source = 'account' and type <> 'income' and account_id is not null)
    or (payment_source = 'card' and type = 'expense' and card_id is not null)
  );
