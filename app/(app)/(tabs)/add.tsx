import { useCallback, useRef, type ComponentProps, type ReactNode } from 'react';
import { Animated, Easing, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors, spacing } from '@/src/theme';

type IconName = ComponentProps<typeof Ionicons>['name'];

const BIG_ACTIONS: {
  title: string;
  subtitle: string;
  icon: IconName;
  gradient: readonly [string, string, string];
  shadow: string;
  href: Href;
}[] = [
  {
    title: 'Gelir',
    subtitle: 'Maaş, kira, ek gelir',
    icon: 'arrow-down',
    gradient: ['#34d399', '#059669', '#047857'],
    shadow: '#059669',
    href: { pathname: '/transaction/new', params: { type: 'income' } },
  },
  {
    title: 'Gider',
    subtitle: 'Market, fatura, yakıt',
    icon: 'arrow-up',
    gradient: ['#fb7185', '#e11d48', '#be123c'],
    shadow: '#e11d48',
    href: { pathname: '/transaction/new', params: { type: 'expense' } },
  },
];

const OTHER_ACTIONS: { title: string; subtitle: string; icon: IconName; tint: string; bg: string; href: Href }[] = [
  { title: 'Kart', subtitle: 'Kredi kartı ve ekstre günü', icon: 'card-outline', tint: colors.navy, bg: '#e8eef8', href: '/card/new' },
  { title: 'Hesap', subtitle: 'Banka hesabı ve bakiye', icon: 'business-outline', tint: colors.primary, bg: colors.primaryLight, href: '/account/new' },
  { title: 'Borç / Kredi', subtitle: 'Kredi, kira, kişisel borç', icon: 'document-text-outline', tint: '#d97706', bg: '#fff7e6', href: '/debt/new' },
  { title: 'Planlı ödeme', subtitle: 'Fatura ve abonelikler', icon: 'repeat-outline', tint: colors.turquoise, bg: '#e6f7f5', href: '/planned/new' },
];

// Başlık, alt başlık, 2 büyük kutu, "Diğer" etiketi ve 4 kart sırayla belirir.
const ITEM_COUNT = 2 + BIG_ACTIONS.length + 1 + OTHER_ACTIONS.length;

/** Basınca hafifçe küçülüp yaylanarak geri gelen dokunma alanı. */
function PressableScale({ onPress, style, children }: { onPress: () => void; style?: object; children: ReactNode }) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, friction: 5, tension: 260, useNativeDriver: true }).start();
  return (
    <Pressable onPress={onPress} onPressIn={() => to(0.95)} onPressOut={() => to(1)} style={style}>
      <Animated.View style={{ flex: 1, transform: [{ scale }] }}>{children}</Animated.View>
    </Pressable>
  );
}

export default function QuickAddScreen() {
  const router = useRouter();
  const items = useRef(Array.from({ length: ITEM_COUNT }, () => new Animated.Value(0))).current;

  // Sekmeye her gelişte kutular sırayla aşağıdan kayarak gelir.
  useFocusEffect(
    useCallback(() => {
      items.forEach((v) => v.setValue(0));
      const anim = Animated.stagger(
        60,
        items.map((v) =>
          Animated.timing(v, { toValue: 1, duration: 450, easing: Easing.out(Easing.back(1.5)), useNativeDriver: true }),
        ),
      );
      anim.start();
      return () => anim.stop();
    }, [items]),
  );

  const rise = (i: number) => ({
    opacity: items[i].interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' }),
    transform: [
      { translateY: items[i].interpolate({ inputRange: [0, 1], outputRange: [28, 0] }) },
      { scale: items[i].interpolate({ inputRange: [0, 1], outputRange: [0.96, 1], extrapolate: 'clamp' }) },
    ],
  });

  let index = 0;
  const next = () => rise(index++);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        <Animated.Text style={[styles.title, next()]}>Ne eklemek istersin?</Animated.Text>
        <Animated.Text style={[styles.subtitle, next()]}>Bir işlem seç, saniyeler içinde kaydet.</Animated.Text>

        <View style={styles.bigRow}>
          {BIG_ACTIONS.map((a) => (
            <Animated.View key={a.title} style={[styles.bigWrap, { shadowColor: a.shadow }, next()]}>
              <PressableScale onPress={() => router.push(a.href)} style={styles.flex}>
                <LinearGradient colors={a.gradient} locations={[0, 0.6, 1]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bigTile}>
                  <View style={[styles.bubble, styles.bubbleTop]} />
                  <View style={[styles.bubble, styles.bubbleBottom]} />
                  <View style={styles.bigIcon}>
                    <Ionicons name={a.icon} size={24} color={colors.white} />
                  </View>
                  <View>
                    <Text style={styles.bigTitle}>{a.title}</Text>
                    <Text style={styles.bigSubtitle}>{a.subtitle}</Text>
                  </View>
                </LinearGradient>
              </PressableScale>
            </Animated.View>
          ))}
        </View>

        <Animated.Text style={[styles.sectionLabel, next()]}>DİĞER</Animated.Text>
        <View style={styles.grid}>
          {OTHER_ACTIONS.map((a) => (
            <Animated.View key={a.title} style={[styles.itemWrap, next()]}>
              <PressableScale onPress={() => router.push(a.href)} style={styles.flex}>
                <View style={styles.item}>
                  <View style={[styles.itemIcon, { backgroundColor: a.bg }]}>
                    <Ionicons name={a.icon} size={22} color={a.tint} />
                  </View>
                  <Text style={styles.itemTitle}>{a.title}</Text>
                  <Text style={styles.itemSubtitle} numberOfLines={2}>
                    {a.subtitle}
                  </Text>
                </View>
              </PressableScale>
            </Animated.View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  container: { paddingHorizontal: spacing.xl, paddingTop: spacing.xxl, paddingBottom: spacing.xl },
  title: { color: colors.slate800, fontSize: 26, fontWeight: '800' },
  subtitle: { color: colors.slate500, fontSize: 14, marginTop: 4 },
  bigRow: { flexDirection: 'row', gap: 12, marginTop: 22 },
  bigWrap: {
    flex: 1,
    height: 156,
    borderRadius: 22,
    backgroundColor: colors.white,
    shadowOpacity: 0.45,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 10 },
    elevation: 6,
  },
  bigTile: { flex: 1, borderRadius: 22, padding: 16, overflow: 'hidden', justifyContent: 'space-between' },
  bubble: { position: 'absolute', borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.12)' },
  bubbleTop: { width: 70, height: 70, right: 30, top: -30 },
  bubbleBottom: { width: 120, height: 120, right: -34, bottom: -40 },
  bigIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.22)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bigTitle: { color: colors.white, fontSize: 21, fontWeight: '800' },
  bigSubtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 12.5, marginTop: 2 },
  sectionLabel: { marginTop: 26, fontSize: 12, fontWeight: '700', letterSpacing: 0.8, color: colors.slate400 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 12, marginTop: 10 },
  itemWrap: {
    width: '48.4%',
    height: 118,
    borderRadius: 18,
    backgroundColor: colors.white,
    shadowColor: '#0f172a',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  item: {
    flex: 1,
    borderRadius: 18,
    padding: 14,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: '#eef2f7',
  },
  itemIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  itemTitle: { marginTop: 14, fontSize: 15.5, fontWeight: '700', color: colors.slate800 },
  itemSubtitle: { marginTop: 2, fontSize: 12, color: colors.slate500, lineHeight: 16 },
});
