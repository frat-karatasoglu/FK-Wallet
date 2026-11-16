import { useEffect } from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { create } from 'zustand';
import Purchases, { LOG_LEVEL, type CustomerInfo, type PurchasesPackage } from 'react-native-purchases';

import { getSupabaseClient } from '../lib/supabase';

/** RevenueCat'teki yetki (entitlement) kimliği. */
export const PREMIUM_ENTITLEMENT = 'premium';
export const TRIAL_DAYS = 7;

/**
 * Abonelik modeli açık mı. Kapalıyken uygulama tamamen ücretsizdir: deneme süresi,
 * Premium ekranı ve yazma kilidi devre dışı kalır, RevenueCat yapılandırılmaz.
 * Açmak için EAS/.env'de EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED=true tanımlanır.
 * Not: Açarken mevcut kullanıcıların trial_started_at değeri kayıt tarihleri olduğu için
 * hemen kilitlenirler; açmadan önce onlara yeni deneme süresi tanımlanmalı.
 */
export const SUBSCRIPTIONS_ENABLED = process.env.EXPO_PUBLIC_SUBSCRIPTIONS_ENABLED === 'true';
const DAY_MS = 24 * 60 * 60 * 1000;

const API_KEY = Platform.select({
  android: process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY,
  ios: process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY,
});

export type AccessStatus = 'free' | 'premium' | 'trial' | 'expired';

interface SubscriptionState {
  trialStartedAt: string | null;
  isPremium: boolean;
  /** RevenueCat anahtarı tanımlı ve SDK yapılandırıldı mı. */
  purchasesAvailable: boolean;
  packages: PurchasesPackage[];
  userId: string | null;
  init: (userId: string) => Promise<void>;
  reset: () => Promise<void>;
  refresh: () => Promise<void>;
  loadPackages: () => Promise<void>;
  purchase: (pkg: PurchasesPackage) => Promise<string | null>;
  restore: () => Promise<string | null>;
}

let configured = false;

function hasPremium(info: CustomerInfo): boolean {
  return info.entitlements.active[PREMIUM_ENTITLEMENT] != null;
}

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  trialStartedAt: null,
  isPremium: false,
  purchasesAvailable: false,
  packages: [],
  userId: null,

  init: async (userId) => {
    if (get().userId === userId) return;
    set({ userId });
    if (!SUBSCRIPTIONS_ENABLED) return;
    await loadTrialStart(set);

    if (!API_KEY) return;
    try {
      if (!configured) {
        if (__DEV__) Purchases.setLogLevel(LOG_LEVEL.WARN);
        Purchases.configure({ apiKey: API_KEY, appUserID: userId });
        Purchases.addCustomerInfoUpdateListener((info) => set({ isPremium: hasPremium(info) }));
        configured = true;
      } else {
        await Purchases.logIn(userId);
      }
      set({ purchasesAvailable: true });
      const info = await Purchases.getCustomerInfo();
      set({ isPremium: hasPremium(info) });
    } catch {
      // Mağaza bağlantısı yoksa (ör. emülatör) deneme süresine göre devam edilir.
    }
  },

  reset: async () => {
    set({ userId: null, trialStartedAt: null, isPremium: false, packages: [] });
    if (configured) {
      try {
        await Purchases.logOut();
      } catch {
        // Anonim kullanıcıda logOut hata verir; önemli değil.
      }
    }
  },

  refresh: async () => {
    if (!SUBSCRIPTIONS_ENABLED) return;
    await loadTrialStart(set);
    if (!configured) return;
    try {
      const info = await Purchases.getCustomerInfo();
      set({ isPremium: hasPremium(info) });
    } catch {
      // Çevrimdışıyken son bilinen durum korunur.
    }
  },

  loadPackages: async () => {
    if (!configured) return;
    try {
      const offerings = await Purchases.getOfferings();
      set({ packages: offerings.current?.availablePackages ?? [] });
    } catch {
      set({ packages: [] });
    }
  },

  purchase: async (pkg) => {
    if (!configured) return 'Satın alma şu an kullanılamıyor.';
    try {
      const { customerInfo } = await Purchases.purchasePackage(pkg);
      const premium = hasPremium(customerInfo);
      set({ isPremium: premium });
      return premium ? null : 'Satın alma tamamlandı ama Premium henüz etkinleşmedi. Birazdan tekrar dene.';
    } catch (error) {
      if ((error as { userCancelled?: boolean }).userCancelled) return null;
      return 'Satın alma tamamlanamadı. Lütfen tekrar dene.';
    }
  },

  restore: async () => {
    if (!configured) return 'Satın alma şu an kullanılamıyor.';
    try {
      const info = await Purchases.restorePurchases();
      const premium = hasPremium(info);
      set({ isPremium: premium });
      return premium ? null : 'Bu Google hesabında etkin bir Premium abonelik bulunamadı.';
    } catch {
      return 'Satın alımlar geri yüklenemedi. Lütfen tekrar dene.';
    }
  },
}));

