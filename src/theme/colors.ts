import type { CardColor } from '../types/database';

export const colors = {
  primary: '#2563eb',
  primaryLight: '#e8f0ff',
  navy: '#1d3f6e',
  navyDark: '#142b4c',
  turquoise: '#0d9488',
  turquoiseLight: '#14b8a6',
  white: '#ffffff',
  background: '#f8fafc',

  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',

  income: '#10b981',
  incomeBg: '#ecfdf5',
  overdue: '#ef4444',
  overdueBg: '#fef2f2',
  dueSoon: '#f59e0b',
  dueSoonBg: '#fffbeb',
} as const;

export const cardPalette: Record<CardColor, string> = {
  navy: '#1d3f6e',
  turquoise: '#0d9488',
  emerald: '#10b981',
  amber: '#f59e0b',
  rose: '#f43f5e',
  violet: '#2563eb',
  sky: '#0ea5e9',
  slate: '#475569',
};

// Kart görseli için koyu gradient çiftleri: her renk tokeni kendi tonunda koyu
// bir yüzey üretir, kartlar birbirinden ayırt edilebilir kalır.
export const cardGradients: Record<CardColor, [string, string]> = {
  navy: ['#27456b', '#0d1c2f'],
  turquoise: ['#0f5f5a', '#06242a'],
  emerald: ['#135c44', '#05211a'],
  amber: ['#7c4f13', '#291807'],
  rose: ['#7b2040', '#290a17'],
  violet: ['#2557a7', '#10254a'],
  sky: ['#104f74', '#05202e'],
  slate: ['#3c4755', '#151a21'],
};

export const cardColorOrder: CardColor[] = [
  'navy',
  'turquoise',
  'emerald',
  'amber',
  'rose',
  'violet',
  'sky',
  'slate',
];
