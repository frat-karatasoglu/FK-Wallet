import { TransactionSection } from '@/src/components/TransactionSection';
import { cardPalette } from '@/src/theme';

export default function ExpensesScreen() {
  return (
    <TransactionSection
      type="expense"
      accentColor={cardPalette.rose}
      totalLabel="Bu ayki toplam gider"
      emptyTitle="Bu ay gider kaydı yok"
      emptyMessage="Sağ üstteki + ile market, fatura gibi harcamalarını ekle."
    />
  );
}
