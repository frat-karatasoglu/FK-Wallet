-- FK Wallet - banka hesapları ve kişilere olan borçlar.
-- Bu dosyayı önceki migration'lardan sonra Supabase SQL Editor'da bir kez çalıştırın.

create table if not exists public.accounts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bank_name text not null check (char_length(trim(bank_name)) between 1 and 80),
  nickname text check (nickname is null or char_length(trim(nickname)) <= 60),
  balance numeric(12,2) not null default 0 check (balance >= 0),
  color text not null default 'navy'
    check (color in ('navy','turquoise','emerald','amber','rose','violet','sky','slate')),
  created_at timestamptz not null default now()
);

alter table public.accounts
  add column if not exists last_four text
    check (last_four is null or last_four ~ '^[0-9]{4}$');

create table if not exists public.personal_debts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  person_name text not null check (char_length(trim(person_name)) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  note text check (note is null or char_length(trim(note)) <= 240),
  is_paid boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists accounts_user_id_idx on public.accounts (user_id);
create index if not exists personal_debts_user_id_idx on public.personal_debts (user_id, is_paid);

alter table public.accounts enable row level security;
alter table public.personal_debts enable row level security;

grant select, insert, update, delete on table public.accounts to authenticated;
grant select, insert, update, delete on table public.personal_debts to authenticated;

drop policy if exists "users manage their own accounts" on public.accounts;
create policy "users manage their own accounts"
on public.accounts for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "users manage their own personal debts" on public.personal_debts;
create policy "users manage their own personal debts"
on public.personal_debts for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
