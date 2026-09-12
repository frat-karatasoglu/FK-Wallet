import { Stack, useRouter, useLocalSearchParams } from 'expo-router';

import { useTransactionsStore } from '@/src/store/useTransactionsStore';
import { TransactionForm } from '@/src/components/TransactionForm';
import type { NewTransaction, TransactionType } from '@/src/types/database';

const TITLES: Record<TransactionType, string> = {
  income: 'Gelir Ekle',
  expense: 'Gider Ekle',
  card_payment: 'Kart Ödemesi Ekle',
};

export default function NewTransactionScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: TransactionType; cardId?: string }>();
  const addTransaction = useTransactionsStore((s) => s.addTransaction);

  async function handleSubmit(values: NewTransaction) {
    const message = await addTransaction(values);
    if (!message) router.back();
    return message;
  }

  return (
    <>
      <Stack.Screen
        options={{ title: params.type ? TITLES[params.type] : 'Hareket Ekle' }}
      />
      <TransactionForm
        initialValues={{
          type: params.type,
          card_id: params.cardId ?? null,
        }}
        hideTypeSelector={Boolean(params.type)}
        submitLabel="Kaydet"
        onSubmit={handleSubmit}
      />
    </>
  );
}
