import { useCallback, useMemo, useRef } from 'react';
import { Animated, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '@/src/components/AppHeader';
import { CardCarousel } from '@/src/components/CardCarousel';
import { Enter, PressableScale, useCountUp, useFocusEntrance } from '@/src/components/motion';
import { HeroTile } from '@/src/components/HeroTile';
import { computeCardDates } from '@/src/lib/cardDates';
import { formatCurrency, formatShortDate, formatSignedCurrency } from '@/src/lib/format';
import { useAuthStore } from '@/src/store/useAuthStore';
import { useCardsStore } from '@/src/store/useCardsStore';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { useTransactionsStore } from '@/src/store/useTransactionsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { useAccessInfo } from '@/src/store/useSubscriptionStore';
import { cardPalette, colors, radius, spacing, iconTile, surface } from '@/src/theme';
import type { Card, Transaction } from '@/src/types/database';

const monthFormatter = new Intl.DateTimeFormat('tr-TR', { month: 'long', year: 'numeric' });

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

function displayName(name?: unknown) {
  if (typeof name !== 'string' || !name.trim()) return 'Hoş geldin';
  return name.trim();
}

export default function DashboardScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const session = useAuthStore((state) => state.session);
  const cards = useCardsStore((state) => state.cards);
  const isLoadingCards = useCardsStore((state) => state.isLoading);
  const fetchCards = useCardsStore((state) => state.fetchCards);
  const accounts = useAccountsStore((state) => state.accounts);
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);
  const personalDebts = usePersonalDebtsStore((state) => state.personalDebts);
  const fetchPersonalDebts = usePersonalDebtsStore((state) => state.fetchPersonalDebts);
  const transactions = useTransactionsStore((state) => state.transactions);
  const transactionsFilter = useTransactionsStore((state) => state.filter);
  const setTransactionsFilter = useTransactionsStore((state) => state.setFilter);
  const fetchTransactions = useTransactionsStore((state) => state.fetchTransactions);
  const transactionsDateRange = useTransactionsStore((state) => state.dateRange);
  const fetchTransactionsDateRange = useTransactionsStore((state) => state.fetchDateRange);
  const plannedPayments = usePlannedPaymentsStore((state) => state.plannedPayments);
  const fetchPlannedPayments = usePlannedPaymentsStore((state) => state.fetchPlannedPayments);
  const cashBalance = useSettingsStore((state) => state.cashBalance);
  const access = useAccessInfo();

  const refresh = useCallback(() => {
    void useSettingsStore.getState().fetchSettings();
    void fetchCards();
    void fetchAccounts();
    void fetchPersonalDebts();
    void fetchTransactions();
    void fetchPlannedPayments();
    void fetchTransactionsDateRange();
  }, [
    fetchAccounts,
    fetchCards,
    fetchPersonalDebts,
    fetchPlannedPayments,
    fetchTransactions,
    fetchTransactionsDateRange,
  ]);

  // Sekmeler arası geçişte ScrollView konumu korunur; Ana Sayfa'ya her
  // dönüşte en üstten başlasın diye odaklanınca en tepeye kaydırıyoruz.
  useFocusEffect(
    useCallback(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
      refresh();
    }, [refresh])
  );

  const { totals, upcomingCard, upcomingDate } = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const transaction of transactions) {
      if (transaction.type === 'income') income += Number(transaction.amount);
      if (transaction.type === 'expense') expense += Number(transaction.amount);
    }

    const nextCards = cards
      .map((card) => ({ card, date: computeCardDates(card).nextDueDate }))
      .sort((left, right) => left.date.getTime() - right.date.getTime());
    const openPlanned = plannedPayments.filter((payment) => !payment.is_paid);
    const cardDebt = cards.reduce((sum, card) => sum + Number(card.current_balance), 0);
    const personalDebt = personalDebts
      .filter((debt) => !debt.is_paid)
      .reduce((sum, debt) => sum + Number(debt.amount), 0);
    // Nakit olarak tutulan gelirler de varlık: hesap bakiyelerine eklenir.
    const accountBalance = accounts.reduce((sum, account) => sum + Number(account.balance), 0) + cashBalance;

    return {
      totals: {
        cardDebt,
        personalDebt,
        accountBalance,
        netWorth: accountBalance - cardDebt - personalDebt,
        income,
        expense,
        plannedTotal: openPlanned.reduce((sum, payment) => sum + Number(payment.amount), 0),
        plannedCount: openPlanned.length,
      },
      upcomingCard: nextCards[0]?.card,
      upcomingDate: nextCards[0]?.date,
    };
  }, [accounts, cards, cashBalance, personalDebts, plannedPayments, transactions]);

  function goToCard(card: Card) {
    router.push(`/card/${card.id}`);
  }

  const [viewYear, viewMonth0] = useMemo(() => {
    const [y, m] = transactionsFilter.from.split('-').map(Number);
    return [y, m - 1];
  }, [transactionsFilter.from]);
  const viewDate = useMemo(() => new Date(viewYear, viewMonth0, 1), [viewYear, viewMonth0]);
  const viewMonthIndex = viewYear * 12 + viewMonth0;

  // İşlemi olmayan aylara gidilmesin: oklar, en eski/en yeni işlemin ayı ile sınırlı.
  function monthIndexOf(dateString: string) {
    const [y, m] = dateString.split('-').map(Number);
    return y * 12 + (m - 1);
  }
  const canGoBack =
    transactionsDateRange.earliest != null &&
    viewMonthIndex > monthIndexOf(transactionsDateRange.earliest);
  const canGoForward =
    transactionsDateRange.latest != null &&
    viewMonthIndex < monthIndexOf(transactionsDateRange.latest);

  function shiftMonth(delta: number) {
    setTransactionsFilter(monthRangeFor(viewYear, viewMonth0 + delta));
  }

  const username = displayName(session?.user.user_metadata.display_name);
  const entrance = useFocusEntrance();
  const netWorthShown = useCountUp(totals.netWorth);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        ref={scrollRef}
        style={styles.flex}
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
      >
        <Enter time={entrance} index={0} style={styles.header}><AppHeader /></Enter>

        <Enter time={entrance} index={1} style={styles.greetingRow}>
          <Text style={styles.greeting} numberOfLines={1} adjustsFontSizeToFit>
            Merhaba, {username}
          </Text>
          <View style={styles.monthPicker}>
            <Pressable onPress={() => shiftMonth(-1)} hitSlop={8} disabled={!canGoBack}>
              <Ionicons
                name="chevron-back"
                size={16}
                color={canGoBack ? colors.navy : colors.slate300}
              />
            </Pressable>
            <Text style={styles.monthText}>{monthFormatter.format(viewDate)}</Text>
            <Pressable onPress={() => shiftMonth(1)} hitSlop={8} disabled={!canGoForward}>
              <Ionicons
                name="chevron-forward"
                size={16}
                color={canGoForward ? colors.navy : colors.slate300}
              />
            </Pressable>
          </View>
        </Enter>

        {upcomingCard && upcomingDate ? (
          <Enter time={entrance} index={2}>
          <PressableScale innerStyle={styles.paymentAlert} onPress={() => goToCard(upcomingCard)}>
            <View style={styles.alertIcon}>
              <Ionicons name="calendar-outline" size={28} color="#b56d00" />
            </View>
            <View style={styles.alertCopy}>
              <Text style={styles.alertTitle}>Yaklaşan ödeme</Text>
              <Text style={styles.alertSubtitle} numberOfLines={1}>
                {upcomingCard.nickname || upcomingCard.bank_name} · {formatShortDate(upcomingDate)}
              </Text>
            </View>
            <Text style={styles.alertAmount} numberOfLines={1} adjustsFontSizeToFit>
              {formatCurrency(upcomingCard.statement_amount ?? upcomingCard.current_balance)}
            </Text>
            <Ionicons name="chevron-forward" size={22} color={colors.slate400} />
          </PressableScale>
          </Enter>
        ) : null}

        {access.status === 'trial' || access.status === 'expired' ? (
          <Pressable
            style={({ pressed }) => [styles.trialBanner, access.status === 'expired' && styles.trialBannerExpired, pressed && { opacity: 0.8 }]}
            onPress={() => router.push('/paywall')}
          >
            <Ionicons name="diamond-outline" size={16} color={access.status === 'expired' ? colors.overdue : colors.primary} />
            <Text style={[styles.trialBannerText, access.status === 'expired' && styles.trialBannerTextExpired]} numberOfLines={1}>
              {access.status === 'expired' ? 'Deneme süren doldu · Premium’a geç' : `Ücretsiz deneme · ${access.trialDaysLeft} gün kaldı`}
            </Text>
            <Text style={[styles.trialBannerAction, access.status === 'expired' && styles.trialBannerTextExpired]}>Premium ›</Text>
          </Pressable>
        ) : null}

        <Enter time={entrance} index={3} style={styles.heroWrap}>
          <HeroTile
            tone={totals.netWorth < 0 ? 'red' : 'navy'}
            icon="wallet-outline"
            label="Net Durum"
            value={netWorthShown < 0 ? formatSignedCurrency(netWorthShown) : formatCurrency(netWorthShown)}
            caption="Hesaplar + Nakit − Tüm Borçlar"
          />
        </Enter>

        <Enter time={entrance} index={4}>
          <SectionHeader title="Kartlarım" count={cards.length} action="Tümü" onPress={() => router.push('/cards')} />
        </Enter>
        <Enter time={entrance} index={5}>
        <CardCarousel
          cards={cards}
          isLoading={isLoadingCards}
          onCardPress={goToCard}
          onAddPress={() => router.push('/card/new')}
        />
        </Enter>

        <Enter time={entrance} index={6}>
          <Text style={styles.summaryHeading}>Bu ayın özeti</Text>
        </Enter>
        <View style={styles.summaryGrid}>
          <SummaryCard
            time={entrance}
            index={7}
            title="Kart borcu"
            icon="card-outline"
            iconBackground={colors.primaryLight}
            iconColor={colors.primary}
            value={formatCurrency(totals.cardDebt)}
            caption={cards.length ? `${cards.length} kart` : 'Kart ekle'}
            onPress={() => router.push('/cards')}
          />
          <SummaryCard
            time={entrance}
            index={8}
            title="Borçlarım"
            icon="people-outline"
            iconBackground="#ffe5e8"
            iconColor={colors.overdue}
            value={formatCurrency(totals.personalDebt)}
            caption={personalDebts.filter((debt) => !debt.is_paid).length ? 'Açık borçların' : 'Açık borcun yok'}
            onPress={() => router.push('/debts')}
          />
          <SummaryCard
            time={entrance}
            index={9}
            title="Hesaplarım"
            icon="wallet-outline"
            iconBackground="#e3e8ff"
            iconColor={colors.navy}
            value={formatCurrency(totals.accountBalance)}
            caption={
              cashBalance > 0
                ? `${accounts.length ? `${accounts.length} hesap + ` : ''}nakit ${formatCurrency(cashBalance)}`
                : accounts.length ? `${accounts.length} hesap` : 'Hesap ekle'
            }
            onPress={() => router.push('/accounts')}
          />
          <SummaryCard
            time={entrance}
            index={10}
            title="Gelirim"
            icon="trending-up"
            iconBackground="#d9f7e9"
            iconColor="#07865a"
            value={formatCurrency(totals.income)}
            caption="Bu ay"
            onPress={() => router.push('/income')}
          />
          <SummaryCard
            time={entrance}
            index={11}
            title="Giderim"
            icon="trending-down"
            iconBackground="#ffe5e8"
            iconColor={cardPalette.rose}
            value={formatCurrency(totals.expense)}
            caption="Bu ay"
            onPress={() => router.push('/expenses')}
          />
          <SummaryCard
            time={entrance}
            index={12}
            title="Planlanan"
            icon="calendar-outline"
            iconBackground="#fff0d7"
            iconColor="#b56d00"
            value={formatCurrency(totals.plannedTotal)}
            caption={totals.plannedCount ? `${totals.plannedCount} ödeme` : 'Bekleyen ödeme yok'}
            onPress={() => router.push('/planned')}
          />
        </View>

        <Enter time={entrance} index={13}>
          <SectionHeader title="Son işlemler" action="Tümü" onPress={() => router.push('/expenses')} />
        </Enter>
        {transactions.length ? (
          <Enter time={entrance} index={14} style={styles.transactions}>
            {transactions.slice(0, 3).map((transaction) => (
              <RecentTransaction
                key={transaction.id}
                transaction={transaction}
                onPress={() => router.push(`/transaction/${transaction.id}/edit`)}
              />
            ))}
          </Enter>
        ) : (
          <Enter time={entrance} index={14}>
            <Text style={styles.emptyTransactions}>Henüz bu aya ait işlem yok.</Text>
          </Enter>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, count, action, onPress }: { title: string; count?: number; action?: string; onPress?: () => void }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.titleWithCount}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {count != null ? <Text style={styles.countBadge}>{count}</Text> : null}
      </View>
      {action && onPress ? (
        <Pressable style={styles.sectionAction} onPress={onPress} hitSlop={8}>
          <Text style={styles.sectionActionText}>{action}</Text>
          <Ionicons name="chevron-forward" size={20} color={colors.primary} />
        </Pressable>
      ) : null}
    </View>
  );
}

