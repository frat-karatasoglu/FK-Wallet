import { useRouter } from 'expo-router';

import { useCardsStore } from '@/src/store/useCardsStore';
import { CardForm } from '@/src/components/CardForm';
import type { NewCard } from '@/src/types/database';

export default function NewCardScreen() {
  const router = useRouter();
  const addCard = useCardsStore((s) => s.addCard);

  async function handleSubmit(values: NewCard) {
    const message = await addCard(values);
    if (!message) router.back();
    return message;
  }

  return <CardForm submitLabel="Kartı Kaydet" onSubmit={handleSubmit} />;
}
