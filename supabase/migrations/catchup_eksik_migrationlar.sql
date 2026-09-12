-- FK Wallet - EKSİK MIGRATION TOPLU DOSYASI
-- Bu dosyanın tamamını Supabase SQL Editor'a yapıştırıp bir kez çalıştırın.
-- Tamamı idempotent: daha önce çalışmış kısımlar varsa hata vermez, atlar.
-- İçerik: planlanan ödemeler tablosu + borç kategorileri + gelirin hesaba bağlanması.

-- 1) Planlanan ödemeler (kira, fatura, taksit vb.)
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

-- 2) Kişisel borçlara kategori (kişi, kira, fatura, kredi/taksit, diğer)
alter table public.personal_debts
  add column if not exists category text not null default 'other';

alter table public.personal_debts drop constraint if exists personal_debts_category_check;
alter table public.personal_debts
  add constraint personal_debts_category_check
  check (category in ('person', 'rent', 'bill', 'loan', 'other'));

-- 3) Gelir bir hesaba aktarılabilsin (nakit ise account_id boş kalır)
alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

alter table public.transactions drop constraint if exists transactions_account_id_requires_income;
alter table public.transactions
  add constraint transactions_account_id_requires_income
  check (account_id is null or type = 'income');

create index if not exists transactions_account_id_idx on public.transactions (account_id);

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
  and (
    account_id is null
    or exists (select 1 from public.accounts a where a.id = account_id and a.user_id = auth.uid())
  )
);
