import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../theme';
import type { TransactionType } from '../types/database';

type CategoryOption = {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
};

const EXPENSE_CATEGORIES: CategoryOption[] = [
  { label: 'Market', icon: 'cart-outline', color: colors.primary, background: colors.primaryLight },
  { label: 'Yeme içme', icon: 'restaurant-outline', color: '#e75a31', background: '#ffebe4' },
  { label: 'Ulaşım', icon: 'car-outline', color: '#1684c7', background: '#e2f3ff' },
  { label: 'Faturalar', icon: 'receipt-outline', color: '#d59405', background: '#fff3d7' },
  { label: 'Sağlık', icon: 'medkit-outline', color: '#e34c67', background: '#ffe6eb' },
  { label: 'Eğlence', icon: 'game-controller-outline', color: '#3b82f6', background: '#e8f4ff' },
  { label: 'Alışveriş', icon: 'bag-outline', color: '#0d9589', background: '#def7f2' },
  { label: 'Eğitim', icon: 'school-outline', color: '#3366c8', background: '#e5edff' },
];

const INCOME_CATEGORIES: CategoryOption[] = [
  { label: 'Maaş', icon: 'cash-outline', color: '#07865a', background: '#d9f7e9' },
  { label: 'Ek gelir', icon: 'briefcase-outline', color: colors.primary, background: colors.primaryLight },
  { label: 'Kira geliri', icon: 'home-outline', color: '#1684c7', background: '#e2f3ff' },
  { label: 'Yatırım', icon: 'trending-up-outline', color: '#d59405', background: '#fff3d7' },
  { label: 'Hediye', icon: 'gift-outline', color: '#e34c67', background: '#ffe6eb' },
  { label: 'İade', icon: 'return-down-back-outline', color: '#0d9589', background: '#def7f2' },
];

interface CategoryPickerProps {
  type: Extract<TransactionType, 'income' | 'expense'>;
  value: string;
  onChange: (value: string) => void;
  customValue: string;
  onCustomChange: (value: string) => void;
}

export function CategoryPicker({ type, value, onChange, customValue, onCustomChange }: CategoryPickerProps) {
  const categories = type === 'income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const isPreset = categories.some((category) => category.label === value);
  const isOther = !value || !isPreset;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{type === 'income' ? 'Gelir kaynağı' : 'Kategori'}</Text>
      <View style={styles.grid}>
        {categories.map((category) => {
          const selected = value === category.label;
          return (
            <Pressable
              key={category.label}
              style={({ pressed }) => [styles.item, selected && styles.itemSelected, pressed && styles.pressed]}
              onPress={() => onChange(category.label)}
            >
              <View style={[styles.icon, { backgroundColor: category.background }]}>
                <Ionicons name={category.icon} size={23} color={category.color} />
              </View>
              <Text style={[styles.itemLabel, selected && styles.itemLabelSelected]} numberOfLines={1}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
        <Pressable
          style={({ pressed }) => [styles.item, isOther && styles.itemSelected, pressed && styles.pressed]}
          onPress={() => {
            onChange('');
            onCustomChange('');
          }}
        >
          <View style={[styles.icon, { backgroundColor: colors.slate100 }]}>
            <Ionicons name="ellipsis-horizontal" size={23} color={colors.slate600} />
          </View>
          <Text style={[styles.itemLabel, isOther && styles.itemLabelSelected]}>Diğer</Text>
        </Pressable>
      </View>
      {isOther ? (
        <View style={styles.customInputWrap}>
          <Text style={styles.customLabel}>Özel kategori</Text>
          <TextInput
            value={customValue}
            onChangeText={(text) => {
              onCustomChange(text);
              onChange(text);
            }}
            placeholder="Örn. Evcil hayvan"
            placeholderTextColor={colors.slate400}
            style={styles.customInput}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginTop: spacing.lg },
  label: { color: colors.slate500, fontSize: 13, marginBottom: spacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  item: { width: '30.9%', alignItems: 'center', gap: spacing.xs, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.slate100 },
  itemSelected: { borderColor: colors.primary, backgroundColor: '#f8faff' },
  pressed: { opacity: 0.72 },
  icon: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  itemLabel: { color: colors.slate600, fontSize: 11, fontWeight: '600', maxWidth: '100%', paddingHorizontal: 2 },
  itemLabelSelected: { color: colors.primary },
  customInputWrap: { marginTop: spacing.md },
  customLabel: { color: colors.slate500, fontSize: 12, marginBottom: spacing.xs },
  customInput: { borderRadius: radius.md, padding: spacing.md, backgroundColor: colors.slate100, color: colors.slate800, fontSize: 14 },
});
