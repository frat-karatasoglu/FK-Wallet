import { TransactionSection } from '@/src/components/TransactionSection';
import { colors } from '@/src/theme';

export default function IncomeScreen() {
  return (
    <TransactionSection
      type="income"
      accentColor={colors.income}
      totalLabel="Bu ayki toplam gelir"
      emptyTitle="Bu ay gelir kaydı yok"
      emptyMessage="Sağ üstteki + ile maaş, kira geliri gibi gelirlerini ekle."
    />
  );
}
