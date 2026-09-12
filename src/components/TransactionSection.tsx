import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';

import { useTransactionsStore } from '../store/useTransactionsStore';
import { TransactionRow } from './TransactionRow';
import { EmptyState } from './EmptyState';
import { colors, radius, spacing } from '../theme';
import { formatCurrency } from '../lib/format';
import type { TransactionType } from '../types/database';

interface TransactionSectionProps {
  type: Extract<TransactionType, 'income' | 'expense'>;
  accentColor: string;
  totalLabel: string;
  emptyTitle: string;
  emptyMessage: string;
}

const MONTH_NAMES = [
  'Ocak',
  'Şubat',
  'Mart',
  'Nisan',
  'Mayıs',
  'Haziran',
  'Temmuz',
  'Ağustos',
  'Eylül',
  'Ekim',
  'Kasım',
  'Aralık',
];

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function monthRangeFor(year: number, month0: number) {
  return {
    from: toDateString(new Date(year, month0, 1)),
    to: toDateString(new Date(year, month0 + 1, 0)),
  };
}

export function TransactionSection({
  type,
  accentColor,
  totalLabel,
  emptyTitle,
  emptyMessage,
}: TransactionSectionProps) {
  const router = useRouter();
  const transactions = useTransactionsStore((s) => s.transactions);
  const filter = useTransactionsStore((s) => s.filter);
  const setFilter = useTransactionsStore((s) => s.setFilter);
  const fetchTransactions = useTransactionsStore((s) => s.fetchTransactions);
  const dateRange = useTransactionsStore((s) => s.dateRange);
  const fetchDateRange = useTransactionsStore((s) => s.fetchDateRange);

  useFocusEffect(
    useCallback(() => {
      fetchTransactions();
      fetchDateRange();
    }, [fetchTransactions, fetchDateRange])
  );

  const [year, month0] = useMemo(() => {
    const [y, m] = filter.from.split('-').map(Number);
    return [y, m - 1];
  }, [filter.from]);

  // İşlemi olmayan aylara gidilmesin: oklar en eski/en yeni işlemin ayıyla sınırlı.
  function monthIndexOf(dateString: string) {
    const [y, m] = dateString.split('-').map(Number);
    return y * 12 + (m - 1);
  }
  const viewMonthIndex = year * 12 + month0;
  const canGoBack = dateRange.earliest != null && viewMonthIndex > monthIndexOf(dateRange.earliest);
  const canGoForward = dateRange.latest != null && viewMonthIndex < monthIndexOf(dateRange.latest);

  const rows = useMemo(
    () => transactions.filter((t) => t.type === type),
    [transactions, type]
  );

  const total = useMemo(
    () => rows.reduce((sum, t) => sum + Number(t.amount), 0),
    [rows]
  );

  function shiftMonth(delta: number) {
    setFilter(monthRangeFor(year, month0 + delta));
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable
              onPress={() =>
                router.push({ pathname: '/transaction/new', params: { type } })
              }
              hitSlop={12}
            >
              <Ionicons name="add-circle" size={28} color={accentColor} />
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={rows}
        keyExtractor={(t) => t.id}
        ListHeaderComponent={
          <View style={[styles.summary, { backgroundColor: accentColor }]}>
            <View style={styles.monthRow}>
              <Pressable onPress={() => shiftMonth(-1)} hitSlop={10} disabled={!canGoBack}>
                <Ionicons
                  name="chevron-back"
                  size={20}
                  color={canGoBack ? colors.white : 'rgba(255,255,255,0.35)'}
                />
              </Pressable>
              <Text style={styles.monthText}>
                {MONTH_NAMES[month0]} {year}
              </Text>
              <Pressable onPress={() => shiftMonth(1)} hitSlop={10} disabled={!canGoForward}>
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={canGoForward ? colors.white : 'rgba(255,255,255,0.35)'}
                />
              </Pressable>
            </View>
            <Text style={styles.summaryLabel}>{totalLabel}</Text>
            <Text style={styles.summaryValue}>{formatCurrency(total)}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            transaction={item}
            onPress={() => router.push(`/transaction/${item.id}/edit`)}
          />
        )}
        ListEmptyComponent={
          <EmptyState icon="document-text-outline" title={emptyTitle} message={emptyMessage} />
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  summary: {
    borderRadius: radius.lg,
    padding: spacing.xl,
    marginBottom: spacing.lg,
  },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  monthText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  summaryLabel: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 12,
  },
  summaryValue: {
    color: colors.white,
    fontSize: 30,
    fontWeight: '700',
    marginTop: spacing.xs,
  },
});
