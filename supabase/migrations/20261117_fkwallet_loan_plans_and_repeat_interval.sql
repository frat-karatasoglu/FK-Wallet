-- FK Wallet: kredi/taksit ödeme planı + planlı ödemelerde tekrar aralığı
-- Supabase Dashboard > SQL Editor'da bir kez çalıştırılır. Tekrar çalıştırmak güvenlidir.

-- 1) Borçlara ödeme planı (taksit tutarı, sıklık, sonraki ödeme, taksit sayıları).
--    amount alanı "kalan borç" olarak kullanılmaya devam eder.
alter table public.personal_debts
  add column if not exists installment_amount numeric(12,2),
  add column if not exists payment_interval_months smallint,
  add column if not exists next_payment_date date,
  add column if not exists installment_count smallint,
  add column if not exists paid_installments smallint not null default 0;

alter table public.personal_debts drop constraint if exists personal_debts_installment_amount_check;
alter table public.personal_debts
  add constraint personal_debts_installment_amount_check
  check (installment_amount is null or installment_amount > 0);

alter table public.personal_debts drop constraint if exists personal_debts_payment_interval_check;
alter table public.personal_debts
  add constraint personal_debts_payment_interval_check
  check (payment_interval_months is null or payment_interval_months in (1, 3, 6, 12));

alter table public.personal_debts drop constraint if exists personal_debts_installment_count_check;
alter table public.personal_debts
  add constraint personal_debts_installment_count_check
  check (installment_count is null or installment_count between 1 and 600);

alter table public.personal_debts drop constraint if exists personal_debts_paid_installments_check;
alter table public.personal_debts
  add constraint personal_debts_paid_installments_check
  check (paid_installments >= 0);

-- Kapanmış bir planın kalan borcu sıfır olabilir.
alter table public.personal_debts drop constraint if exists personal_debts_amount_check;
alter table public.personal_debts
  add constraint personal_debts_amount_check check (amount >= 0);

-- 2) Planlı ödemelerde tekrar aralığı (0 = tekrar yok, 1/3/6/12 ay).
--    repeat_monthly eski uygulama sürümleri için korunuyor.
alter table public.planned_payments
  add column if not exists repeat_interval_months smallint not null default 0;

alter table public.planned_payments drop constraint if exists planned_payments_repeat_interval_check;
alter table public.planned_payments
  add constraint planned_payments_repeat_interval_check
  check (repeat_interval_months in (0, 1, 3, 6, 12));

update public.planned_payments
set repeat_interval_months = 1
where repeat_monthly = true and repeat_interval_months = 0;

-- 3) Taksit ödemelerini borca bağla: her borcun ödeme geçmişi (hangi dönem ne kadar
--    ödendiği) bu bağlantıyla listelenir. Borç silinirse gider kaydı kalır.
alter table public.transactions
  add column if not exists debt_id uuid references public.personal_debts(id) on delete set null;

alter table public.transactions drop constraint if exists transactions_debt_id_requires_expense;
alter table public.transactions
  add constraint transactions_debt_id_requires_expense
  check (debt_id is null or type = 'expense');

create index if not exists transactions_debt_id_idx on public.transactions (debt_id);

-- debt_id, o kullanıcıya ait olmayan bir borca işaret edemez.
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
  and (
    debt_id is null
    or exists (select 1 from public.personal_debts d where d.id = debt_id and d.user_id = auth.uid())
  )
);
