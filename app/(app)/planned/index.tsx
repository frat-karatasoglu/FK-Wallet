import { useCallback, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { UrgencyBadge } from '@/src/components/UrgencyBadge';
import { EmptyState } from '@/src/components/EmptyState';
import { colors, radius, spacing, typography } from '@/src/theme';
import { formatCurrency, formatDate } from '@/src/lib/format';
import type { PlannedPayment } from '@/src/types/database';

export default function PlannedPaymentsScreen() {
  const router = useRouter();
  const plannedPayments = usePlannedPaymentsStore((s) => s.plannedPayments);
  const fetchPlannedPayments = usePlannedPaymentsStore((s) => s.fetchPlannedPayments);
  const markAsPaid = usePlannedPaymentsStore((s) => s.markAsPaid);
  const notificationLeadDays = useSettingsStore((s) => s.notificationLeadDays);
  const [payingId, setPayingId] = useState<string | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchPlannedPayments();
    }, [fetchPlannedPayments])
  );

  const openPayments = useMemo(
    () => plannedPayments.filter((p) => !p.is_paid),
    [plannedPayments]
  );
  const paidPayments = useMemo(
    () => plannedPayments.filter((p) => p.is_paid),
    [plannedPayments]
  );
  const total = useMemo(
    () => openPayments.reduce((sum, p) => sum + Number(p.amount), 0),
    [openPayments]
  );

  async function handleMarkPaid(payment: PlannedPayment) {
    setPayingId(payment.id);
    await markAsPaid(payment.id);
    setPayingId(null);
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push('/planned/new')} hitSlop={12}>
              <Ionicons name="add-circle" size={28} color={colors.dueSoon} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={openPayments}
        keyExtractor={(p) => p.id}
        ListHeaderComponent={
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Bekleyen toplam ödeme</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
            <Text style={styles.summaryCaption}>
              {openPayments.length > 0
                ? `${openPayments.length} planlanan ödeme`
                : 'Bekleyen ödemen yok'}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.row}>
            <Pressable
              style={({ pressed }) => [styles.rowMain, pressed && styles.pressed]}
              onPress={() => router.push(`/planned/${item.id}/edit`)}
            >
              <View style={styles.rowTop}>
                <Text style={styles.rowTitle}>{item.title}</Text>
                <UrgencyBadge
                  date={new Date(item.due_date)}
                  dueSoonThresholdDays={notificationLeadDays}
                />
              </View>
              <Text style={styles.rowSub}>
                {formatDate(item.due_date)}
                {item.repeat_monthly ? ' · her ay tekrar' : ''}
              </Text>
              <Text style={styles.rowAmount}>{formatCurrency(item.amount)}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.payButton, pressed && styles.pressed]}
              onPress={() => handleMarkPaid(item)}
              disabled={payingId === item.id}
            >
              <Ionicons name="checkmark-circle" size={18} color={colors.income} />
              <Text style={styles.payButtonText}>
                {payingId === item.id ? 'Kaydediliyor...' : 'Ödendi'}
              </Text>
            </Pressable>
          </View>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="calendar-outline"
            title="Planlanan ödeme yok"
            message="Sağ üstteki + ile kira, fatura, taksit gibi ödemelerini planla."
          />
        }
        ListFooterComponent={
          paidPayments.length > 0 ? (
            <View style={styles.paidSection}>
              <Text style={styles.sectionTitle}>Tamamlananlar</Text>
              {paidPayments.map((payment) => (
                <Pressable
                  key={payment.id}
                  style={styles.paidRow}
                  onPress={() => router.push(`/planned/${payment.id}/edit`)}
                >
                  <Text style={styles.paidTitle}>{payment.title}</Text>
                  <Text style={styles.paidAmount}>{formatCurrency(payment.amount)}</Text>
                </Pressable>
              ))}
            </View>
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.8 },
  summary: {
    backgroundColor: colors.dueSoon,
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
  },
  summaryValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
  summaryCaption: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 12,
    marginTop: spacing.xs,
  },
  row: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    overflow: 'hidden',
  },
  rowMain: {
    padding: spacing.lg,
  },
  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate800,
    flexShrink: 1,
  },
  rowSub: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
  rowAmount: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.slate800,
    marginTop: spacing.sm,
  },
  payButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
    backgroundColor: colors.incomeBg,
  },
  payButtonText: {
    color: colors.income,
    fontWeight: '600',
    fontSize: 14,
  },
  paidSection: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    ...typography.title,
    marginBottom: spacing.md,
  },
  paidRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: colors.slate100,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  paidTitle: {
    color: colors.slate500,
    fontSize: 14,
    textDecorationLine: 'line-through',
  },
  paidAmount: {
    color: colors.slate500,
    fontSize: 14,
  },
});
