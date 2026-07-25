import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

// Las claves llegan por variables de entorno EXPO_PUBLIC_* (fichero .env.local)
// y quedan replicadas en `extra` de app.config.ts para las builds de EAS.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | null>;

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ?? extra.supabaseUrl ?? '';
export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? extra.supabaseAnonKey ?? '';

/** Sin claves la app arranca igual, pero enseña la pantalla de configuración. */
export const hayBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

export const supabase = createClient(
  SUPABASE_URL || 'https://sin-configurar.supabase.co',
  SUPABASE_ANON_KEY || 'sin-configurar',
  {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // La detección por URL es cosa del navegador: en nativo no aplica.
      detectSessionInUrl: false,
    },
  }
);

// Renovar el token solo mientras la app está en primer plano.
if (hayBackend) {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
