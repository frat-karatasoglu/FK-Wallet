import { useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import * as SplashScreen from 'expo-splash-screen';

import { colors } from '../theme';

const LOGO = require('../../assets/images/fk-logo.png');
/** app.json'daki expo-splash-screen "imageWidth" değeriyle aynı olmalı (geçiş kesintisiz görünsün). */
const LOGO_SIZE = 220;

interface Props {
  onFinish: () => void;
}

/**
 * Yerel açılış ekranının üstüne aynı logoyla açılır, ardından logo hafifçe "nefes alır",
 * "FK Cüzdan" yazısı belirir ve ekran büyüyerek kaybolup uygulamayı gösterir.
 */
export function AnimatedSplash({ onFinish }: Props) {
  const logoScale = useRef(new Animated.Value(1)).current;
  const glow = useRef(new Animated.Value(0)).current;
  const text = useRef(new Animated.Value(0)).current;
  const exit = useRef(new Animated.Value(0)).current;
  const started = useRef(false);

  function start() {
    if (started.current) return;
    started.current = true;
    SplashScreen.hideAsync().catch(() => {});

    Animated.sequence([
      Animated.parallel([
        Animated.sequence([
          Animated.timing(logoScale, { toValue: 0.88, duration: 180, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.spring(logoScale, { toValue: 1.06, friction: 4, tension: 120, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(150),
          Animated.timing(glow, { toValue: 1, duration: 260, useNativeDriver: true }),
          Animated.timing(glow, { toValue: 0, duration: 420, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.delay(260),
          Animated.timing(text, { toValue: 1, duration: 380, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        ]),
      ]),
      Animated.delay(320),
      Animated.timing(exit, { toValue: 1, duration: 360, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
    ]).start(() => onFinish());
  }

  const containerStyle = {
    opacity: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
  };
  const contentStyle = {
    transform: [{ scale: exit.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
  };

  return (
    <Animated.View style={[styles.container, containerStyle]} onLayout={start} pointerEvents="none">
      <Animated.View style={[styles.content, contentStyle]}>
        <View style={styles.logoWrap}>
          <Animated.View
            style={[
              styles.glow,
              {
                opacity: glow.interpolate({ inputRange: [0, 1], outputRange: [0, 0.55] }),
                transform: [{ scale: glow.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.25] }) }],
              },
            ]}
          />
          <Animated.Image source={LOGO} resizeMode="contain" style={[styles.logo, { transform: [{ scale: logoScale }] }]} />
        </View>
        <Animated.View
          style={[
            styles.textWrap,
            {
              opacity: text,
              transform: [{ translateY: text.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }],
            },
          ]}
        >
          <Text style={styles.title}>
            FK <Text style={styles.titleAccent}>Cüzdan</Text>
          </Text>
          <Text style={styles.subtitle}>Kartların, borçların, bütçen</Text>
        </Animated.View>
      </Animated.View>
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
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    elevation: 1000,
  },
  content: { alignItems: 'center', justifyContent: 'center' },
  logoWrap: { width: LOGO_SIZE, height: LOGO_SIZE, alignItems: 'center', justifyContent: 'center' },
  glow: {
    position: 'absolute',
    width: LOGO_SIZE,
    height: LOGO_SIZE,
    borderRadius: LOGO_SIZE / 2,
    backgroundColor: '#22d3ee',
  },
  logo: { width: LOGO_SIZE, height: LOGO_SIZE },
  // Logo ekranın tam ortasında kalsın diye yazı akışa girmeden altına yerleştirilir.
  textWrap: { position: 'absolute', top: LOGO_SIZE + 12, alignItems: 'center', width: 320 },
  title: { fontSize: 30, fontWeight: '800', color: colors.navy, letterSpacing: 0.5 },
  titleAccent: { color: '#0ea5e9' },
  subtitle: { marginTop: 4, fontSize: 14, color: colors.slate500 },
});
