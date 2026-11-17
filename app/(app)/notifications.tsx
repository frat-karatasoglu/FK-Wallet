import { useCallback, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { useCardsStore } from '@/src/store/useCardsStore';
import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { hasPaymentPlan, nextInstallmentAmount, parseDateString } from '@/src/lib/paymentSchedule';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { computeCardDates } from '@/src/lib/cardDates';
import { formatCurrency, formatDate } from '@/src/lib/format';
import { UrgencyBadge } from '@/src/components/UrgencyBadge';
import { EmptyState } from '@/src/components/EmptyState';
import { colors, radius, spacing } from '@/src/theme';

interface ReminderRow {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  date: Date;
  amount: number;
  onPress: () => void;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const cards = useCardsStore((s) => s.cards);
  const fetchCards = useCardsStore((s) => s.fetchCards);
  const plannedPayments = usePlannedPaymentsStore((s) => s.plannedPayments);
  const fetchPlannedPayments = usePlannedPaymentsStore((s) => s.fetchPlannedPayments);
  const personalDebts = usePersonalDebtsStore((s) => s.personalDebts);
  const fetchPersonalDebts = usePersonalDebtsStore((s) => s.fetchPersonalDebts);
  const notificationLeadDays = useSettingsStore((s) => s.notificationLeadDays);

  useFocusEffect(
    useCallback(() => {
      fetchCards();
      fetchPlannedPayments();
      fetchPersonalDebts();
    }, [fetchCards, fetchPlannedPayments, fetchPersonalDebts])
  );

  const reminders = useMemo<ReminderRow[]>(() => {
    const now = new Date();
    const cardRows: ReminderRow[] = cards.map((card) => {
      const { nextDueDate } = computeCardDates(card, now);
      return {
        id: `card-${card.id}`,
        icon: 'card',
        title: card.nickname || card.bank_name,
        subtitle: 'Kart son ödemesi',
        date: nextDueDate,
        amount: card.statement_amount ?? card.current_balance,
        onPress: () => router.push(`/card/${card.id}`),
      };
    });

    const plannedRows: ReminderRow[] = plannedPayments
      .filter((payment) => !payment.is_paid)
      .map((payment) => ({
        id: `planned-${payment.id}`,
        icon: 'calendar',
        title: payment.title,
        subtitle: 'Planlanan ödeme',
        date: parseDateString(payment.due_date),
        amount: payment.amount,
        onPress: () => router.push(`/planned/${payment.id}/edit`),
      }));

    const debtRows: ReminderRow[] = personalDebts.flatMap((debt) =>
      !debt.is_paid && hasPaymentPlan(debt)
        ? [{
            id: `debt-${debt.id}`,
            icon: 'repeat' as const,
            title: debt.person_name,
            subtitle: 'Taksit ödemesi',
            date: parseDateString(debt.next_payment_date),
            amount: nextInstallmentAmount(debt),
            onPress: () => router.push(`/debt/${debt.id}` as never),
          }]
        : []
    );

    return [...cardRows, ...plannedRows, ...debtRows].sort((a, b) => a.date.getTime() - b.date.getTime());
  }, [cards, plannedPayments, personalDebts, router]);

  return (
    <FlatList
      style={styles.flex}
      contentContainerStyle={styles.container}
      data={reminders}
      keyExtractor={(row) => row.id}
      ListHeaderComponent={
        <Text style={styles.hint}>
          Son ödeme tarihinden {notificationLeadDays} gün önce ve ödeme gününün sabahı bildirim
          gönderilir.
        </Text>
      }
      renderItem={({ item }) => (
        <Pressable
          style={({ pressed }) => [styles.row, pressed && styles.pressed]}
          onPress={item.onPress}
        >
          <View style={styles.iconWrap}>
            <Ionicons name={item.icon} size={20} color={colors.navy} />
          </View>
          <View style={styles.middle}>
            <Text style={styles.title} numberOfLines={1}>
              {item.title}
            </Text>
            <Text style={styles.subtitle}>
              {item.subtitle} · {formatDate(item.date)}
            </Text>
          </View>
          <View style={styles.right}>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
            <UrgencyBadge date={item.date} dueSoonThresholdDays={notificationLeadDays} />
          </View>
        </Pressable>
      )}
      ListEmptyComponent={
        <EmptyState
          icon="notifications-outline"
          title="Bekleyen hatırlatma yok"
          message="Kart, planlanan ödeme veya taksitli borç ekledikçe burada görünecek."
        />
      }
    />
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hint: {
    fontSize: 12,
    color: colors.slate500,
    marginBottom: spacing.lg,
  },
  pressed: { opacity: 0.75 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.md,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: { flex: 1, minWidth: 0 },
  title: { fontSize: 15, fontWeight: '600', color: colors.slate800 },
  subtitle: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  amount: { fontSize: 14, fontWeight: '700', color: colors.slate800 },
});
