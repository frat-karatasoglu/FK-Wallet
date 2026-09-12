export type Urgency = 'overdue' | 'due_soon' | 'normal';

export interface CardCycleDates {
  nextStatementDate: Date;
  nextDueDate: Date;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function daysInMonth(year: number, month0: number): number {
  return new Date(year, month0 + 1, 0).getDate();
}

export function clampDayToMonth(year: number, month0: number, day: number): number {
  return Math.min(day, daysInMonth(year, month0));
}

export function getNextOccurrence(day: number, referenceDate: Date = new Date()): Date {
  const today = startOfDay(referenceDate);
  const y = today.getFullYear();
  const m = today.getMonth();

  const thisMonth = new Date(y, m, clampDayToMonth(y, m, day));
  if (thisMonth >= today) {
    return thisMonth;
  }

  // m + 1 === 12 taşarsa Date constructor'ı kendiliğinden bir sonraki yılın
  // Ocak ayına normalize eder, elle yıl geçişi kontrolü gerekmez.
  return new Date(y, m + 1, clampDayToMonth(y, m + 1, day));
}

export function computeCardDates(
  card: { statement_day: number; due_day: number },
  referenceDate: Date = new Date()
): CardCycleDates {
  return {
    nextStatementDate: getNextOccurrence(card.statement_day, referenceDate),
    nextDueDate: getNextOccurrence(card.due_day, referenceDate),
  };
}

export function daysUntil(target: Date, referenceDate: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  const diff = startOfDay(target).getTime() - startOfDay(referenceDate).getTime();
  return Math.round(diff / msPerDay);
}

export function getUrgency(
  target: Date,
  referenceDate: Date = new Date(),
  dueSoonThresholdDays: number = 3
): Urgency {
  const diff = daysUntil(target, referenceDate);
  if (diff < 0) return 'overdue';
  if (diff <= dueSoonThresholdDays) return 'due_soon';
  return 'normal';
}
