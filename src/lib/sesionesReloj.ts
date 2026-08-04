import { SesionImportada, parseSesion } from './importSesion';

// Volcado automático desde el Apple Watch embebido: el módulo nativo watch-sync
// guarda cada sesión recibida por WatchConnectivity (mismo JSON del contrato
// que el deep link ligapadel://importar) y aquí se convierte en algo que las
// pantallas puedan enseñar. El deep link sigue funcionando como respaldo.

export interface SesionRelojPendiente {
  id: string;
  /** Sesión parseada, o null si el payload no es utilizable. */
  sesion: SesionImportada | null;
  /** Motivo legible cuando `sesion` es null. */
  error: string | null;
}

/** Convierte la cola cruda del módulo nativo en sesiones listas para pintar.
 * Una sesión ilegible no tumba a las demás: se conserva con su error para que
 * el usuario pueda descartarla a mano. */
export function clasificarPendientes(
  crudas: { id: string; datos: string }[]
): SesionRelojPendiente[] {
  return crudas.map(({ id, datos }) => {
    try {
      return { id, sesion: parseSesion(datos), error: null };
    } catch (e) {
      return {
        id,
        sesion: null,
        error: e instanceof Error ? e.message : 'Sesión ilegible.',
      };
    }
  });
}
