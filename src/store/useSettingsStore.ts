import { create } from 'zustand';
import { requireWriteAccess } from './useSubscriptionStore';
import { getSupabaseClient } from '../lib/supabase';
import { setCurrency, type CurrencyCode } from '../lib/format';

interface SettingsState {
  notificationLeadDays: number;
  notificationsEnabled: boolean;
  currency: CurrencyCode;
  /** Elde tutulan nakit; nakit olarak tutulan gelirler buraya eklenir. */
  cashBalance: number;
  isLoading: boolean;
  fetchSettings: () => Promise<void>;
  updateCashBalance: (value: number) => Promise<string | null>;
  applyCashDelta: (delta: number) => Promise<void>;
  updateNotificationLeadDays: (days: number) => Promise<string | null>;
  updateNotificationsEnabled: (enabled: boolean) => Promise<string | null>;
  updateCurrency: (code: CurrencyCode) => Promise<string | null>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  notificationLeadDays: 3,
  notificationsEnabled: true,
  currency: 'TRY',
  cashBalance: 0,
  isLoading: false,

  fetchSettings: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true });
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      set({ isLoading: false });
      return;
    }
    const { data, error } = await supabase
      .from('profiles')
      .select('notification_lead_days, notifications_enabled, currency')
      .eq('id', userData.user.id)
      .single();
    if (!error && data) {
      setCurrency(data.currency);
      set({
        notificationLeadDays: data.notification_lead_days,
        notificationsEnabled: data.notifications_enabled,
        currency: data.currency,
      });
    }
    // Ayrı sorgu: cash_balance sütunu henüz yoksa diğer ayarlar yine yüklensin.
    const { data: cashData, error: cashError } = await supabase
      .from('profiles')
      .select('cash_balance')
      .eq('id', userData.user.id)
      .single();
    if (!cashError && cashData) set({ cashBalance: Number(cashData.cash_balance) });
    set({ isLoading: false });
  },

  updateCashBalance: async (value) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';
    const next = Math.max(0, Math.round(value * 100) / 100);
    const { error } = await supabase.from('profiles').update({ cash_balance: next }).eq('id', userData.user.id);
    if (error) return error.message;
    set({ cashBalance: next });
    return null;
  },

  applyCashDelta: async (delta) => {
    await get().updateCashBalance(get().cashBalance + delta);
  },

  updateNotificationLeadDays: async (days) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('profiles')
      .update({ notification_lead_days: days })
      .eq('id', userData.user.id);
    if (error) return error.message;

    set({ notificationLeadDays: days });
    // Kartlar store'u import etmeden yeniden zamanlama tetiklemek için
    // dinamik import: dairesel bağımlılığı (cards <-> settings) önler.
    const { useCardsStore } = await import('./useCardsStore');
    const { usePlannedPaymentsStore } = await import('./usePlannedPaymentsStore');
    const { usePersonalDebtsStore } = await import('./usePersonalDebtsStore');
    const { rescheduleAllCardReminders, reschedulePlannedPaymentReminders, rescheduleDebtReminders } =
      await import('../lib/notifications');
    await rescheduleAllCardReminders(useCardsStore.getState().cards, days);
    await reschedulePlannedPaymentReminders(usePlannedPaymentsStore.getState().plannedPayments, days);
    await rescheduleDebtReminders(usePersonalDebtsStore.getState().personalDebts, days);

    return null;
  },

  updateNotificationsEnabled: async (enabled) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('profiles')
      .update({ notifications_enabled: enabled })
      .eq('id', userData.user.id);
    if (error) return error.message;

    set({ notificationsEnabled: enabled });

    const {
      cancelAllReminders,
      rescheduleAllCardReminders,
      reschedulePlannedPaymentReminders,
      rescheduleDebtReminders,
    } = await import('../lib/notifications');
    if (!enabled) {
      await cancelAllReminders();
    } else {
      const { useCardsStore } = await import('./useCardsStore');
      const { usePlannedPaymentsStore } = await import('./usePlannedPaymentsStore');
      const { usePersonalDebtsStore } = await import('./usePersonalDebtsStore');
      const leadDays = get().notificationLeadDays;
      await rescheduleAllCardReminders(useCardsStore.getState().cards, leadDays);
      await reschedulePlannedPaymentReminders(
        usePlannedPaymentsStore.getState().plannedPayments,
        leadDays
      );
      await rescheduleDebtReminders(usePersonalDebtsStore.getState().personalDebts, leadDays);
    }

    return null;
  },

  updateCurrency: async (code) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('profiles')
      .update({ currency: code })
      .eq('id', userData.user.id);
    if (error) return error.message;

    setCurrency(code);
    set({ currency: code });
    return null;
  },
}));
