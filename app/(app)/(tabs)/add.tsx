import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, spacing } from '@/src/theme';

export default function QuickAddScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.container}>
        <View style={styles.heroIcon}><Ionicons name="add" size={35} color={colors.white} /></View>
        <Text style={styles.title}>Ne eklemek istersin?</Text>
        <Text style={styles.subtitle}>Cüzdanını güncel tutmak için bir işlem seç.</Text>
        <View style={styles.actions}>
          <PrimaryButton title="Gelir Ekle" style={styles.incomeButton} onPress={() => router.push({ pathname: '/transaction/new', params: { type: 'income' } })} />
          <PrimaryButton title="Gider Ekle" style={styles.expenseButton} onPress={() => router.push({ pathname: '/transaction/new', params: { type: 'expense' } })} />
          <PrimaryButton title="Kart Ekle" variant="outline" onPress={() => router.push('/card/new')} />
          <PrimaryButton title="Hesap Ekle" variant="outline" onPress={() => router.push('/account/new')} />
          <PrimaryButton title="Borç Ekle" variant="outline" onPress={() => router.push('/debt/new')} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  container: { flex: 1, padding: spacing.xl, alignItems: 'center', justifyContent: 'center' },
  heroIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary, marginBottom: spacing.lg },
  title: { color: colors.slate800, fontSize: 25, fontWeight: '800' },
  subtitle: { color: colors.slate500, fontSize: 15, textAlign: 'center', marginTop: spacing.sm },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.xxl },
  incomeButton: { backgroundColor: colors.income },
  expenseButton: { backgroundColor: '#f43f5e' },
});
