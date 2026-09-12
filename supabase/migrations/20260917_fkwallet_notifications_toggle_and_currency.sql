-- FK Wallet - bildirim aç/kapa anahtarı ve seçilebilir para birimi.
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın.

alter table public.profiles
  add column if not exists notifications_enabled boolean not null default true;

alter table public.profiles drop constraint if exists profiles_currency_check;
alter table public.profiles
  add constraint profiles_currency_check check (currency in ('TRY', 'USD', 'EUR', 'GBP'));

notify pgrst, 'reload schema';
