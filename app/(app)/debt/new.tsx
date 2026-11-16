import { useRouter } from 'expo-router';
import { useRedirectIfLocked } from '@/src/store/useSubscriptionStore';

import { PersonalDebtForm } from '@/src/components/PersonalDebtForm';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import type { NewPersonalDebt } from '@/src/types/database';

export default function NewDebtScreen() {
  useRedirectIfLocked();
  const router = useRouter();
  const addPersonalDebt = usePersonalDebtsStore((state) => state.addPersonalDebt);

  async function handleSubmit(values: NewPersonalDebt) {
    const message = await addPersonalDebt(values);
    if (!message) router.back();
    return message;
  }

  return <PersonalDebtForm submitLabel="Borcu Kaydet" onSubmit={handleSubmit} />;
}
