-- Daha önce oluşturulmuş accounts tablosuna kart son dört hane alanını ekler.
-- Supabase SQL Editor'da bir kez çalıştırın.

alter table if exists public.accounts
  add column if not exists last_four text
    check (last_four is null or last_four ~ '^[0-9]{4}$');

notify pgrst, 'reload schema';
