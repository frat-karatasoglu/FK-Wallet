import { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useCardsStore } from '@/src/store/useCardsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { getSupabaseClient } from '@/src/lib/supabase';
import { computeCardDates } from '@/src/lib/cardDates';
import { formatDate, formatDayOfMonth } from '@/src/lib/format';
import { colors, radius, spacing, typography } from '@/src/theme';
import { CardPreview } from '@/src/components/CardPreview';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { MoneyText } from '@/src/components/MoneyText';
import { EmptyState } from '@/src/components/EmptyState';
import { InlineMoneyEditor } from '@/src/components/InlineMoneyEditor';
import type { Transaction } from '@/src/types/database';

export default function CardDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cards = useCardsStore((s) => s.cards);
  const updateCard = useCardsStore((s) => s.updateCard);
  const notificationLeadDays = useSettingsStore((s) => s.notificationLeadDays);
  const card = useMemo(() => cards.find((c) => c.id === id), [cards, id]);

  const [history, setHistory] = useState<Transaction[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const loadHistory = useCallback(async () => {
    if (!id) return;
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setIsLoadingHistory(true);
    const { data } = await supabase
      .from('transactions')
      .select('*')
      .eq('card_id', id)
      .order('occurred_on', { ascending: false });
    setHistory((data ?? []) as Transaction[]);
    setIsLoadingHistory(false);
  }, [id]);

  useFocusEffect(
    useCallback(() => {
      loadHistory();
    }, [loadHistory])
  );

  useEffect(() => {
    if (cards.length === 0) {
      useCardsStore.getState().fetchCards();
    }
  }, [cards.length]);

  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Kart bulunamadı.</Text>
      </View>
    );
  }

  const { nextStatementDate, nextDueDate } = computeCardDates(card);

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <Pressable onPress={() => router.push(`/card/${card.id}/edit`)} hitSlop={12}>
              <Text style={styles.editLink}>Düzenle</Text>
            </Pressable>
          ),
        }}
      />
      <FlatList
        style={styles.flex}
        contentContainerStyle={styles.container}
        data={history}
        keyExtractor={(t) => t.id}
        renderItem={({ item }) => (
          <View style={styles.historyRow}>
            <View>
              <Text style={styles.historyDate}>{formatDate(item.occurred_on)}</Text>
              {item.note ? <Text style={styles.historyNote}>{item.note}</Text> : null}
            </View>
            <MoneyText amount={-item.amount} signed />
          </View>
        )}
        ListHeaderComponent={
          <View style={styles.header}>
            <CardPreview card={card} />

            <View style={styles.balanceRow}>
              <InlineMoneyEditor
                label="Güncel Borç"
                value={card.current_balance}
                emphasis
                onSave={(value) => updateCard(card.id, { current_balance: value })}
              />
              <InlineMoneyEditor
                label="Bu Ayki Ekstre"
                value={card.statement_amount}
                placeholder="Ekstre gir"
                onSave={(value) => updateCard(card.id, { statement_amount: value })}
              />
            </View>
            <Text style={styles.balanceHint}>Ekstre, güncel borcu geçemez.</Text>

            <View style={styles.datesRow}>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Sonraki kesim</Text>
                <Text style={styles.dateValue}>{formatDate(nextStatementDate)}</Text>
                <Text style={styles.dateSub}>{formatDayOfMonth(card.statement_day)}</Text>
              </View>
              <View style={styles.dateBox}>
                <Text style={styles.dateLabel}>Sonraki son ödeme</Text>
                <Text style={styles.dateValue}>{formatDate(nextDueDate)}</Text>
                <Text style={styles.dateSub}>{formatDayOfMonth(card.due_day)}</Text>
              </View>
            </View>

            {card.credit_limit != null ? (
              <View style={styles.infoBox}>
                <View style={styles.infoRow}>
                  <Text style={styles.dateLabel}>Kredi limiti</Text>
                  <MoneyText amount={card.credit_limit} />
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoRow}>
                  <Text style={styles.dateLabel}>Kalan limit</Text>
                  <MoneyText
                    amount={Math.max(0, Number(card.credit_limit) - Number(card.current_balance))}
                  />
                </View>
              </View>
            ) : null}

            <View style={styles.reminderBox}>
              <Ionicons name="notifications" size={16} color={colors.navy} />
              <Text style={styles.reminderText}>
                Hatırlatma: son ödemeden {notificationLeadDays} gün önce ve son ödeme günü sabah
                09:00'da bildirim gelir.
              </Text>
            </View>

            <PrimaryButton
              title="Ödendi Olarak İşaretle"
              onPress={() =>
                router.push({
                  pathname: '/transaction/new',
                  params: { type: 'card_payment', cardId: card.id },
                })
              }
              style={styles.payButton}
            />

            <Text style={styles.sectionTitle}>Ödeme Geçmişi</Text>
          </View>
        }
        ListEmptyComponent={
          !isLoadingHistory ? (
            <EmptyState
              icon="receipt-outline"
              title="Henüz ödeme yok"
              message="Bu karta ait bir ödeme kaydettiğinde burada görünecek."
            />
          ) : null
        }
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  header: { gap: spacing.lg, marginBottom: spacing.lg },
  balanceRow: {
    flexDirection: 'row',
    gap: spacing.lg,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  balanceHint: { fontSize: 12, color: colors.slate500, marginTop: -spacing.sm },
  editLink: { color: colors.navy, fontWeight: '600', fontSize: 15 },
  datesRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  dateBox: {
    flex: 1,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  dateLabel: {
    fontSize: 12,
    color: colors.slate500,
  },
  dateValue: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.slate800,
    marginTop: spacing.xs,
  },
  dateSub: {
    fontSize: 12,
    color: colors.slate400,
    marginTop: 2,
  },
  infoBox: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoDivider: {
    height: 1,
    backgroundColor: colors.slate100,
  },
  reminderBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    backgroundColor: colors.slate50,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  reminderText: {
    flex: 1,
    fontSize: 12,
    color: colors.slate600,
    lineHeight: 17,
  },
  payButton: {},
  sectionTitle: {
    ...typography.title,
    marginTop: spacing.md,
  },
  historyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.slate800,
  },
  historyNote: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
});
