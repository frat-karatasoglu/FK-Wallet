import { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CardPreview, CARD_ASPECT_RATIO } from './CardPreview';
import { colors, radius, spacing } from '../theme';
import type { Card } from '../types/database';

interface CardCarouselProps {
  cards: Card[];
  isLoading?: boolean;
  onCardPress: (card: Card) => void;
  onAddPress: () => void;
}

const GAP = spacing.md;
const EDGE = spacing.lg;

export function CardCarousel({ cards, isLoading = false, onCardPress, onAddPress }: CardCarouselProps) {
  const { width } = useWindowDimensions();
  const cardWidth = Math.min(width, 520) - EDGE * 2;
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (index !== activeIndex) setActiveIndex(index);
  }

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
    <View>
      <FlatList
        data={cards}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={(card) => card.id}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <CardPreview card={item} width={cardWidth} onPress={() => onCardPress(item)} />
        )}
      />
      {cards.length > 1 ? (
        <View style={styles.dots}>
          {cards.map((card, index) => (
            <View
              key={card.id}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.9 },
  listContent: {
    paddingHorizontal: EDGE,
    gap: GAP,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
    marginTop: spacing.md,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.slate300,
  },
  dotActive: {
    width: 18,
    backgroundColor: colors.primary,
  },
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
