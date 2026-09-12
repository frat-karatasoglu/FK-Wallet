import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { colors, spacing, typography } from '@/src/theme';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Sayfa bulunamadı' }} />
      <View style={styles.container}>
        <Text style={typography.title}>Bu sayfa mevcut değil.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ana sayfaya dön</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    backgroundColor: colors.background,
  },
  link: {
    marginTop: spacing.lg,
    paddingVertical: spacing.md,
  },
  linkText: {
    fontSize: 15,
    color: colors.turquoise,
    fontWeight: '600',
  },
});
