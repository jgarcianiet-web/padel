import { EstadoReto, PuestoEscalera, ReglasEscalera, Reto } from '../types/domain';

// Escalera individual: un ranking en el que cada jugador ocupa un escalón y
// solo puede retar a los que tiene justo por encima. Si el retador gana, le
// quita el puesto y todos los que estaban entre medias bajan un escalón.

export interface Escalon {
  jugadorId: string;
  posicion: number;
}

/** Normaliza posiciones a 1..N sin huecos, respetando el orden actual. */
export function normalizar(puestos: Escalon[]): Escalon[] {
  return [...puestos]
    .sort((x, y) => x.posicion - y.posicion)
    .map((p, i) => ({ jugadorId: p.jugadorId, posicion: i + 1 }));
}

export const posicionDe = (puestos: Escalon[], jugadorId: string): number | null =>
  puestos.find((p) => p.jugadorId === jugadorId)?.posicion ?? null;

export interface Veredicto {
  ok: boolean;
  motivo?: string;
}

const RETOS_ABIERTOS: EstadoReto[] = ['propuesto', 'aceptado'];

export const retoAbierto = (r: Pick<Reto, 'estado'>): boolean =>
  RETOS_ABIERTOS.includes(r.estado);

/**
 * ¿Puede `retadorId` retar a `retadoId`? Solo hacia arriba, dentro del rango
 * configurado y sin exceder los retos abiertos permitidos. El retado tampoco
 * puede estar ya defendiendo otro reto.
 */
export function puedeRetar(
  puestos: Escalon[],
  retadorId: string,
  retadoId: string,
  reglas: Pick<ReglasEscalera, 'rangoReto' | 'retosSimultaneos'>,
  retos: Pick<Reto, 'retadorId' | 'retadoId' | 'estado'>[]
): Veredicto {
  if (retadorId === retadoId) return { ok: false, motivo: 'No puedes retarte a ti mismo.' };

  const posRetador = posicionDe(puestos, retadorId);
  const posRetado = posicionDe(puestos, retadoId);
  if (posRetador === null || posRetado === null)
    return { ok: false, motivo: 'Alguno de los dos no está en la escalera.' };

  if (posRetado > posRetador)
    return { ok: false, motivo: 'Solo se reta hacia arriba.' };

  const distancia = posRetador - posRetado;
  if (distancia > reglas.rangoReto)
    return {
      ok: false,
      motivo: `Solo puedes retar hasta ${reglas.rangoReto} puesto${
        reglas.rangoReto === 1 ? '' : 's'
      } por encima.`,
    };

  const abiertos = retos.filter(retoAbierto);
  const mios = abiertos.filter(
    (r) => r.retadorId === retadorId || r.retadoId === retadorId
  );
  if (mios.length >= reglas.retosSimultaneos)
    return { ok: false, motivo: 'Ya tienes un reto en marcha.' };

  const suyos = abiertos.filter(
    (r) => r.retadorId === retadoId || r.retadoId === retadoId
  );
  if (suyos.length >= reglas.retosSimultaneos)
    return { ok: false, motivo: 'Ese jugador ya tiene un reto en marcha.' };

  const repetido = abiertos.some(
    (r) => r.retadorId === retadorId && r.retadoId === retadoId
  );
  if (repetido) return { ok: false, motivo: 'Ya le has retado.' };

  return { ok: true };
}

/** A quién puedes retar ahora mismo, de mejor a peor puesto. */
export function retablesPara(
  puestos: Escalon[],
  jugadorId: string,
  reglas: Pick<ReglasEscalera, 'rangoReto' | 'retosSimultaneos'>,
  retos: Pick<Reto, 'retadorId' | 'retadoId' | 'estado'>[]
): Escalon[] {
  return normalizar(puestos)
    .filter((p) => puedeRetar(puestos, jugadorId, p.jugadorId, reglas, retos).ok)
    .sort((x, y) => x.posicion - y.posicion);
}

/**
 * Aplica el resultado de un reto. Si gana el retador ocupa el puesto del
 * retado y los intermedios (incluido el retado) bajan un escalón. Si gana el
 * retado, la escalera no se mueve.
 */
export function aplicarReto(
  puestos: Escalon[],
  retadorId: string,
  retadoId: string,
  ganaRetador: boolean
): Escalon[] {
  const base = normalizar(puestos);
  if (!ganaRetador) return base;

  const posRetador = posicionDe(base, retadorId);
  const posRetado = posicionDe(base, retadoId);
  if (posRetador === null || posRetado === null || posRetado >= posRetador) return base;

  return normalizar(
    base.map((p) => {
      if (p.jugadorId === retadorId) return { ...p, posicion: posRetado };
      if (p.posicion >= posRetado && p.posicion < posRetador)
        return { ...p, posicion: p.posicion + 1 };
      return p;
    })
  );
}

/**
 * Un reto aceptado que se pasa de fecha se resuelve a favor del retador: es
 * lo que evita que quien va arriba se esconda. Devuelve el nuevo estado.
 */
export function estadoTrasPlazo(
  reto: Pick<Reto, 'estado' | 'fechaLimite'>,
  hoyISO: string
): EstadoReto {
  if (!retoAbierto(reto) || !reto.fechaLimite) return reto.estado;
  return reto.fechaLimite < hoyISO ? 'caducado' : reto.estado;
}

export function fechaLimiteReto(desdeISO: string, dias: number): string {
  const d = new Date(`${desdeISO}T00:00:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

/** Escalera inicial a partir del orden de inscripción o de un sorteo. */
export function sembrarEscalera(jugadorIds: string[]): PuestoEscalera[] {
  return jugadorIds.map((jugadorId, i) => ({
    competicionId: '',
    jugadorId,
    posicion: i + 1,
  }));
}
