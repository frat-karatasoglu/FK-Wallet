-- FK Wallet: uygulama içinden hesap silme (Google Play şartı).
-- Kullanıcı yalnızca kendi auth kaydını silebilir; tüm tablolar auth.users'a
-- "on delete cascade" ile bağlı olduğundan kartlar, hesaplar, borçlar, işlemler,
-- planlı ödemeler ve profil de birlikte silinir.

create or replace function public.delete_my_account()
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  uid uuid := auth.uid();
begin
  if uid is null then
    raise exception 'Oturum bulunamadı.';
  end if;
  delete from auth.users where id = uid;
end;
$$;

revoke all on function public.delete_my_account() from public;
revoke all on function public.delete_my_account() from anon;
grant execute on function public.delete_my_account() to authenticated;
