import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import { AppState } from 'react-native';

// Las claves llegan por variables de entorno EXPO_PUBLIC_* (fichero .env.local)
// y quedan replicadas en `extra` de app.config.ts para las builds de EAS.
const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, unknown>;

// Cualquier cosa que no sea texto con contenido cuenta como "sin configurar":
// según de dónde venga el hueco (entorno inlineado por Metro, `extra` del
// manifiesto, render en node) llega como null, undefined u objeto.
const texto = (valor: unknown): string =>
  typeof valor === 'string' && valor.trim() ? valor.trim() : '';

export const SUPABASE_URL =
  texto(process.env.EXPO_PUBLIC_SUPABASE_URL) || texto(extra.supabaseUrl);
export const SUPABASE_ANON_KEY =
  texto(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) || texto(extra.supabaseAnonKey);

/** Sin claves la app arranca igual, pero enseña la pantalla de configuración. */
export const hayBackend = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

let instancia: SupabaseClient | null = null;

/**
 * Cliente perezoso: se construye la primera vez que se usa, no al importar el
 * módulo. Es lo que permite que la app arranque sin claves y enseñe la
 * pantalla de "falta conectar Supabase" en lugar de morir en el import
 * (createClient valida la URL en el constructor y revienta si está vacía).
 */
export function cliente(): SupabaseClient {
  if (instancia) return instancia;
  if (!hayBackend)
    throw new Error(
      'Falta configurar Supabase: rellena EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_ANON_KEY (ver docs/SUPABASE.md).'
    );

  instancia = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      // La detección por URL es cosa del navegador: en nativo no aplica.
      detectSessionInUrl: false,
    },
  });

  // Renovar el token solo mientras la app está en primer plano.
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') instancia?.auth.startAutoRefresh();
    else instancia?.auth.stopAutoRefresh();
  });

  return instancia;
}
