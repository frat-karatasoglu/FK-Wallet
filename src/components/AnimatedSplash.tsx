import { useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, View, useWindowDimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as SplashScreen from 'expo-splash-screen';

import { colors } from '../theme';

const LOGO = require('../../assets/images/fk-logo.png');
/** Animasyondaki logonun tam boyutu. */
const LOGO_SIZE = 220;
/**
 * app.json'daki expo-splash-screen "imageWidth" değeriyle aynı olmalı (geçiş kesintisiz görünsün).
 * Android 12+ açılış simgesini 288dp'lik alanda 192dp çaplı bir daireyle kırpar; logo köşeleri
 * kesilmesin diye yerel açılışta logo 144dp çizilir, animasyon onu buradan büyüterek açar.
 */
const NATIVE_LOGO_SIZE = 144;
const START_SCALE = NATIVE_LOGO_SIZE / LOGO_SIZE;

interface Props {
  onFinish: () => void;
}

// ---- Zaman çizelgesi (saniye) ----------------------------------------------
const TOTAL = 2.66;
const T = {
  squeeze: [0.2, 0.38],
  flash: 0.38,
  cardsIn: [0.55, 1.05],
  word: 0.8,
  tag: [1.2, 1.5],
  collapse: [1.8, 2.02],
  wipe: [2.0, 2.36],
  fade: [2.36, 2.66],
} as const;

const clamp = (x: number) => Math.max(0, Math.min(1, x));
const seg = (t: number, a: number, b: number) => clamp((t - a) / (b - a));
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;
const outCubic = (p: number) => 1 - Math.pow(1 - p, 3);
const inCubic = (p: number) => p * p * p;
const outQuad = (p: number) => 1 - (1 - p) * (1 - p);
const outBack = (p: number, s = 2.2) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);
const spring = (p: number) => (p >= 1 ? 1 : 1 - Math.exp(-6 * p) * Math.cos(p * 3.2 * Math.PI));

/** Logonun ve arkasındaki her şeyin yukarı kayması (yazıya yer açılır). */
const lift = (t: number) => -46 * outCubic(seg(t, 0.75, 1.2));

// Tek bir zaman değeri (0 → TOTAL) native sürücüde akar; her öğenin eğrisi
// bu değerden örneklenmiş bir interpolasyonla üretilir.
const STEP = 1 / 60;
const SAMPLES = Array.from({ length: Math.ceil(TOTAL / STEP) + 1 }, (_, i) => Math.min(TOTAL, i * STEP));

function curve(time: Animated.Value, fn: (t: number) => number) {
  return time.interpolate({ inputRange: SAMPLES, outputRange: SAMPLES.map(fn), extrapolate: 'clamp' });
}
function degCurve(time: Animated.Value, fn: (t: number) => number) {
  return time.interpolate({
    inputRange: SAMPLES,
    outputRange: SAMPLES.map((t) => `${fn(t).toFixed(3)}deg`),
    extrapolate: 'clamp',
  });
}

const SPARK_COLORS = ['#22d3ee', '#0ea5e9', '#fbbf24', colors.navy];
const SPARKS = Array.from({ length: 16 }, (_, i) => ({
  angle: (i / 16) * Math.PI * 2 + (i % 3) * 0.12,
  dist: 150 + (i % 4) * 22,
  streak: i % 2 === 1,
  color: SPARK_COLORS[i % SPARK_COLORS.length],
  delay: (i % 3) * 0.02,
}));

const CARDS = [
  { x: -78, y: -78, r: -18, delay: 0, colors: ['#2563eb', '#10254a'] as const },
  { x: 78, y: -78, r: 18, delay: 0.03, colors: ['#0ea5e9', '#0b3a63'] as const },
  { x: 0, y: -104, r: 0, delay: 0.06, colors: ['#14b8a6', '#06424a'] as const },
];
const CARD_W = 150;
const CARD_H = 94;

const WORD = 'FK Cüzdan';
const WORD_Y = 108;

/**
 * Yerel açılış ekranının üstüne aynı logoyla açılır. Logo sıkışıp şimşek gibi çakar
 * (parlama, halkalar, kıvılcımlar), arkasından kartlar yelpaze gibi açılır, "FK Cüzdan"
 * harf harf belirir; sonunda lacivert bir daire ekranı kaplar ve perde açılır.
 */
