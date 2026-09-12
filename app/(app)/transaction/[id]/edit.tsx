import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useTransactionsStore } from '@/src/store/useTransactionsStore';
import { getSupabaseClient } from '@/src/lib/supabase';
import { TransactionForm } from '@/src/components/TransactionForm';
import { colors, typography } from '@/src/theme';
import type { NewTransaction, Transaction } from '@/src/types/database';

export default function EditTransactionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const updateTransaction = useTransactionsStore((s) => s.updateTransaction);
  const deleteTransaction = useTransactionsStore((s) => s.deleteTransaction);

  const [transaction, setTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function load() {
      const supabase = getSupabaseClient();
      if (!supabase || !id) return;
      const { data } = await supabase.from('transactions').select('*').eq('id', id).single();
      if (isMounted) {
        setTransaction((data ?? null) as Transaction | null);
        setIsLoading(false);
      }
    }
    load();
    return () => {
      isMounted = false;
    };
  }, [id]);

  async function handleSubmit(values: NewTransaction) {
    const message = await updateTransaction(id, values);
    if (!message) router.back();
    return message;
  }

  async function handleDelete() {
    await deleteTransaction(id);
    router.back();
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.navy} />
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Hareket bulunamadı.</Text>
      </View>
    );
  }

  return (
    <TransactionForm
      initialValues={transaction}
      submitLabel="Değişiklikleri Kaydet"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
