import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { cardColorOrder, cardPalette, colors, spacing, typography } from '../theme';
import type { CardColor } from '../types/database';

interface ColorSwatchPickerProps {
  value: CardColor;
  onChange: (color: CardColor) => void;
}

export function ColorSwatchPicker({ value, onChange }: ColorSwatchPickerProps) {
  return (
    <View style={styles.wrapper}>
      <Text style={typography.caption}>Renk</Text>
      <View style={styles.row}>
        {cardColorOrder.map((color) => {
          const selected = color === value;
          return (
            <Pressable
              key={color}
              onPress={() => onChange(color)}
              style={[styles.swatch, { backgroundColor: cardPalette[color] }]}
            >
              {selected ? <Ionicons name="checkmark" size={18} color={colors.white} /> : null}
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
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  swatch: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
