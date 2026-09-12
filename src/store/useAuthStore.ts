import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';

interface AuthState {
  session: Session | null;
  isInitializing: boolean;
  init: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<string | null>;
}

let didInit = false;

export const useAuthStore = create<AuthState>((set) => ({
  session: null,
  isInitializing: true,

  init: () => {
    if (didInit) return;
    didInit = true;

    const supabase = getSupabaseClient();
    if (!supabase) {
      set({ isInitializing: false });
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ session: data.session, isInitializing: false });
    });

    supabase.auth.onAuthStateChange((_event, session) => {
      set({ session });
    });
  },

  signIn: async (email, password) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? error.message : null;
  },

  signUp: async (email, password, displayName) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    return error ? error.message : null;
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  // updateUser bir "USER_UPDATED" auth event'i tetikler; init()'teki
  // onAuthStateChange dinleyicisi session'ı zaten otomatik günceller.
  updateDisplayName: async (displayName) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    return error ? error.message : null;
  },
}));
