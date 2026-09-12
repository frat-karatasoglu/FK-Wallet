-- FK Wallet - planlanan ödemeler bölümü (kira, fatura, taksit vb.).
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın.

create table if not exists public.planned_payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(trim(title)) between 1 and 80),
  amount numeric(12,2) not null check (amount > 0),
  due_date date not null,
  repeat_monthly boolean not null default false,
  is_paid boolean not null default false,
  note text check (note is null or char_length(trim(note)) <= 240),
  created_at timestamptz not null default now()
);

create index if not exists planned_payments_user_due_idx
  on public.planned_payments (user_id, due_date);

alter table public.planned_payments enable row level security;

grant select, insert, update, delete on table public.planned_payments to authenticated;

drop policy if exists "users manage their own planned payments" on public.planned_payments;
create policy "users manage their own planned payments"
on public.planned_payments for all to authenticated
using (user_id = auth.uid()) with check (user_id = auth.uid());
