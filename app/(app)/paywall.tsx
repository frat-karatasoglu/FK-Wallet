import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import type { PurchasesPackage } from 'react-native-purchases';

import { PrimaryButton } from '@/src/components/PrimaryButton';
import { formatDate } from '@/src/lib/format';
import { TRIAL_DAYS, useAccessInfo, useSubscriptionStore } from '@/src/store/useSubscriptionStore';
import { colors, radius, spacing, typography } from '@/src/theme';

const PRIVACY_POLICY_URL = 'https://github.com/frat-karatasoglu/FK-Wallet/blob/main/PRIVACY_POLICY.md';

const BENEFITS: { icon: keyof typeof Ionicons.glyphMap; text: string }[] = [
  { icon: 'card-outline', text: 'Sınırsız kart, hesap ve borç kaydı' },
  { icon: 'repeat-outline', text: 'Kredi ve taksit planları, ödeme geçmişi' },
  { icon: 'notifications-outline', text: 'Son ödeme ve taksit hatırlatmaları' },
  { icon: 'wallet-outline', text: 'Gelir, gider ve nakit takibi' },
  { icon: 'calendar-outline', text: 'Tüm ödemeler tek takvimde' },
];

function packageLabel(pkg: PurchasesPackage): { title: string; caption?: string } {
  switch (pkg.packageType) {
    case 'ANNUAL': {
      const monthly = pkg.product.price / 12;
      return {
        title: 'Yıllık',
        caption: `Aylık ~${monthly.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ${pkg.product.currencyCode === 'TRY' ? '₺' : pkg.product.currencyCode}`,
      };
    }
    case 'MONTHLY':
      return { title: 'Aylık' };
    case 'SIX_MONTH':
      return { title: '6 aylık' };
    case 'THREE_MONTH':
      return { title: '3 aylık' };
    case 'WEEKLY':
      return { title: 'Haftalık' };
    default:
      return { title: pkg.product.title };
  }
}

