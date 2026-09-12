import { create } from 'zustand';
import { getSupabaseClient } from '../lib/supabase';
import { rescheduleAllCardReminders } from '../lib/notifications';
import { useSettingsStore } from './useSettingsStore';
import type { Card, NewCard, UpdatableCardFields } from '../types/database';

interface CardsState {
  cards: Card[];
  isLoading: boolean;
  error: string | null;
  fetchCards: () => Promise<void>;
  addCard: (card: NewCard) => Promise<string | null>;
  updateCard: (id: string, card: Partial<UpdatableCardFields>) => Promise<string | null>;
  deleteCard: (id: string) => Promise<string | null>;
  applyCardPayment: (cardId: string, amount: number) => Promise<void>;
}

async function reschedule(cards: Card[]) {
  const leadDays = useSettingsStore.getState().notificationLeadDays;
  await rescheduleAllCardReminders(cards, leadDays);
}

export const useCardsStore = create<CardsState>((set, get) => ({
  cards: [],
  isLoading: false,
  error: null,

  fetchCards: async () => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    set({ isLoading: true, error: null });
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) {
      set({ isLoading: false, error: error.message });
      return;
    }
    const cards = (data ?? []) as Card[];
    set({ cards, isLoading: false });
    reschedule(cards);
  },

  addCard: async (card) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return 'Oturum bulunamadı.';

    const { error } = await supabase
      .from('cards')
      .insert({ ...card, user_id: userData.user.id });
    if (error) return error.message;

    await get().fetchCards();
    return null;
  },

  // Ekstre tutarı, o karta ait güncel borçtan asla fazla olamaz (ekstre zaten
  // güncel borcun bir parçasıdır). Güncel borç azaltıldığında ekstre de aynı
  // miktarda düşer; hangi yönden düzenlenirse düzenlensin ekstre <= borç kalır.
  updateCard: async (id, card) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const existingCard = get().cards.find((item) => item.id === id);
    const update = { ...card };

    if (existingCard && card.current_balance != null) {
      const nextBalance = Math.max(0, Number(card.current_balance));
      const previousBalance = Number(existingCard.current_balance);
      update.current_balance = nextBalance;

      if (existingCard.statement_amount != null && nextBalance < previousBalance) {
        const payment = previousBalance - nextBalance;
        update.statement_amount = Math.max(0, Number(existingCard.statement_amount) - payment);
      }
    }

    if (existingCard) {
      const balance = Number(update.current_balance ?? existingCard.current_balance);
      const statement = update.statement_amount ?? existingCard.statement_amount;
      if (statement != null) {
        update.statement_amount = Math.min(Math.max(0, Number(statement)), balance);
      }
    }

    const { error } = await supabase.from('cards').update(update).eq('id', id);
    if (error) return error.message;

    await get().fetchCards();
    return null;
  },

  deleteCard: async (id) => {
    const supabase = getSupabaseClient();
    if (!supabase) return 'Supabase yapılandırılmamış.';
    const { error } = await supabase.from('cards').delete().eq('id', id);
    if (error) return error.message;

    await get().fetchCards();
    return null;
  },

  // Ödeme, güncel borcu azaltır; ekstre tutarı da (borcun bir parçası olduğu
  // için) aynı miktarda düşer - aksi halde ekstre borçtan büyük görünebilir.
  applyCardPayment: async (cardId, amount) => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    const card = get().cards.find((c) => c.id === cardId);
    if (!card) return;

    const nextBalance = Math.max(0, Number(card.current_balance) - amount);
    const nextStatement =
      card.statement_amount != null ? Math.max(0, Number(card.statement_amount) - amount) : null;

    await supabase
      .from('cards')
      .update({ current_balance: nextBalance, statement_amount: nextStatement })
      .eq('id', cardId);

    await get().fetchCards();
  },
}));
