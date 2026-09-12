import { create } from 'zustand';

import { getSupabaseClient } from '../lib/supabase';
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
    set({ personalDebts: (data ?? []) as PersonalDebt[], isLoading: false });
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
}));
