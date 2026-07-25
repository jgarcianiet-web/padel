import { FilaClasificacion, Partido, ReglasComunes } from '../types/domain';
import { resumirSets } from './marcador';

// Clasificación individual (ligas por divisiones, liga individual y escalera)
// y por equipos (torneo de parejas). El mismo cálculo sirve para las dos:
// cambia solo qué id se cuenta como participante.

export interface OpcionesClasificacion {
  puntosVictoria: number;
  puntosDerrota: number;
  /** Participantes que deben aparecer aunque aún no hayan jugado. */
  participantes?: string[];
  /** En torneo de parejas, `equipoA` ya trae el id de la pareja. */
  porEquipo?: boolean;
}

interface Acumulado extends Omit<FilaClasificacion, 'puesto'> {}

const vacio = (participanteId: string): Acumulado => ({
  participanteId,
  jugados: 0,
  ganados: 0,
  perdidos: 0,
  setsFavor: 0,
  setsContra: 0,
  juegosFavor: 0,
  juegosContra: 0,
  puntos: 0,
});

/**
 * Solo cuentan los partidos confirmados: mientras el rival no valide el
 * resultado, la clasificación no se mueve.
 */
export function calcularClasificacion(
  partidos: Partido[],
  opciones: OpcionesClasificacion
): FilaClasificacion[] {
  const tabla = new Map<string, Acumulado>();
  const asegurar = (id: string) => {
    if (!tabla.has(id)) tabla.set(id, vacio(id));
    return tabla.get(id) as Acumulado;
  };

  for (const id of opciones.participantes ?? []) asegurar(id);

  // Enfrentamientos directos, para el último criterio de desempate.
  const directos = new Map<string, string>(); // "idA|idB" → ganador

  for (const p of partidos) {
    if (p.estado !== 'confirmado' || !p.sets) continue;
    const r = resumirSets(p.sets);
    if (!r.ganador) continue;

    for (const [lado, ids] of [
      ['a', p.equipoA],
      ['b', p.equipoB],
    ] as const) {
      const gana = r.ganador === lado;
      const favorSets = lado === 'a' ? r.setsA : r.setsB;
      const contraSets = lado === 'a' ? r.setsB : r.setsA;
      const favorJuegos = lado === 'a' ? r.juegosA : r.juegosB;
      const contraJuegos = lado === 'a' ? r.juegosB : r.juegosA;

      for (const id of ids) {
        const fila = asegurar(id);
        fila.jugados += 1;
        fila.ganados += gana ? 1 : 0;
        fila.perdidos += gana ? 0 : 1;
        fila.setsFavor += favorSets;
        fila.setsContra += contraSets;
        fila.juegosFavor += favorJuegos;
        fila.juegosContra += contraJuegos;
        fila.puntos += gana ? opciones.puntosVictoria : opciones.puntosDerrota;
      }
    }

    if (p.equipoA.length === 1 && p.equipoB.length === 1) {
      const [x] = p.equipoA;
      const [y] = p.equipoB;
      directos.set(clave(x, y), r.ganador === 'a' ? x : y);
    }
  }

  const filas = [...tabla.values()].sort((x, y) => comparar(x, y, directos));
  return filas.map((f, i) => ({ ...f, puesto: i + 1 }));
}

const clave = (x: string, y: string) => [x, y].sort().join('|');

function comparar(
  x: Acumulado,
  y: Acumulado,
  directos: Map<string, string>
): number {
  if (y.puntos !== x.puntos) return y.puntos - x.puntos;

  const dSetsX = x.setsFavor - x.setsContra;
  const dSetsY = y.setsFavor - y.setsContra;
  if (dSetsY !== dSetsX) return dSetsY - dSetsX;

  const dJuegosX = x.juegosFavor - x.juegosContra;
  const dJuegosY = y.juegosFavor - y.juegosContra;
  if (dJuegosY !== dJuegosX) return dJuegosY - dJuegosX;

  const ganador = directos.get(clave(x.participanteId, y.participanteId));
  if (ganador === x.participanteId) return -1;
  if (ganador === y.participanteId) return 1;

  if (y.juegosFavor !== x.juegosFavor) return y.juegosFavor - x.juegosFavor;
  return x.participanteId.localeCompare(y.participanteId);
}

export const reglasPuntos = (reglas: ReglasComunes) => ({
  puntosVictoria: reglas.puntosVictoria,
  puntosDerrota: reglas.puntosDerrota,
});

// ─── Ascensos y descensos entre divisiones ─────────────────────────────────

export interface MovimientoDivision {
  jugadorId: string;
  desde: number; // orden de división actual (1 = la más alta)
  hasta: number;
  movimiento: 'asciende' | 'desciende' | 'permanece';
}

/**
 * Cierre de temporada: los `sube` primeros de cada división ascienden y los
 * `baja` últimos descienden. La división 1 no tiene a dónde ascender ni la
 * última a dónde bajar.
 */
export function aplicarAscensos(
  divisiones: { orden: number; clasificacion: FilaClasificacion[] }[],
  reglas: { sube: number; baja: number }
): MovimientoDivision[] {
  const ordenes = divisiones.map((d) => d.orden).sort((a, b) => a - b);
  const primera = ordenes[0];
  const ultima = ordenes[ordenes.length - 1];

  return divisiones.flatMap((d) => {
    const n = d.clasificacion.length;
    return d.clasificacion.map((fila) => {
      const asciende = d.orden > primera && fila.puesto <= reglas.sube;
      const desciende = d.orden < ultima && fila.puesto > n - reglas.baja;
      const hasta = asciende ? d.orden - 1 : desciende ? d.orden + 1 : d.orden;
      return {
        jugadorId: fila.participanteId,
        desde: d.orden,
        hasta,
        movimiento: asciende
          ? ('asciende' as const)
          : desciende
            ? ('desciende' as const)
            : ('permanece' as const),
      };
    });
  });
}
