import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { formatCurrency } from '@/src/lib/format';
import { DEBT_CATEGORIES } from '@/src/lib/debtCategories';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { colors, radius, spacing } from '@/src/theme';
import type { PersonalDebt } from '@/src/types/database';

export default function DebtsScreen() {
  const router = useRouter();
  const personalDebts = usePersonalDebtsStore((state) => state.personalDebts);
  const fetchPersonalDebts = usePersonalDebtsStore((state) => state.fetchPersonalDebts);
  const markAsPaid = usePersonalDebtsStore((state) => state.markAsPaid);
  const [payingId, setPayingId] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { void fetchPersonalDebts(); }, [fetchPersonalDebts]));

  const openDebts = useMemo(() => personalDebts.filter((debt) => !debt.is_paid), [personalDebts]);
  const paidDebts = useMemo(() => personalDebts.filter((debt) => debt.is_paid), [personalDebts]);
  const total = useMemo(() => openDebts.reduce((sum, debt) => sum + Number(debt.amount), 0), [openDebts]);

  async function handleMarkAsPaid(debt: PersonalDebt) {
    setPayingId(debt.id);
    await markAsPaid(debt.id);
    setPayingId(null);
  }

  return (
    <>
      <Stack.Screen options={{ headerRight: () => (
        <Pressable onPress={() => router.push('/debt/new')} hitSlop={12}>
          <Ionicons name="add-circle" size={28} color={colors.overdue} />
        </Pressable>
      ) }} />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={openDebts}
        keyExtractor={(debt) => debt.id}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Toplam borç</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            <Text style={styles.summaryCaption}>{openDebts.length ? `${openDebts.length} açık borç` : 'Açık borcun yok'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]} onPress={() => router.push(`/debt/${item.id}/edit` as never)}>
              {(() => {
                const meta = DEBT_CATEGORIES[item.category ?? 'other'];
                return (
                  <View style={[styles.personIcon, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                );
              })()}
              <View style={styles.copy}>
                <Text style={styles.personName}>{item.person_name}</Text>
                <Text style={styles.note} numberOfLines={1}>
                  {DEBT_CATEGORIES[item.category ?? 'other'].label}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            </Pressable>
            <Pressable style={({ pressed }) => [styles.payButton, pressed && styles.pressed]} onPress={() => handleMarkAsPaid(item)} disabled={payingId === item.id}>
              <Ionicons name="checkmark-circle" size={18} color={colors.income} />
              <Text style={styles.payText}>{payingId === item.id ? 'Kaydediliyor...' : 'Ödendi'}</Text>
            </Pressable>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="cash-outline" title="Açık borcun yok" message="Sağ üstteki + ile borçlarını ekleyebilirsin." />}
        ListFooterComponent={paidDebts.length ? <View style={styles.closedSection}><Text style={styles.closedTitle}>Kapanan borçlar</Text>{paidDebts.map((debt) => <Pressable key={debt.id} style={styles.closedRow} onPress={() => router.push(`/debt/${debt.id}/edit` as never)}><Text style={styles.closedName}>{debt.person_name}</Text><Text style={styles.closedAmount}>{formatCurrency(debt.amount)}</Text></Pressable>)}</View> : null}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.75 },
  summary: { backgroundColor: colors.overdue, borderRadius: radius.lg, padding: spacing.xl, marginBottom: spacing.lg },
  summaryLabel: { color: 'rgba(255,255,255,0.82)', fontSize: 13 },
  summaryValue: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: spacing.xs },
  summaryCaption: { color: 'rgba(255,255,255,0.82)', fontSize: 13, marginTop: spacing.xs },
  row: { overflow: 'hidden', borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate100 },
  rowMain: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  personIcon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.overdueBg },
  copy: { flex: 1, minWidth: 0 },
  personName: { color: colors.slate800, fontSize: 16, fontWeight: '700' },
  note: { color: colors.slate500, fontSize: 13, marginTop: 2 },
  amount: { color: colors.slate800, fontSize: 18, fontWeight: '800' },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.slate100, backgroundColor: colors.incomeBg },
  payText: { color: colors.income, fontSize: 14, fontWeight: '700' },
  separator: { height: spacing.sm },
  closedSection: { marginTop: spacing.xl },
  closedTitle: { color: colors.slate700, fontSize: 17, fontWeight: '700', marginBottom: spacing.md },
  closedRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, backgroundColor: colors.slate100 },
  closedName: { color: colors.slate500, fontSize: 14, textDecorationLine: 'line-through' },
  closedAmount: { color: colors.slate500, fontSize: 14 },
});
