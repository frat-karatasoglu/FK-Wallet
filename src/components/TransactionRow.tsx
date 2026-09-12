import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';
import { formatShortDate } from '../lib/format';
import { MoneyText } from './MoneyText';
import type { Transaction } from '../types/database';

interface TransactionRowProps {
  transaction: Transaction;
  onPress?: () => void;
}

const ICONS: Record<Transaction['type'], keyof typeof Ionicons.glyphMap> = {
  income: 'arrow-down-circle',
  expense: 'arrow-up-circle',
  card_payment: 'card',
};

const LABELS: Record<Transaction['type'], string> = {
  income: 'Gelir',
  expense: 'Gider',
  card_payment: 'Kart Ödemesi',
};

export function TransactionRow({ transaction, onPress }: TransactionRowProps) {
  const isIncome = transaction.type === 'income';
  const iconColor = isIncome ? colors.income : colors.slate500;

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      <View style={[styles.iconWrap, { backgroundColor: isIncome ? colors.incomeBg : colors.slate100 }]}>
        <Ionicons name={ICONS[transaction.type]} size={20} color={iconColor} />
      </View>
      <View style={styles.middle}>
        <Text style={styles.title} numberOfLines={1}>
          {transaction.category || LABELS[transaction.type]}
        </Text>
        <Text style={styles.subtitle}>{formatShortDate(transaction.occurred_on)}</Text>
      </View>
      <MoneyText amount={isIncome ? transaction.amount : -transaction.amount} signed />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.slate100,
    gap: spacing.md,
  },
  pressed: {
    opacity: 0.7,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  middle: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate800,
  },
  subtitle: {
    fontSize: 12,
    color: colors.slate500,
    marginTop: 2,
  },
});
