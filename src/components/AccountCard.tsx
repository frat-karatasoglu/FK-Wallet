import { StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { colors, spacing } from '../theme';
import { formatCurrency } from '../lib/format';
import type { Account } from '../types/database';
import { CardShell, cardPillStyles } from './CardShell';

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
  width?: number;
}

/** Banka hesabı kartı: kredi kartlarıyla aynı boyut ve görünüm. */
export function AccountCard({ account, onPress, width }: AccountCardProps) {
  return (
    <CardShell color={account.color} width={width} onPress={onPress}>
      <View style={styles.topRow}>
        <View style={styles.identity}>
          <Text style={styles.name} numberOfLines={1}>
            {account.nickname || account.bank_name}
          </Text>
          {account.nickname ? (
            <Text style={styles.bank} numberOfLines={1}>
              {account.bank_name}
            </Text>
          ) : null}
        </View>
        <View style={styles.logo}>
          <MaterialIcons name="account-balance" size={18} color="#ffffff" />
        </View>
      </View>

      <View style={styles.numberRow}>
        <Text style={styles.dots}>••••</Text>
        <Text style={styles.lastFour}>{account.last_four ?? '••••'}</Text>
      </View>

      <View>
        <Text style={styles.label}>Kullanılabilir bakiye</Text>
        <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
          {formatCurrency(account.balance)}
        </Text>
      </View>

      <View style={cardPillStyles.row}>
        <View style={cardPillStyles.pill}>
          <Ionicons name="wallet-outline" size={12} color="rgba(255,255,255,0.8)" />
          <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            <Text style={styles.pillLabel}>Tür </Text>
            Vadesiz
          </Text>
        </View>
        <View style={cardPillStyles.pill}>
          <View style={styles.activeDot} />
          <Text style={styles.pillText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.75}>
            <Text style={styles.pillLabel}>Durum </Text>
            Aktif
          </Text>
        </View>
      </View>
    </CardShell>
  );
}

const styles = StyleSheet.create({
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: { flexShrink: 1 },
  name: { color: colors.white, fontSize: 18, fontWeight: '800', letterSpacing: -0.2 },
  bank: { color: 'rgba(255,255,255,0.7)', fontSize: 11.5, marginTop: 1 },
  logo: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dots: { color: 'rgba(255,255,255,0.65)', fontSize: 14, letterSpacing: 2 },
  lastFour: { color: colors.white, fontSize: 16, fontWeight: '700', letterSpacing: 2 },
  label: { color: 'rgba(255,255,255,0.7)', fontSize: 11 },
  balance: { color: colors.white, fontSize: 27, fontWeight: '800', marginTop: 2, letterSpacing: -0.5 },
  pillText: { flexShrink: 1, color: colors.white, fontSize: 11.5, fontWeight: '700' },
  pillLabel: { color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  activeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#4ade80' },
});
