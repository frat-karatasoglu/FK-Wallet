import { useRouter } from 'expo-router';

import { PersonalDebtForm } from '@/src/components/PersonalDebtForm';
import { usePersonalDebtsStore } from '@/src/store/usePersonalDebtsStore';
import type { NewPersonalDebt } from '@/src/types/database';

export default function NewDebtScreen() {
  const router = useRouter();
  const addPersonalDebt = usePersonalDebtsStore((state) => state.addPersonalDebt);

  async function handleSubmit(values: NewPersonalDebt) {
    const message = await addPersonalDebt(values);
    if (!message) router.back();
    return message;
  }

  return <PersonalDebtForm submitLabel="Borcu Kaydet" onSubmit={handleSubmit} />;
}
