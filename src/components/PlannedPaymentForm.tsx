import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';

import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { DateField } from './DateField';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { PAYMENT_INTERVALS, intervalLabel, parseDateString, plannedRepeatInterval, toDateString } from '../lib/paymentSchedule';
import { colors, radius, spacing, typography } from '../theme';
import type { NewPlannedPayment, RepeatInterval } from '../types/database';

interface PlannedPaymentFormProps {
  initialValues?: Partial<NewPlannedPayment>;
  submitLabel: string;
  onSubmit: (values: NewPlannedPayment) => Promise<string | null>;
  onDelete?: () => Promise<void>;
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
    initialValues?.due_date ? parseDateString(initialValues.due_date) : new Date()
  );
  const [repeatInterval, setRepeatInterval] = useState<RepeatInterval>(
    plannedRepeatInterval({
      repeat_interval_months: initialValues?.repeat_interval_months ?? 0,
      repeat_monthly: initialValues?.repeat_monthly ?? false,
    })
  );
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
      // Eski uygulama sürümleri sadece repeat_monthly'yi okuyor.
      repeat_monthly: repeatInterval > 0,
      repeat_interval_months: repeatInterval,
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

        <Text style={[typography.caption, styles.repeatLabel]}>Tekrar</Text>
        <View style={styles.chipRow}>
          {([0, ...PAYMENT_INTERVALS] as RepeatInterval[]).map((value) => {
            const selected = value === repeatInterval;
            return (
              <Pressable
                key={value}
                onPress={() => setRepeatInterval(value)}
                style={[styles.chip, selected && styles.chipSelected]}
              >
                {selected ? <Ionicons name="checkmark" size={14} color={colors.white} /> : null}
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {value === 0 ? 'Tek sefer' : intervalLabel(value)}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={styles.toggleSub}>
          {repeatInterval
            ? 'Ödendi işaretlediğinde otomatik olarak bir sonraki döneme taşınır.'
            : 'Ödendi işaretlediğinde tamamlananlara geçer.'}
        </Text>

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
  repeatLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.slate100,
  },
  chipSelected: { backgroundColor: colors.navy },
  chipText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  chipTextSelected: { color: colors.white },
  toggleSub: {
    ...typography.caption,
    marginTop: spacing.sm,
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
