import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { formatCurrency, formatDate } from '@/src/lib/format';
import { DEBT_CATEGORIES } from '@/src/lib/debtCategories';
import { hasPaymentPlan, nextInstallmentAmount } from '@/src/lib/paymentSchedule';
import { AppHeader } from '@/src/components/AppHeader';
import { CardCarousel } from '@/src/components/CardCarousel';
import { AccountCard } from '@/src/components/AccountCard';
import { InlineMoneyEditor } from '@/src/components/InlineMoneyEditor';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { useCardsStore } from '@/src/store/useCardsStore';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { useSettingsStore } from '@/src/store/useSettingsStore';
import { colors, spacing } from '@/src/theme';

type WalletTab = 'cards' | 'accounts' | 'debts';

const tabs: { id: WalletTab; label: string }[] = [
  { id: 'cards', label: 'Kartlarım' },
  { id: 'accounts', label: 'Hesaplarım' },
  { id: 'debts', label: 'Borçlarım' },
];

export default function WalletScreen() {
  const router = useRouter();
  const scrollRef = useRef<ScrollView>(null);
  const cards = useCardsStore((state) => state.cards);
  const isLoadingCards = useCardsStore((state) => state.isLoading);
  const fetchCards = useCardsStore((state) => state.fetchCards);
  const accounts = useAccountsStore((state) => state.accounts);
  const fetchAccounts = useAccountsStore((state) => state.fetchAccounts);
  const debts = usePersonalDebtsStore((state) => state.personalDebts);
  const fetchDebts = usePersonalDebtsStore((state) => state.fetchPersonalDebts);
  const cashBalance = useSettingsStore((state) => state.cashBalance);
  const updateCashBalance = useSettingsStore((state) => state.updateCashBalance);
  const [activeTab, setActiveTab] = useState<WalletTab>('cards');

  // Cüzdanım'a her dönüşte Kartlarım sekmesinden ve en üstten başla;
  // önceki seçim/kaydırma konumu kalmasın.
  useFocusEffect(useCallback(() => {
    setActiveTab('cards');
    scrollRef.current?.scrollTo({ y: 0, animated: false });
    void fetchCards();
    void fetchAccounts();
    void fetchDebts();
    void useSettingsStore.getState().fetchSettings();
  }, [fetchAccounts, fetchCards, fetchDebts]));

  const cardDebt = useMemo(() => cards.reduce((sum, card) => sum + Number(card.current_balance), 0), [cards]);
  const accountBalance = useMemo(() => accounts.reduce((sum, account) => sum + Number(account.balance), 0), [accounts]);
  const openDebts = useMemo(() => debts.filter((debt) => !debt.is_paid), [debts]);
  const debtTotal = useMemo(() => openDebts.reduce((sum, debt) => sum + Number(debt.amount), 0), [openDebts]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView ref={scrollRef} style={styles.flex} contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}><AppHeader /></View>

        <View style={styles.tabs}>
          {tabs.map((tab) => {
            const selected = activeTab === tab.id;
            return <Pressable key={tab.id} onPress={() => setActiveTab(tab.id)} style={[styles.tab, selected && styles.tabSelected]}><Text style={[styles.tabText, selected && styles.tabTextSelected]}>{tab.label}</Text></Pressable>;
          })}
        </View>

        {activeTab === 'cards' ? (
          <>
            <WalletSummary icon="card-outline" title="Toplam kart borcu" value={formatCurrency(cardDebt)} caption={cards.length ? `${cards.length} kart` : 'Kart ekle'} tone="blue" />
            <View style={styles.carouselWrap}>
              <CardCarousel cards={cards} isLoading={isLoadingCards} onCardPress={(card) => router.push(`/card/${card.id}`)} onAddPress={() => router.push('/card/new')} />
            </View>
          </>
        ) : null}

        {activeTab === 'accounts' ? (
          <>
            <WalletSummary icon="business-outline" title="Toplam hesap bakiyesi" value={formatCurrency(accountBalance + cashBalance)} caption={accounts.length ? `${accounts.length} hesap + nakit` : 'Nakit'} tone="blue" />
            <View style={styles.cashBox}>
              <View style={[styles.itemIcon, styles.cashIcon]}><Ionicons name="cash-outline" size={22} color={colors.income} /></View>
              <View style={styles.cashEditor}>
                <InlineMoneyEditor label="Nakit (elimdeki)" value={cashBalance} placeholder="Nakit gir" onSave={updateCashBalance} />
              </View>
            </View>
            <Text style={styles.cashHint}>"Nakit olarak tut" seçtiğin gelirler buraya eklenir. Harcadıkça tutarı güncelleyebilirsin.</Text>
            <View style={styles.accountCards}>{accounts.map((account) => (
              <AccountCard
                key={account.id}
                account={account}
                onPress={() => router.push(`/account/${account.id}/edit` as never)}
              />
            ))}</View>
            <AddButton title="Hesap ekle" onPress={() => router.push('/account/new')} />
          </>
        ) : null}

        {activeTab === 'debts' ? (
          <>
            <WalletSummary icon="people-outline" title="Toplam borç" value={formatCurrency(debtTotal)} caption={openDebts.length ? `${openDebts.length} açık borç` : 'Açık borç yok'} tone="red" />
            <View style={styles.list}>{openDebts.map((debt) => {
              const meta = DEBT_CATEGORIES[debt.category ?? 'other'];
              const plan = hasPaymentPlan(debt) ? debt : null;
              return (
                <Pressable
                  key={debt.id}
                  style={({ pressed }) => [styles.debtCard, pressed && styles.pressed]}
                  onPress={() => router.push((plan ? `/debt/${debt.id}` : `/debt/${debt.id}/edit`) as never)}
                >
                  <View style={styles.debtRow}>
                    <View style={[styles.itemIcon, { backgroundColor: meta.background }]}><Ionicons name={meta.icon} size={21} color={meta.color} /></View>
                    <View style={styles.itemCopy}>
                      <Text style={styles.itemTitle} numberOfLines={1}>{debt.person_name}</Text>
                      <Text style={styles.itemLabel} numberOfLines={1}>{meta.label}{debt.note ? ` · ${debt.note}` : ''}</Text>
                    </View>
                    <Text style={styles.debtAmount} numberOfLines={1}>{formatCurrency(debt.amount)}</Text>
                    <Ionicons name="chevron-forward" size={18} color={colors.slate400} />
                  </View>
                  {plan ? (
                    <View style={styles.debtFooter}>
                      <Text style={styles.debtFooterText} numberOfLines={1}>
                        Sonraki: <Text style={styles.debtFooterStrong}>{formatDate(plan.next_payment_date)}</Text> · {formatCurrency(nextInstallmentAmount(plan))}
                      </Text>
                      {plan.installment_count ? <Text style={styles.debtFooterText}>{plan.paid_installments}/{plan.installment_count}</Text> : null}
                    </View>
                  ) : null}
                </Pressable>
              );
            })}</View>
            <AddButton title="Borç ekle" onPress={() => router.push('/debt/new')} />
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function WalletSummary({ icon, title, value, caption, tone }: { icon: keyof typeof Ionicons.glyphMap; title: string; value: string; caption: string; tone: 'blue' | 'red' }) {
  const color = tone === 'red' ? colors.overdue : colors.primary;
  const background = tone === 'red' ? colors.overdueBg : colors.primaryLight;
  return <View style={styles.summary}><View style={[styles.summaryIcon, { backgroundColor: background }]}><Ionicons name={icon} size={26} color={color} /></View><View><Text style={styles.summaryLabel}>{title}</Text><Text style={[styles.summaryValue, tone === 'red' && styles.summaryValueRed]}>{value}</Text><Text style={styles.summaryCaption}>{caption}</Text></View></View>;
}

function AddButton({ title, onPress }: { title: string; onPress: () => void }) {
  return <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.pressed]} onPress={onPress}><Ionicons name="add" size={20} color={colors.primary} /><Text style={styles.addButtonText}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background }, flex: { flex: 1 }, container: { padding: spacing.lg, paddingBottom: spacing.xxl }, pressed: { opacity: 0.72 },
  header: { marginBottom: spacing.lg },
  tabs: { flexDirection: 'row', padding: 3, borderRadius: 9, backgroundColor: '#e8f0ff', marginBottom: spacing.md }, tab: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 7 }, tabSelected: { backgroundColor: colors.primary }, tabText: { color: '#5f7190', fontSize: 11, fontWeight: '700' }, tabTextSelected: { color: colors.white },
  summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4', marginBottom: spacing.md }, summaryIcon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' }, summaryLabel: { color: '#61738f', fontSize: 11, fontWeight: '600' }, summaryValue: { color: '#112c59', fontSize: 21, fontWeight: '800', marginTop: 1 }, summaryValueRed: { color: colors.overdue }, summaryCaption: { color: '#8291a8', fontSize: 11, marginTop: 1 },
  carouselWrap: { marginHorizontal: -spacing.lg }, list: { gap: spacing.sm },
  itemIcon: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }, itemCopy: { flex: 1, minWidth: 0 }, itemTitle: { color: '#112c59', fontSize: 14, fontWeight: '800' }, itemLabel: { color: '#71819c', fontSize: 11, marginTop: 2 },
  debtCard: { borderRadius: 12, padding: spacing.md, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4' },
  debtRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  debtAmount: { color: '#112c59', fontSize: 15, fontWeight: '800', maxWidth: '40%' },
  debtFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginTop: spacing.sm, paddingTop: spacing.sm, borderTopWidth: 1, borderColor: '#edf1f7' },
  debtFooterText: { color: '#71819c', fontSize: 11, flexShrink: 1 },
  debtFooterStrong: { color: '#112c59', fontWeight: '700' },
  cashBox: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md, borderRadius: 12, backgroundColor: colors.white, borderWidth: 1, borderColor: '#e2e9f4' },
  cashIcon: { backgroundColor: colors.incomeBg },
  cashEditor: { flex: 1 },
  cashHint: { color: '#8291a8', fontSize: 11, marginTop: spacing.xs, marginBottom: spacing.md },
  accountCards: { gap: spacing.md },
  addButton: { marginTop: spacing.md, minHeight: 42, borderRadius: 9, borderWidth: 1.5, borderColor: colors.primary, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, backgroundColor: colors.white }, addButtonText: { color: colors.primary, fontSize: 14, fontWeight: '800' },
});
