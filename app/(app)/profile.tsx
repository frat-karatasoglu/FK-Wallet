import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/store/useAuthStore';
import { FormField } from '@/src/components/FormField';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, radius, spacing, typography } from '@/src/theme';

function displayName(name?: unknown) {
  if (typeof name !== 'string' || !name.trim()) return '';
  return name.trim();
}

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);

  const currentName = displayName(session?.user.user_metadata.display_name);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const initial = (name || session?.user.email || '?').charAt(0).toLocaleUpperCase('tr-TR');

  async function handleSave() {
    if (!name.trim()) {
      setError('Bir ad gir.');
      return;
    }
    setError(null);
    setInfo(null);
    setIsSaving(true);
    const message = await updateDisplayName(name.trim());
    setIsSaving(false);
    if (message) setError(message);
    else setInfo('Kaydedildi.');
  }

  async function handleSignOut() {
    setIsSigningOut(true);
    await signOut();
  }

  async function runDelete() {
    setDeleteError(null);
    setIsDeleting(true);
    const message = await deleteAccount();
    if (message) {
      setIsDeleting(false);
      setDeleteError(message);
    }
  }

  function handleDeleteAccount() {
    Alert.alert(
      'Hesabını sil',
      'Hesabın ve tüm kayıtların (kartlar, hesaplar, borçlar, gelir/gider, planlı ödemeler) kalıcı olarak silinecek. Bu işlem geri alınamaz.\n\nPremium aboneliğin varsa Google Play’den ayrıca iptal etmeyi unutma; hesabı silmek aboneliği iptal etmez.',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Devam',
          style: 'destructive',
          onPress: () =>
            Alert.alert('Emin misin?', 'Silinen veriler geri getirilemez.', [
              { text: 'Vazgeç', style: 'cancel' },
              { text: 'Hesabımı Sil', style: 'destructive', onPress: runDelete },
            ]),
        },
      ],
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{initial}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>E-posta</Text>
        <Text style={styles.email}>{session?.user.email}</Text>
      </View>

      <View style={styles.section}>
        <FormField label="Görünen ad" value={name} onChangeText={setName} placeholder="Adın" />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {info ? <Text style={styles.info}>{info}</Text> : null}
        <PrimaryButton
          title="Kaydet"
          onPress={handleSave}
          isLoading={isSaving}
          style={styles.saveButton}
        />
      </View>

      <PrimaryButton
        title="Çıkış Yap"
        variant="danger"
        onPress={handleSignOut}
        isLoading={isSigningOut}
        style={styles.signOutButton}
      />

      <View style={styles.dangerZone}>
        <Text style={styles.sectionLabel}>Hesabı sil</Text>
        <Text style={styles.dangerText}>
          Hesabın ve tüm verilerin kalıcı olarak silinir. Premium aboneliğin varsa Google Play’den ayrıca iptal etmelisin.
        </Text>
        {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
        <PrimaryButton
          title="Hesabımı Sil"
          variant="danger"
          onPress={handleDeleteAccount}
          isLoading={isDeleting}
          style={styles.deleteButton}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  container: { padding: spacing.lg, paddingBottom: spacing.xxl, alignItems: 'center' },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: colors.navy,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: spacing.lg,
  },
  avatarText: { color: colors.white, fontSize: 34, fontWeight: '700' },
  section: {
    width: '100%',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: colors.slate100,
  },
  sectionLabel: {
    ...typography.caption,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  email: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.slate800,
    marginTop: spacing.xs,
  },
  error: { color: colors.overdue, marginTop: spacing.sm, fontSize: 13 },
  info: { color: colors.income, marginTop: spacing.sm, fontSize: 13 },
  saveButton: { marginTop: spacing.lg },
  signOutButton: { width: '100%' },
  dangerZone: {
    width: '100%',
    marginTop: spacing.xxl,
    paddingTop: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.slate100,
  },
  dangerText: { fontSize: 13, color: colors.slate800, marginTop: spacing.xs, lineHeight: 18 },
  deleteButton: { marginTop: spacing.md },
});
