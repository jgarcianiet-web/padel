import { Tabs } from 'expo-router';
import { SymbolView } from 'expo-symbols';

import { useDisposicion } from '@/src/lib/responsive';
import { T } from '@/src/theme/colors';

export default function TabLayout() {
  const { esEscritorio } = useDisposicion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // En el móvil la navegación va abajo, al alcance del pulgar; en la
        // ventana de un ordenador pasa a ser una barra lateral, que es donde
        // la busca quien usa ratón.
        tabBarPosition: esEscritorio ? 'left' : 'bottom',
        tabBarActiveTintColor: T.pista,
        tabBarInactiveTintColor: T.tintaSuave,
        tabBarStyle: esEscritorio
          ? { backgroundColor: T.blanco, borderRightColor: T.borde, borderRightWidth: 1 }
          : { backgroundColor: T.blanco, borderTopColor: T.borde },
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
          title: 'Inicio',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'house.fill', android: 'home', web: 'home' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="explorar"
        options={{
          title: 'Competir',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'trophy.fill', android: 'trophy', web: 'trophy' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="clubes"
        options={{
          title: 'Clubes',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'mappin.and.ellipse', android: 'place', web: 'place' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="perfil"
        options={{
          title: 'Perfil',
          tabBarIcon: ({ color }) => (
            <SymbolView
              name={{ ios: 'person.crop.circle.fill', android: 'person', web: 'person' }}
              tintColor={color}
              size={26}
            />
          ),
        }}
      />
    </Tabs>
  );
}
