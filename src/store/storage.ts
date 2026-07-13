import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY } from '../constants/catalogos';
import { LigaState } from '../types/domain';

// Persistencia manual (sin middleware) para que el JSON en disco sea
// exactamente {matches, objetivos, perfil, analisis} — el mismo shape que
// exporta/importa la copia de seguridad de la web-app.
export async function readState(): Promise<LigaState | null> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as LigaState;
  } catch {
    return null;
  }
}

export async function writeState(state: LigaState): Promise<void> {
  const { matches, objetivos, perfil, analisis, analisisHistorial } = state;
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify({ matches, objetivos, perfil, analisis, analisisHistorial })
  );
}
