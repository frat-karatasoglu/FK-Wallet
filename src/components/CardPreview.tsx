import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { cardGradients, colors, spacing } from '../theme';
import { formatCurrency, formatShortDate } from '../lib/format';
import { computeCardDates } from '../lib/cardDates';
import type { Card } from '../types/database';

// Gerçek kredi kartı oranı (ID-1: 85.60mm x 53.98mm).
export const CARD_ASPECT_RATIO = 1.586;

interface CardPreviewProps {
  card: Card;
  onPress?: () => void;
  width?: number;
}

export function CardPreview({ card, onPress, width }: CardPreviewProps) {
  const [from, to] = cardGradients[card.color];
  const { nextStatementDate, nextDueDate } = computeCardDates(card);
  const remainingLimit = card.credit_limit == null
    ? null
    : Math.max(0, Number(card.credit_limit) - Number(card.current_balance));

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [width != null && { width }, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
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
          <View style={styles.chip}>
            <View style={styles.chipLine} />
            <View style={styles.chipLine} />
          </View>
        </View>

        <View style={styles.numberRow}>
          <Text style={styles.dots}>••••</Text>
          <Text style={styles.lastFour}>{card.last_four ?? '••••'}</Text>
          <Ionicons
            name="wifi"
            size={16}
            color="rgba(255,255,255,0.6)"
            style={styles.contactless}
          />
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

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerLabel}>Kesim </Text>
            {formatShortDate(nextStatementDate)}
          </Text>
          <Text style={styles.footerText}>
            <Text style={styles.footerLabel}>Son ödeme </Text>
            {formatShortDate(nextDueDate)}
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
  card: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 18,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: { flexShrink: 1 },
  name: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bank: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 1,
  },
  chip: {
    width: 30,
    height: 23,
    borderRadius: 5,
    backgroundColor: '#e7c66a',
    paddingVertical: 4,
    paddingHorizontal: 5,
    justifyContent: 'space-between',
  },
  chipLine: {
    height: 1.5,
    backgroundColor: 'rgba(0,0,0,0.25)',
    borderRadius: 1,
  },
  numberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dots: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    letterSpacing: 2,
  },
  lastFour: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '600',
    letterSpacing: 1.5,
  },
  contactless: {
    marginLeft: 'auto',
    transform: [{ rotate: '90deg' }],
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  amountBlock: { flexShrink: 1 },
  limitBlock: { alignItems: 'flex-end' },
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
  balance: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 1,
  },
  limitValue: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '600',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  footerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
});
