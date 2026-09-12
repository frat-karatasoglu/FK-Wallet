import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { AccountForm } from '@/src/components/AccountForm';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import { colors, typography } from '@/src/theme';
import type { NewAccount } from '@/src/types/database';

export default function EditAccountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const accounts = useAccountsStore((state) => state.accounts);
  const updateAccount = useAccountsStore((state) => state.updateAccount);
  const deleteAccount = useAccountsStore((state) => state.deleteAccount);
  const account = useMemo(() => accounts.find((item) => item.id === id), [accounts, id]);

  if (!account) return <View style={styles.center}><Text style={typography.body}>Hesap bulunamadı.</Text></View>;

  async function handleSubmit(values: NewAccount) {
    const message = await updateAccount(account!.id, values);
    if (!message) router.back();
    return message;
  }

  async function handleDelete() {
    await deleteAccount(account!.id);
    router.dismissTo('/accounts');
  }

  return <AccountForm initialValues={account} submitLabel="Değişiklikleri Kaydet" onSubmit={handleSubmit} onDelete={handleDelete} />;
}

const styles = StyleSheet.create({ center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white } });
