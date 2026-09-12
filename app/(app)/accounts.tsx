import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { AccountCard } from '@/src/components/AccountCard';
import { formatCurrency } from '@/src/lib/format';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { colors, radius, spacing } from '@/src/theme';

export default function AccountsScreen() {
  const router = useRouter();
  const accounts = useAccountsStore((state) => state.accounts);
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);

  useFocusEffect(useCallback(() => { void fetchAccounts(); }, [fetchAccounts]));

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
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Toplam hesap bakiyesi</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            <Text style={styles.summaryCaption}>{accounts.length ? `${accounts.length} hesap` : 'Henüz hesap eklemedin'}</Text>
          </View>
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
});
