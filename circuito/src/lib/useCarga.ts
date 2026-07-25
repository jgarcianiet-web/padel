import { useCallback, useEffect, useState } from 'react';

interface Estado<T> {
  datos: T | null;
  cargando: boolean;
  error: string | null;
  recargar: () => void;
}

/**
 * Carga asíncrona con recarga manual. Suficiente para pantallas que leen de
 * Supabase: no hay caché compartida, cada pantalla pide lo suyo y se refresca
 * al tirar hacia abajo o después de una acción.
 */
export function useCarga<T>(cargar: () => Promise<T>, deps: unknown[] = []): Estado<T> {
  const [datos, setDatos] = useState<T | null>(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fn = useCallback(cargar, deps);

  useEffect(() => {
    let vivo = true;
    setCargando(true);
    fn()
      .then((r) => {
        if (!vivo) return;
        setDatos(r);
        setError(null);
      })
      .catch((e: unknown) => {
        if (!vivo) return;
        setError(e instanceof Error ? e.message : 'No se ha podido cargar');
      })
      .finally(() => {
        if (vivo) setCargando(false);
      });
    return () => {
      vivo = false;
    };
  }, [fn, tick]);

  return { datos, cargando, error, recargar: () => setTick((t) => t + 1) };
}
