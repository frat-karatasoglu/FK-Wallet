import { useRouter } from 'expo-router';

import { AccountForm } from '@/src/components/AccountForm';
import { useAccountsStore } from '@/src/store/useAccountsStore';
import type { NewAccount } from '@/src/types/database';

export default function NewAccountScreen() {
  const router = useRouter();
  const addAccount = useAccountsStore((state) => state.addAccount);

  async function handleSubmit(values: NewAccount) {
    const message = await addAccount(values);
    if (!message) router.back();
    return message;
  }

  return <AccountForm submitLabel="Hesabı Kaydet" onSubmit={handleSubmit} />;
}
