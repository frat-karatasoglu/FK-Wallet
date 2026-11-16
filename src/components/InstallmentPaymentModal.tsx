import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { FormField } from './FormField';
import { PrimaryButton } from './PrimaryButton';
import { PaymentSourcePicker, type PaymentSource } from './PaymentSourcePicker';
import { formatDate } from '../lib/format';
import { formatMoneyInput, moneyValueToInput, parseMoneyInput } from '../lib/moneyInput';
import { addMonths, hasPaymentPlan, nextInstallmentAmount } from '../lib/paymentSchedule';
import { usePersonalDebtsStore } from '../store/usePersonalDebtsStore';
import { colors, radius, spacing, typography } from '../theme';
import type { PersonalDebt } from '../types/database';

interface InstallmentPaymentModalProps {
  debt: PersonalDebt | null;
  onClose: () => void;
}

// Taksit tutarı dönemden döneme değişebilir: kullanıcı o dönem gerçekte ödediği
// tutarı ve biliyorsa bir sonraki taksit tutarını burada girer.
export function InstallmentPaymentModal({ debt, onClose }: InstallmentPaymentModalProps) {
  const markInstallmentPaid = usePersonalDebtsStore((state) => state.markInstallmentPaid);
  const [paidAmount, setPaidAmount] = useState('');
  const [nextAmount, setNextAmount] = useState('');
  const [source, setSource] = useState<PaymentSource>({ kind: 'cash' });
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const plan = debt && hasPaymentPlan(debt) ? debt : null;
  const installmentNumber = plan ? plan.paid_installments + 1 : 0;
  const isLastInstallment =
    plan != null && plan.installment_count != null && installmentNumber >= plan.installment_count;

  useEffect(() => {
    if (!plan) return;
    setPaidAmount(moneyValueToInput(nextInstallmentAmount(plan)));
    setNextAmount(moneyValueToInput(plan.installment_amount));
    setError(null);
    // Pencere her açıldığında o borcun güncel değerleriyle başlasın.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [plan?.id, plan?.paid_installments]);

  async function handleSave() {
    if (!plan) return;
    const paid = parseMoneyInput(paidAmount);
    if (!paidAmount || Number.isNaN(paid) || paid <= 0) {
      setError('Ödediğin tutarı gir.');
      return;
    }
    const next = nextAmount ? parseMoneyInput(nextAmount) : null;
    if (next !== null && (Number.isNaN(next) || next <= 0)) {
      setError('Sonraki taksit tutarı geçerli değil.');
      return;
    }
    setError(null);
    setIsSaving(true);
    const message = await markInstallmentPaid(plan.id, paid, isLastInstallment ? null : next, source);
    setIsSaving(false);
    if (message) {
      setError(message);
      return;
    }
    onClose();
  }

  return (
    <Modal visible={plan != null} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.backdrop} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        {plan ? (
          <View style={styles.sheet}>
            <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <Text style={styles.title}>Taksit ödendi</Text>
            <Text style={styles.subtitle}>
              {plan.person_name} · {plan.installment_count ? `${installmentNumber}/${plan.installment_count}. taksit` : `${installmentNumber}. taksit`} · {formatDate(plan.next_payment_date)}
            </Text>

            <FormField
              label="Bu dönem ödediğin tutar"
              value={paidAmount}
              onChangeText={(value) => setPaidAmount(formatMoneyInput(value))}
              keyboardType="decimal-pad"
              placeholder="0"
            />

            <PaymentSourcePicker value={source} onChange={setSource} />

            {!isLastInstallment ? (
              <>
                <FormField
                  label={`Sonraki taksit tutarı (${formatDate(addMonths(plan.next_payment_date, plan.payment_interval_months))})`}
                  value={nextAmount}
                  onChangeText={(value) => setNextAmount(formatMoneyInput(value))}
                  keyboardType="decimal-pad"
                  placeholder="Bilmiyorsan aynı kalsın"
                />
                <Text style={styles.hint}>Banka sonraki taksiti farklı bildirdiyse buraya yaz; hatırlatma ve takvim bu tutarı gösterir.</Text>
              </>
            ) : (
              <Text style={styles.hint}>Bu son taksit; kaydedince borç kapanır.</Text>
            )}

            {error ? <Text style={styles.error}>{error}</Text> : null}

            <PrimaryButton title="Kaydet" onPress={handleSave} isLoading={isSaving} style={styles.saveButton} />
            <PrimaryButton title="Vazgeç" variant="outline" onPress={onClose} style={styles.cancelButton} />
            </ScrollView>
          </View>
        ) : null}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(15, 23, 42, 0.45)' },
  sheet: {
    backgroundColor: colors.white,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    maxHeight: '90%',
    padding: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  title: { ...typography.title },
  subtitle: { ...typography.caption, marginTop: spacing.xs },
  hint: { ...typography.caption, marginTop: spacing.xs },
  error: { color: colors.overdue, marginTop: spacing.md, fontSize: 13 },
  saveButton: { marginTop: spacing.xl },
  cancelButton: { marginTop: spacing.sm },
});
