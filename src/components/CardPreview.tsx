import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import { formatCurrency, formatShortDate } from '../lib/format';
import { computeCardDates } from '../lib/cardDates';
import type { Card } from '../types/database';
import { CardShell, cardPillStyles } from './CardShell';

export { CARD_ASPECT_RATIO } from './CardShell';

interface CardPreviewProps {
  card: Card;
  onPress?: () => void;
  width?: number;
}

export function CardPreview({ card, onPress, width }: CardPreviewProps) {
  const { nextStatementDate, nextDueDate } = computeCardDates(card);
  const remainingLimit = card.credit_limit == null
    ? null
    : Math.max(0, Number(card.credit_limit) - Number(card.current_balance));

  return (
    <CardShell color={card.color} width={width} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {card.nickname || card.bank_name}
          </Text>
          {card.nickname ? (
            <Text style={styles.bank} numberOfLines={1}>
              {card.bank_name}
            </Text>
          ) : null}
        </View>
        <LinearGradient
          colors={['#fde68a', '#e7c66a', '#c9a227']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.chip}
        >
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
          <View style={styles.chipLine} />
        </LinearGradient>
      </View>

      <View style={styles.numberRow}>
        <Text style={styles.dots}>••••</Text>
        <Text style={styles.lastFour}>{card.last_four ?? '••••'}</Text>
        <Ionicons name="wifi" size={18} color="rgba(255,255,255,0.7)" style={styles.contactless} />
      </View>

      <View style={styles.amountRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.label}>Güncel borç</Text>
          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(card.current_balance)}
          </Text>
        </View>
        {remainingLimit != null ? (
          <View style={styles.limitBlock}>
            <Text style={styles.label}>Kalan limit</Text>
            <Text style={styles.limitValue} numberOfLines={1}>
              {formatCurrency(remainingLimit)}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={cardPillStyles.row}>
        <View style={cardPillStyles.pill}>
          <Ionicons name="document-text-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.pillText}>
            <Text style={styles.pillLabel}>Kesim </Text>
            {formatShortDate(nextStatementDate)}
          </Text>
        </View>
        <View style={cardPillStyles.pill}>
          <Ionicons name="alarm-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.pillText}>
            <Text style={styles.pillLabel}>Son ödeme </Text>
            {formatShortDate(nextDueDate)}
          </Text>
        </View>
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: { flexShrink: 1 },
  name: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  bank: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, marginTop: 1 },
  chip: {
    width: 36,
    height: 27,
    borderRadius: 6,
    paddingVertical: 5,
    paddingHorizontal: 6,
    justifyContent: 'space-between',
  },
  chipLine: { height: 1.5, backgroundColor: 'rgba(0,0,0,0.22)', borderRadius: 1 },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: 2 },
  lastFour: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  contactless: { marginLeft: 'auto', transform: [{ rotate: '90deg' }] },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amountBlock: { flexShrink: 1 },
  limitBlock: { alignItems: 'flex-end' },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balance: { color: colors.white, fontSize: 27, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  limitValue: { color: colors.white, fontSize: 14, fontWeight: '700', marginTop: 2 },
  pillText: { color: colors.white, fontSize: 11.5, fontWeight: '700' },
  pillLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
});