export default function PaywallScreen() {
  const router = useRouter();
  const access = useAccessInfo();
  const packages = useSubscriptionStore((state) => state.packages);
  const purchasesAvailable = useSubscriptionStore((state) => state.purchasesAvailable);
  const loadPackages = useSubscriptionStore((state) => state.loadPackages);
  const purchase = useSubscriptionStore((state) => state.purchase);
  const restore = useSubscriptionStore((state) => state.restore);
  const [isLoadingPackages, setIsLoadingPackages] = useState(true);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isBuying, setIsBuying] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    loadPackages().finally(() => setIsLoadingPackages(false));
  }, [loadPackages]);

  // Yıllık paket varsa varsayılan olarak o seçili gelsin.
  const sortedPackages = useMemo(
    () => [...packages].sort((a, b) => (a.packageType === 'ANNUAL' ? -1 : b.packageType === 'ANNUAL' ? 1 : 0)),
    [packages]
  );
  const selected = sortedPackages.find((pkg) => pkg.identifier === selectedId) ?? sortedPackages[0];

  async function handleBuy() {
    if (!selected) return;
    setMessage(null);
    setIsBuying(true);
    const error = await purchase(selected);
    setIsBuying(false);
    if (error) setMessage(error);
  }

  async function handleRestore() {
    setMessage(null);
    setIsRestoring(true);
    const error = await restore();
    setIsRestoring(false);
    setMessage(error ?? 'Premium aboneliğin geri yüklendi.');
  }

  // Abonelik modeli kapalıyken bu ekranın gösterilecek bir şeyi yok.
  if (access.status === 'free') return <Redirect href="/" />;

  if (access.status === 'premium') {
    return (
      <View style={styles.doneWrap}>
        <View style={styles.doneIcon}><Ionicons name="checkmark" size={36} color={colors.white} /></View>
        <Text style={styles.doneTitle}>Premium aktif</Text>
        <Text style={styles.doneText}>Tüm özellikler açık. Desteğin için teşekkürler!</Text>
        <PrimaryButton title="Devam Et" onPress={() => router.back()} style={styles.doneButton} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.hero}>
        <View style={styles.heroIcon}><Ionicons name="diamond-outline" size={30} color={colors.white} /></View>
        <Text style={styles.heroTitle}>FK Wallet Premium</Text>
        <Text style={styles.heroText}>
          {access.status === 'expired'
            ? `${TRIAL_DAYS} günlük ücretsiz deneme süren doldu. Verilerin güvende; görüntülemeye devam edebilirsin. Yeni kayıt eklemek ve düzenlemek için Premium’a geç.`
            : `Ücretsiz denemende ${access.trialDaysLeft} gün kaldı${access.trialEndsAt ? ` (${formatDate(access.trialEndsAt)})` : ''}. Deneme bitince devam etmek için Premium’a geçebilirsin.`}
        </Text>
      </View>

      <View style={styles.benefits}>
        {BENEFITS.map((benefit) => (
          <View key={benefit.text} style={styles.benefitRow}>
            <View style={styles.benefitIcon}><Ionicons name={benefit.icon} size={18} color={colors.primary} /></View>
            <Text style={styles.benefitText}>{benefit.text}</Text>
          </View>
        ))}
      </View>

      {isLoadingPackages ? (
        <ActivityIndicator color={colors.navy} style={styles.loader} />
      ) : !purchasesAvailable || sortedPackages.length === 0 ? (
        <View style={styles.unavailable}>
          <Ionicons name="time-outline" size={20} color={colors.slate500} />
          <Text style={styles.unavailableText}>Abonelik satın alma şu an kullanılamıyor. Uygulamayı Google Play’den indirdiysen biraz sonra tekrar dene.</Text>
        </View>
      ) : (
        <View style={styles.packages}>
          {sortedPackages.map((pkg) => {
            const isSelected = pkg.identifier === selected?.identifier;
            const label = packageLabel(pkg);
            return (
              <Pressable
                key={pkg.identifier}
                onPress={() => setSelectedId(pkg.identifier)}
                style={[styles.packageCard, isSelected && styles.packageCardSelected]}
              >
                <View style={[styles.radio, isSelected && styles.radioSelected]}>
                  {isSelected ? <View style={styles.radioDot} /> : null}
                </View>
                <View style={styles.packageCopy}>
                  <Text style={styles.packageTitle}>{label.title}</Text>
                  {label.caption ? <Text style={styles.packageCaption}>{label.caption}</Text> : null}
                </View>
                <Text style={styles.packagePrice}>{pkg.product.priceString}</Text>
                {pkg.packageType === 'ANNUAL' ? <Text style={styles.badge}>Avantajlı</Text> : null}
              </Pressable>
            );
          })}
        </View>
      )}

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <PrimaryButton
        title="Premium’a Geç"
        onPress={handleBuy}
        isLoading={isBuying}
        disabled={!selected || !purchasesAvailable}
        style={styles.buyButton}
      />
      <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restore} hitSlop={8}>
        <Text style={styles.restoreText}>{isRestoring ? 'Kontrol ediliyor...' : 'Satın alımları geri yükle'}</Text>
      </Pressable>

      <Text style={styles.legal}>
        Abonelik, Google Play hesabından ücretlendirilir ve iptal edilmediği sürece her dönem sonunda otomatik olarak yenilenir. İstediğin zaman Google Play › Ödemeler ve abonelikler bölümünden iptal edebilirsin; iptal ettiğinde mevcut dönemin sonuna kadar Premium açık kalır.
      </Text>
      <Pressable onPress={() => Linking.openURL(PRIVACY_POLICY_URL)} hitSlop={8}>
        <Text style={styles.link}>Gizlilik Politikası</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl },
  hero: { alignItems: 'center', backgroundColor: colors.navy, borderRadius: radius.lg, padding: spacing.xl },
  heroIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(255,255,255,0.16)' },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '800', marginTop: spacing.md },
  heroText: { color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: spacing.sm },
  benefits: { backgroundColor: colors.white, borderRadius: radius.md, padding: spacing.lg, marginTop: spacing.lg, gap: spacing.md, borderWidth: 1, borderColor: colors.slate100 },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  benefitIcon: { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primaryLight },
  benefitText: { flex: 1, fontSize: 14, color: colors.slate700, fontWeight: '500' },
  loader: { marginTop: spacing.xl },
  unavailable: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start', marginTop: spacing.lg, padding: spacing.md, borderRadius: radius.md, backgroundColor: colors.slate100 },
  unavailableText: { flex: 1, fontSize: 13, color: colors.slate600, lineHeight: 18 },
  packages: { marginTop: spacing.lg, gap: spacing.sm },
  packageCard: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.slate200 },
  packageCardSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.slate300, alignItems: 'center', justifyContent: 'center' },
  radioSelected: { borderColor: colors.primary },
  radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.primary },
  packageCopy: { flex: 1 },
  packageTitle: { fontSize: 16, fontWeight: '700', color: colors.slate800 },
  packageCaption: { fontSize: 12, color: colors.slate500, marginTop: 2 },
  packagePrice: { fontSize: 16, fontWeight: '800', color: colors.slate800 },
  badge: { position: 'absolute', top: -9, right: spacing.md, fontSize: 11, fontWeight: '700', color: colors.white, backgroundColor: colors.income, paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.full, overflow: 'hidden' },
  message: { ...typography.caption, color: colors.slate700, textAlign: 'center', marginTop: spacing.lg },
  buyButton: { marginTop: spacing.lg },
  restore: { alignSelf: 'center', marginTop: spacing.md },
  restoreText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
  legal: { fontSize: 11, color: colors.slate500, lineHeight: 16, textAlign: 'center', marginTop: spacing.xl },
  link: { fontSize: 12, color: colors.primary, textAlign: 'center', marginTop: spacing.sm, fontWeight: '600' },
  doneWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, backgroundColor: colors.background },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.income },
  doneTitle: { fontSize: 22, fontWeight: '800', color: colors.slate800, marginTop: spacing.lg },
  doneText: { fontSize: 14, color: colors.slate500, textAlign: 'center', marginTop: spacing.sm },
  doneButton: { marginTop: spacing.xl, alignSelf: 'stretch' },
});
