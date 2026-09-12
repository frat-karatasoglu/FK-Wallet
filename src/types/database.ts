export type CardColor =
  | 'navy'
  | 'turquoise'
  | 'emerald'
  | 'amber'
  | 'rose'
  | 'violet'
  | 'sky'
  | 'slate';

export type TransactionType = 'income' | 'card_payment' | 'expense';

export interface Profile {
  id: string;
  display_name: string | null;
  notification_lead_days: number;
  currency: 'TRY';
  created_at: string;
}

export interface Card {
  id: string;
  user_id: string;
  bank_name: string;
  nickname: string | null;
  last_four: string | null;
  color: CardColor;
  statement_day: number;
  due_day: number;
  credit_limit: number | null;
  current_balance: number;
  statement_amount: number | null;
  created_at: string;
}

export type NewCard = Omit<
  Card,
  'id' | 'user_id' | 'created_at' | 'current_balance' | 'statement_amount'
>;
export type UpdatableCardFields = Omit<Card, 'id' | 'user_id' | 'created_at'>;

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  occurred_on: string;
  category: string | null;
  note: string | null;
  card_id: string | null;
  account_id: string | null;
  created_at: string;
}

export type NewTransaction = Omit<Transaction, 'id' | 'user_id' | 'created_at'>;

export interface PlannedPayment {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  due_date: string;
  repeat_monthly: boolean;
  is_paid: boolean;
  note: string | null;
  created_at: string;
}

export type NewPlannedPayment = Omit<PlannedPayment, 'id' | 'user_id' | 'created_at' | 'is_paid'>;

export interface Account {
  id: string;
  user_id: string;
  bank_name: string;
  nickname: string | null;
  last_four: string | null;
  balance: number;
  color: CardColor;
  created_at: string;
}

export type NewAccount = Omit<Account, 'id' | 'user_id' | 'created_at'>;

export type DebtCategory = 'person' | 'rent' | 'bill' | 'loan' | 'other';

export interface PersonalDebt {
  id: string;
  user_id: string;
  person_name: string;
  category: DebtCategory;
  amount: number;
  note: string | null;
  is_paid: boolean;
  created_at: string;
}

export type NewPersonalDebt = Omit<PersonalDebt, 'id' | 'user_id' | 'created_at' | 'is_paid'>;
