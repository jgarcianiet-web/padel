import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { T } from '@/src/theme/colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: T.pista,
        tabBarInactiveTintColor: T.tintaSuave,
        tabBarStyle: { backgroundColor: T.blanco, borderTopColor: T.borde },
        tabBarLabelStyle: {
          fontFamily: 'ChakraPetch_700Bold',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Panel',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'square.grid.2x2.fill', android: 'dashboard', web: 'dashboard' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="partido"
        options={{
          title: 'Partido',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'plus.circle.fill', android: 'add_circle', web: 'add_circle' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="historial"
        options={{
          title: 'Historial',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'list.bullet.rectangle.fill', android: 'list', web: 'list' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ajustes"
        options={{
          title: 'Ajustes',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'gearshape.fill', android: 'settings', web: 'settings' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