async function loadTrialStart(set: (partial: Partial<SubscriptionState>) => void) {
  const supabase = getSupabaseClient();
  if (!supabase) return;
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user) return;
  const { data, error } = await supabase
    .from('profiles')
    .select('trial_started_at')
    .eq('id', userData.user.id)
    .single();
  if (!error && data?.trial_started_at) set({ trialStartedAt: data.trial_started_at });
}

export interface AccessInfo {
  status: AccessStatus;
  canWrite: boolean;
  trialDaysLeft: number;
  trialEndsAt: Date | null;
}

export function getAccessInfo(state: Pick<SubscriptionState, 'isPremium' | 'trialStartedAt'>, now = new Date()): AccessInfo {
  if (!SUBSCRIPTIONS_ENABLED) return { status: 'free', canWrite: true, trialDaysLeft: 0, trialEndsAt: null };
  if (state.isPremium) return { status: 'premium', canWrite: true, trialDaysLeft: 0, trialEndsAt: null };
  // Deneme başlangıcı okunamadıysa (bağlantı yok vb.) kullanıcıyı kilitlemeyelim.
  if (!state.trialStartedAt) return { status: 'trial', canWrite: true, trialDaysLeft: TRIAL_DAYS, trialEndsAt: null };
  const trialEndsAt = new Date(new Date(state.trialStartedAt).getTime() + TRIAL_DAYS * DAY_MS);
  const msLeft = trialEndsAt.getTime() - now.getTime();
  if (msLeft <= 0) return { status: 'expired', canWrite: false, trialDaysLeft: 0, trialEndsAt };
  return { status: 'trial', canWrite: true, trialDaysLeft: Math.ceil(msLeft / DAY_MS), trialEndsAt };
}

export function useAccessInfo(): AccessInfo {
  const isPremium = useSubscriptionStore((state) => state.isPremium);
  const trialStartedAt = useSubscriptionStore((state) => state.trialStartedAt);
  return getAccessInfo({ isPremium, trialStartedAt });
}

/**
 * Yeni kayıt ekleme ekranlarında kullanılır: deneme bittiyse ve Premium yoksa
 * kullanıcı formu boşuna doldurmasın diye ekranı Premium ekranıyla değiştirir.
 */
export function useRedirectIfLocked(): void {
  const { canWrite } = useAccessInfo();
  useEffect(() => {
    if (!canWrite) router.replace('/paywall');
  }, [canWrite]);
}

export const PREMIUM_REQUIRED_MESSAGE = 'Deneme süren doldu. Kayıt eklemek ve düzenlemek için Premium’a geç.';

/**
 * Yazma işlemlerinden önce çağrılır. Deneme bittiyse ve Premium yoksa Premium ekranını
 * açar ve hata mesajı döner; izin varsa null döner.
 */
export function requireWriteAccess(): string | null {
  if (getAccessInfo(useSubscriptionStore.getState()).canWrite) return null;
  try {
    router.push('/paywall');
  } catch {
    // Navigasyon hazır değilse sadece mesaj dönülür.
  }
  return PREMIUM_REQUIRED_MESSAGE;
}
