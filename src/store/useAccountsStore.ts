import { create } from 'zustand';

import { getSupabaseClient } from '../lib/supabase';
import type { Account, NewAccount } from '../types/database';

function hasMissingLastFourColumn(error: { code?: string; message?: string } | null): boolean {
  return error?.code === 'PGRST204' && error.message?.includes('last_four') === true;
}

interface AccountsState {
  accounts: Account[];
  isLoading: boolean;
  error: string | null;
  fetchAccounts: () => Promise<void>;
  addAccount: (account: NewAccount) => Promise<string | null>;
  updateAccount: (id: string, account: Partial<NewAccount>) => Promise<string | null>;
  deleteAccount: (id: string) => Promise<string | null>;
  applyIncome: (accountId: string, amount: number) => Promise<void>;
}

export const useAccountsStore = create<AccountsState>((set, get) => ({
  accounts: [],
  isLoading: false,
  error: null,

  fetchAccounts: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true, error: null });
    const { data, error } = await supabase.from('accounts').select('*').order('created_at');
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    set({ accounts: (data ?? []) as Account[], isLoading: false });
  },

  addAccount: async (account) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';
    let { error } = await supabase.from('accounts').insert({ ...account, user_id: userData.user.id });
    if (hasMissingLastFourColumn(error)) {
      const { last_four: _lastFour, ...accountWithoutLastFour } = account;
      ({ error } = await supabase
        .from('accounts')
        .insert({ ...accountWithoutLastFour, user_id: userData.user.id }));
    }
    if (error) return error.message;
    await get().fetchAccounts();
    return null;
  },

  updateAccount: async (id, account) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    let { error } = await supabase.from('accounts').update(account).eq('id', id);
    if (hasMissingLastFourColumn(error)) {
      const { last_four: _lastFour, ...accountWithoutLastFour } = account;
      ({ error } = await supabase.from('accounts').update(accountWithoutLastFour).eq('id', id));
    }
    if (error) return error.message;
    await get().fetchAccounts();
    return null;
  },

  deleteAccount: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('accounts').delete().eq('id', id);
    if (error) return error.message;
    await get().fetchAccounts();
    return null;
  },

  // Bir gelir hesaba aktarıldığında o hesabın bakiyesini artırır.
  applyIncome: async (accountId, amount) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const account = get().accounts.find((a) => a.id === accountId);
    if (!account) return;

    const nextBalance = Number(account.balance) + amount;
    await supabase.from('accounts').update({ balance: nextBalance }).eq('id', accountId);

    await get().fetchAccounts();
  },
}));