function SummaryCard({ time, index, title, icon, iconBackground, iconColor, value, caption, onPress }: {
  time: Animated.Value;
  index: number;
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconBackground: string;
  iconColor: string;
  value: string;
  caption: string;
  onPress: () => void;
}) {
  return (
    <Enter time={time} index={index} style={styles.summaryCell}>
    <PressableScale innerStyle={styles.summaryCard} onPress={onPress}>
      <View style={[styles.summaryIcon, { backgroundColor: iconBackground }]}>
        <Ionicons name={icon} size={22} color={iconColor} />
      </View>
      <View style={styles.summaryCopy}>
        <Text style={styles.summaryTitle} numberOfLines={1}>{title}</Text>
        <Text style={styles.summaryValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
        <Text style={styles.summaryCaption} numberOfLines={1}>{caption}</Text>
      </View>
    </PressableScale>
    </Enter>
  );
}

function RecentTransaction({ transaction, onPress }: { transaction: Transaction; onPress: () => void }) {
  const isIncome = transaction.type === 'income';
  const icon = isIncome ? 'arrow-down' : transaction.type === 'card_payment' ? 'card-outline' : 'bag-outline';
  const label = isIncome ? 'Gelir' : transaction.type === 'expense' ? 'Gider' : 'Kart ödemesi';

  return (
    <Pressable style={({ pressed }) => [styles.transactionRow, pressed && styles.pressed]} onPress={onPress}>
      <View style={[styles.transactionIcon, { backgroundColor: isIncome ? '#d9f7e9' : colors.primaryLight }]}>
        <Ionicons name={icon} size={24} color={isIncome ? '#07865a' : colors.primary} />
      </View>
      <View style={styles.transactionCopy}>
        <Text style={styles.transactionTitle} numberOfLines={1}>{transaction.category || label}</Text>
        <Text style={styles.transactionSubtitle}>{formatShortDate(transaction.occurred_on)} · {label}</Text>
      </View>
      <Text style={[styles.transactionAmount, isIncome && styles.incomeAmount]}>
        {formatSignedCurrency(isIncome ? Number(transaction.amount) : -Number(transaction.amount))}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { paddingBottom: spacing.xxl, gap: spacing.lg },
  pressed: { opacity: 0.72 },
  header: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  greetingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  greeting: { flexShrink: 1, color: '#0f1d36', fontSize: 22, fontWeight: '800', letterSpacing: -0.4 },
  monthPicker: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, borderWidth: 1, borderColor: '#dfe5f0', borderRadius: radius.full, paddingHorizontal: spacing.md, paddingVertical: 7 },
  monthText: { color: colors.navy, fontSize: 13, fontWeight: '600' },
  paymentAlert: { marginHorizontal: spacing.lg, flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: 14, borderRadius: 18, backgroundColor: '#fff8e8', borderWidth: 1, borderColor: '#fdeccb' },
  alertIcon: { ...iconTile, width: 44, height: 44, borderRadius: 13, backgroundColor: '#ffebc5' },
  alertCopy: { flex: 1, minWidth: 0 },
  alertTitle: { color: '#17243c', fontSize: 14, fontWeight: '700' },
  alertSubtitle: { color: '#667795', fontSize: 12, marginTop: 2 },
  alertAmount: { color: '#0f1d36', fontSize: 15, fontWeight: '800', maxWidth: '30%' },
  heroWrap: { marginHorizontal: spacing.lg },
  trialBanner: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.primaryLight,
  },
  trialBannerExpired: { backgroundColor: colors.overdueBg },
  trialBannerText: { flex: 1, color: colors.primary, fontSize: 13, fontWeight: '600' },
  trialBannerTextExpired: { color: colors.overdue },
  trialBannerAction: { color: colors.primary, fontSize: 13, fontWeight: '800' },
  sectionHeader: { paddingHorizontal: spacing.lg, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  titleWithCount: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  sectionTitle: { color: '#0f1d36', fontSize: 20, fontWeight: '800', letterSpacing: -0.3 },
  countBadge: { minWidth: 26, height: 26, paddingHorizontal: spacing.xs, borderRadius: radius.full, textAlign: 'center', textAlignVertical: 'center', overflow: 'hidden', backgroundColor: '#eef1f7', color: '#35435c', fontSize: 13, fontWeight: '700', lineHeight: 26 },
  sectionAction: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  sectionActionText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  summaryHeading: { color: '#0f1d36', fontSize: 20, fontWeight: '800', letterSpacing: -0.3, paddingHorizontal: spacing.lg },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: spacing.lg },
  summaryCell: { flexBasis: '47%', flexGrow: 1 },
  summaryCard: { ...surface, minHeight: 124, padding: 14 },
  summaryIcon: { ...iconTile },
  summaryCopy: { marginTop: 12, minWidth: 0 },
  summaryTitle: { color: '#64748b', fontSize: 12.5, fontWeight: '600' },
  summaryValue: { color: '#0f1d36', fontSize: 18, fontWeight: '800', marginTop: 2 },
  summaryCaption: { color: '#74849e', fontSize: 11, marginTop: 1 },
  transactions: { ...surface, marginHorizontal: spacing.lg, overflow: 'hidden' },
  transactionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
  transactionIcon: { ...iconTile },
  transactionCopy: { flex: 1, minWidth: 0 },
  transactionTitle: { color: '#17243c', fontSize: 14, fontWeight: '700' },
  transactionSubtitle: { color: '#74849e', fontSize: 11, marginTop: 2 },
  transactionAmount: { color: '#17243c', fontSize: 14, fontWeight: '800' },
  incomeAmount: { color: '#07865a' },
  emptyTransactions: { color: colors.slate500, fontSize: 15, paddingHorizontal: spacing.xl, marginTop: -spacing.md },
});
