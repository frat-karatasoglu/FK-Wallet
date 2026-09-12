import { Stack } from 'expo-router';
import { colors } from '@/src/theme';

export default function AppLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />

      <Stack.Screen name="profile" options={{ title: 'Profil' }} />
      <Stack.Screen name="notifications" options={{ title: 'Bildirimler' }} />

      <Stack.Screen name="income" options={{ title: 'Gelirim' }} />
      <Stack.Screen name="expenses" options={{ title: 'Giderim' }} />
      <Stack.Screen name="accounts" options={{ title: 'Hesaplarım' }} />
      <Stack.Screen name="debts" options={{ title: 'Borçlarım' }} />
      <Stack.Screen name="account/new" options={{ presentation: 'modal', title: 'Hesap Ekle' }} />
      <Stack.Screen name="account/[id]/edit" options={{ presentation: 'modal', title: 'Hesabı Düzenle' }} />
      <Stack.Screen name="debt/new" options={{ presentation: 'modal', title: 'Borç Ekle' }} />
      <Stack.Screen name="debt/[id]/edit" options={{ presentation: 'modal', title: 'Borcu Düzenle' }} />
      <Stack.Screen name="planned/index" options={{ title: 'Planlanan Ödemelerim' }} />
      <Stack.Screen
        name="planned/new"
        options={{ presentation: 'modal', title: 'Planlanan Ödeme Ekle' }}
      />
      <Stack.Screen
        name="planned/[id]/edit"
        options={{ presentation: 'modal', title: 'Ödemeyi Düzenle' }}
      />

      <Stack.Screen name="card/new" options={{ presentation: 'modal', title: 'Kart Ekle' }} />
      <Stack.Screen name="card/[id]/index" options={{ title: 'Kart Detayı' }} />
      <Stack.Screen
        name="card/[id]/edit"
        options={{ presentation: 'modal', title: 'Kartı Düzenle' }}
      />

      <Stack.Screen
        name="transaction/new"
        options={{ presentation: 'modal', title: 'Hareket Ekle' }}
      />
      <Stack.Screen
        name="transaction/[id]/edit"
        options={{ presentation: 'modal', title: 'Hareketi Düzenle' }}
      />
    </Stack>
  );
}
