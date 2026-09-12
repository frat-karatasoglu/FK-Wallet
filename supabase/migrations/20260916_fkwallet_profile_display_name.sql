-- FK Wallet - kullanıcı adı alanını profiles tablosuna ekler.
-- Supabase SQL Editor'da bir kez çalıştırın.

alter table public.profiles
  add column if not exists display_name text
    check (display_name is null or char_length(trim(display_name)) between 2 and 40);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    nullif(trim(new.raw_user_meta_data ->> 'display_name'), '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

notify pgrst, 'reload schema';
