import type { TextStyle, ViewStyle } from 'react-native';

/*
 * "+" ekranıyla başlayan ortak görünüm: büyük yuvarlatılmış beyaz kutular, yumuşak gölge,
 * köşeli-yuvarlak renkli simge kareleri ve gradyan "kahraman" kutular.
 */

/** Beyaz, yumuşak gölgeli kutu. */
export const surface: ViewStyle = {
  backgroundColor: '#ffffff',
  borderRadius: 18,
  borderWidth: 1,
  borderColor: '#eef2f7',
  shadowColor: '#0f172a',
  shadowOpacity: 0.08,
  shadowRadius: 10,
  shadowOffset: { width: 0, height: 4 },
  elevation: 2,
};

/** Renkli zemin üstünde simge karesi (arka plan rengi ayrıca verilir). */
export const iconTile: ViewStyle = {
  width: 40,
  height: 40,
  borderRadius: 12,
  alignItems: 'center',
  justifyContent: 'center',
};

/** Küçük, büyük harfli bölüm etiketi ("DİĞER" gibi). */
export const sectionLabel: TextStyle = {
  fontSize: 12,
  fontWeight: '700',
  letterSpacing: 0.8,
  color: '#94a3b8',
};

/** Gradyan kahraman kutu renkleri: açık → orta → koyu. */
export const heroGradients = {
  blue: ['#60a5fa', '#2563eb', '#1d3f6e'],
  navy: ['#3b82f6', '#1d4ed8', '#142b4c'],
  green: ['#34d399', '#059669', '#047857'],
  red: ['#fb7185', '#e11d48', '#be123c'],
  amber: ['#fbbf24', '#f59e0b', '#b45309'],
} as const satisfies Record<string, readonly [string, string, string]>;

export type HeroTone = keyof typeof heroGradients;

/** Gradyan kutunun gölge rengi. */
export const heroShadows: Record<HeroTone, string> = {
  blue: '#2563eb',
  navy: '#1d4ed8',
  green: '#059669',
  red: '#e11d48',
  amber: '#f59e0b',
};

/** Modern giriş alanı: yumuşak zemin, yuvarlak köşe; odakta mavi çerçeve. */
export const inputField = {
  minHeight: 50,
  borderWidth: 1.5,
  borderColor: '#e3e9f3',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 12,
  fontSize: 16,
  color: '#1e293b',
  backgroundColor: '#f6f8fc',
} as const;

export const inputFocused = {
  borderColor: '#2563eb',
  backgroundColor: '#ffffff',
  shadowColor: '#2563eb',
  shadowOpacity: 0.15,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 2 },
  elevation: 2,
} as const;

export const inputLabel = {
  color: '#475569',
  fontSize: 12.5,
  fontWeight: '600',
} as const;
