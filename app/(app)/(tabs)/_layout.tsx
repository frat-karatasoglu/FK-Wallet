import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors } from '@/src/theme';

const TAB_BAR_HEIGHT = 62;

export default function TabsLayout() {
  // Android'in 3 tuşlu gezinme çubuğu (ve iPhone ana ekran çizgisi) uygulamanın
  // üstüne çizilir; sabit yükseklik verince sekme çubuğu onun altında kalıyordu.
  const insets = useSafeAreaInsets();
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.white },
        headerTintColor: colors.navy,
        headerTitleStyle: { fontWeight: '600' },
        headerShadowVisible: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.slate400,
        tabBarStyle: [
          styles.tabBar,
          { height: TAB_BAR_HEIGHT + insets.bottom, paddingBottom: Math.max(insets.bottom, 6) },
        ],
        tabBarLabelStyle: styles.tabLabel,
        tabBarAllowFontScaling: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Ana Sayfa',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="cards"
        options={{
          title: 'Cüzdanım',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="card-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: 'Ekle',
          headerShown: false,
          tabBarIcon: () => (
            <View style={styles.addButton}>
              <Ionicons name="add" size={30} color={colors.white} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Takvim',
          tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Ionicons name="settings-outline" color={color} size={size} />,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    paddingTop: 7,
    backgroundColor: colors.white,
    borderTopColor: colors.slate200,
    overflow: 'visible',
  },
  tabLabel: { fontSize: 10, fontWeight: '600' },
  addButton: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    marginTop: -28,
    shadowColor: colors.primary,
    shadowOpacity: 0.28,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
});
