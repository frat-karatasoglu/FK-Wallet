import { create } from 'zustand';
import { requireWriteAccess } from './useSubscriptionStore';
import { getSupabaseClient } from '../lib/supabase';
import { reschedulePlannedPaymentReminders } from '../lib/notifications';
import { addMonths, plannedRepeatInterval, toDateString } from '../lib/paymentSchedule';
import { useSettingsStore } from './useSettingsStore';
import type { NewPlannedPayment, PlannedPayment } from '../types/database';

interface PlannedPaymentsState {
  plannedPayments: PlannedPayment[];
  isLoading: boolean;
  error: string | null;
  fetchPlannedPayments: () => Promise<void>;
  addPlannedPayment: (payment: NewPlannedPayment) => Promise<string | null>;
  updatePlannedPayment: (id: string, payment: Partial<NewPlannedPayment>) => Promise<string | null>;
  deletePlannedPayment: (id: string) => Promise<string | null>;
  markAsPaid: (id: string) => Promise<string | null>;
}

async function reschedule(payments: PlannedPayment[]) {
  const leadDays = useSettingsStore.getState().notificationLeadDays;
  await reschedulePlannedPaymentReminders(payments, leadDays);
}

export const usePlannedPaymentsStore = create<PlannedPaymentsState>((set, get) => ({
  plannedPayments: [],
  isLoading: false,
  error: null,

  fetchPlannedPayments: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('planned_payments')
      .select('*')
      .order('due_date', { ascending: true });
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    const plannedPayments = (data ?? []) as PlannedPayment[];
    set({ plannedPayments, isLoading: false });
    reschedule(plannedPayments);
  },

  addPlannedPayment: async (payment) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('planned_payments')
      .insert({ ...payment, user_id: userData.user.id });
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },

  updatePlannedPayment: async (id, payment) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('planned_payments').update(payment).eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },

  deletePlannedPayment: async (id) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('planned_payments').delete().eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },

  // Ödendi işaretlemek hem gider hareketi oluşturur hem de tekrar eden ödemeyi
  // aralığı kadar (1/3/6/12 ay) ileri taşır; tekrar etmiyorsa ödendi olarak kapatır.
  markAsPaid: async (id) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const payment = get().plannedPayments.find((p) => p.id === id);
    if (!payment) return 'Ödeme bulunamadı.';

    const { error: transactionError } = await supabase.from('transactions').insert({
      user_id: userData.user.id,
      type: 'expense',
      amount: payment.amount,
      occurred_on: toDateString(new Date()),
      category: payment.title,
      note: payment.note,
    });
    if (transactionError) return transactionError.message;

    const interval = plannedRepeatInterval(payment);
    const update = interval
      ? { due_date: addMonths(payment.due_date, interval) }
      : { is_paid: true };

    const { error } = await supabase.from('planned_payments').update(update).eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },
}));
