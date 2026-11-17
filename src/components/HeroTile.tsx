import type { ComponentProps, ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { PressableScale } from './motion';
import { heroGradients, heroShadows, type HeroTone } from '../theme/surfaces';

interface Props {
  tone: HeroTone;
  icon: ComponentProps<typeof Ionicons>['name'];
  label: string;
  value: string;
  caption?: string;
  /** Değerin sağına eklenecek küçük içerik (ör. rozet). */
  accessory?: ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** "+" ekranındaki Gelir/Gider kutuları gibi gradyanlı, büyük özet kutusu. */
export function HeroTile({ tone, icon, label, value, caption, accessory, onPress, style }: Props) {
  const body = (
    <LinearGradient
      colors={heroGradients[tone]}
      locations={[0, 0.6, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.tile}
    >
      <View style={[styles.bubble, styles.bubbleTop]} />
      <View style={[styles.bubble, styles.bubbleBottom]} />
      <View style={styles.topRow}>
        <View style={styles.icon}>
          <Ionicons name={icon} size={22} color="#ffffff" />
        </View>
        <Text style={styles.label} numberOfLines={1}>
          {label}
        </Text>
        {onPress ? <Ionicons name="chevron-forward" size={18} color="rgba(255,255,255,0.85)" /> : null}
      </View>
      <View style={styles.valueRow}>
        <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </Text>
        {accessory}
      </View>
      {caption ? (
        <Text style={styles.caption} numberOfLines={1}>
          {caption}
        </Text>
      ) : null}
    </LinearGradient>
  );

  return (
    <View style={[styles.shadow, { shadowColor: heroShadows[tone] }, style]}>
      {onPress ? (
        <PressableScale onPress={onPress} innerStyle={styles.flex}>
          {body}
        </PressableScale>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  shadow: {
    borderRadius: 22,
    backgroundColor: '#ffffff',
    shadowOpacity: 0.4,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  tile: { borderRadius: 22, padding: 18, overflow: 'hidden' },
  bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  bubbleTop: { width: 90, height: 90, right: 40, top: -40 },
  bubbleBottom: { width: 150, height: 150, right: -44, bottom: -60 },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { flex: 1, color: 'rgba(255,255,255,0.92)', fontSize: 14, fontWeight: '700' },
  valueRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 18 },
  value: { flexShrink: 1, color: '#ffffff', fontSize: 30, fontWeight: '800', letterSpacing: -0.5 },
  caption: { color: 'rgba(255,255,255,0.85)', fontSize: 12.5, marginTop: 2 },
});
