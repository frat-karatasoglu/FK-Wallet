import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../theme';
import { daysUntil, getUrgency } from '../lib/cardDates';

interface UrgencyBadgeProps {
  date: Date;
  dueSoonThresholdDays?: number;
}

const palette = {
  overdue: { bg: colors.overdueBg, fg: colors.overdue },
  due_soon: { bg: colors.dueSoonBg, fg: colors.dueSoon },
  normal: { bg: colors.incomeBg, fg: colors.income },
};

export function UrgencyBadge({ date, dueSoonThresholdDays }: UrgencyBadgeProps) {
  const urgency = getUrgency(date, new Date(), dueSoonThresholdDays);
  const diff = daysUntil(date);
  const { bg, fg } = palette[urgency];

  let label: string;
  if (urgency === 'overdue') {
    label = diff === -1 ? 'Dün geçti' : `${Math.abs(diff)} gün gecikti`;
  } else if (diff === 0) {
    label = 'Bugün';
  } else if (diff === 1) {
    label = 'Yarın';
  } else {
    label = `${diff} gün kaldı`;
  }

  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
  },
});
