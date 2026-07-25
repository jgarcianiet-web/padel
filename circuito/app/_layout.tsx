import {
  Barlow_400Regular,
  Barlow_600SemiBold,
  Barlow_700Bold,
} from '@expo-google-fonts/barlow';
import {
  ChakraPetch_500Medium,
  ChakraPetch_600SemiBold,
  ChakraPetch_700Bold,
} from '@expo-google-fonts/chakra-petch';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';

import { EntrarScreen } from '@/src/screens/EntrarScreen';
import { useSesion } from '@/src/store/sesion';

export { ErrorBoundary } from 'expo-router';

export const unstable_settings = {
  initialRouteName: '(tabs)',
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    ChakraPetch_500Medium,
    ChakraPetch_600SemiBold,
    ChakraPetch_700Bold,
    Barlow_400Regular,
    Barlow_600SemiBold,
    Barlow_700Bold,
  });
  const listo = useSesion((s) => s.listo);
  const sesion = useSesion((s) => s.sesion);

  useEffect(() => useSesion.getState().arrancar(), []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && listo) SplashScreen.hideAsync();
  }, [fontsLoaded, listo]);

  if (!fontsLoaded || !listo) return null; // el splash sigue visible

  // Sin sesión no hay nada que navegar: la app entera es la pantalla de acceso.
  if (!sesion) {
    return (
      <>
        <StatusBar style="dark" />
        <EntrarScreen />
      </>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="competicion" />
        <Stack.Screen name="crear" />
        <Stack.Screen name="partido" />
      </Stack>
    </>
  );
}
