import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { InstallmentPaymentModal } from '@/src/components/InstallmentPaymentModal';
import { UrgencyBadge } from '@/src/components/UrgencyBadge';
import { formatCurrency, formatDate } from '@/src/lib/format';
import { DEBT_CATEGORIES } from '@/src/lib/debtCategories';
import { hasPaymentPlan, intervalLabel, nextInstallmentAmount, parseDateString } from '@/src/lib/paymentSchedule';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { colors, radius, spacing } from '@/src/theme';
import type { PersonalDebt } from '@/src/types/database';

export default function DebtsScreen() {
  const router = useRouter();
  const personalDebts = usePersonalDebtsStore((state) => state.personalDebts);
  const fetchPersonalDebts = usePersonalDebtsStore((state) => state.fetchPersonalDebts);
  const markAsPaid = usePersonalDebtsStore((state) => state.markAsPaid);
  const [installmentDebt, setInstallmentDebt] = useState<PersonalDebt | null>(null);
  const notificationLeadDays = useSettingsStore((state) => state.notificationLeadDays);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);

  useFocusEffect(useCallback(() => { void fetchPersonalDebts(); }, [fetchPersonalDebts]));

  const openDebts = useMemo(() => personalDebts.filter((debt) => !debt.is_paid), [personalDebts]);
  const paidDebts = useMemo(() => personalDebts.filter((debt) => debt.is_paid), [personalDebts]);
  const total = useMemo(() => openDebts.reduce((sum, debt) => sum + Number(debt.amount), 0), [openDebts]);

  async function handleMarkAsPaid(debt: PersonalDebt) {
    // Taksitli borçta tutar dönemden döneme değişebildiği için önce tutar sorulur.
    if (hasPaymentPlan(debt)) {
      setInstallmentDebt(debt);
      return;
    }
    setPayingId(debt.id);
    setPayError(null);
    const message = await markAsPaid(debt.id);
    if (message) setPayError(message);
    setPayingId(null);
  }

  function openDebt(debt: PersonalDebt) {
    router.push((hasPaymentPlan(debt) ? `/debt/${debt.id}` : `/debt/${debt.id}/edit`) as never);
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
            {payError ? <Text style={styles.payError}>{payError}</Text> : null}
          </View>
        }
        renderItem={({ item }) => {
          const plan = hasPaymentPlan(item) ? item : null;
          return (
          <View style={styles.row}>
            <Pressable style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]} onPress={() => openDebt(item)}>
              {(() => {
                const meta = DEBT_CATEGORIES[item.category ?? 'other'];
                return (
                  <View style={[styles.personIcon, { backgroundColor: meta.background }]}>
                    <Ionicons name={meta.icon} size={22} color={meta.color} />
                  </View>
                );
              })()}
              <View style={styles.copy}>
                <Text style={styles.personName} numberOfLines={1}>{item.person_name}</Text>
                <Text style={styles.note} numberOfLines={1}>
                  {DEBT_CATEGORIES[item.category ?? 'other'].label}
                  {item.note ? ` · ${item.note}` : ''}
                </Text>
              </View>
              <View style={styles.amountWrap}>
                <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
                {plan ? <Text style={styles.amountCaption}>kalan</Text> : null}
              </View>
            </Pressable>
            {plan ? (
              <Pressable style={({ pressed }) => [styles.planInfo, pressed && styles.pressed]} onPress={() => openDebt(item)}>
                <View style={styles.planTop}>
                  <Text style={styles.planText}>
                    {intervalLabel(plan.payment_interval_months)}
                    {plan.installment_count ? ` · ${plan.paid_installments}/${plan.installment_count} taksit` : plan.paid_installments ? ` · ${plan.paid_installments} taksit ödendi` : ''}
                  </Text>
                  <UrgencyBadge date={parseDateString(plan.next_payment_date)} dueSoonThresholdDays={notificationLeadDays} />
                </View>
                {plan.installment_count ? (
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.min(100, (plan.paid_installments / plan.installment_count) * 100)}%` }]} />
                  </View>
                ) : null}
                <Text style={styles.planNext}>
                  Sonraki ödeme: <Text style={styles.planNextStrong}>{formatDate(plan.next_payment_date)}</Text> · {formatCurrency(nextInstallmentAmount(plan))}
                </Text>
              </Pressable>
            ) : null}
            <Pressable style={({ pressed }) => [styles.payButton, pressed && styles.pressed]} onPress={() => handleMarkAsPaid(item)} disabled={payingId === item.id}>
              <Ionicons name="checkmark-circle" size={18} color={colors.income} />
              <Text style={styles.payText}>{payingId === item.id ? 'Kaydediliyor...' : plan ? 'Taksit Ödendi' : 'Ödendi'}</Text>
            </Pressable>
          </View>
          );
        }}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<EmptyState icon="cash-outline" title="Açık borcun yok" message="Sağ üstteki + ile borçlarını ekleyebilirsin." />}
        ListFooterComponent={paidDebts.length ? <View style={styles.closedSection}><Text style={styles.closedTitle}>Kapanan borçlar</Text>{paidDebts.map((debt) => <Pressable key={debt.id} style={styles.closedRow} onPress={() => openDebt(debt)}><Text style={styles.closedName} numberOfLines={1}>{debt.person_name}</Text><Text style={styles.closedAmount} numberOfLines={1}>{formatCurrency(debt.amount)}</Text></Pressable>)}</View> : null}
      />
      <InstallmentPaymentModal debt={installmentDebt} onClose={() => setInstallmentDebt(null)} />
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
  amountWrap: { alignItems: 'flex-end' },
  amount: { color: colors.slate800, fontSize: 17, fontWeight: '800', flexShrink: 0 },
  amountCaption: { color: colors.slate500, fontSize: 11, marginTop: 1 },
  planInfo: { paddingHorizontal: spacing.lg, paddingBottom: spacing.md, gap: spacing.sm },
  planTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  planText: { color: colors.slate700, fontSize: 13, fontWeight: '600', flexShrink: 1 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: colors.slate100, overflow: 'hidden' },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: '#0369a1' },
  planNext: { color: colors.slate500, fontSize: 12 },
  planNextStrong: { color: colors.slate800, fontWeight: '700' },
  payError: { color: colors.white, fontSize: 12, marginTop: spacing.sm, fontWeight: '600' },
  payButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.md, borderTopWidth: 1, borderTopColor: colors.slate100, backgroundColor: colors.incomeBg },
  payText: { color: colors.income, fontSize: 14, fontWeight: '700' },
  separator: { height: spacing.sm },
  closedSection: { marginTop: spacing.xl },
  closedTitle: { color: colors.slate700, fontSize: 17, fontWeight: '700', marginBottom: spacing.md },
  closedRow: { flexDirection: 'row', justifyContent: 'space-between', padding: spacing.md, marginBottom: spacing.sm, borderRadius: radius.md, backgroundColor: colors.slate100 },
  closedName: { color: colors.slate500, fontSize: 14, textDecorationLine: 'line-through', flex: 1, marginRight: spacing.md },
  closedAmount: { color: colors.slate500, fontSize: 14 },
});
