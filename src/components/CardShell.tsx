import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

import { cardPalette, spacing } from '../theme';
import type { CardColor } from '../types/database';

// Gerçek kredi kartı oranı (ID-1: 85.60mm x 53.98mm).
export const CARD_ASPECT_RATIO = 1.586;
const EDGE = spacing.lg;

// Canlı, doygun kart renkleri: açık tondan başlayıp derin tona iner.
const vividGradients: Record<CardColor, [string, string, string]> = {
  navy: ['#3466b0', '#1d4580', '#102a52'],
  turquoise: ['#14c4b0', '#0d9488', '#0a5c56'],
  emerald: ['#2fd67a', '#059669', '#065f46'],
  amber: ['#fbbf24', '#ea8a0c', '#b45309'],
  rose: ['#ff6b85', '#e11d48', '#9f1239'],
  violet: ['#4f8df7', '#2563eb', '#1e3a8a'],
  sky: ['#3cc5fa', '#0284c7', '#075985'],
  slate: ['#6b7d96', '#475569', '#1e293b'],
};

/** Kredi kartı ve hesap kartlarının her ekranda aynı genişliği. */
export function useCardWidth() {
  const { width } = useWindowDimensions();
  return Math.min(width, 520) - EDGE * 2;
}

interface Props {
  color: CardColor;
  width?: number;
  onPress?: () => void;
  children: ReactNode;
}

/**
 * Kredi kartı ve hesap kartının ortak gövdesi: canlı gradyan, ışık yansıması,
 * dekoratif daireler ve kartın renginde yumuşak gölge.
 */
export function CardShell({ color, width, onPress, children }: Props) {
  const defaultWidth = useCardWidth();
    const base = cardPalette[color];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.shadow,
        { width: width ?? defaultWidth, shadowColor: base },
        pressed && styles.pressed,
      ]}
    >
      <LinearGradient
        colors={vividGradients[color]}
        locations={[0, 0.5, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.sheenWide} pointerEvents="none" />
        <View style={styles.sheenThin} pointerEvents="none" />
        {children}
      </LinearGradient>
    </Pressable>
  );
}

/** Kartın altındaki küçük bilgi hapı ("Kesim 8 Ara" gibi). */
export const cardPillStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  pill: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
});

const styles = StyleSheet.create({
  pressed: { opacity: 0.94 },
  shadow: {
    alignSelf: 'center',
    borderRadius: 20,
    shadowOpacity: 0.35,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 20,
    padding: 18,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  // Çapraz ışık şeritleri: cam/metal kart yansıması.
  sheenWide: { position: 'absolute', top: '-60%', bottom: '-60%', right: '22%', width: 70, backgroundColor: 'rgba(255,255,255,0.09)', transform: [{ rotate: '24deg' }] },
  sheenThin: { position: 'absolute', top: '-60%', bottom: '-60%', right: '8%', width: 22, backgroundColor: 'rgba(255,255,255,0.07)', transform: [{ rotate: '24deg' }] },
});
