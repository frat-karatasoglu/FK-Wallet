import { Stack } from 'expo-router';
import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { useAuthStore } from '@/src/store/useAuthStore';
import { useCardsStore } from '@/src/store/useCardsStore';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import {
  ensureNotificationPermission,
  ensureNotificationSetup,
  rescheduleAllCardReminders,
  reschedulePlannedPaymentReminders,
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

  useEffect(() => {
    if (!isInitializing) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [isInitializing]);

  useAppForegroundReschedule(session != null);

  if (isInitializing) {
    return null;
  }

  return (
    <Stack>
      <Stack.Protected guard={session != null}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
      <Stack.Protected guard={session == null}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
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
        const { notificationLeadDays } = useSettingsStore.getState();
        rescheduleAllCardReminders(useCardsStore.getState().cards, notificationLeadDays);
        reschedulePlannedPaymentReminders(
          usePlannedPaymentsStore.getState().plannedPayments,
          notificationLeadDays
        );
      }
    });

    return () => subscription.remove();
  }, [enabled]);
}
