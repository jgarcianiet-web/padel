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
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';

import { useLigaStore } from '@/src/store/ligaStore';

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
  const hydrated = useLigaStore((s) => s.hydrated);

  useEffect(() => {
    useLigaStore.getState().hydrate();
  }, []);

  useEffect(() => {
    if (fontError) throw fontError;
  }, [fontError]);

  useEffect(() => {
    if (fontsLoaded && hydrated) SplashScreen.hideAsync();
  }, [fontsLoaded, hydrated]);

  if (!fontsLoaded || !hydrated) return null; // el splash sigue visible

  return (
    <>
      <StatusBar style="dark" />
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="analisis" options={{ headerShown: false }} />
        <Stack.Screen name="golpe" options={{ headerShown: false }} />
        <Stack.Screen name="detalle" options={{ headerShown: false }} />
        <Stack.Screen name="importar" options={{ headerShown: false }} />
      </Stack>
    </>
  );
}
