import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';

import { clampDayToMonth } from '@/src/lib/cardDates';
import { formatCurrency } from '@/src/lib/format';
import { getSupabaseClient } from '@/src/lib/supabase';
import { useCardsStore } from '@/src/store/useCardsStore';
import { colors, radius, spacing } from '@/src/theme';
import type { Card, Transaction } from '@/src/types/database';

type CalendarEvent = { card: Card; date: Date; type: 'statement' | 'due' };

const weekdays = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'];
const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });
const dayFormatter = new Intl.DateTimeFormat('tr-TR', { day: 'numeric', month: 'long' });

function toDateString(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function isSameDate(left: Date, right: Date) {
  return left.getFullYear() === right.getFullYear() && left.getMonth() === right.getMonth() && left.getDate() === right.getDate();
}

export default function CalendarScreen() {
  const router = useRouter();
  const cards = useCardsStore((state) => state.cards);
  const fetchCards = useCardsStore((state) => state.fetchCards);
  const today = useMemo(() => new Date(), []);
  const [visibleMonth, setVisibleMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedDate, setSelectedDate] = useState(today);
  const [payments, setPayments] = useState<Transaction[]>([]);

  useFocusEffect(useCallback(() => { void fetchCards(); }, [fetchCards]));

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const from = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth(), 1);
    const to = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + 1, 0);
    supabase
      .from('transactions')
      .select('*')
      .eq('type', 'card_payment')
      .gte('occurred_on', toDateString(from))
      .lte('occurred_on', toDateString(to))
      .then(({ data }) => setPayments((data ?? []) as Transaction[]));
  }, [visibleMonth]);

  const events = useMemo<CalendarEvent[]>(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    return cards.flatMap((card) => [
      { card, date: new Date(year, month, clampDayToMonth(year, month, card.statement_day)), type: 'statement' as const },
      { card, date: new Date(year, month, clampDayToMonth(year, month, card.due_day)), type: 'due' as const },
    ]);
  }, [cards, visibleMonth]);

  const monthCells = useMemo(() => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();
    const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7;
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: firstWeekday + daysInMonth }, (_, index) =>
      index < firstWeekday ? null : new Date(year, month, index - firstWeekday + 1)
    );
  }, [visibleMonth]);

  const selectedEvents = events.filter((event) => isSameDate(event.date, selectedDate));

  function changeMonth(offset: number) {
    const next = new Date(visibleMonth.getFullYear(), visibleMonth.getMonth() + offset, 1);
    setVisibleMonth(next);
    setSelectedDate(next);
  }

  function paymentTotal(cardId: string) {
    return payments
      .filter((payment) => payment.card_id === cardId)
      .reduce((sum, payment) => sum + Number(payment.amount), 0);
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.intro}>
        <View style={styles.introIcon}><Ionicons name="calendar-outline" size={24} color={colors.primary} /></View>
        <View style={styles.introCopy}>
          <Text style={styles.introTitle}>Kart takvimi</Text>
          <Text style={styles.introText}>Hesap kesim ve son ödeme günlerini tek yerde takip et.</Text>
        </View>
      </View>

      <View style={styles.calendarCard}>
        <View style={styles.monthHeader}>
          <Pressable style={styles.monthButton} onPress={() => changeMonth(-1)} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={colors.navy} />
          </Pressable>
          <Text style={styles.monthTitle}>{monthFormatter.format(visibleMonth)}</Text>
          <Pressable style={styles.monthButton} onPress={() => changeMonth(1)} hitSlop={8}>
            <Ionicons name="chevron-forward" size={22} color={colors.navy} />
          </Pressable>
        </View>
        <View style={styles.weekRow}>
          {weekdays.map((day) => <Text key={day} style={styles.weekday}>{day}</Text>)}
        </View>
        <View style={styles.daysGrid}>
          {monthCells.map((date, index) => {
            if (!date) return <View key={`empty-${index}`} style={styles.dayCell} />;
            const dayEvents = events.filter((event) => isSameDate(event.date, date));
            const selected = isSameDate(date, selectedDate);
            const isToday = isSameDate(date, today);
            return (
              <Pressable key={toDateString(date)} style={({ pressed }) => [styles.dayCell, selected && styles.daySelected, pressed && styles.pressed]} onPress={() => setSelectedDate(date)}>
                <Text style={[styles.dayNumber, selected && styles.dayNumberSelected, isToday && !selected && styles.dayNumberToday]}>{date.getDate()}</Text>
                <View style={styles.eventDots}>
                  {dayEvents.slice(0, 3).map((event, eventIndex) => <View key={`${event.card.id}-${event.type}`} style={[styles.dot, { backgroundColor: event.type === 'due' ? colors.overdue : colors.primary }, eventIndex > 0 && styles.dotGap]} />)}
                </View>
              </Pressable>
            );
          })}
        </View>
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.primary }]} /><Text style={styles.legendText}>Hesap kesim</Text></View>
          <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: colors.overdue }]} /><Text style={styles.legendText}>Son ödeme</Text></View>
        </View>
      </View>

      <Text style={styles.selectedHeading}>{dayFormatter.format(selectedDate)}</Text>
      {selectedEvents.length ? selectedEvents.map((event) => {
        const paid = paymentTotal(event.card.id);
        // Kart ödemesi kaydedildiğinde mevcut ekstre borcu azaltılıyor. Bu nedenle
        // başlangıçtaki ödenecek tutarı, kalan ekstre + o ay kaydedilen ödemelerden kuruyoruz.
        const remaining = Number(event.card.statement_amount ?? event.card.current_balance);
        const dueAmount = remaining + paid;
        return (
          <Pressable key={`${event.card.id}-${event.type}`} style={({ pressed }) => [styles.eventCard, pressed && styles.pressed]} onPress={() => router.push(`/card/${event.card.id}`)}>
            <View style={[styles.eventTypeIcon, { backgroundColor: event.type === 'due' ? colors.overdueBg : colors.primaryLight }]}>
              <Ionicons name={event.type === 'due' ? 'card-outline' : 'document-text-outline'} size={22} color={event.type === 'due' ? colors.overdue : colors.primary} />
            </View>
            <View style={styles.eventCopy}>
              <Text style={styles.eventTitle}>{event.card.nickname || event.card.bank_name}</Text>
              <Text style={styles.eventType}>{event.type === 'due' ? 'Son ödeme günü' : 'Hesap kesim günü'}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.slate400} />
            <View style={styles.amountGrid}>
              <CalendarAmount label="Ödenecek" value={dueAmount} />
              <CalendarAmount label="Ödendi" value={paid} tone={colors.income} />
              <CalendarAmount label="Kalan" value={remaining} tone={remaining > 0 ? colors.overdue : colors.income} />
            </View>
          </Pressable>
        );
      }) : <View style={styles.noEvents}><Ionicons name="calendar-clear-outline" size={28} color={colors.slate400} /><Text style={styles.noEventsText}>Bu tarihte kart etkinliği yok.</Text></View>}
    </ScrollView>
  );
}

