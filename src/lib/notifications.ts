import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { computeCardDates } from './cardDates';
import { formatCurrency } from './format';
import { hasPaymentPlan, nextInstallmentAmount, parseDateString } from './paymentSchedule';
import { useSettingsStore } from '../store/useSettingsStore';
import { getAccessInfo, useSubscriptionStore } from '../store/useSubscriptionStore';
import type { Card, PersonalDebt, PlannedPayment } from '../types/database';

const CARD_LEAD_PREFIX = 'card-due-';
const CARD_DAY_PREFIX = 'card-dueday-';
const PLANNED_LEAD_PREFIX = 'planned-due-';
const PLANNED_DAY_PREFIX = 'planned-dueday-';
const DEBT_LEAD_PREFIX = 'debt-due-';
const DEBT_DAY_PREFIX = 'debt-dueday-';

const REMINDER_HOUR = 9;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureNotificationSetup(): Promise<void> {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('card-reminders', {
      name: 'Ödeme hatırlatmaları',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }
}

export async function ensureNotificationPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.status === 'granted') return true;
  const requested = await Notifications.requestPermissionsAsync();
  return requested.status === 'granted';
}

// Hatırlatmalar sabah 9'da düşsün; gün içinde rastgele bir saatte gelmesi
// "bugün son gün" uyarısını işe yaramaz hale getirir.
function atReminderHour(date: Date, daysBefore: number): Date {
  const target = new Date(date);
  target.setDate(target.getDate() - daysBefore);
  target.setHours(REMINDER_HOUR, 0, 0, 0);
  return target;
}

async function cancelStaleByPrefix(prefix: string, validIds: Set<string>) {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  for (const notification of scheduled) {
    const id = notification.identifier;
    if (id.startsWith(prefix) && !validIds.has(id.slice(prefix.length))) {
      await Notifications.cancelScheduledNotificationAsync(id);
    }
  }
}

async function schedule(identifier: string, title: string, body: string, date: Date) {
  await Notifications.cancelScheduledNotificationAsync(identifier);
  if (date.getTime() <= Date.now()) return;
  await Notifications.scheduleNotificationAsync({
    identifier,
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
  });
}

export async function cancelAllReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Hatırlatmalar; kullanıcı kapatmadıysa ve deneme/Premium erişimi sürüyorsa kurulur.
// Deneme bitip Premium alınmadıysa bekleyen hatırlatmalar da iptal edilir.
async function remindersAllowed(): Promise<boolean> {
  if (!useSettingsStore.getState().notificationsEnabled) return false;
  if (!getAccessInfo(useSubscriptionStore.getState()).canWrite) {
    await cancelAllReminders();
    return false;
  }
  return true;
}

export async function rescheduleAllCardReminders(cards: Card[], leadDays: number): Promise<void> {
  if (!(await remindersAllowed())) return;
  if (!(await ensureNotificationPermission())) return;

  const ids = new Set(cards.map((c) => c.id));
  await cancelStaleByPrefix(CARD_LEAD_PREFIX, ids);
  await cancelStaleByPrefix(CARD_DAY_PREFIX, ids);

  const now = new Date();
  for (const card of cards) {
    const { nextDueDate } = computeCardDates(card, now);
    const label = card.nickname || card.bank_name;
    const amount = card.statement_amount ?? card.current_balance;
    const amountText = amount > 0 ? ` Ekstre: ${formatCurrency(amount)}.` : '';

    await schedule(
      `${CARD_LEAD_PREFIX}${card.id}`,
      'Ödeme hatırlatması',
      `${label} kartının son ödeme tarihine ${leadDays} gün kaldı.${amountText}`,
      atReminderHour(nextDueDate, leadDays)
    );

    await schedule(
      `${CARD_DAY_PREFIX}${card.id}`,
      'Bugün son ödeme günü',
      `${label} kartının son ödeme günü bugün.${amountText}`,
      atReminderHour(nextDueDate, 0)
    );
  }
}

export async function reschedulePlannedPaymentReminders(
  payments: PlannedPayment[],
  leadDays: number
): Promise<void> {
  if (!(await remindersAllowed())) return;
  if (!(await ensureNotificationPermission())) return;

  const open = payments.filter((p) => !p.is_paid);
  const ids = new Set(open.map((p) => p.id));
  await cancelStaleByPrefix(PLANNED_LEAD_PREFIX, ids);
  await cancelStaleByPrefix(PLANNED_DAY_PREFIX, ids);

  for (const payment of open) {
    const dueDate = parseDateString(payment.due_date);
    const amountText = ` (${formatCurrency(payment.amount)})`;

    await schedule(
      `${PLANNED_LEAD_PREFIX}${payment.id}`,
      'Planlanan ödeme yaklaşıyor',
      `${payment.title}${amountText} ödemesine ${leadDays} gün kaldı.`,
      atReminderHour(dueDate, leadDays)
    );

    await schedule(
      `${PLANNED_DAY_PREFIX}${payment.id}`,
      'Planlanan ödeme bugün',
      `${payment.title}${amountText} ödemesinin günü bugün.`,
      atReminderHour(dueDate, 0)
    );
  }
}

export async function rescheduleDebtReminders(debts: PersonalDebt[], leadDays: number): Promise<void> {
  if (!(await remindersAllowed())) return;
  if (!(await ensureNotificationPermission())) return;

  const planned = debts.filter((debt) => !debt.is_paid && hasPaymentPlan(debt));
  const ids = new Set(planned.map((debt) => debt.id));
  await cancelStaleByPrefix(DEBT_LEAD_PREFIX, ids);
  await cancelStaleByPrefix(DEBT_DAY_PREFIX, ids);

  for (const debt of planned) {
    if (!hasPaymentPlan(debt)) continue;
    const dueDate = parseDateString(debt.next_payment_date);
    const amountText = ` (${formatCurrency(nextInstallmentAmount(debt))})`;

    await schedule(
      `${DEBT_LEAD_PREFIX}${debt.id}`,
      'Taksit ödemesi yaklaşıyor',
      `${debt.person_name}${amountText} taksitine ${leadDays} gün kaldı.`,
      atReminderHour(dueDate, leadDays)
    );

    await schedule(
      `${DEBT_DAY_PREFIX}${debt.id}`,
      'Taksit ödemesi bugün',
      `${debt.person_name}${amountText} taksitinin ödeme günü bugün.`,
      atReminderHour(dueDate, 0)
    );
  }
}

export async function cancelCardReminder(cardId: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(`${CARD_LEAD_PREFIX}${cardId}`);
  await Notifications.cancelScheduledNotificationAsync(`${CARD_DAY_PREFIX}${cardId}`);
}
