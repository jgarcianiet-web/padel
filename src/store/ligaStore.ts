import { create } from 'zustand';

import { estadoInicial } from '../lib/backup';
import { upsertMatch } from '../lib/metrics';
import { Analisis, LigaState, Match, Perfil } from '../types/domain';
import { readState, writeState } from './storage';

interface LigaStore extends LigaState {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  guardarPartido: (m: Match) => Promise<void>;
  borrarPartido: (id: number) => Promise<void>;
  guardarObjetivos: (objetivos: string[]) => Promise<void>;
  guardarPerfil: (perfil: Perfil) => Promise<void>;
  guardarAnalisis: (analisis: Analisis) => Promise<void>;
  importarEstado: (estado: LigaState) => Promise<void>;
}

const persistir = (s: LigaStore) => writeState(s);

export const useLigaStore = create<LigaStore>((set, get) => ({
  ...estadoInicial(),
  hydrated: false,

  hydrate: async () => {
    const guardado = await readState();
    if (guardado) {
      set({
        matches: guardado.matches ?? [],
        objetivos:
          guardado.objetivos && guardado.objetivos.length === 3
            ? guardado.objetivos
            : get().objetivos,
        perfil: guardado.perfil ?? get().perfil,
        analisis: guardado.analisis ?? null,
      });
    }
    set({ hydrated: true });
  },

  guardarPartido: async (m) => {
    set({ matches: upsertMatch(get().matches, m) });
    await persistir(get());
  },

  borrarPartido: async (id) => {
    set({ matches: get().matches.filter((m) => m.id !== id) });
    await persistir(get());
  },

  guardarObjetivos: async (objetivos) => {
    set({ objetivos });
    await persistir(get());
  },

  guardarPerfil: async (perfil) => {
    set({ perfil });
    await persistir(get());
  },

  guardarAnalisis: async (analisis) => {
    set({ analisis });
    await persistir(get());
  },

  importarEstado: async (estado) => {
    set({
      matches: estado.matches,
      objetivos: estado.objetivos,
      perfil: estado.perfil,
      analisis: estado.analisis,
    });
    await persistir(get());
  },
}));
