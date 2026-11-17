import { useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from '@/src/components/ScaledText';
import { Link, useLocalSearchParams } from 'expo-router';

import { useAuthStore } from '@/src/store/useAuthStore';
import { FormField } from '@/src/components/FormField';
import { PrimaryButton } from '@/src/components/PrimaryButton';
import { colors, spacing, typography } from '@/src/theme';

export default function ForgotPasswordScreen() {
  const params = useLocalSearchParams<{ email?: string }>();
  const sendPasswordReset = useAuthStore((s) => s.sendPasswordReset);
  const resetPasswordWithCode = useAuthStore((s) => s.resetPasswordWithCode);

  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState(typeof params.email === 'string' ? params.email : '');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [passwordAgain, setPasswordAgain] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSendCode() {
    const trimmed = email.trim();
    if (!trimmed) {
      setError('E-posta adresini gir.');
      return;
    }
    setError(null);
    setInfo(null);
    setIsSubmitting(true);
    const message = await sendPasswordReset(trimmed);
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    setStep('code');
    setInfo('Bu adrese kayıtlı bir hesap varsa şifre sıfırlama kodu gönderdik. Gelen kutunu ve gereksiz klasörünü kontrol et.');
  }

  async function handleReset() {
    const trimmedCode = code.replace(/\s/g, '');
    if (!/^\d{6,8}$/.test(trimmedCode)) {
      setError('E-postadaki kodu eksiksiz gir.');
      return;
    }
    if (password.length < 6) {
      setError('Yeni şifre en az 6 karakter olmalı.');
      return;
    }
    if (password !== passwordAgain) {
      setError('Şifreler aynı değil.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    const message = await resetPasswordWithCode(email.trim(), trimmedCode, password);
    setIsSubmitting(false);
    if (message) {
      setError(message);
      return;
    }
    // Kod doğrulanınca oturum açılır ve uygulama ana ekrana geçer.
    Alert.alert('Şifren güncellendi', 'Yeni şifrenle giriş yaptın.');
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Şifremi unuttum</Text>
        <Text style={styles.subtitle}>
          {step === 'email'
            ? 'Hesabına kayıtlı e-posta adresini gir, sana bir sıfırlama kodu gönderelim.'
            : 'E-postana gelen kodu ve yeni şifreni gir.'}
        </Text>

        <View>
          <FormField
            label="E-posta"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            placeholder="ornek@eposta.com"
            editable={step === 'email'}
          />

          {step === 'code' ? (
            <>
              <FormField
                label="Doğrulama kodu"
                value={code}
                onChangeText={setCode}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={8}
                placeholder="E-postadaki kod"
              />
              <FormField
                label="Yeni şifre"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                placeholder="En az 6 karakter"
              />
              <FormField
                label="Yeni şifre (tekrar)"
                value={passwordAgain}
                onChangeText={setPasswordAgain}
                secureTextEntry
                autoCapitalize="none"
                autoComplete="password-new"
                placeholder="Şifreyi tekrar yaz"
              />
            </>
          ) : null}

          {info ? <Text style={styles.info}>{info}</Text> : null}
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <PrimaryButton
            title={step === 'email' ? 'Kod Gönder' : 'Şifreyi Güncelle'}
            onPress={step === 'email' ? handleSendCode : handleReset}
            isLoading={isSubmitting}
            style={styles.submitButton}
          />

          {step === 'code' ? (
            <Pressable
              onPress={() => {
                setStep('email');
                setCode('');
                setError(null);
                setInfo(null);
              }}
              style={styles.secondaryAction}
            >
              <Text style={styles.switchTextStrong}>Kodu tekrar gönder / e-postayı değiştir</Text>
            </Pressable>
          ) : null}
        </View>

        <Link href="/sign-in" style={styles.switchLink}>
          <Text style={styles.switchText}>
            Şifreni hatırladın mı? <Text style={styles.switchTextStrong}>Giriş yap</Text>
          </Text>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.white },
  container: { flexGrow: 1, justifyContent: 'center', padding: spacing.xl },
  title: { ...typography.heading, fontSize: 26, color: colors.navy, textAlign: 'center' },
  subtitle: {
    ...typography.body,
    color: colors.slate500,
    textAlign: 'center',
    marginTop: spacing.xs,
    marginBottom: spacing.xl,
  },
  info: { color: colors.income, marginTop: spacing.md, fontSize: 13, lineHeight: 18 },
  error: { color: colors.overdue, marginTop: spacing.md, fontSize: 13 },
  submitButton: { marginTop: spacing.xl },
  secondaryAction: { marginTop: spacing.lg, alignSelf: 'center' },
  switchLink: { marginTop: spacing.xl, alignSelf: 'center' },
  switchText: { color: colors.slate500, fontSize: 14 },
  switchTextStrong: { color: colors.turquoise, fontWeight: '600', fontSize: 14 },
});
