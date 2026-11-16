-- FK Wallet: elde tutulan nakit bakiyesi.
-- "Nakit olarak tut" seçilen gelirler bu bakiyeye eklenir ve net duruma dahil edilir.
-- Supabase Dashboard > SQL Editor'da (FK Wallet projesinde) bir kez çalıştırılır.

alter table public.profiles
  add column if not exists cash_balance numeric(12,2) not null default 0;

alter table public.profiles drop constraint if exists profiles_cash_balance_check;
alter table public.profiles
  add constraint profiles_cash_balance_check check (cash_balance >= 0);

-- Bu sürümden önce "nakit" olarak kaydedilmiş gelirleri bir kereliğine bakiyeye taşı.
update public.profiles p
set cash_balance = coalesce((
  select sum(t.amount)
  from public.transactions t
  where t.user_id = p.id and t.type = 'income' and t.account_id is null
), 0)
where p.cash_balance = 0;
