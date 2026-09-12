export const CURRENCY_OPTIONS = [
  { code: 'TRY', symbol: '₺', name: 'Türk Lirası' },
  { code: 'USD', symbol: '$', name: 'Amerikan Doları' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'İngiliz Sterlini' },
] as const;

export type CurrencyCode = (typeof CURRENCY_OPTIONS)[number]['code'];

let currentCurrency: CurrencyCode = 'TRY';

// Uygulama tek bir para birimi sembolü kullanır (gerçek kur çevrimi yapmaz,
// sadece görünen sembolü değiştirir). Ayarlar ekranından setCurrency çağrılır.
export function setCurrency(code: string): void {
  currentCurrency = CURRENCY_OPTIONS.some((option) => option.code === code)
    ? (code as CurrencyCode)
    : 'TRY';
}

export function getCurrencySymbol(): string {
  return CURRENCY_OPTIONS.find((option) => option.code === currentCurrency)?.symbol ?? '₺';
}

const currencyFormatter = new Intl.NumberFormat('tr-TR', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export function formatCurrency(amount: number): string {
  return `${currencyFormatter.format(Math.abs(amount))} ${getCurrencySymbol()}`;
}

export function formatSignedCurrency(amount: number): string {
  const sign = amount > 0 ? '+' : amount < 0 ? '−' : '';
  return `${sign}${formatCurrency(amount)}`;
}

const dateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
});

export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return dateFormatter.format(d);
}

const shortDateFormatter = new Intl.DateTimeFormat('tr-TR', {
  day: 'numeric',
  month: 'short',
});

export function formatShortDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return shortDateFormatter.format(d);
}

export function formatDayOfMonth(day: number): string {
  return `Her ayın ${day}. günü`;
}
