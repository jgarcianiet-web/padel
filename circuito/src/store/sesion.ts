import { Session } from '@supabase/supabase-js';
import { create } from 'zustand';

import { hayBackend, supabase } from '../api/cliente';
import { guardarPerfil, miPerfil } from '../api/consultas';
import { Perfil } from '../types/domain';

interface SesionStore {
  sesion: Session | null;
  perfil: Perfil | null;
  listo: boolean;
  arrancar: () => () => void;
  refrescarPerfil: () => Promise<void>;
  actualizarPerfil: (cambios: Partial<Perfil>) => Promise<void>;
  salir: () => Promise<void>;
}

export const useSesion = create<SesionStore>((set, get) => ({
  sesion: null,
  perfil: null,
  listo: false,

  /** Devuelve la función para cancelar la suscripción a los cambios de sesión. */
  arrancar: () => {
    if (!hayBackend) {
      set({ listo: true });
      return () => {};
    }

    supabase.auth.getSession().then(({ data }) => {
      set({ sesion: data.session, listo: true });
      if (data.session) get().refrescarPerfil();
    });

    const { data } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      set({ sesion, listo: true, perfil: sesion ? get().perfil : null });
      if (sesion) get().refrescarPerfil();
    });

    return () => data.subscription.unsubscribe();
  },

  refrescarPerfil: async () => {
    const uid = get().sesion?.user.id;
    if (!uid) return;
    try {
      set({ perfil: await miPerfil(uid) });
    } catch {
      // El perfil lo crea un trigger al registrarse; si aún no está, se
      // reintenta en la siguiente carga en lugar de romper la pantalla.
    }
  },

  actualizarPerfil: async (cambios) => {
    const uid = get().sesion?.user.id;
    if (!uid) return;
    await guardarPerfil(uid, cambios);
    await get().refrescarPerfil();
  },

  salir: async () => {
    await supabase.auth.signOut();
    set({ sesion: null, perfil: null });
  },
}));

export const useUid = (): string | null => useSesion((s) => s.sesion?.user.id ?? null);
