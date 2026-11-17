import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { AccessibilityInfo, Animated, Easing, Pressable, type StyleProp, type ViewStyle } from 'react-native';
import { useFocusEffect } from 'expo-router';

/*
 * Ekranlarda ortak hareket dili: öğeler ekran her açıldığında sırayla aşağıdan kayarak
 * gelir, dokunulabilir kutular basınca yaylanarak küçülür, tutarlar sayarak belirir.
 * Hepsi native sürücüde çalışır; "hareketi azalt" açıksa animasyon atlanır.
 */

const TOTAL = 1.4; // saniye: tüm girişlerin bittiği an
const STEP = 0.055; // ardışık öğeler arası gecikme
const MAX_DELAY = 0.8; // çok uzun listelerde son öğeler beklemesin
const DURATION = 0.45;
const SAMPLES = 14;

// Native sürücü özel easing fonksiyonu taşıyamadığı için eğri örneklenir.
const outBack = (p: number, s = 1.4) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2);

function windowFor(index: number) {
  const start = Math.min(index * STEP, MAX_DELAY);
  return { start, end: start + DURATION };
}

function sampled(start: number, end: number, fn: (p: number) => number) {
  const inputRange: number[] = [];
  const outputRange: number[] = [];
  for (let i = 0; i <= SAMPLES; i++) {
    const p = i / SAMPLES;
    inputRange.push(start + (end - start) * p);
    outputRange.push(fn(p));
  }
  return { inputRange, outputRange };
}

let reduceMotion = false;
AccessibilityInfo.isReduceMotionEnabled()
  .then((value) => {
    reduceMotion = value;
  })
  .catch(() => undefined);

/**
 * Ekran her odaklandığında 0 → TOTAL akan zaman değeri. replayKey değişince
 * (ör. sekme içi geçiş, seçilen gün) animasyon yeniden oynar.
 */
export function useFocusEntrance(replayKey?: unknown) {
  const time = useRef(new Animated.Value(reduceMotion ? TOTAL : 0)).current;
  const isFirst = useRef(true);

  const play = useCallback(() => {
      if (reduceMotion) {
        time.setValue(TOTAL);
        return undefined;
      }
      time.setValue(0);
      const anim = Animated.timing(time, {
        toValue: TOTAL,
        duration: TOTAL * 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      });
      anim.start();
      return () => anim.stop();
  }, [time]);

  useFocusEffect(play);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return undefined;
    }
    return play();
  }, [replayKey, play]);

  return time;
}

/** Sırası gelince aşağıdan kayarak beliren sarmalayıcı. */
export function Enter({
  time,
  index,
  style,
  children,
}: {
  time: Animated.Value;
  index: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const { start, end } = windowFor(index);
  const opacity = time.interpolate({
    ...sampled(start, end, (p) => Math.min(1, p * 1.6)),
    extrapolate: 'clamp',
  });
  const translateY = time.interpolate({
    ...sampled(start, end, (p) => (1 - outBack(p)) * 24),
    extrapolate: 'clamp',
  });
  const scale = time.interpolate({
    ...sampled(start, end, (p) => 0.97 + 0.03 * Math.min(1, outBack(p))),
    extrapolate: 'clamp',
  });
  return <Animated.View style={[style, { opacity, transform: [{ translateY }, { scale }] }]}>{children}</Animated.View>;
}

/** Basınca hafifçe küçülüp yaylanarak geri gelen dokunma alanı. */
export function PressableScale({
  onPress,
  style,
  innerStyle,
  disabled,
  children,
}: {
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  innerStyle?: StyleProp<ViewStyle>;
  disabled?: boolean;
  children: ReactNode;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const to = (value: number) =>
    Animated.spring(scale, { toValue: value, friction: 7, tension: 300, useNativeDriver: true }).start();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      // Kaydırırken dokunuşlar kutuları küçültmesin: basma kısa bir gecikmeyle başlar.
      unstable_pressDelay={90}
      onPressIn={() => to(0.985)}
      onPressOut={() => to(1)}
      style={style}
    >
      <Animated.View style={[innerStyle, { transform: [{ scale }] }]}>{children}</Animated.View>
    </Pressable>
  );
}

/** Tutarı ekran her açıldığında 0'dan hedefe sayarak gösterir. */
export function useCountUp(target: number, duration = 750) {
  const [value, setValue] = useState(reduceMotion ? target : 0);
  const targetRef = useRef(target);
  const frame = useRef<number | null>(null);
  const [runId, setRunId] = useState(0);

  useFocusEffect(
    useCallback(() => {
      setRunId((id) => id + 1);
    }, []),
  );

  useEffect(() => {
    targetRef.current = target;
    if (reduceMotion) {
      setValue(target);
      return undefined;
    }
    const startTime = Date.now();
    const tick = () => {
      const p = Math.min(1, (Date.now() - startTime) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(targetRef.current * eased);
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current != null) cancelAnimationFrame(frame.current);
    };
  }, [target, duration, runId]);

  return value;
}
