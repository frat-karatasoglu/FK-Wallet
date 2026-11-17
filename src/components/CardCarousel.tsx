import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons } from '@expo/vector-icons';

import { CardPreview, CARD_ASPECT_RATIO } from './CardPreview';
import { useCardWidth } from './CardShell';
import { SwipeCarousel } from './SwipeCarousel';
import { colors, radius, spacing } from '../theme';
import type { Card } from '../types/database';

interface CardCarouselProps {
  cards: Card[];
  isLoading?: boolean;
  onCardPress: (card: Card) => void;
  onAddPress: () => void;
}

const EDGE = spacing.lg;

export function CardCarousel({ cards, isLoading = false, onCardPress, onAddPress }: CardCarouselProps) {
  const cardWidth = useCardWidth();

  // İlk yükleme sırasında "kart yok" boş durumunu bir anlığına göstermek yerine
  // kart şeklinde bir iskelet göster; reload sonrası ekran boşmuş hissi vermesin.
  if (cards.length === 0 && isLoading) {
    return (
      <View style={styles.emptyWrap}>
        <View style={[styles.skeleton, { width: cardWidth }]}>
          <ActivityIndicator color={colors.slate400} />
        </View>
      </View>
    );
  }

  if (cards.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <Pressable
          style={({ pressed }) => [styles.addCard, { width: cardWidth }, pressed && styles.pressed]}
          onPress={onAddPress}
        >
          <Ionicons name="add-circle-outline" size={32} color={colors.slate400} />
          <Text style={styles.addTitle}>İlk kartını ekle</Text>
          <Text style={styles.addSub}>Borcunu ve son ödeme tarihini tek bakışta gör</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <SwipeCarousel
      items={cards}
      keyExtractor={(card) => card.id}
      renderItem={(card, cardWidth) => (
        <CardPreview card={card} width={cardWidth} onPress={() => onCardPress(card)} />
      )}
    />
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  emptyWrap: {
    paddingHorizontal: EDGE,
  },
  skeleton: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: radius.lg,
    backgroundColor: colors.slate100,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCard: {
    borderRadius: 22,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: colors.slate300,
    backgroundColor: colors.white,
    paddingVertical: spacing.xxl,
    alignItems: 'center',
    gap: spacing.xs,
  },
  addTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate700,
    marginTop: spacing.sm,
  },
  addSub: {
    fontSize: 12,
    color: colors.slate500,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});
