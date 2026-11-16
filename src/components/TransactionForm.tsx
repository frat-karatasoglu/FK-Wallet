import { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { DateField } from './DateField';
import { CategoryPicker } from './CategoryPicker';
import {
  PaymentSourcePicker,
  paymentSourceFields,
  paymentSourceFromFields,
  type PaymentSource,
} from './PaymentSourcePicker';
import { useCardsStore } from '../store/useCardsStore';
import { useAccountsStore } from '../store/useAccountsStore';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { cardPalette, colors, radius, spacing, typography } from '../theme';
import type { NewTransaction, TransactionType } from '../types/database';

interface TransactionFormProps {
  initialValues?: Partial<NewTransaction>;
  submitLabel: string;
  onSubmit: (values: NewTransaction) => Promise<string | null>;
  onDelete?: () => Promise<void>;
  hideTypeSelector?: boolean;
}

const TYPE_OPTIONS: { value: TransactionType; label: string }[] = [
  { value: 'income', label: 'Gelir' },
  { value: 'card_payment', label: 'Kart Ödemesi' },
  { value: 'expense', label: 'Gider' },
];

// Yerel tarih bileşenleri: toISOString() UTC'ye kaydırdığı için TR'de gün atlıyor.
function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function TransactionForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
  hideTypeSelector = false,
}: TransactionFormProps) {
  const cards = useCardsStore((s) => s.cards);
  const accounts = useAccountsStore((s) => s.accounts);

  const [type, setType] = useState<TransactionType>(initialValues?.type ?? 'expense');
  const [accountId, setAccountId] = useState<string | null>(initialValues?.account_id ?? null);
  const [amount, setAmount] = useState(
    moneyValueToInput(initialValues?.amount)
  );
  const [occurredOn, setOccurredOn] = useState(
    initialValues?.occurred_on ? new Date(initialValues.occurred_on) : new Date()
  );
  const [category, setCategory] = useState(initialValues?.category ?? '');
  const [customCategory, setCustomCategory] = useState(initialValues?.category ?? '');
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [cardId, setCardId] = useState<string | null>(
    initialValues?.type === 'expense' ? null : initialValues?.card_id ?? null
  );
  const [source, setSource] = useState<PaymentSource>(
    initialValues ? paymentSourceFromFields(initialValues) : { kind: 'cash' }
  );
  // Bu özellikten önce kaydedilmiş bir gider/kart ödemesi düzenlenirken kaynak
  // seçilmediyse dokunmayalım; aksi halde eski bir kayıt birden nakitten düşerdi.
  const isLegacyRecord = Boolean(initialValues?.amount) && !initialValues?.payment_source;
  const [sourceTouched, setSourceTouched] = useState(!isLegacyRecord);

  function changeSource(next: PaymentSource) {
    setSource(next);
    setSourceTouched(true);
  }

  function sourceFieldsForType(): Pick<NewTransaction, 'card_id' | 'account_id' | 'payment_source'> {
    if (type === 'income') return { card_id: null, account_id: accountId, payment_source: null };
    if (type === 'card_payment') {
      if (!sourceTouched) return { card_id: cardId, account_id: null, payment_source: null };
      return source.kind === 'account'
        ? { card_id: cardId, account_id: source.id, payment_source: 'account' }
        : { card_id: cardId, account_id: null, payment_source: 'cash' };
    }
    if (!sourceTouched) return { card_id: null, account_id: null, payment_source: null };
    return paymentSourceFields(source);
  }
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir tutar gir.');
      return;
    }
    if (type === 'card_payment' && !cardId) {
      setError('Bir kart seç.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      type,
      amount: parsedAmount,
      occurred_on: toDateString(occurredOn),
      category: category.trim() || null,
      note: note.trim() || null,
      ...sourceFieldsForType(),
    });
    setIsSubmitting(false);
    if (message) setError(message);
  }

  async function handleDelete() {
    if (!onDelete) return;
    setIsDeleting(true);
    await onDelete();
    setIsDeleting(false);
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {hideTypeSelector ? null : (
          <>
            <Text style={typography.caption}>Tür</Text>
            <View style={styles.segmentRow}>
              {TYPE_OPTIONS.map((option) => {
                const selected = option.value === type;
                return (
                  <Pressable
                    key={option.value}
                    style={[styles.segment, selected && styles.segmentSelected]}
                    onPress={() => setType(option.value)}
                  >
                    <Text style={[styles.segmentText, selected && styles.segmentTextSelected]}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        )}

        {type === 'card_payment' ? (
          <View style={styles.cardPickerWrapper}>
            <Text style={typography.caption}>Kart</Text>
            {cards.length === 0 ? (
              <Text style={styles.warning}>Önce Kartlarım sekmesinden bir kart ekle.</Text>
            ) : (
              <View style={styles.cardPickerRow}>
                {cards.map((card) => {
                  const selected = card.id === cardId;
                  return (
                    <Pressable
                      key={card.id}
                      onPress={() => setCardId(card.id)}
                      style={[
                        styles.cardChip,
                        { borderColor: cardPalette[card.color] },
                        selected && { backgroundColor: cardPalette[card.color] },
                      ]}
                    >
                      <Text
                        style={[styles.cardChipText, selected && styles.cardChipTextSelected]}
                        numberOfLines={1}
                      >
                        {card.nickname || card.bank_name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        ) : null}

        {type === 'income' ? (
          <View style={styles.cardPickerWrapper}>
            <Text style={typography.caption}>Nereye?</Text>
            <View style={styles.cardPickerRow}>
              <Pressable
                onPress={() => setAccountId(null)}
                style={[styles.cardChip, styles.cashChip, accountId === null && styles.cashChipSelected]}
              >
                <Text
                  style={[styles.cardChipText, accountId === null && styles.cardChipTextSelected]}
                >
                  Nakit
                </Text>
              </Pressable>
              {accounts.map((account) => {
                const selected = account.id === accountId;
                return (
                  <Pressable
                    key={account.id}
                    onPress={() => setAccountId(account.id)}
                    style={[
                      styles.cardChip,
                      { borderColor: cardPalette[account.color] },
                      selected && { backgroundColor: cardPalette[account.color] },
                    ]}
                  >
                    <Text
                      style={[styles.cardChipText, selected && styles.cardChipTextSelected]}
                      numberOfLines={1}
                    >
                      {account.nickname || account.bank_name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Text style={styles.hint}>
              {accountId === null ? 'Elindeki nakde eklenir.' : 'Seçtiğin hesabın bakiyesine eklenir.'}
            </Text>
          </View>
        ) : null}

        {type === 'expense' || (type === 'card_payment' && cards.length > 0) ? (
          <PaymentSourcePicker
            label={type === 'card_payment' ? 'Ödemeyi nereden yaptın?' : 'Nereden ödendi?'}
            value={source}
            onChange={changeSource}
            allowCards={type === 'expense'}
          />
        ) : null}
        {!sourceTouched && type !== 'income' ? (
          <Text style={styles.hint}>Bu kayıt eski; bir kaynak seçmezsen hiçbir bakiye değişmez.</Text>
        ) : null}

        <FormField
          label="Tutar (₺)"
          value={amount}
          onChangeText={(value) => setAmount(formatMoneyInput(value))}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <DateField label="Tarih" value={occurredOn} onChange={setOccurredOn} />

        {type !== 'card_payment' ? (
          <CategoryPicker
            type={type}
            value={category}
            onChange={setCategory}
            customValue={customCategory}
            onCustomChange={setCustomCategory}
          />
        ) : null}
        <FormField
          label="Not (opsiyonel)"
          value={note}
          onChangeText={setNote}
          placeholder="Ek bilgi"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title={submitLabel}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />

        {onDelete ? (
          <PrimaryButton
            title="Hareketi Sil"
            variant="outline"
            onPress={handleDelete}
            isLoading={isDeleting}
            style={styles.deleteButton}
          />
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl },
  segmentRow: {
    flexDirection: 'row',
    backgroundColor: colors.slate100,
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.sm,
  },
  segment: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  segmentSelected: {
    backgroundColor: colors.white,
  },
  segmentText: {
    fontSize: 13,
    color: colors.slate500,
    fontWeight: '600',
  },
  segmentTextSelected: {
    color: colors.navy,
  },
  cardPickerWrapper: {
    marginTop: spacing.lg,
    gap: spacing.sm,
  },
  cardPickerRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  cardChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    maxWidth: '100%',
  },
  cardChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.slate700,
  },
  cardChipTextSelected: {
    color: colors.white,
  },
  cashChip: {
    borderColor: colors.slate300,
    borderStyle: 'dashed',
  },
  cashChipSelected: {
    backgroundColor: colors.slate700,
    borderColor: colors.slate700,
    borderStyle: 'solid',
  },
  warning: {
    fontSize: 13,
    color: colors.dueSoon,
  },
  hint: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: spacing.xs,
  },
  error: {
    color: colors.overdue,
    marginTop: spacing.lg,
    fontSize: 13,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
