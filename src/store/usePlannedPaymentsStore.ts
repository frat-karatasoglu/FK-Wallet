import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';
import { reschedulePlannedPaymentReminders } from '../lib/notifications';
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

function addOneMonth(dateString: string): string {
  const date = new Date(dateString);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + 1, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toDateString(target);
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
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
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('planned_payments').update(payment).eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },

  deletePlannedPayment: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('planned_payments').delete().eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },

  // Ödendi işaretlemek hem gider hareketi oluşturur hem de tekrar eden ödemeyi
  // bir sonraki aya taşır (tekrar etmiyorsa ödendi olarak kapatır).
  markAsPaid: async (id) => {
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

    const update = payment.repeat_monthly
      ? { due_date: addOneMonth(payment.due_date) }
      : { is_paid: true };

    const { error } = await supabase.from('planned_payments').update(update).eq('id', id);
    if (error) return error.message;

    await get().fetchPlannedPayments();
    return null;
  },
}));
