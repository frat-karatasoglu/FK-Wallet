import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { DEBT_CATEGORIES, DEBT_CATEGORY_ORDER } from '../lib/debtCategories';
import { colors, radius, spacing, typography } from '../theme';
import type { DebtCategory, NewPersonalDebt } from '../types/database';

interface PersonalDebtFormProps {
  initialValues?: Partial<NewPersonalDebt>;
  submitLabel: string;
  onSubmit: (values: NewPersonalDebt) => Promise<string | null>;
  onDelete?: () => Promise<void>;
}

export function PersonalDebtForm({ initialValues, submitLabel, onSubmit, onDelete }: PersonalDebtFormProps) {
  const [personName, setPersonName] = useState(initialValues?.person_name ?? '');
  const [category, setCategory] = useState<DebtCategory>(initialValues?.category ?? 'person');
  const [amount, setAmount] = useState(moneyValueToInput(initialValues?.amount));
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    if (!personName.trim()) {
      setError('Borç başlığı gerekli.');
      return;
    }
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Tutar sıfırdan büyük olmalı.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      person_name: personName.trim(),
      category,
      amount: parsedAmount,
      note: note.trim() || null,
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
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FormField label="Borç başlığı" value={personName} onChangeText={setPersonName} placeholder="Örn. Ahmet Yılmaz veya kira" />

        <Text style={[typography.caption, styles.categoryLabel]}>Kategori</Text>
        <View style={styles.categoryRow}>
          {DEBT_CATEGORY_ORDER.map((value) => {
            const meta = DEBT_CATEGORIES[value];
            const selected = value === category;
            return (
              <Pressable
                key={value}
                onPress={() => setCategory(value)}
                style={[
                  styles.categoryChip,
                  { backgroundColor: selected ? meta.color : meta.background },
                ]}
              >
                <Ionicons name={meta.icon} size={16} color={selected ? colors.white : meta.color} />
                <Text style={[styles.categoryChipText, { color: selected ? colors.white : meta.color }]}>
                  {meta.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <FormField label="Borç tutarı" value={amount} onChangeText={(value) => setAmount(formatMoneyInput(value))} placeholder="Örn. 1.500" keyboardType="decimal-pad" />
        <FormField label="Not (opsiyonel)" value={note} onChangeText={setNote} placeholder="Örn. Ödeme detayı" multiline numberOfLines={3} style={styles.note} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title={submitLabel} onPress={handleSubmit} isLoading={isSubmitting} style={styles.submitButton} />
        {onDelete ? <PrimaryButton title="Borcu Sil" variant="outline" onPress={handleDelete} isLoading={isDeleting} style={styles.deleteButton} /> : null}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl },
  note: { minHeight: 88, textAlignVertical: 'top' },
  categoryLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  categoryRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  error: { color: colors.overdue, marginTop: spacing.lg, fontSize: 13 },
  submitButton: { marginTop: spacing.xl },
  deleteButton: { marginTop: spacing.md },
  bottomSpacer: { height: spacing.xxl },
});
