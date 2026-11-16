-- FK Wallet: 7 günlük ücretsiz deneme süresinin başlangıcı.
-- Supabase Dashboard > SQL Editor'da (FK Wallet projesinde) bir kez çalıştırılır.
--
-- Yeni kullanıcılarda kayıt anında, mevcut kullanıcılarda bu SQL'in çalıştığı anda başlar
-- (mevcut kullanıcılar da 7 gün deneme hakkı kazanır).

alter table public.profiles
  add column if not exists trial_started_at timestamptz not null default now();

-- Kullanıcı deneme başlangıcını kendisi değiştiremesin: profiles tablosunda yalnızca
-- uygulamanın gerçekten güncellediği sütunlara yazma izni ver.
revoke update on table public.profiles from authenticated;
grant update (display_name, notification_lead_days, notifications_enabled, currency, cash_balance)
  on table public.profiles to authenticated;
