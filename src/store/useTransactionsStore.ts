import { create } from 'zustand';
import { requireWriteAccess } from './useSubscriptionStore';
import { getSupabaseClient } from '../lib/supabase';
import { applyBalanceEffect } from '../lib/balanceEffects';
import type { NewTransaction, Transaction } from '../types/database';

function monthRange(reference: Date = new Date()) {
  const from = new Date(reference.getFullYear(), reference.getMonth(), 1);
  const to = new Date(reference.getFullYear(), reference.getMonth() + 1, 0);
  return { from: toDateString(from), to: toDateString(to) };
}

// toISOString() UTC'ye çevirdiği için TR saatinde (UTC+3) gece yarısı tarihleri
// bir gün geriye kayıyor; tarihi yerel bileşenlerden kuruyoruz.
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

async function fetchTransaction(id: string): Promise<Transaction | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const { data } = await supabase.from('transactions').select('*').eq('id', id).maybeSingle();
  return (data as Transaction | null) ?? null;
}

interface TransactionsFilter {
  from: string;
  to: string;
}

interface DateRange {
  earliest: string | null;
  latest: string | null;
}

interface TransactionsState {
  transactions: Transaction[];
  filter: TransactionsFilter;
  dateRange: DateRange;
  isLoading: boolean;
  error: string | null;
  setFilter: (filter: Partial<TransactionsFilter>) => void;
  fetchTransactions: () => Promise<void>;
  fetchDateRange: () => Promise<void>;
  addTransaction: (transaction: NewTransaction) => Promise<string | null>;
  updateTransaction: (id: string, transaction: Partial<NewTransaction>) => Promise<string | null>;
  deleteTransaction: (id: string) => Promise<string | null>;
}

export const useTransactionsStore = create<TransactionsState>((set, get) => ({
  transactions: [],
  filter: monthRange(),
  dateRange: { earliest: null, latest: null },
  isLoading: false,
  error: null,

  setFilter: (filter) => {
    set((state) => ({ filter: { ...state.filter, ...filter } }));
    get().fetchTransactions();
  },

  // Ana sayfadaki ay okları, işlemi olmayan aylara gidilmesini engellemek için
  // en eski ve en yeni işlem tarihini bilmesi gerekiyor.
  fetchDateRange: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;

    const [earliestResult, latestResult] = await Promise.all([
      supabase.from('transactions').select('occurred_on').order('occurred_on', { ascending: true }).limit(1),
      supabase.from('transactions').select('occurred_on').order('occurred_on', { ascending: false }).limit(1),
    ]);

    set({
      dateRange: {
        earliest: earliestResult.data?.[0]?.occurred_on ?? null,
        latest: latestResult.data?.[0]?.occurred_on ?? null,
      },
    });
  },

  fetchTransactions: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true, error: null });

    const { from, to } = get().filter;
    const query = supabase
      .from('transactions')
      .select('*')
      .gte('occurred_on', from)
      .lte('occurred_on', to)
      .order('occurred_on', { ascending: false });

    const { data, error } = await query;
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ transactions: (data ?? []) as Transaction[], isLoading: false });
  },

  addTransaction: async (transaction) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('transactions')
      .insert({ ...transaction, user_id: userData.user.id });
    if (error) return error.message;

    await applyBalanceEffect(transaction, 1);

    await get().fetchTransactions();
    await get().fetchDateRange();
    return null;
  },

  updateTransaction: async (id, transaction) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const previous = await fetchTransaction(id);
    const { error } = await supabase.from('transactions').update(transaction).eq('id', id);
    if (error) return error.message;

    // Tutar, tür ya da nereye/nereden bilgisi değiştiyse eski etkiyi geri al, yenisini uygula.
    if (previous) {
      await applyBalanceEffect(previous, -1);
      await applyBalanceEffect({ ...previous, ...transaction }, 1);
    }

    await get().fetchTransactions();
    await get().fetchDateRange();
    return null;
  },

  deleteTransaction: async (id) => {
    const blocked = requireWriteAccess();
    if (blocked) return blocked;
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const previous = await fetchTransaction(id);
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) return error.message;

    if (previous) await applyBalanceEffect(previous, -1);

    await get().fetchTransactions();
    await get().fetchDateRange();
    return null;
  },
}));
