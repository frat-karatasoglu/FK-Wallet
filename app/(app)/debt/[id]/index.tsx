import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';

import { EmptyState } from '@/src/components/EmptyState';
import { InstallmentPaymentModal } from '@/src/components/InstallmentPaymentModal';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { UrgencyBadge } from '@/src/components/UrgencyBadge';
import { DEBT_CATEGORIES } from '@/src/lib/debtCategories';
import { formatCurrency, formatDate } from '@/src/lib/format';
import { hasPaymentPlan, intervalLabel, nextInstallmentAmount, parseDateString } from '@/src/lib/paymentSchedule';
import { getSupabaseClient } from '@/src/lib/supabase';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { colors, radius, spacing, typography } from '@/src/theme';
import type { PersonalDebt, Transaction } from '@/src/types/database';

const LOAN_COLOR = '#0369a1';

export default function DebtDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const personalDebts = usePersonalDebtsStore((state) => state.personalDebts);
  const notificationLeadDays = useSettingsStore((state) => state.notificationLeadDays);
  const debt = useMemo(() => personalDebts.find((item) => item.id === id), [personalDebts, id]);
  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [payingDebt, setPayingDebt] = useState<PersonalDebt | null>(null);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('debt_id', id)
      .order('occurred_on', { ascending: false })
      .order('created_at', { ascending: false });
    setHistory((data ?? []) as Transaction[]);
    setIsLoadingHistory(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      if (!usePersonalDebtsStore.getState().personalDebts.length) {
        void usePersonalDebtsStore.getState().fetchPersonalDebts();
      }
      void loadHistory();
    }, [loadHistory])
  );

  const totalPaid = useMemo(() => history.reduce((sum, item) => sum + Number(item.amount), 0), [history]);

  if (!debt) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Borç bulunamadı.</Text>
      </View>
    );
  }

  const plan = hasPaymentPlan(debt) ? debt : null;
  const meta = DEBT_CATEGORIES[debt.category ?? 'other'];
  const progress = plan?.installment_count ? Math.min(1, plan.paid_installments / plan.installment_count) : null;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push(`/debt/${debt.id}/edit` as never)} hitSlop={12}>
              <Text style={styles.editLink}>Düzenle</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={history}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => {
          // Bir önceki döneme göre fark: taksit tutarındaki değişimi gösterir.
          const previous = history[index + 1];
          const diff = previous ? Number(item.amount) - Number(previous.amount) : 0;
          return (
            <View style={styles.historyRow}>
              <View style={styles.historyIcon}>
                <Ionicons name="checkmark" size={16} color={colors.income} />
              </View>
              <View style={styles.historyCopy}>
                <Text style={styles.historyTitle}>{item.note || 'Ödeme'}</Text>
                <Text style={styles.historyDate}>{formatDate(item.occurred_on)}</Text>
              </View>
              <View style={styles.historyRight}>
                <Text style={styles.historyAmount}>{formatCurrency(item.amount)}</Text>
                {Math.abs(diff) >= 0.01 ? (
                  <Text style={[styles.historyDiff, { color: diff > 0 ? colors.overdue : colors.income }]}>
                    {diff > 0 ? '▲ ' : '▼ '}
                    {formatCurrency(Math.abs(diff))}
                  </Text>
                ) : null}
              </View>
            </View>
          );
        }}
        ListHeaderComponent={
          <View style={styles.header}>
            <View style={[styles.summary, { backgroundColor: plan ? LOAN_COLOR : meta.color }]}>
              <View style={styles.summaryTop}>
                <Ionicons name={meta.icon} size={18} color="rgba(255,255,255,0.9)" />
                <Text style={styles.summaryCategory}>{meta.label}</Text>
                {debt.is_paid ? <Text style={styles.closedBadge}>Kapandı</Text> : null}
              </View>
              <Text style={styles.summaryTitle}>{debt.person_name}</Text>
              <Text style={styles.summaryLabel}>Kalan borç</Text>
              <Text style={styles.summaryValue}>{formatCurrency(debt.amount)}</Text>
              {progress != null ? (
                <>
                  <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
                  </View>
                  <Text style={styles.summaryCaption}>
                    {plan!.paid_installments}/{plan!.installment_count} taksit ödendi
                  </Text>
                </>
              ) : null}
            </View>

            {plan && !debt.is_paid ? (
              <View style={styles.nextBox}>
                <View style={styles.nextTop}>
                  <Text style={styles.boxLabel}>Sonraki ödeme</Text>
                  <UrgencyBadge date={parseDateString(plan.next_payment_date)} dueSoonThresholdDays={notificationLeadDays} />
                </View>
                <View style={styles.nextRow}>
                  <View>
                    <Text style={styles.nextDate}>{formatDate(plan.next_payment_date)}</Text>
                    <Text style={styles.nextSub}>{intervalLabel(plan.payment_interval_months)} ödeme</Text>
                  </View>
                  <Text style={styles.nextAmount}>{formatCurrency(nextInstallmentAmount(plan))}</Text>
                </View>
                <PrimaryButton title="Taksit Ödendi" onPress={() => setPayingDebt(plan)} style={styles.payButton} />
              </View>
            ) : null}

            {plan ? (
              <View style={styles.reminderBox}>
                <Ionicons name="notifications" size={16} color={colors.navy} />
                <Text style={styles.reminderText}>
                  Hatırlatma: ödemeden {notificationLeadDays} gün önce ve ödeme günü sabah 09:00'da bildirim gelir.
                </Text>
              </View>
            ) : null}

            {debt.note ? (
              <View style={styles.noteBox}>
                <Text style={styles.boxLabel}>Not</Text>
                <Text style={styles.noteText}>{debt.note}</Text>
              </View>
            ) : null}

            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Ödeme Geçmişi</Text>
              {history.length ? <Text style={styles.sectionTotal}>Toplam {formatCurrency(totalPaid)}</Text> : null}
            </View>
          </View>
        }
        ListEmptyComponent={
          !isLoadingHistory ? (
            <EmptyState
              icon="receipt-outline"
              title="Henüz ödeme yok"
              message="Taksit ödendi olarak işaretlediğinde her dönem ödediğin tutar burada listelenir."
            />
          ) : null
        }
      />
      <InstallmentPaymentModal
        debt={payingDebt}
        onClose={() => {
          setPayingDebt(null);
          void loadHistory();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  editLink: { color: colors.navy, fontWeight: '600', fontSize: 15 },
  summary: { borderRadius: radius.lg, padding: spacing.xl },
  summaryTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  summaryCategory: { color: 'rgba(255,255,255,0.9)', fontSize: 13, fontWeight: '600', flex: 1 },
  closedBadge: { color: colors.white, fontSize: 12, fontWeight: '700', backgroundColor: 'rgba(255,255,255,0.22)', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  summaryTitle: { color: colors.white, fontSize: 20, fontWeight: '800', marginTop: spacing.sm },
  summaryLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: spacing.md },
  summaryValue: { color: colors.white, fontSize: 30, fontWeight: '800', marginTop: 2 },
  progressTrack: { height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)', overflow: 'hidden', marginTop: spacing.md },
  progressFill: { height: 6, borderRadius: 3, backgroundColor: colors.white },
  summaryCaption: { color: 'rgba(255,255,255,0.85)', fontSize: 12, marginTop: spacing.xs },
  nextBox: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.slate100 },
  nextTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  boxLabel: { fontSize: 12, color: colors.slate500 },
  nextRow: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', marginTop: spacing.sm },
  nextDate: { fontSize: 16, fontWeight: '700', color: colors.slate800 },
  nextSub: { fontSize: 12, color: colors.slate400, marginTop: 2 },
  nextAmount: { fontSize: 20, fontWeight: '800', color: colors.slate800 },
  payButton: { marginTop: spacing.lg },
  reminderBox: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm, backgroundColor: colors.slate50, borderRadius: radius.md, padding: spacing.md },
  reminderText: { flex: 1, fontSize: 12, color: colors.slate600, lineHeight: 17 },
  noteBox: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, borderWidth: 1, borderColor: colors.slate100 },
  noteText: { fontSize: 14, color: colors.slate700, marginTop: spacing.xs },
  sectionHeader: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
  sectionTitle: { ...typography.title },
  sectionTotal: { fontSize: 13, color: colors.slate500, fontWeight: '600' },
  historyRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, marginBottom: spacing.sm, borderWidth: 1, borderColor: colors.slate100 },
  historyIcon: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.incomeBg },
  historyCopy: { flex: 1 },
  historyTitle: { fontSize: 14, fontWeight: '600', color: colors.slate800 },
  historyDate: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  historyRight: { alignItems: 'flex-end' },
  historyAmount: { fontSize: 15, fontWeight: '700', color: colors.slate800 },
  historyDiff: { fontSize: 11, fontWeight: '600', marginTop: 2 },
});
