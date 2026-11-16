import { Stack } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { AnimatedSplash } from '@/src/components/AnimatedSplash';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useCardsStore } from '@/src/store/useCardsStore';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { useSubscriptionStore } from '@/src/store/useSubscriptionStore';
import {
  ensureNotificationPermission,
  ensureNotificationSetup,
  rescheduleAllCardReminders,
  reschedulePlannedPaymentReminders,
  rescheduleDebtReminders,
} from '@/src/lib/notifications';

export {
  ErrorBoundary,
} from 'expo-router';

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const session = useAuthStore((s) => s.session);
  const init = useAuthStore((s) => s.init);

  useEffect(() => {
    ensureNotificationSetup().then(() => ensureNotificationPermission());
    init();
  }, [init]);

  // Yerel açılış ekranını AnimatedSplash, kendi logosu çizildiği anda kapatır.
  const [splashDone, setSplashDone] = useState(false);

  useAppForegroundReschedule(session != null);

  // Deneme süresi ve Premium durumu oturum açan kullanıcıya göre yüklenir.
  const userId = session?.user.id ?? null;
  useEffect(() => {
    if (userId) void useSubscriptionStore.getState().init(userId);
    else void useSubscriptionStore.getState().reset();
  }, [userId]);

  if (isInitializing) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Protected guard={session != null}>
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={session == null}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        </Stack.Protected>
      </Stack>
      {!splashDone ? <AnimatedSplash onFinish={() => setSplashDone(true)} /> : null}
    </>
  );
}

function useAppForegroundReschedule(enabled: boolean) {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (!enabled) return;

    useSettingsStore.getState().fetchSettings();
    useCardsStore.getState().fetchCards();
    useAccountsStore.getState().fetchAccounts();
    usePersonalDebtsStore.getState().fetchPersonalDebts();
    usePlannedPaymentsStore.getState().fetchPlannedPayments();

    const subscription = AppState.addEventListener('change', (nextState) => {
      const cameToForeground = appState.current.match(/inactive|background/) && nextState === 'active';
      appState.current = nextState;
      if (cameToForeground) {
        void useSubscriptionStore.getState().refresh();
        const { notificationLeadDays } = useSettingsStore.getState();
        rescheduleAllCardReminders(useCardsStore.getState().cards, notificationLeadDays);
        reschedulePlannedPaymentReminders(
          usePlannedPaymentsStore.getState().plannedPayments,
          notificationLeadDays
        );
        rescheduleDebtReminders(usePersonalDebtsStore.getState().personalDebts, notificationLeadDays);
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
