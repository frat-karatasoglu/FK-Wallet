import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useAccountsStore } from '../store/useAccountsStore';
import { useCardsStore } from '../store/useCardsStore';
import { cardPalette, colors, radius, spacing, typography } from '../theme';
import type { PaymentSource } from '../lib/paymentSource';

export { paymentSourceFields, paymentSourceFromFields, type PaymentSource } from '../lib/paymentSource';

interface PaymentSourcePickerProps {
  label?: string;
  value: PaymentSource;
  onChange: (value: PaymentSource) => void;
  /** Kart ödemesinde kredi kartıyla ödeme seçeneği gösterilmez. */
  allowCards?: boolean;
  /** Bu kart seçeneklerden çıkarılır (ör. borcu ödenen kartın kendisi). */
  excludeCardId?: string | null;
}

export function PaymentSourcePicker({
  label = 'Nereden ödendi?',
  value,
  onChange,
  allowCards = true,
  excludeCardId,
}: PaymentSourcePickerProps) {
  const accounts = useAccountsStore((state) => state.accounts);
  const cards = useCardsStore((state) => state.cards);
  const cardOptions = allowCards ? cards.filter((card) => card.id !== excludeCardId) : [];

  const selectedAccount = value.kind === 'account' ? accounts.find((a) => a.id === value.id) : undefined;
  const selectedCard = value.kind === 'card' ? cards.find((c) => c.id === value.id) : undefined;
  const hint =
    value.kind === 'cash'
      ? 'Elindeki nakitten düşülür.'
      : selectedAccount
        ? `${selectedAccount.nickname || selectedAccount.bank_name} bakiyesinden düşülür.`
        : selectedCard
          ? `${selectedCard.nickname || selectedCard.bank_name} kartının borcuna eklenir.`
          : '';

  return (
    <View style={styles.wrapper}>
      <Text style={typography.caption}>{label}</Text>
      <View style={styles.row}>
        <Pressable
          onPress={() => onChange({ kind: 'cash' })}
          style={[styles.chip, styles.cashChip, value.kind === 'cash' && styles.cashChipSelected]}
        >
          <Ionicons name="cash-outline" size={14} color={value.kind === 'cash' ? colors.white : colors.slate700} />
          <Text style={[styles.chipText, value.kind === 'cash' && styles.chipTextSelected]}>Nakit</Text>
        </Pressable>

        {accounts.map((account) => {
          const selected = value.kind === 'account' && value.id === account.id;
          return (
            <Pressable
              key={account.id}
              onPress={() => onChange({ kind: 'account', id: account.id })}
              style={[
                styles.chip,
                { borderColor: cardPalette[account.color] },
                selected && { backgroundColor: cardPalette[account.color] },
              ]}
            >
              <Ionicons name="business-outline" size={14} color={selected ? colors.white : colors.slate700} />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                {account.nickname || account.bank_name}
              </Text>
            </Pressable>
          );
        })}

        {cardOptions.map((card) => {
          const selected = value.kind === 'card' && value.id === card.id;
          return (
            <Pressable
              key={card.id}
              onPress={() => onChange({ kind: 'card', id: card.id })}
              style={[
                styles.chip,
                { borderColor: cardPalette[card.color] },
                selected && { backgroundColor: cardPalette[card.color] },
              ]}
            >
              <Ionicons name="card-outline" size={14} color={selected ? colors.white : colors.slate700} />
              <Text style={[styles.chipText, selected && styles.chipTextSelected]} numberOfLines={1}>
                {card.nickname || card.bank_name}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.lg, gap: spacing.sm },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    borderWidth: 1.5,
    maxWidth: '100%',
  },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.slate700, flexShrink: 1 },
  chipTextSelected: { color: colors.white },
  cashChip: { borderColor: colors.slate300 },
  cashChipSelected: { backgroundColor: colors.slate700, borderColor: colors.slate700 },
  hint: { fontSize: 12, color: colors.slate500 },
});