export function AnimatedSplash({ onFinish }: Props) {
  const { width, height } = useWindowDimensions();
  const time = useRef(new Animated.Value(0)).current;
  const started = useRef(false);

  const cx = width / 2;
  const cy = height / 2;
  // Daire ekranın en uzak köşesine kadar uzansın
  const wipeScale = (Math.hypot(width, height) + 120) / 100;

  const anim = useMemo(() => {
    const flashOpacity = (t: number) => {
      const f = t - T.flash;
      if (f < 0) return 0;
      if (f < 0.05) return (f / 0.05) * 0.75;
      if (f < 0.09) return lerp(0.75, 0.1, (f - 0.05) / 0.04);
      if (f < 0.12) return lerp(0.1, 0.5, (f - 0.09) / 0.03);
      if (f < 0.32) return lerp(0.5, 0, (f - 0.12) / 0.2);
      return 0;
    };
    const logoScale = (t: number) => {
      let s =
        t < T.flash
          ? lerp(START_SCALE, START_SCALE * 0.86, outQuad(seg(t, T.squeeze[0], T.squeeze[1])))
          : lerp(START_SCALE * 0.86, 1, spring(seg(t, T.flash, T.flash + 0.75))) +
            0.14 * Math.sin(Math.PI * seg(t, T.flash, T.flash + 0.22));
      s += 0.06 * Math.sin(Math.PI * seg(t, T.collapse[0], T.collapse[1]));
      return s;
    };
    const collapse = (t: number) => inCubic(seg(t, T.collapse[0], T.collapse[1]));

    return {
      container: curve(time, (t) => 1 - outQuad(seg(t, T.fade[0], T.fade[1]))),
      flash: curve(time, flashOpacity),
      lift: curve(time, lift),
      logoScale: curve(time, logoScale),
      glowOpacity: curve(time, (t) => {
        const g = seg(t, T.flash, T.flash + 0.6);
        return g > 0 ? 1 - g : 0;
      }),
      glowScale: curve(time, (t) => lerp(0.5, 1.5, outCubic(seg(t, T.flash, T.flash + 0.6)))),
      rings: [
        { start: T.flash, end: T.flash + 0.55, to: 2.8, max: 0.9 },
        { start: T.flash + 0.08, end: T.flash + 0.7, to: 3.4, max: 0.7 },
      ].map((r) => ({
        opacity: curve(time, (t) => {
          const p = seg(t, r.start, r.end);
          return p > 0 ? r.max * (1 - p) : 0;
        }),
        scale: curve(time, (t) => lerp(0.9, r.to, outCubic(seg(t, r.start, r.end)))),
      })),
      sparks: SPARKS.map((sp) => {
        const p = (t: number) => seg(t, T.flash + 0.02 + sp.delay, T.flash + 0.62);
        const d = (t: number) => lerp(60, sp.dist, outCubic(p(t)));
        return {
          x: curve(time, (t) => Math.cos(sp.angle) * d(t)),
          y: curve(time, (t) => Math.sin(sp.angle) * d(t) + lift(t)),
          scale: curve(time, (t) => lerp(1.3, 0.4, p(t))),
          opacity: curve(time, (t) => (p(t) > 0 ? 1 - p(t) : 0)),
        };
      }),
      cards: CARDS.map((c) => {
        const p = (t: number) =>
          outBack(seg(t, T.cardsIn[0] + c.delay, T.cardsIn[1] + c.delay), 1.6) * (1 - collapse(t));
        return {
          x: curve(time, (t) => c.x * p(t)),
          y: curve(time, (t) => c.y * p(t) + lift(t) - 10),
          rotate: degCurve(time, (t) => c.r * p(t)),
          scale: curve(time, (t) => lerp(0.5, 1, Math.min(1, p(t)))),
          opacity: curve(time, (t) => clamp(p(t) * 1.6)),
        };
      }),
      letters: [...WORD].map((_, i) => {
        const p = (t: number) => seg(t, T.word + i * 0.045, T.word + i * 0.045 + 0.32);
        return {
          opacity: curve(time, (t) => clamp(p(t) * 1.4)),
          y: curve(time, (t) => lerp(22, 0, outBack(p(t), 2))),
        };
      }),
      bar: curve(time, (t) => Math.max(0.001, outCubic(seg(t, T.word + 0.3, T.word + 0.7)))),
      barOpacity: curve(time, (t) => (seg(t, T.word + 0.3, T.word + 0.7) > 0 ? 1 : 0)),
      tagOpacity: curve(time, (t) => outCubic(seg(t, T.tag[0], T.tag[1]))),
      tagY: curve(time, (t) => lerp(10, 0, outCubic(seg(t, T.tag[0], T.tag[1])))),
      wipeOpacity: curve(time, (t) => (seg(t, T.wipe[0], T.wipe[1]) > 0 ? 1 : 0)),
      wipeScale: curve(time, (t) => {
        const w = seg(t, T.wipe[0], T.wipe[1]);
        return Math.max(0.001, (inCubic(w) * 0.6 + w * 0.4) * wipeScale);
      }),
    };
  }, [time, wipeScale]);

  function start() {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync().catch(() => {});
    Animated.timing(time, {
      toValue: TOTAL,
      duration: TOTAL * 1000,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => onFinish());
  }

  /** Ekran ortasına göre konumlanan kutu. */
  const centered = (w: number, h: number) => ({
    position: 'absolute' as const,
    left: cx - w / 2,
    top: cy - h / 2,
    width: w,
    height: h,
  });

  return (
    <Animated.View style={[styles.container, { opacity: anim.container }]} onLayout={start} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.flash, { opacity: anim.flash }]} />

      {/* Parıltı: iç içe yarı saydam daireler */}
      <Animated.View
        style={[
          centered(300, 300),
          { opacity: anim.glowOpacity, transform: [{ translateY: anim.lift }, { scale: anim.glowScale }] },
        ]}
      >
        {[300, 220, 150].map((size, i) => (
          <View
            key={size}
            style={{
              position: 'absolute',
              left: (300 - size) / 2,
              top: (300 - size) / 2,
              width: size,
              height: size,
              borderRadius: size / 2,
              backgroundColor: '#22d3ee',
              opacity: 0.12 + i * 0.1,
            }}
          />
        ))}
      </Animated.View>

      {anim.rings.map((r, i) => (
        <Animated.View
          key={i}
          style={[
            centered(170, 170),
            i === 0 ? styles.ringCyan : styles.ringNavy,
            { opacity: r.opacity, transform: [{ translateY: anim.lift }, { scale: r.scale }] },
          ]}
        />
      ))}

      {anim.sparks.map((s, i) => {
        const sp = SPARKS[i];
        const w = sp.streak ? 22 : 7;
        const h = sp.streak ? 4 : 7;
        return (
          <Animated.View
            key={i}
            style={[
              centered(w, h),
              { borderRadius: h / 2, backgroundColor: sp.color, opacity: s.opacity },
              {
                transform: [
                  { translateX: s.x },
                  { translateY: s.y },
                  { rotate: sp.streak ? `${sp.angle}rad` : '0rad' },
                  { scale: s.scale },
                ],
              },
            ]}
          />
        );
      })}

      {anim.cards.map((c, i) => (
        <Animated.View
          key={i}
          style={[
            centered(CARD_W, CARD_H),
            styles.cardShadow,
            {
              opacity: c.opacity,
              transform: [{ translateX: c.x }, { translateY: c.y }, { rotate: c.rotate }, { scale: c.scale }],
            },
          ]}
        >
          <LinearGradient colors={CARDS[i].colors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.card}>
            <LinearGradient colors={['#fde68a', '#d4a017']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.chip} />
            <View style={styles.cardLineShort} />
            <View style={styles.cardLine} />
          </LinearGradient>
        </Animated.View>
      ))}

      <Animated.Image
        source={LOGO}
        resizeMode="contain"
        style={[centered(LOGO_SIZE, LOGO_SIZE), { transform: [{ translateY: anim.lift }, { scale: anim.logoScale }] }]}
      />

      <View style={[styles.row, { top: cy + WORD_Y - 26 }]}>
        {[...WORD].map((ch, i) => (
          <Animated.Text
            key={i}
            style={[
              styles.word,
              i >= 3 && styles.wordAccent,
              { opacity: anim.letters[i].opacity, transform: [{ translateY: anim.letters[i].y }] },
            ]}
          >
            {ch === ' ' ? ' ' : ch}
          </Animated.Text>
        ))}
      </View>

      <Animated.View
        style={[
          centered(64, 5),
          styles.bar,
          { opacity: anim.barOpacity, transform: [{ translateY: WORD_Y + 34 }, { scaleX: anim.bar }] },
        ]}
      />

      <Animated.Text
        style={[
          styles.tag,
          { top: cy + WORD_Y + 52, opacity: anim.tagOpacity, transform: [{ translateY: anim.tagY }] },
        ]}
      >
        Kartların, borçların, bütçen
      </Animated.Text>

      <Animated.View
        style={[
          centered(100, 100),
          styles.wipe,
          { opacity: anim.wipeOpacity, transform: [{ translateY: anim.lift }, { scale: anim.wipeScale }] },
        ]}
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    zIndex: 1000,
    elevation: 1000,
  },
  flash: { backgroundColor: '#d9f6ff' },
  ringCyan: { borderRadius: 85, borderWidth: 5, borderColor: '#22d3ee' },
  ringNavy: { borderRadius: 85, borderWidth: 3, borderColor: colors.navy },
  cardShadow: {
    borderRadius: 14,
    backgroundColor: '#10254a',
    shadowColor: '#0f172a',
    shadowOpacity: 0.28,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
  card: { flex: 1, borderRadius: 14, overflow: 'hidden' },
  chip: { position: 'absolute', left: 14, top: 16, width: 24, height: 18, borderRadius: 4 },
  cardLineShort: {
    position: 'absolute',
    left: 14,
    bottom: 28,
    width: 50,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cardLine: {
    position: 'absolute',
    left: 14,
    bottom: 16,
    width: 70,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  row: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 52,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  word: { fontSize: 38, fontWeight: '800', color: colors.navy, letterSpacing: 0.5 },
  wordAccent: { color: '#0ea5e9' },
  bar: { borderRadius: 3, backgroundColor: '#0ea5e9' },
  tag: { position: 'absolute', left: 0, right: 0, textAlign: 'center', fontSize: 15, color: colors.slate500 },
  wipe: { borderRadius: 50, backgroundColor: colors.navy },
});
