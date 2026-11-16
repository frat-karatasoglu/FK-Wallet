import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { AccountCard } from '@/src/components/AccountCard';
import { InlineMoneyEditor } from '@/src/components/InlineMoneyEditor';
import { formatCurrency } from '@/src/lib/format';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { colors, radius, spacing } from '@/src/theme';

export default function AccountsScreen() {
  const router = useRouter();
  const accounts = useAccountsStore((state) => state.accounts);
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);

  const cashBalance = useSettingsStore((state) => state.cashBalance);
  const updateCashBalance = useSettingsStore((state) => state.updateCashBalance);

  useFocusEffect(useCallback(() => {
    void fetchAccounts();
    void useSettingsStore.getState().fetchSettings();
  }, [fetchAccounts]));

  const total = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [accounts]
  );

  return (
    <>
      <Stack.Screen options={{ headerRight: () => (
        <Pressable onPress={() => router.push('/account/new')} hitSlop={12}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
        </Pressable>
      ) }} />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={accounts}
        keyExtractor={(account) => account.id}
        ListHeaderComponent={
          <>
            <View style={styles.summary}>
              <Text style={styles.summaryLabel}>Toplam hesap bakiyesi</Text>
              <Text style={styles.summaryValue}>{formatCurrency(total + cashBalance)}</Text>
              <Text style={styles.summaryCaption}>{accounts.length ? `${accounts.length} hesap + nakit` : 'Nakit'}</Text>
            </View>
            <View style={styles.cashBox}>
              <View style={styles.cashIcon}><Ionicons name="cash-outline" size={22} color={colors.income} /></View>
              <View style={styles.cashEditor}>
                <InlineMoneyEditor label="Nakit (elimdeki)" value={cashBalance} placeholder="Nakit gir" onSave={updateCashBalance} />
              </View>
            </View>
            <Text style={styles.cashHint}>"Nakit olarak tut" seçtiğin gelirler buraya eklenir. Harcadıkça tutarı güncelleyebilirsin.</Text>
          </>
        }
        renderItem={({ item }) => (
          <AccountCard
            account={item}
            onPress={() => router.push(`/account/${item.id}/edit` as never)}
          />
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="wallet-outline" title="Henüz hesap eklemedin" message="Sağ üstteki + ile banka hesaplarını ve mevcut bakiyelerini ekle." />}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.78 },
  summary: { backgroundColor: colors.primary, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
  summaryLabel: { color: 'rgba(255,255,255,0.78)', fontSize: 13 },
  summaryValue: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: spacing.xs },
  summaryCaption: { color: 'rgba(255,255,255,0.78)', fontSize: 13, marginTop: spacing.xs },
  separator: { height: spacing.md },
  cashBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate100 },
  cashIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.incomeBg },
  cashEditor: { flex: 1 },
  cashHint: { color: colors.slate500, fontSize: 11, marginTop: spacing.xs, marginBottom: spacing.lg },
});
