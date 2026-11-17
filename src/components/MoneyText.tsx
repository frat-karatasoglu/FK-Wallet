import { StyleSheet, type TextStyle } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { colors } from '../theme';
import { formatCurrency, formatSignedCurrency } from '../lib/format';

interface MoneyTextProps {
  amount: number;
  signed?: boolean;
  style?: TextStyle;
}

export function MoneyText({ amount, signed = false, style }: MoneyTextProps) {
  const color = !signed
    ? colors.slate800
    : amount > 0
      ? colors.income
      : amount < 0
        ? colors.overdue
        : colors.slate800;

  return (
    <Text style={[styles.text, { color }, style]}>
      {signed ? formatSignedCurrency(amount) : formatCurrency(amount)}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontVariant: ['tabular-nums'],
  },
});
