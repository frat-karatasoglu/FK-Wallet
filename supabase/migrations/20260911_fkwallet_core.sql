-- FK Wallet - ilk veri modeli (profiles, cards, transactions).
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın.

create extension if not exists pgcrypto;

-- profiles: auth.users'a 1-1 eşlenir, sadece uygulamaya özgü ayarları tutar.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  notification_lead_days smallint not null default 3
    check (notification_lead_days between 0 and 14),
  currency text not null default 'TRY' check (currency = 'TRY'),
  created_at timestamptz not null default now()
);

create table if not exists public.cards (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 80),
  nickname text check (nickname is null or char_length(trim(nickname)) <= 60),
  last_four text check (last_four is null or last_four ~ '^[0-9]{4}$'),
  color text not null default 'navy'
    check (color in ('navy','turquoise','emerald','amber','rose','violet','sky','slate')),
  statement_day smallint not null check (statement_day between 1 and 31),
  due_day smallint not null check (due_day between 1 and 31),
  credit_limit numeric(12,2) check (credit_limit is null or credit_limit >= 0),
  created_at timestamptz not null default now()
);

-- transactions: gelir / kart ödemesi / gider tek tabloda (birleşik hareket defteri).
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('income','card_payment','expense')),
  amount numeric(12,2) not null check (amount > 0),
  occurred_on date not null default current_date,
  category text check (category is null or char_length(trim(category)) <= 60),
  note text check (note is null or char_length(trim(note)) <= 240),
  card_id uuid references public.cards(id) on delete set null,
  created_at timestamptz not null default now(),
  -- card_id yalnızca card_payment türünde dolu olabilir (gelir/gider bir karta bağlanamaz).
  constraint transactions_card_id_requires_card_payment
    check (card_id is null or type = 'card_payment')
);

create index if not exists cards_user_id_idx on public.cards (user_id);
create index if not exists transactions_user_id_occurred_on_idx
  on public.transactions (user_id, occurred_on desc);
create index if not exists transactions_card_id_idx on public.transactions (card_id);

alter table public.profiles enable row level security;
alter table public.cards enable row level security;
alter table public.transactions enable row level security;

grant usage on schema public to authenticated;
grant select, update on table public.profiles to authenticated;
grant select, insert, update, delete on table public.cards to authenticated;
grant select, insert, update, delete on table public.transactions to authenticated;

drop policy if exists "users can read own profile" on public.profiles;
create policy "users can read own profile"
on public.profiles for select to authenticated
using (id = auth.uid());

drop policy if exists "users can update own profile" on public.profiles;
create policy "users can update own profile"
on public.profiles for update to authenticated
using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "users manage their own cards" on public.cards;
create policy "users manage their own cards"
on public.cards for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

-- card_id, o kullanıcıya ait olmayan bir karta işaret edemez (RLS'i yalnızca
-- transactions tablosuna güvenmek yetmez - cards ile çapraz kontrol şart).
drop policy if exists "users manage their own transactions" on public.transactions;
create policy "users manage their own transactions"
on public.transactions for all to authenticated
using (user_id = auth.uid())
with check (
  user_id = auth.uid()
  and (
    card_id is null
    or exists (select 1 from public.cards c where c.id = card_id and c.user_id = auth.uid())
  )
);

-- Yeni kullanıcı kayıt olduğunda profiles satırı otomatik oluşur.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id) values (new.id) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
