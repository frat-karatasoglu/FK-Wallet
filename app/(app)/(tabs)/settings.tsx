import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuthStore } from '@/src/store/useAuthStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { CURRENCY_OPTIONS, type CurrencyCode } from '@/src/lib/format';
import { colors, spacing } from '@/src/theme';

const LEAD_DAY_OPTIONS = [1, 2, 3, 5, 7];

function getDisplayName(value: unknown) {
  return typeof value === 'string' && value.trim() ? value.trim() : 'FK Wallet Kullanıcısı';
}

export default function SettingsScreen() {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const notificationLeadDays = useSettingsStore((state) => state.notificationLeadDays);
  const notificationsEnabled = useSettingsStore((state) => state.notificationsEnabled);
  const currency = useSettingsStore((state) => state.currency);
  const fetchSettings = useSettingsStore((state) => state.fetchSettings);
  const updateNotificationLeadDays = useSettingsStore((state) => state.updateNotificationLeadDays);
  const updateNotificationsEnabled = useSettingsStore((state) => state.updateNotificationsEnabled);
  const updateCurrency = useSettingsStore((state) => state.updateCurrency);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isSavingLeadDays, setIsSavingLeadDays] = useState<number | null>(null);
  const [isTogglingNotifications, setIsTogglingNotifications] = useState(false);
  const [isSavingCurrency, setIsSavingCurrency] = useState<string | null>(null);

  useEffect(() => { void fetchSettings(); }, [fetchSettings]);

  const displayName = getDisplayName(session?.user.user_metadata.display_name);
  const initials = useMemo(
    () => displayName.split(/\s+/).slice(0, 2).map((part) => part.charAt(0)).join('').toLocaleUpperCase('tr-TR'),
    [displayName]
  );

  async function handleSelectLeadDays(days: number) {
    setIsSavingLeadDays(days);
    await updateNotificationLeadDays(days);
    setIsSavingLeadDays(null);
  }

  async function handleToggleNotifications(value: boolean) {
    setIsTogglingNotifications(true);
    await updateNotificationsEnabled(value);
    setIsTogglingNotifications(false);
  }

  async function handleSelectCurrency(code: CurrencyCode) {
    setIsSavingCurrency(code);
    await updateCurrency(code);
    setIsSavingCurrency(null);
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Ayarlar</Text>

        <View style={styles.accountCard}>
          <Text style={styles.cardHeading}>Hesabım</Text>
          <View style={styles.accountRow}>
            <View style={styles.avatar}><Text style={styles.avatarText}>{initials}</Text></View>
            <View style={styles.accountCopy}>
              <Text style={styles.name} numberOfLines={1}>{displayName}</Text>
              <Text style={styles.email} numberOfLines={1}>{session?.user.email}</Text>
            </View>
          </View>
        </View>

        <View style={styles.reminderCard}>
          <View style={styles.reminderHeader}>
            <View style={styles.reminderIcon}><Ionicons name="notifications-outline" size={20} color={colors.primary} /></View>
            <View style={styles.reminderTitleWrap}>
              <Text style={styles.reminderTitle}>Hatırlatmalar</Text>
              <Text style={styles.enabledText}>
                {notificationsEnabled ? 'Bildirimler açık' : 'Bildirimler kapalı'}
              </Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={handleToggleNotifications}
              disabled={isTogglingNotifications}
              trackColor={{ true: colors.primary }}
            />
          </View>

          {notificationsEnabled ? (
            <>
              <Text style={styles.question}>Kaç gün önce hatırlatalım?</Text>
              <View style={styles.chipRow}>
                {LEAD_DAY_OPTIONS.map((days) => {
                  const selected = days === notificationLeadDays;
                  return (
                    <Pressable
                      key={days}
                      onPress={() => handleSelectLeadDays(days)}
                      disabled={isSavingLeadDays != null}
                      style={({ pressed }) => [styles.dayChip, selected && styles.dayChipSelected, pressed && styles.pressed]}
                    >
                      <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>{days} gün</Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.reminderDivider} />
              <View style={styles.dayReminderRow}>
                <Ionicons name="time-outline" size={16} color={colors.slate500} />
                <Text style={styles.dayReminderText}>Ödeme günü ayrıca hatırlatılır.</Text>
              </View>
            </>
          ) : null}
        </View>

        <View style={styles.currencyCard}>
          <View style={styles.currencyHeader}>
            <View style={styles.currencyIcon}><Ionicons name="wallet-outline" size={18} color={colors.primary} /></View>
            <Text style={styles.currencyTitle}>Para birimi</Text>
          </View>
          <View style={styles.chipRow}>
            {CURRENCY_OPTIONS.map((option) => {
              const selected = option.code === currency;
              return (
                <Pressable
                  key={option.code}
                  onPress={() => handleSelectCurrency(option.code)}
                  disabled={isSavingCurrency != null}
                  style={({ pressed }) => [styles.currencyChip, selected && styles.dayChipSelected, pressed && styles.pressed]}
                >
                  <Text style={[styles.dayChipText, selected && styles.dayChipTextSelected]}>
                    {option.symbol} {option.code}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && styles.pressed, isSigningOut && styles.disabled]}
          onPress={handleSignOut}
          disabled={isSigningOut}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.overdue} />
          <Text style={styles.signOutText}>{isSigningOut ? 'Çıkış yapılıyor...' : 'Çıkış Yap'}</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, gap: spacing.lg },
  pressed: { opacity: 0.72 },
  disabled: { opacity: 0.5 },
  pageTitle: { color: '#0f2852', fontSize: 26, fontWeight: '800', letterSpacing: -0.5 },
  accountCard: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4' },
  cardHeading: { color: '#112c59', fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.4 },
  accountRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.md },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  avatarText: { color: colors.primary, fontSize: 17, fontWeight: '800' },
  accountCopy: { flex: 1, minWidth: 0 },
  name: { color: '#112c59', fontSize: 16, fontWeight: '700' },
  email: { color: '#70819f', fontSize: 13, marginTop: 1 },
  reminderCard: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4' },
  reminderHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  reminderIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f5ff' },
  reminderTitleWrap: { flex: 1, minWidth: 0 },
  reminderTitle: { color: '#112c59', fontSize: 16, fontWeight: '700' },
  enabledText: { color: colors.primary, fontSize: 13, fontWeight: '600', marginTop: 2 },
  question: { color: '#70819f', fontSize: 13, fontWeight: '500', marginTop: spacing.lg },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  dayChip: { flex: 1, minWidth: 0, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 1.5, borderColor: '#d6e0ef' },
  currencyChip: { minWidth: 82, flexGrow: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 10, borderRadius: 16, borderWidth: 1.5, borderColor: '#d6e0ef' },
  dayChipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipText: { color: '#17315e', fontSize: 13, fontWeight: '600' },
  dayChipTextSelected: { color: colors.white },
  reminderDivider: { height: 1, backgroundColor: '#e6edf7', marginTop: spacing.lg },
  dayReminderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.md },
  dayReminderText: { flex: 1, color: '#70819f', fontSize: 13 },
  currencyCard: { padding: spacing.lg, borderRadius: 18, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4' },
  currencyHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  currencyIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f0f5ff' },
  currencyTitle: { color: '#112c59', fontSize: 16, fontWeight: '700' },
  signOutButton: { minHeight: 50, borderRadius: 16, borderWidth: 1.5, borderColor: colors.overdue, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.white },
  signOutText: { color: colors.overdue, fontSize: 15, fontWeight: '700' },
});
