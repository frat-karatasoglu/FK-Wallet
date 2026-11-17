import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';

import { DateField } from './DateField';
import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { formatCurrency } from '../lib/format';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { DEBT_CATEGORIES, DEBT_CATEGORY_ORDER } from '../lib/debtCategories';
import {
  PAYMENT_INTERVALS,
  hasPaymentPlan,
  intervalLabel,
  parseDateString,
  toDateString,
} from '../lib/paymentSchedule';
import { colors, radius, spacing, typography } from '../theme';
import type { DebtCategory, NewPersonalDebt, PaymentInterval } from '../types/database';

interface PersonalDebtFormProps {
  initialValues?: Partial<NewPersonalDebt>;
  submitLabel: string;
  onSubmit: (values: NewPersonalDebt) => Promise<string | null>;
  onDelete?: () => Promise<void>;
}

function parseCount(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isInteger(parsed) ? parsed : NaN;
}

export function PersonalDebtForm({ initialValues, submitLabel, onSubmit, onDelete }: PersonalDebtFormProps) {
  const initialPlan =
    initialValues &&
    hasPaymentPlan({
      installment_amount: initialValues.installment_amount ?? null,
      payment_interval_months: initialValues.payment_interval_months ?? null,
      next_payment_date: initialValues.next_payment_date ?? null,
    });

  const [personName, setPersonName] = useState(initialValues?.person_name ?? '');
  const [category, setCategory] = useState<DebtCategory>(initialValues?.category ?? 'person');
  const [amount, setAmount] = useState(moneyValueToInput(initialValues?.amount));
  const [note, setNote] = useState(initialValues?.note ?? '');
  const [hasPlan, setHasPlan] = useState(Boolean(initialPlan));
  const [installmentAmount, setInstallmentAmount] = useState(
    moneyValueToInput(initialValues?.installment_amount ?? undefined)
  );
  const [interval, setPaymentInterval] = useState<PaymentInterval>(initialValues?.payment_interval_months ?? 1);
  const [nextPaymentDate, setNextPaymentDate] = useState(
    initialValues?.next_payment_date ? parseDateString(initialValues.next_payment_date) : new Date()
  );
  const [installmentCount, setInstallmentCount] = useState(
    initialValues?.installment_count ? String(initialValues.installment_count) : ''
  );
  const [paidInstallments, setPaidInstallments] = useState(
    initialValues?.paid_installments ? String(initialValues.paid_installments) : ''
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Kalan borç boş bırakılırsa taksit × kalan taksit sayısından hesaplanır.
  const parsedInstallment = parseMoneyInput(installmentAmount);
  const parsedCount = parseCount(installmentCount);
  const parsedPaid = parseCount(paidInstallments) ?? 0;
  const suggestedRemaining =
    hasPlan && parsedInstallment > 0 && parsedCount && parsedCount > parsedPaid
      ? Math.round(parsedInstallment * (parsedCount - parsedPaid) * 100) / 100
      : null;

  function selectCategory(value: DebtCategory) {
    setCategory(value);
    if (value === 'loan' && !initialValues) setHasPlan(true);
  }

  async function handleSubmit() {
    if (!personName.trim()) {
      setError('Borç başlığı gerekli.');
      return;
    }

    let finalAmount = parseMoneyInput(amount);
    if (!amount && suggestedRemaining) finalAmount = suggestedRemaining;

    let plan: Pick<
      NewPersonalDebt,
      'installment_amount' | 'payment_interval_months' | 'next_payment_date' | 'installment_count' | 'paid_installments'
    > = {
      installment_amount: null,
      payment_interval_months: null,
      next_payment_date: null,
      installment_count: null,
      paid_installments: 0,
    };

    if (hasPlan) {
      if (!installmentAmount || Number.isNaN(parsedInstallment) || parsedInstallment <= 0) {
        setError('Taksit tutarı sıfırdan büyük olmalı.');
        return;
      }
      if (parsedCount !== null && (Number.isNaN(parsedCount) || parsedCount < 1 || parsedCount > 600)) {
        setError('Toplam taksit sayısı 1 ile 600 arasında bir tam sayı olmalı.');
        return;
      }
      const paid = parseCount(paidInstallments);
      if (paid !== null && (Number.isNaN(paid) || paid < 0)) {
        setError('Ödenen taksit sayısı geçerli bir tam sayı olmalı.');
        return;
      }
      if (parsedCount && paid !== null && paid >= parsedCount) {
        setError('Ödenen taksit, toplam taksit sayısından az olmalı.');
        return;
      }
      plan = {
        installment_amount: parsedInstallment,
        payment_interval_months: interval,
        next_payment_date: toDateString(nextPaymentDate),
        installment_count: parsedCount,
        paid_installments: paid ?? 0,
      };
    }

    if (Number.isNaN(finalAmount) || finalAmount <= 0) {
      setError(hasPlan ? 'Kalan borcu gir ya da toplam taksit sayısını doldur.' : 'Tutar sıfırdan büyük olmalı.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      person_name: personName.trim(),
      category,
      amount: finalAmount,
      note: note.trim() || null,
      ...plan,
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
        <FormField label="Borç başlığı" value={personName} onChangeText={setPersonName} placeholder="Örn. Ahmet Yılmaz, kira veya ihtiyaç kredisi" />

        <Text style={[typography.caption, styles.sectionLabel]}>Kategori</Text>
        <View style={styles.chipRow}>
          {DEBT_CATEGORY_ORDER.map((value) => {
            const meta = DEBT_CATEGORIES[value];
            const selected = value === category;
            return (
              <Pressable
                key={value}
                onPress={() => selectCategory(value)}
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

        <View style={styles.planToggle}>
          <View style={styles.planToggleCopy}>
            <Text style={styles.planToggleTitle}>Ödeme planı</Text>
            <Text style={styles.planToggleSub}>Taksit tutarı, ödeme sıklığı ve sonraki ödeme tarihi</Text>
          </View>
          <Switch
            value={hasPlan}
            onValueChange={setHasPlan}
            trackColor={{ false: colors.slate300, true: colors.navy }}
            thumbColor={colors.white}
          />
        </View>

        {hasPlan ? (
          <View style={styles.planBox}>
            <FormField
              label="Taksit tutarı"
              value={installmentAmount}
              onChangeText={(value) => setInstallmentAmount(formatMoneyInput(value))}
              placeholder="Örn. 12.500"
              keyboardType="decimal-pad"
            />

            <Text style={[typography.caption, styles.sectionLabel]}>Ödeme sıklığı</Text>
            <View style={styles.chipRow}>
              {PAYMENT_INTERVALS.map((value) => {
                const selected = value === interval;
                return (
                  <Pressable
                    key={value}
                    onPress={() => setPaymentInterval(value)}
                    style={[styles.intervalChip, selected && styles.intervalChipSelected]}
                  >
                    <Text style={[styles.intervalChipText, selected && styles.intervalChipTextSelected]}>
                      {intervalLabel(value)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <DateField label="Sonraki ödeme tarihi" value={nextPaymentDate} onChange={setNextPaymentDate} allowFuture />

            <View style={styles.countRow}>
              <View style={styles.countField}>
                <FormField
                  label="Toplam taksit"
                  value={installmentCount}
                  onChangeText={(value) => setInstallmentCount(value.replace(/[^0-9]/g, ''))}
                  placeholder="Örn. 10"
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.countField}>
                <FormField
                  label="Ödenen taksit"
                  value={paidInstallments}
                  onChangeText={(value) => setPaidInstallments(value.replace(/[^0-9]/g, ''))}
                  placeholder="0"
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </View>
        ) : null}

        <FormField
          label={hasPlan ? 'Kalan borç' : 'Borç tutarı'}
          value={amount}
          onChangeText={(value) => setAmount(formatMoneyInput(value))}
          placeholder="Örn. 1.500"
          keyboardType="decimal-pad"
        />
        {hasPlan && !amount && suggestedRemaining ? (
          <Text style={styles.hint}>Boş bırakırsan kalan borç {formatCurrency(suggestedRemaining)} olarak kaydedilir.</Text>
        ) : null}

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
  sectionLabel: { marginTop: spacing.lg, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
  },
  categoryChipText: { fontSize: 13, fontWeight: '600' },
  planToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginTop: spacing.xl,
    paddingVertical: spacing.sm,
  },
  planToggleCopy: { flex: 1 },
  planToggleTitle: { ...typography.body, fontWeight: '600' },
  planToggleSub: { ...typography.caption, marginTop: 2 },
  planBox: {
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    borderRadius: radius.md,
    backgroundColor: colors.slate100,
  },
  intervalChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.full,
    backgroundColor: colors.white,
  },
  intervalChipSelected: { backgroundColor: colors.navy },
  intervalChipText: { fontSize: 13, fontWeight: '600', color: colors.slate700 },
  intervalChipTextSelected: { color: colors.white },
  countRow: { flexDirection: 'row', gap: spacing.md },
  countField: { flex: 1 },
  hint: { ...typography.caption, marginTop: spacing.xs },
  error: { color: colors.overdue, marginTop: spacing.lg, fontSize: 13 },
  submitButton: { marginTop: spacing.xl },
  deleteButton: { marginTop: spacing.md },
  bottomSpacer: { height: spacing.xxl },
});
