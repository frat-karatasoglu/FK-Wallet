import { useAccountsStore } from '../store/useAccountsStore';
import { useCardsStore } from '../store/useCardsStore';
import { useSettingsStore } from '../store/useSettingsStore';
import type { Transaction } from '../types/database';

export type BalanceAffecting = Pick<Transaction, 'type' | 'amount' | 'account_id' | 'card_id'> & {
  payment_source?: Transaction['payment_source'];
};

/**
 * Bir hareketin bakiyelere etkisini uygular (sign = 1) ya da geri alır (sign = -1).
 *
 * - Gelir: account_id'deki hesaba, yoksa nakde eklenir.
 * - Gider: payment_source'a göre nakitten / hesaptan düşer ya da kredi kartının borcuna eklenir.
 * - Kart ödemesi: kartın borcu (ve ekstresi) azalır; payment_source'a göre nakitten / hesaptan düşer.
 *
 * payment_source'u olmayan eski gider/kart ödemeleri yalnızca eskiden uygulanan etkiyi taşır
 * (kart ödemesinde kart borcunun azalması), böylece silinip düzenlenirken bakiyeler bozulmaz.
 */
export async function applyBalanceEffect(transaction: BalanceAffecting, sign: 1 | -1): Promise<void> {
  const amount = Number(transaction.amount) * sign;
  if (!amount) return;

  if (transaction.type === 'income') {
    if (transaction.account_id) {
      await useAccountsStore.getState().applyIncome(transaction.account_id, amount);
    } else {
      await useSettingsStore.getState().applyCashDelta(amount);
    }
    return;
  }

  if (transaction.type === 'card_payment' && transaction.card_id) {
    await useCardsStore.getState().applyCardPayment(transaction.card_id, amount);
  }

  switch (transaction.payment_source) {
    case 'cash':
      await useSettingsStore.getState().applyCashDelta(-amount);
      break;
    case 'account':
      if (transaction.account_id) {
        await useAccountsStore.getState().applyIncome(transaction.account_id, -amount);
      }
      break;
    case 'card':
      if (transaction.type === 'expense' && transaction.card_id) {
        await useCardsStore.getState().applyCardCharge(transaction.card_id, amount);
      }
      break;
    default:
      break;
  }
}
