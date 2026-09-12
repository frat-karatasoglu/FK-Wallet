import { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { useCardsStore } from '@/src/store/useCardsStore';
import { CardForm } from '@/src/components/CardForm';
import { colors, spacing, typography } from '@/src/theme';
import type { NewCard } from '@/src/types/database';

export default function EditCardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const cards = useCardsStore((s) => s.cards);
  const card = useMemo(() => cards.find((c) => c.id === id), [cards, id]);
  const updateCard = useCardsStore((s) => s.updateCard);
  const deleteCard = useCardsStore((s) => s.deleteCard);

  if (!card) {
    return (
      <View style={styles.center}>
        <Text style={typography.body}>Kart bulunamadı.</Text>
      </View>
    );
  }

  async function handleSubmit(values: NewCard) {
    const message = await updateCard(card!.id, values);
    if (!message) router.back();
    return message;
  }

  async function handleDelete() {
    await deleteCard(card!.id);
    router.dismissTo('/cards');
  }

  return (
    <CardForm
      initialValues={card}
      submitLabel="Değişiklikleri Kaydet"
      onSubmit={handleSubmit}
      onDelete={handleDelete}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
});
