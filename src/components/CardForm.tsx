import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { ColorSwatchPicker } from './ColorSwatchPicker';
import { DayOfMonthPicker } from './DayOfMonthPicker';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { colors, spacing } from '../theme';
import type { CardColor, NewCard } from '../types/database';

interface CardFormProps {
  initialValues?: Partial<NewCard>;
  submitLabel: string;
  onSubmit: (values: NewCard) => Promise<string | null>;
  onDelete?: () => Promise<void>;
}

export function CardForm({ initialValues, submitLabel, onSubmit, onDelete }: CardFormProps) {
  const [bankName, setBankName] = useState(initialValues?.bank_name ?? '');
  const [nickname, setNickname] = useState(initialValues?.nickname ?? '');
  const [lastFour, setLastFour] = useState(initialValues?.last_four ?? '');
  const [color, setColor] = useState<CardColor>(initialValues?.color ?? 'navy');
  const [statementDay, setStatementDay] = useState(initialValues?.statement_day ?? 1);
  const [dueDay, setDueDay] = useState(initialValues?.due_day ?? 10);
  const [creditLimit, setCreditLimit] = useState(
    moneyValueToInput(initialValues?.credit_limit)
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit() {
    if (!bankName.trim()) {
      setError('Banka adı gerekli.');
      return;
    }
    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      setError('Son 4 hane sadece rakam olmalı.');
      return;
    }
    const parsedLimit = creditLimit ? parseMoneyInput(creditLimit) : null;
    if (creditLimit && (Number.isNaN(parsedLimit) || (parsedLimit ?? 0) < 0)) {
      setError('Kredi limiti geçerli bir sayı olmalı.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      bank_name: bankName.trim(),
      nickname: nickname.trim() || null,
      last_four: lastFour || null,
      color,
      statement_day: statementDay,
      due_day: dueDay,
      credit_limit: parsedLimit,
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
          label="Banka adı"
          value={bankName}
          onChangeText={setBankName}
          placeholder="Banka adını yaz"
        />
        <FormField
          label="Takma ad (opsiyonel)"
          value={nickname}
          onChangeText={setNickname}
          placeholder="Örn. Market kartım"
        />
        <FormField
          label="Son 4 hane (opsiyonel)"
          value={lastFour}
          onChangeText={setLastFour}
          placeholder="1234"
          keyboardType="number-pad"
          maxLength={4}
        />
        <FormField
          label="Kredi limiti (opsiyonel)"
          value={creditLimit}
          onChangeText={(value) => setCreditLimit(formatMoneyInput(value))}
          placeholder="Örn. 50.000"
          keyboardType="decimal-pad"
        />

        <ColorSwatchPicker value={color} onChange={setColor} />
        <DayOfMonthPicker label="Hesap kesim günü" value={statementDay} onChange={setStatementDay} />
        <DayOfMonthPicker label="Son ödeme günü" value={dueDay} onChange={setDueDay} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <PrimaryButton
          title={submitLabel}
          onPress={handleSubmit}
          isLoading={isSubmitting}
          style={styles.submitButton}
        />

        {onDelete ? (
          <PrimaryButton
            title="Kartı Sil"
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
  error: {
    color: colors.overdue,
    marginTop: spacing.lg,
    fontSize: 13,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  deleteButton: {
    marginTop: spacing.md,
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