function CalendarAmount({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return <View style={styles.amountCell}><Text style={styles.amountLabel}>{label}</Text><Text style={[styles.amountValue, tone && { color: tone }]} numberOfLines={1} adjustsFontSizeToFit>{formatCurrency(value)}</Text></View>;
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  pressed: { opacity: 0.72 },
  intro: { flexDirection: 'row', gap: spacing.md, alignItems: 'center', marginBottom: spacing.lg },
  introIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  introCopy: { flex: 1 },
  introTitle: { color: colors.slate800, fontSize: 20, fontWeight: '800' },
  introText: { color: colors.slate500, fontSize: 13, marginTop: 2 },
  calendarCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.slate100 },
  monthHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  monthButton: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.slate100 },
  monthTitle: { color: colors.slate800, fontSize: 18, fontWeight: '800', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row', marginBottom: spacing.xs },
  weekday: { width: '14.2857%', textAlign: 'center', color: colors.slate400, fontSize: 11, fontWeight: '700' },
  daysGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: { width: '14.2857%', height: 53, alignItems: 'center', justifyContent: 'center', borderRadius: radius.sm },
  daySelected: { backgroundColor: colors.primary },
  dayNumber: { color: colors.slate700, fontSize: 14, fontWeight: '600' },
  dayNumberSelected: { color: colors.white },
  dayNumberToday: { color: colors.primary, fontWeight: '900' },
  eventDots: { height: 7, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  dotGap: { marginLeft: 2 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: spacing.lg, paddingTop: spacing.sm, borderTopWidth: 1, borderTopColor: colors.slate100 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
  legendText: { color: colors.slate500, fontSize: 11 },
  selectedHeading: { color: colors.slate800, fontSize: 22, fontWeight: '800', textTransform: 'capitalize', marginTop: spacing.xl, marginBottom: spacing.sm },
  eventCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md, borderWidth: 1, borderColor: colors.slate100, flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing.md },
  eventTypeIcon: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  eventCopy: { flex: 1 },
  eventTitle: { color: colors.slate800, fontSize: 16, fontWeight: '800' },
  eventType: { color: colors.slate500, fontSize: 13, marginTop: 2 },
  amountGrid: { flexBasis: '100%', flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.slate100, paddingTop: spacing.md },
  amountCell: { flex: 1 },
  amountLabel: { color: colors.slate500, fontSize: 11 },
  amountValue: { color: colors.slate800, fontSize: 15, fontWeight: '800', marginTop: 2 },
  noEvents: { minHeight: 120, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.slate100 },
  noEventsText: { color: colors.slate500, fontSize: 14 },
});
