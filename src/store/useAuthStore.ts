import type { Session } from '@supabase/supabase-js';
import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';
import { cancelAllReminders } from '../lib/notifications';
import { authErrorMessage } from '../lib/authErrors';

interface AuthState {
  session: Session | null;
  isInitializing: boolean;
  init: () => void;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (email: string, password: string, displayName: string) => Promise<string | null>;
  signOut: () => Promise<void>;
  /** Hesabı ve tüm verileri kalıcı olarak siler; hata varsa mesaj döner. */
  deleteAccount: () => Promise<string | null>;
  updateDisplayName: (displayName: string) => Promise<string | null>;
  /** Şifre sıfırlama kodunu e-postaya gönderir. */
  sendPasswordReset: (email: string) => Promise<string | null>;
  /** E-postadaki kodu doğrular ve yeni şifreyi kaydeder (kullanıcı giriş yapmış olur). */
  resetPasswordWithCode: (email: string, code: string, newPassword: string) => Promise<string | null>;
  /** Giriş yapmış kullanıcının şifresini değiştirir. */
  changePassword: (currentPassword: string, newPassword: string) => Promise<string | null>;
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
    return error ? authErrorMessage(error) : null;
  },

  signUp: async (email, password, displayName) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return authErrorMessage(error);
    // E-posta doğrulaması açıksa Supabase kayıtlı adres için hata vermez, boş kimlik döner.
    if (data.user && data.user.identities?.length === 0) {
      return 'Bu e-posta adresiyle zaten bir hesap var. Giriş yapmayı dene.';
    }
    return null;
  },

  signOut: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    await supabase.auth.signOut();
  },

  deleteAccount: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.rpc('delete_my_account');
    if (error) return 'Hesap silinemedi. İnternet bağlantını kontrol edip tekrar dene.';
    await cancelAllReminders().catch(() => undefined);
    // Kullanıcı sunucuda artık yok; oturumu yalnızca cihazdan temizle.
    await supabase.auth.signOut({ scope: 'local' }).catch(() => undefined);
    set({ session: null });
    return null;
  },

  // updateUser bir "USER_UPDATED" auth event'i tetikler; init()'teki
  // onAuthStateChange dinleyicisi session'ı zaten otomatik günceller.
  updateDisplayName: async (displayName) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.updateUser({
      data: { display_name: displayName },
    });
    return error ? authErrorMessage(error) : null;
  },

  sendPasswordReset: async (email) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.resetPasswordForEmail(email);
    return error ? authErrorMessage(error) : null;
  },

  resetPasswordWithCode: async (email, code, newPassword) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.auth.verifyOtp({ email, token: code, type: 'recovery' });
    if (error) return authErrorMessage(error);
    const { error: updateError } = await supabase.auth.updateUser({ password: newPassword });
    return updateError ? authErrorMessage(updateError) : null;
  },

  changePassword: async (currentPassword, newPassword) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const email = useAuthStore.getState().session?.user.email;
    if (!email) return 'Oturumun sona ermiş. Tekrar giriş yap.';
    // Mevcut şifreyi doğrula; telefonu eline alan biri şifreyi değiştiremesin.
    const { error: checkError } = await supabase.auth.signInWithPassword({ email, password: currentPassword });
    if (checkError) {
      return checkError.code === 'invalid_credentials' ? 'Mevcut şifren hatalı.' : authErrorMessage(checkError);
    }
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    return error ? authErrorMessage(error) : null;
  },
}));
