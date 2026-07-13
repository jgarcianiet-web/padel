import AsyncStorage from '@react-native-async-storage/async-storage';

import { STORAGE_KEY } from '../constants/catalogos';
import { estadoInicial } from '../lib/backup';
import { BACKUP_BRIEF, mkMatch } from '../lib/fixtures';
import { useLigaStore } from './ligaStore';

// jest-expo trae el mock oficial de AsyncStorage (memoria).
const reset = async () => {
  await AsyncStorage.clear();
  useLigaStore.setState({ ...estadoInicial(), hydrated: false });
};

const leerDisco = async () => {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
};

describe('ligaStore', () => {
  beforeEach(reset);

  test('hydrate sin datos deja el estado inicial', async () => {
    await useLigaStore.getState().hydrate();
    const s = useLigaStore.getState();
    expect(s.hydrated).toBe(true);
    expect(s.matches).toEqual([]);
    expect(s.objetivos).toHaveLength(3);
  });

  test('hydrate carga un backup de la web-app guardado bajo la key exacta', async () => {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(BACKUP_BRIEF));
    await useLigaStore.getState().hydrate();
    const s = useLigaStore.getState();
    expect(s.matches).toHaveLength(1);
    expect(s.perfil.nivelPlaytomic).toBe('3.20');
    expect(s.analisis?.nPartidos).toBe(3);
    // datos sin historial (web-app o versión anterior): se siembra con el último
    expect(s.analisisHistorial).toEqual([BACKUP_BRIEF.analisis]);
  });

  test('guardarAnalisis archiva cada análisis en el historial', async () => {
    await useLigaStore.getState().hydrate();
    const a1 = { ...BACKUP_BRIEF.analisis!, fecha: '2026-07-01', nPartidos: 3 };
    const a2 = { ...BACKUP_BRIEF.analisis!, fecha: '2026-07-10', nPartidos: 5 };
    await useLigaStore.getState().guardarAnalisis(a1);
    await useLigaStore.getState().guardarAnalisis(a2);
    const s = useLigaStore.getState();
    expect(s.analisis).toEqual(a2);
    expect(s.analisisHistorial).toEqual([a1, a2]);
    expect((await leerDisco()).analisisHistorial).toHaveLength(2);
  });

  test('guardarPartido persiste el shape exacto en disco', async () => {
    await useLigaStore.getState().hydrate();
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 1 }));
    const disco = await leerDisco();
    expect(Object.keys(disco)).toEqual([
      'matches',
      'objetivos',
      'perfil',
      'analisis',
      'analisisHistorial',
    ]);
    expect(disco.matches).toHaveLength(1);
    // sin claves extra del store (hydrated, funciones…)
    expect(disco.hydrated).toBeUndefined();
  });

  test('guardarPartido edita por id y mantiene orden por fecha', async () => {
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 1, fecha: '2026-07-02' }));
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 2, fecha: '2026-07-01' }));
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 1, fecha: '2026-07-02', club: 'X' }));
    const s = useLigaStore.getState();
    expect(s.matches.map((m) => m.id)).toEqual([2, 1]);
    expect(s.matches[1].club).toBe('X');
  });

  test('borrarPartido elimina y persiste', async () => {
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 7 }));
    await useLigaStore.getState().borrarPartido(7);
    expect(useLigaStore.getState().matches).toEqual([]);
    expect((await leerDisco()).matches).toEqual([]);
  });

  test('importarEstado reemplaza todo y persiste', async () => {
    await useLigaStore.getState().guardarPartido(mkMatch({ id: 99 }));
    await useLigaStore
      .getState()
      .importarEstado({ ...BACKUP_BRIEF, analisisHistorial: [BACKUP_BRIEF.analisis!] });
    const s = useLigaStore.getState();
    expect(s.matches.map((m) => m.id)).toEqual([1234567890]);
    expect((await leerDisco()).objetivos).toEqual(['obj1', 'obj2', 'obj3']);
    expect(s.analisisHistorial).toHaveLength(1);
  });
});
