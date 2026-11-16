import type { PaymentSourceType } from '../types/database';

export type PaymentSource =
  | { kind: 'cash' }
  | { kind: 'account'; id: string }
  | { kind: 'card'; id: string };

export function paymentSourceFields(source: PaymentSource): {
  payment_source: PaymentSourceType;
  account_id: string | null;
  card_id: string | null;
} {
  if (source.kind === 'account') return { payment_source: 'account', account_id: source.id, card_id: null };
  if (source.kind === 'card') return { payment_source: 'card', account_id: null, card_id: source.id };
  return { payment_source: 'cash', account_id: null, card_id: null };
}

export function paymentSourceFromFields(fields: {
  payment_source?: PaymentSourceType | null;
  account_id?: string | null;
  card_id?: string | null;
}): PaymentSource {
  if (fields.payment_source === 'account' && fields.account_id) return { kind: 'account', id: fields.account_id };
  if (fields.payment_source === 'card' && fields.card_id) return { kind: 'card', id: fields.card_id };
  return { kind: 'cash' };
}
