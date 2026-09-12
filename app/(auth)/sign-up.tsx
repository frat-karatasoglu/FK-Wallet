import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Link } from 'expo-router';

import { useAuthStore } from '@/src/store/useAuthStore';
import { FormField } from '@/src/components/FormField';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, spacing, typography } from '@/src/theme';

export default function SignUpScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!displayName.trim() || !email || !password) {
      setError('Kullanıcı adı, e-posta ve şifre gerekli.');
      return;
    }
    if (displayName.trim().length < 2) {
      setError('Kullanıcı adı en az 2 karakter olmalı.');
      return;
    }
    if (password.length < 6) {
      setError('Şifre en az 6 karakter olmalı.');
      return;
    }
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    const message = await signUp(email.trim(), password, displayName.trim());
    setIsSubmitting(false);
    if (message) {
      setError(message);
    } else {
      setInfo('Hesabın oluşturuldu. Giriş yapabilirsin.');
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Image source={require('@/assets/images/fk-logo.png')} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brand}>Cüzdanım</Text>
        </View>
        <Text style={styles.subtitle}>Yeni hesap oluştur</Text>

        <View style={styles.form}>
          <FormField
            label="Kullanıcı adı"
            value={displayName}
            onChangeText={setDisplayName}
            autoCapitalize="words"
            autoComplete="name"
            placeholder="Örn. Fırat"
            maxLength={40}
          />
          <FormField
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ornek@eposta.com"
          />
          <FormField
            label="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoCapitalize="none"
            autoComplete="password-new"
            placeholder="En az 6 karakter"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}
          {info ? <Text style={styles.info}>{info}</Text> : null}

          <PrimaryButton
            title="Kayıt Ol"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />
        </View>

        <Link href="/sign-in" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Zaten hesabın var mı? <Text style={styles.switchTextStrong}>Giriş yap</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  brand: {
    ...typography.heading,
    fontSize: 29,
    color: colors.navy,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm },
  logo: { width: 48, height: 48 },
  subtitle: {
    ...typography.body,
    color: colors.slate500,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xxl,
  },
  form: {},
  error: {
    color: colors.overdue,
    marginTop: spacing.md,
    fontSize: 13,
  },
  info: {
    color: colors.income,
    marginTop: spacing.md,
    fontSize: 13,
  },
  submitButton: {
    marginTop: spacing.xl,
  },
  switchLink: {
    marginTop: spacing.xl,
    alignSelf: 'center',
  },
  switchText: {
    color: colors.slate500,
    fontSize: 14,
  },
  switchTextStrong: {
    color: colors.turquoise,
    fontWeight: '600',
  },
});
