import type { Ionicons } from '@expo/vector-icons';
import type { DebtCategory } from '../types/database';

interface DebtCategoryMeta {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  background: string;
}

export const DEBT_CATEGORIES: Record<DebtCategory, DebtCategoryMeta> = {
  person: { label: 'Kişi', icon: 'person-outline', color: '#e11d48', background: '#ffe4e9' },
  rent: { label: 'Kira', icon: 'home-outline', color: '#b45309', background: '#fef3c7' },
  bill: { label: 'Fatura', icon: 'receipt-outline', color: '#7c3aed', background: '#ede9fe' },
  loan: { label: 'Kredi / Taksit', icon: 'card-outline', color: '#0369a1', background: '#e0f2fe' },
  other: { label: 'Diğer', icon: 'ellipsis-horizontal-circle-outline', color: '#475569', background: '#f1f5f9' },
};

export const DEBT_CATEGORY_ORDER: DebtCategory[] = ['person', 'rent', 'bill', 'loan', 'other'];
