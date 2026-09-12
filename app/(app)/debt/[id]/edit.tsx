import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { PersonalDebtForm } from '@/src/components/PersonalDebtForm';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import { colors, typography } from '@/src/theme';
import type { NewPersonalDebt } from '@/src/types/database';

export default function EditDebtScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const personalDebts = usePersonalDebtsStore((state) => state.personalDebts);
  const updatePersonalDebt = usePersonalDebtsStore((state) => state.updatePersonalDebt);
  const deletePersonalDebt = usePersonalDebtsStore((state) => state.deletePersonalDebt);
  const debt = useMemo(() => personalDebts.find((item) => item.id === id), [personalDebts, id]);

  if (!debt) return <View style={styles.center}><Text style={typography.body}>Borç bulunamadı.</Text></View>;

  async function handleSubmit(values: NewPersonalDebt) {
    const message = await updatePersonalDebt(debt!.id, values);
    if (!message) router.back();
    return message;
  }

  async function handleDelete() {
    await deletePersonalDebt(debt!.id);
    router.dismissTo('/debts');
  }

  return <PersonalDebtForm initialValues={debt} submitLabel="Değişiklikleri Kaydet" onSubmit={handleSubmit} onDelete={handleDelete} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white } });
