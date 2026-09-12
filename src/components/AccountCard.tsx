import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

import { cardGradients, colors, spacing } from '../theme';
import { formatCurrency } from '../lib/format';
import type { Account } from '../types/database';

// Kart görselleriyle aynı gerçek kart oranı (ID-1: 85.60mm x 53.98mm).
const CARD_ASPECT_RATIO = 1.586;

interface AccountCardProps {
  account: Account;
  onPress?: () => void;
  width?: number;
}

export function AccountCard({ account, onPress, width }: AccountCardProps) {
  const [from, to] = cardGradients[account.color];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [width != null && { width }, pressed && styles.pressed]}
    >
      <LinearGradient
        colors={[from, to]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
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
            <MaterialIcons name="account-balance" size={18} color="rgba(255,255,255,0.85)" />
          </View>
        </View>

        <Text style={styles.lastFour}>•••• {account.last_four ?? '••••'}</Text>

        <View style={styles.balanceBlock}>
          <Text style={styles.label}>Kullanılabilir bakiye</Text>
          <Text style={styles.balance} numberOfLines={1} adjustsFontSizeToFit>
            {formatCurrency(account.balance)}
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            <Text style={styles.footerLabel}>Tür </Text>
            Vadesiz
          </Text>
          <Text style={styles.footerText}>
            <Text style={styles.footerLabel}>Durum </Text>
            Aktif
          </Text>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  pressed: { opacity: 0.92 },
  card: {
    aspectRatio: CARD_ASPECT_RATIO,
    borderRadius: 18,
    padding: spacing.lg,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  identity: { flexShrink: 1 },
  name: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  bank: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 11,
    marginTop: 1,
  },
  logo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lastFour: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 14,
    letterSpacing: 1.5,
  },
  balanceBlock: {},
  label: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 11,
  },
  balance: {
    color: colors.white,
    fontSize: 24,
    fontWeight: '700',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.18)',
  },
  footerText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  footerLabel: {
    color: 'rgba(255,255,255,0.6)',
    fontWeight: '400',
  },
});
