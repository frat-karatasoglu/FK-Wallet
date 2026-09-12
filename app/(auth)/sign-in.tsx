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

export default function SignInScreen() {
  const signIn = useAuthStore((s) => s.signIn);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit() {
    if (!email || !password) {
      setError('E-posta ve şifre gerekli.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const message = await signIn(email.trim(), password);
    setIsSubmitting(false);
    if (message) setError(message);
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
        <Text style={styles.subtitle}>Kartlarını ve harcamalarını tek yerden takip et</Text>

        <View style={styles.form}>
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
            autoComplete="password"
            placeholder="••••••••"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title="Giriş Yap"
            onPress={handleSubmit}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />
        </View>

        <Link href="/sign-up" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Hesabın yok mu? <Text style={styles.switchTextStrong}>Kayıt ol</Text>
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
