import { create } from 'zustand';

import { getSupabaseClient } from '../lib/supabase';
import { rescheduleDebtReminders } from '../lib/notifications';
import { addMonths, hasPaymentPlan, toDateString } from '../lib/paymentSchedule';
import { useSettingsStore } from './useSettingsStore';
import type { NewPersonalDebt, PersonalDebt } from '../types/database';

interface PersonalDebtsState {
  personalDebts: PersonalDebt[];
  isLoading: boolean;
  error: string | null;
  fetchPersonalDebts: () => Promise<void>;
  addPersonalDebt: (debt: NewPersonalDebt) => Promise<string | null>;
  updatePersonalDebt: (id: string, debt: Partial<NewPersonalDebt>) => Promise<string | null>;
  deletePersonalDebt: (id: string) => Promise<string | null>;
  markAsPaid: (id: string) => Promise<string | null>;
  markInstallmentPaid: (
    id: string,
    paidAmount: number,
    nextInstallment?: number | null
  ) => Promise<string | null>;
}

async function reschedule(debts: PersonalDebt[]) {
  const leadDays = useSettingsStore.getState().notificationLeadDays;
  await rescheduleDebtReminders(debts, leadDays);
}

export const usePersonalDebtsStore = create<PersonalDebtsState>((set, get) => ({
  personalDebts: [],
  isLoading: false,
  error: null,

  fetchPersonalDebts: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('personal_debts')
      .select('*')
      .order('is_paid')
      .order('created_at', { ascending: false });
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    const personalDebts = (data ?? []) as PersonalDebt[];
    set({ personalDebts, isLoading: false });
    reschedule(personalDebts);
  },

  addPersonalDebt: async (debt) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';
    const { error } = await supabase
      .from('personal_debts')
      .insert({ ...debt, user_id: userData.user.id });
    if (error) return error.message;
    await get().fetchPersonalDebts();
    return null;
  },

  updatePersonalDebt: async (id, debt) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('personal_debts').update(debt).eq('id', id);
    if (error) return error.message;
    await get().fetchPersonalDebts();
    return null;
  },

  deletePersonalDebt: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('personal_debts').delete().eq('id', id);
    if (error) return error.message;
    await get().fetchPersonalDebts();
    return null;
  },

  markAsPaid: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('personal_debts').update({ is_paid: true }).eq('id', id);
    if (error) return error.message;
    await get().fetchPersonalDebts();
    return null;
  },

  // Taksit ödendiğinde: gerçekte ödenen tutarla borca bağlı gider kaydı oluşur,
  // kalan borç o kadar düşer, sonraki ödeme tarihi plan aralığı kadar ileri kayar.
  // Taksit tutarı dönemden döneme değişebildiği için sonraki taksit tutarı da
  // isteğe bağlı güncellenir. Son taksitte borç kapanır.
  markInstallmentPaid: async (id, paidAmount, nextInstallment) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const debt = get().personalDebts.find((item) => item.id === id);
    if (!debt) return 'Borç bulunamadı.';
    if (!hasPaymentPlan(debt)) return 'Bu borcun ödeme planı yok.';

    if (!(paidAmount > 0)) return 'Ödenen tutar sıfırdan büyük olmalı.';
    const payment = Math.round(paidAmount * 100) / 100;
    const paidInstallments = debt.paid_installments + 1;
    const remaining = Math.max(0, Math.round((Number(debt.amount) - payment) * 100) / 100);
    const isFinished =
      remaining <= 0 || (debt.installment_count != null && paidInstallments >= debt.installment_count);

    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: userData.user.id,
      type: 'expense',
      amount: payment,
      occurred_on: toDateString(new Date()),
      category: debt.person_name,
      debt_id: debt.id,
      note: debt.installment_count
        ? `Taksit ${paidInstallments}/${debt.installment_count}`
        : `Taksit ${paidInstallments}`,
    });
    if (transactionError) return transactionError.message;

    const { error } = await supabase
      .from('personal_debts')
      .update({
        amount: remaining,
        paid_installments: paidInstallments,
        next_payment_date: addMonths(debt.next_payment_date, debt.payment_interval_months),
        ...(nextInstallment && nextInstallment > 0 ? { installment_amount: nextInstallment } : {}),
        is_paid: isFinished,
      })
      .eq('id', id);
    if (error) return error.message;

    await get().fetchPersonalDebts();
    return null;
  },
}));
