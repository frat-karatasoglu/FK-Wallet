import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useAuthStore } from '@/src/store/useAuthStore';
import { SUBSCRIPTIONS_ENABLED } from '@/src/store/useSubscriptionStore';
import { FormField } from '@/src/components/FormField';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, radius, spacing, typography } from '@/src/theme';

const SUBSCRIPTION_NOTE = 'Premium aboneliğin varsa Google Play’den ayrıca iptal etmeyi unutma; hesabı silmek aboneliği iptal etmez.';

function displayName(name?: unknown) {
  if (typeof name !== 'string' || !name.trim()) return '';
  return name.trim();
}

export default function ProfileScreen() {
  const session = useAuthStore((s) => s.session);
  const updateDisplayName = useAuthStore((s) => s.updateDisplayName);
  const signOut = useAuthStore((s) => s.signOut);
  const deleteAccount = useAuthStore((s) => s.deleteAccount);
  const changePassword = useAuthStore((s) => s.changePassword);

  const currentName = displayName(session?.user.user_metadata.display_name);
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordAgain, setNewPasswordAgain] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordInfo, setPasswordInfo] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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

  async function handleChangePassword() {
    setPasswordInfo(null);
    if (!currentPassword || !newPassword) {
      setPasswordError('Mevcut ve yeni şifreni gir.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }
    if (newPassword !== newPasswordAgain) {
      setPasswordError('Yeni şifreler aynı değil.');
      return;
    }
    setPasswordError(null);
    setIsChangingPassword(true);
    const message = await changePassword(currentPassword, newPassword);
    setIsChangingPassword(false);
    if (message) {
      setPasswordError(message);
      return;
    }
    setCurrentPassword('');
    setNewPassword('');
    setNewPasswordAgain('');
    setPasswordInfo('Şifren değiştirildi.');
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
      'Hesabın ve tüm kayıtların (kartlar, hesaplar, borçlar, gelir/gider, planlı ödemeler) kalıcı olarak silinecek. Bu işlem geri alınamaz.' +
        (SUBSCRIPTIONS_ENABLED ? `\n\n${SUBSCRIPTION_NOTE}` : ''),
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

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Şifreyi değiştir</Text>
        <FormField
          label="Mevcut şifre"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
          placeholder="••••••••"
        />
        <FormField
          label="Yeni şifre"
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="En az 6 karakter"
        />
        <FormField
          label="Yeni şifre (tekrar)"
          value={newPasswordAgain}
          onChangeText={setNewPasswordAgain}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="password-new"
          placeholder="Şifreyi tekrar yaz"
        />
        {passwordError ? <Text style={styles.error}>{passwordError}</Text> : null}
        {passwordInfo ? <Text style={styles.info}>{passwordInfo}</Text> : null}
        <PrimaryButton
          title="Şifreyi Değiştir"
          onPress={handleChangePassword}
          isLoading={isChangingPassword}
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
          Hesabın ve tüm verilerin kalıcı olarak silinir.{SUBSCRIPTIONS_ENABLED ? ` ${SUBSCRIPTION_NOTE}` : ''}
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
