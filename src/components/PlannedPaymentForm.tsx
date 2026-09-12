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
import { DateField } from './DateField';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { colors, radius, spacing, typography } from '../theme';
import type { NewPlannedPayment } from '../types/database';

interface PlannedPaymentFormProps {
  initialValues?: Partial<NewPlannedPayment>;
  submitLabel: string;
  onSubmit: (values: NewPlannedPayment) => Promise<string | null>;
  onDelete?: () => Promise<void>;
}

function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function PlannedPaymentForm({
  initialValues,
  submitLabel,
  onSubmit,
  onDelete,
}: PlannedPaymentFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [amount, setAmount] = useState(
    moneyValueToInput(initialValues?.amount)
  );
  const [dueDate, setDueDate] = useState(
    initialValues?.due_date ? new Date(initialValues.due_date) : new Date()
  );
  const [repeatMonthly, setRepeatMonthly] = useState(initialValues?.repeat_monthly ?? false);
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit() {
    const parsedAmount = parseMoneyInput(amount);
    if (!title.trim()) {
      setError('Ödeme adı gerekli.');
      return;
    }
    if (!amount || Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      setError('Geçerli bir tutar gir.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      title: title.trim(),
      amount: parsedAmount,
      due_date: toDateString(dueDate),
      repeat_monthly: repeatMonthly,
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
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <FormField
          label="Ödeme adı"
          value={title}
          onChangeText={setTitle}
          placeholder="Örn. Kira, Elektrik faturası"
        />
        <FormField
          label="Tutar (₺)"
          value={amount}
          onChangeText={(value) => setAmount(formatMoneyInput(value))}
          placeholder="0"
          keyboardType="decimal-pad"
        />

        <DateField label="Ödeme tarihi" value={dueDate} onChange={setDueDate} allowFuture />

        <Pressable style={styles.toggleRow} onPress={() => setRepeatMonthly((v) => !v)}>
          <View style={[styles.checkbox, repeatMonthly && styles.checkboxChecked]}>
            {repeatMonthly ? <Ionicons name="checkmark" size={16} color={colors.white} /> : null}
          </View>
          <View style={styles.toggleTextWrap}>
            <Text style={styles.toggleTitle}>Her ay tekrar et</Text>
            <Text style={styles.toggleSub}>
              Ödendi işaretlediğinde otomatik olarak bir sonraki aya taşınır.
            </Text>
          </View>
        </Pressable>

        <FormField
          label="Not (opsiyonel)"
          value={note}
          onChangeText={setNote}
          placeholder="Ek bilgi"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title={submitLabel}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />

        {onDelete ? (
          <PrimaryButton
            title="Ödemeyi Sil"
            variant="outline"
            onPress={handleDelete}
            isLoading={isDeleting}
            style={styles.deleteButton}
          />
        ) : null}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: radius.sm,
    borderWidth: 1.5,
    borderColor: colors.slate300,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxChecked: {
    backgroundColor: colors.navy,
    borderColor: colors.navy,
  },
  toggleTextWrap: { flex: 1 },
  toggleTitle: {
    ...typography.body,
    fontWeight: '600',
  },
  toggleSub: {
    ...typography.caption,
    marginTop: 2,
  },
  error: {
    color: colors.overdue,
    marginTop: spacing.lg,
    fontSize: 13,
  },
  submitButton: { marginTop: spacing.xl },
  deleteButton: { marginTop: spacing.md },
  bottomSpacer: { height: spacing.xxl },
});
