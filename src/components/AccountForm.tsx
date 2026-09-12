import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { ColorSwatchPicker } from './ColorSwatchPicker';
import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { colors, spacing } from '../theme';
import type { CardColor, NewAccount } from '../types/database';

interface AccountFormProps {
  initialValues?: Partial<NewAccount>;
  submitLabel: string;
  onSubmit: (values: NewAccount) => Promise<string | null>;
  onDelete?: () => Promise<void>;
}

export function AccountForm({ initialValues, submitLabel, onSubmit, onDelete }: AccountFormProps) {
  const [bankName, setBankName] = useState(initialValues?.bank_name ?? '');
  const [nickname, setNickname] = useState(initialValues?.nickname ?? '');
  const [lastFour, setLastFour] = useState(initialValues?.last_four ?? '');
  const [balance, setBalance] = useState(moneyValueToInput(initialValues?.balance));
  const [color, setColor] = useState<CardColor>(initialValues?.color ?? 'navy');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  async function handleSubmit() {
    const parsedBalance = parseMoneyInput(balance);
    if (!bankName.trim()) {
      setError('Banka veya hesap adı gerekli.');
      return;
    }
    if (lastFour && !/^\d{4}$/.test(lastFour)) {
      setError('Son 4 hane sadece rakam olmalı.');
      return;
    }
    if (!balance || Number.isNaN(parsedBalance) || parsedBalance < 0) {
      setError('Bakiye geçerli bir sayı olmalı.');
      return;
    }

    setError(null);
    setIsSubmitting(true);
    const message = await onSubmit({
      bank_name: bankName.trim(),
      nickname: nickname.trim() || null,
      last_four: lastFour || null,
      balance: parsedBalance,
      color,
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
        <FormField label="Banka veya hesap adı" value={bankName} onChangeText={setBankName} placeholder="Banka adını yaz" />
        <FormField label="Hesap takma adı (opsiyonel)" value={nickname} onChangeText={setNickname} placeholder="Örn. Maaş hesabım" />
        <FormField label="Kartın son 4 hanesi (opsiyonel)" value={lastFour} onChangeText={setLastFour} placeholder="1234" keyboardType="number-pad" maxLength={4} />
        <FormField label="Mevcut bakiye" value={balance} onChangeText={(value) => setBalance(formatMoneyInput(value))} placeholder="Örn. 25.000" keyboardType="decimal-pad" />
        <ColorSwatchPicker value={color} onChange={setColor} />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <PrimaryButton title={submitLabel} onPress={handleSubmit} isLoading={isSubmitting} style={styles.submitButton} />
        {onDelete ? <PrimaryButton title="Hesabı Sil" variant="outline" onPress={handleDelete} isLoading={isDeleting} style={styles.deleteButton} /> : null}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { padding: spacing.xl },
  error: { color: colors.overdue, marginTop: spacing.lg, fontSize: 13 },
  submitButton: { marginTop: spacing.xl },
  deleteButton: { marginTop: spacing.md },
  bottomSpacer: { height: spacing.xxl },
});
