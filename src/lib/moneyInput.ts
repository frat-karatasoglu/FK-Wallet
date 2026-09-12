/** Türkçe para alanları için yazım ve kayıt dönüşümleri. */
export function formatMoneyInput(value: string): string {
  const cleaned = value.replace(/[^\d,]/g, '');
  const hasFraction = cleaned.includes(',');
  const [rawWhole = '', ...fractionParts] = cleaned.split(',');
  const whole = rawWhole.replace(/^0+(?=\d)/, '');
  const groupedWhole = whole.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

  if (!hasFraction) return groupedWhole;
  return `${groupedWhole || '0'},${fractionParts.join('').slice(0, 2)}`;
}

export function moneyValueToInput(value: number | null | undefined): string {
  if (value == null || value === 0) return '';
  return formatMoneyInput(String(value).replace('.', ','));
}

export function parseMoneyInput(value: string): number {
  return Number(value.replace(/\./g, '').replace(',', '.'));
}
