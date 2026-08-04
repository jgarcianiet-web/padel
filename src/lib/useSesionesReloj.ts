import { useCallback, useEffect, useState } from 'react';
import { AppState } from 'react-native';

import {
  alRecibirSesion,
  consumir,
  getPendientes,
  relojDisponible,
} from '@/modules/watch-sync';

import { SesionRelojPendiente, clasificarPendientes } from './sesionesReloj';

/** Cola viva de sesiones del reloj: se refresca al abrir, al volver del fondo
 * y cuando el módulo nativo avisa de una sesión recién llegada. En builds sin
 * el módulo (Android, web, Expo Go) queda siempre vacía. */
export function useSesionesReloj() {
  const [pendientes, setPendientes] = useState<SesionRelojPendiente[]>([]);

  const refrescar = useCallback(() => {
    if (!relojDisponible) return;
    setPendientes(clasificarPendientes(getPendientes()));
  }, []);

  useEffect(() => {
    if (!relojDisponible) return;
    refrescar();
    const suscripcion = alRecibirSesion(refrescar);
    // La entrega en segundo plano no dispara el evento JS: al volver a primer
    // plano se relee la cola nativa, que es la fuente de verdad.
    const appState = AppState.addEventListener('change', (estado) => {
      if (estado === 'active') refrescar();
    });
    return () => {
      suscripcion?.remove();
      appState.remove();
    };
  }, [refrescar]);

  const descartar = useCallback(
    (id: string) => {
      consumir(id);
      refrescar();
    },
    [refrescar]
  );

  return { pendientes, descartar };
}
