import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../theme';

interface DayOfMonthPickerProps {
  label: string;
  value: number;
  onChange: (day: number) => void;
}

const DAYS = Array.from({ length: 31 }, (_, i) => i + 1);

export function DayOfMonthPicker({ label, value, onChange }: DayOfMonthPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={typography.caption}>{label}</Text>
      <View style={styles.grid}>
        {DAYS.map((day) => {
          const selected = day === value;
          return (
            <Pressable
              key={day}
              onPress={() => onChange(day)}
              style={[styles.chip, selected && styles.chipSelected]}
            >
              <Text style={[styles.chipText, selected && styles.chipTextSelected]}>{day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  chip: {
    width: 36,
    height: 36,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.slate50,
    borderWidth: 1,
    borderColor: colors.slate200,
  },
  chipSelected: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  chipText: {
    fontSize: 13,
    color: colors.slate700,
  },
  chipTextSelected: {
    color: colors.white,
    fontWeight: '700',
  },
});
