import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { usePlannedPaymentsStore } from '@/src/store/usePlannedPaymentsStore';
import { PlannedPaymentForm } from '@/src/components/PlannedPaymentForm';
import { colors, typography } from '@/src/theme';
import type { NewPlannedPayment } from '@/src/types/database';

export default function EditPlannedPaymentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const plannedPayments = usePlannedPaymentsStore((s) => s.plannedPayments);
  const updatePlannedPayment = usePlannedPaymentsStore((s) => s.updatePlannedPayment);
  const deletePlannedPayment = usePlannedPaymentsStore((s) => s.deletePlannedPayment);

  const payment = useMemo(
    () => plannedPayments.find((p) => p.id === id),
    [plannedPayments, id]
  );

  if (!payment) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Ödeme bulunamadı.</Text>
      </View>
    );
  }

  async function handleSubmit(values: NewPlannedPayment) {
    const message = await updatePlannedPayment(payment!.id, values);
    if (!message) router.back();
    return message;
  }

  async function handleDelete() {
    await deletePlannedPayment(payment!.id);
    router.back();
  }

  return (
    <PlannedPaymentForm
      initialValues={payment}
      submitLabel="Değişiklikleri Kaydet"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
