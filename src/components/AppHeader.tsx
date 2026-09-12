import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import { useAuthStore } from '../store/useAuthStore';
import { colors, spacing } from '../theme';

function initialOf(name: unknown, email?: string) {
  const source = typeof name === 'string' && name.trim() ? name.trim() : email ?? '?';
  return source.charAt(0).toLocaleUpperCase('tr-TR');
}

export function AppHeader() {
  const router = useRouter();
  const session = useAuthStore((state) => state.session);
  const initial = initialOf(session?.user.user_metadata.display_name, session?.user.email);

  return (
    <View style={styles.topBar}>
      <View style={styles.brandRow}>
        <Image
          source={require('@/assets/images/fk-logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.brand}>Cüzdanım</Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}
          onPress={() => router.push('/notifications')}
          hitSlop={8}
        >
          <Ionicons name="notifications-outline" size={18} color={colors.primary} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.avatar, pressed && styles.pressed]}
          onPress={() => router.push('/profile')}
          hitSlop={4}
        >
          <Text style={styles.avatarText}>{initial}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  logo: { width: 38, height: 38 },
  brand: { color: '#112c59', fontSize: 22, fontWeight: '800' },
  actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  pressed: { opacity: 0.72 },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: colors.primary, fontSize: 15, fontWeight: '800' },
});
