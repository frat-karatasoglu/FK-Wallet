import { useState, type ReactElement } from 'react';
import {
  FlatList,
  StyleSheet,
  View,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';

import { colors, spacing } from '../theme';
import { useCardWidth } from './CardShell';

const GAP = spacing.md;
const EDGE = spacing.lg;

interface SwipeCarouselProps<T> {
  items: T[];
  keyExtractor: (item: T) => string;
  renderItem: (item: T, width: number) => ReactElement;
}

/** Kart/hesap kartlarını sağa-sola kaydırılan, sayfa sayfa duran liste. */
export function SwipeCarousel<T>({ items, keyExtractor, renderItem }: SwipeCarouselProps<T>) {
  const cardWidth = useCardWidth();
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const index = Math.round(event.nativeEvent.contentOffset.x / (cardWidth + GAP));
    if (index !== activeIndex) setActiveIndex(index);
  }

  return (
    <View>
      <FlatList
        data={items}
        horizontal
        showsHorizontalScrollIndicator={false}
        keyExtractor={keyExtractor}
        snapToInterval={cardWidth + GAP}
        decelerationRate="fast"
        onScroll={handleScroll}
        scrollEventThrottle={16}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => renderItem(item, cardWidth)}
      />
      {items.length > 1 ? (
        <View style={styles.dots}>
          {items.map((item, index) => (
            <View
              key={keyExtractor(item)}
              style={[styles.dot, index === activeIndex && styles.dotActive]}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  // Dikey boşluk, kartın renkli gölgesinin kesilmemesi için.
  listContent: {
    paddingHorizontal: EDGE,
    paddingTop: 4,
    paddingBottom: 16,
    gap: GAP,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xs,
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
});
