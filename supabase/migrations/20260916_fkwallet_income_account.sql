-- FK Wallet - gelirin bir hesaba mı yoksa nakit olarak mı tutulduğunu izler.
-- Bu dosyanın tamamını Supabase SQL Editor'da bir kez çalıştırın.

alter table public.transactions
  add column if not exists account_id uuid references public.accounts(id) on delete set null;

-- account_id yalnızca income türünde dolu olabilir (gider/kart ödemesi bir hesaba bağlanamaz).
alter table public.transactions drop constraint if exists transactions_account_id_requires_income;
alter table public.transactions
  add constraint transactions_account_id_requires_income
  check (account_id is null or type = 'income');

create index if not exists transactions_account_id_idx on public.transactions (account_id);

-- account_id, o kullanıcıya ait olmayan bir hesaba işaret edemez.
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
