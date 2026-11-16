import type { PaymentInterval, PersonalDebt, PlannedPayment, RepeatInterval } from '../types/database';

export const PAYMENT_INTERVALS: PaymentInterval[] = [1, 3, 6, 12];

const INTERVAL_LABELS: Record<PaymentInterval, string> = {
  1: 'Her ay',
  3: '3 ayda bir',
  6: '6 ayda bir',
  12: 'Yılda bir',
};

export function intervalLabel(months: PaymentInterval): string {
  return INTERVAL_LABELS[months];
}

export function toDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** "2027-05-15" → yerel saatle 15 Mayıs 2027 00:00 (UTC kaymasını önler). */
export function parseDateString(value: string): Date {
  const [y, m, d] = value.slice(0, 10).split('-').map(Number);
  return new Date(y, m - 1, d);
}

/** Ay ekler; 31 Ocak + 1 ay = 28/29 Şubat gibi ay sonuna sabitlenir. */
export function addMonths(value: string, months: number): string {
  const date = parseDateString(value);
  const day = date.getDate();
  const target = new Date(date.getFullYear(), date.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(day, lastDay));
  return toDateString(target);
}

/** Planlı ödemenin tekrar aralığı; eski kayıtlar için repeat_monthly'ye düşer. */
export function plannedRepeatInterval(payment: Pick<PlannedPayment, 'repeat_interval_months' | 'repeat_monthly'>): RepeatInterval {
  if (payment.repeat_interval_months) return payment.repeat_interval_months;
  return payment.repeat_monthly ? 1 : 0;
}

export function hasPaymentPlan(
  debt: Pick<PersonalDebt, 'installment_amount' | 'payment_interval_months' | 'next_payment_date'>
): debt is typeof debt & { installment_amount: number; payment_interval_months: PaymentInterval; next_payment_date: string } {
  return debt.installment_amount != null && debt.payment_interval_months != null && debt.next_payment_date != null;
}

/** Bir sonraki taksitte ödenecek tutar: kalan borç taksitten azsa kalan kadar. */
export function nextInstallmentAmount(debt: Pick<PersonalDebt, 'amount' | 'installment_amount'>): number {
  const installment = Number(debt.installment_amount ?? 0);
  const remaining = Number(debt.amount);
  return Math.min(installment, remaining) || installment;
}
