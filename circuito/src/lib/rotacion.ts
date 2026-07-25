import { Enfrentamiento } from '../types/domain';

// Motor de la liga por divisiones estilo "Pádel o Nada": te inscribes solo,
// cada jornada te sientan en una mesa con otros 3 (o 4) jugadores de tu nivel
// y juegas rotando de compañero, de modo que en la misma jornada juegas con y
// contra todos los de la mesa. Los puntos son individuales.

/**
 * Rondas de una mesa con rotación completa de parejas.
 *
 * - 4 jugadores → 3 rondas, cada uno juega una vez con cada compañero.
 * - 5 jugadores → 5 rondas, descansa uno por ronda y cada par de jugadores
 *   coincide como pareja exactamente una vez (las 10 parejas posibles).
 */
export function rondasMesa(jugadores: string[]): Enfrentamiento[] {
  if (jugadores.length === 4) {
    const [p0, p1, p2, p3] = jugadores;
    return [
      { ronda: 1, equipoA: [p0, p1], equipoB: [p2, p3], descansan: [] },
      { ronda: 2, equipoA: [p0, p2], equipoB: [p1, p3], descansan: [] },
      { ronda: 3, equipoA: [p0, p3], equipoB: [p1, p2], descansan: [] },
    ];
  }

  if (jugadores.length === 5) {
    // Esquema cíclico módulo 5: en la ronda k descansa k y se enfrentan
    // (k+1, k+4) contra (k+2, k+3). Recorre las 10 parejas sin repetir.
    return Array.from({ length: 5 }, (_, k) => ({
      ronda: k + 1,
      equipoA: [jugadores[(k + 1) % 5], jugadores[(k + 4) % 5]],
      equipoB: [jugadores[(k + 2) % 5], jugadores[(k + 3) % 5]],
      descansan: [jugadores[k]],
    }));
  }

  throw new Error(
    `Una mesa con rotación de parejas es de 4 o 5 jugadores (recibidos ${jugadores.length}).`
  );
}

/**
 * Tamaños de mesa que sientan al mayor número posible de jugadores usando
 * solo mesas de 4 y de 5. Con 6, 7 u 11 jugadores no hay reparto exacto, así
 * que se maximiza la gente sentada y el resto descansa la jornada.
 */
export function repartoMesas(total: number, preferido: 4 | 5 = 4): number[] {
  let mejor: { sentados: number; cuatros: number; cincos: number } | null = null;

  for (let cincos = 0; cincos <= Math.floor(total / 5); cincos++) {
    const cuatros = Math.floor((total - cincos * 5) / 4);
    const sentados = cincos * 5 + cuatros * 4;
    const preferidas = preferido === 5 ? cincos : cuatros;
    const mejorPreferidas = mejor
      ? preferido === 5
        ? mejor.cincos
        : mejor.cuatros
      : -1;
    if (
      !mejor ||
      sentados > mejor.sentados ||
      (sentados === mejor.sentados && preferidas > mejorPreferidas)
    ) {
      mejor = { sentados, cuatros, cincos };
    }
  }

  if (!mejor || mejor.sentados === 0) return [];
  const cuatros = Array<number>(mejor.cuatros).fill(4);
  const cincos = Array<number>(mejor.cincos).fill(5);
  // Las mesas del tamaño preferido van primero (arriba de la clasificación).
  return preferido === 5 ? [...cincos, ...cuatros] : [...cuatros, ...cincos];
}

/**
 * Reparte a los jugadores de una división en mesas siguiendo el orden de la
 * clasificación (1-4, 5-8…), que es lo que hace que cada jornada juegues
 * contra gente de tu nivel real. Los que no entran en ninguna mesa —siempre
 * la cola de la clasificación— se devuelven en `sinMesa`.
 */
export function formarMesas(
  ordenClasificacion: string[],
  tamano: 4 | 5 = 4
): { mesas: string[][]; sinMesa: string[] } {
  const tamanos = repartoMesas(ordenClasificacion.length, tamano);
  const mesas: string[][] = [];
  let i = 0;
  for (const t of tamanos) {
    mesas.push(ordenClasificacion.slice(i, i + t));
    i += t;
  }
  return { mesas, sinMesa: ordenClasificacion.slice(i) };
}

export interface PartidoPlantilla {
  ronda: string;
  orden: number;
  equipoA: string[];
  equipoB: string[];
}

/**
 * Partidos completos de una jornada de división: reparte mesas y expande cada
 * mesa en sus rondas de rotación.
 */
export function generarJornada(
  ordenClasificacion: string[],
  tamano: 4 | 5 = 4
): { partidos: PartidoPlantilla[]; descansan: string[] } {
  const { mesas, sinMesa } = formarMesas(ordenClasificacion, tamano);
  const partidos: PartidoPlantilla[] = [];
  const descansan = [...sinMesa];
  let orden = 0;

  mesas.forEach((mesa, idx) => {
    for (const r of rondasMesa(mesa)) {
      partidos.push({
        ronda: `Mesa ${idx + 1}`,
        orden: orden++,
        equipoA: r.equipoA,
        equipoB: r.equipoB,
      });
    }
  });

  return { partidos, descansan };
}

/**
 * Liga individual (1 vs 1): todos contra todos por el método del círculo.
 * Devuelve una lista de jornadas, cada una con sus enfrentamientos.
 */
export function roundRobinIndividual(jugadores: string[]): PartidoPlantilla[][] {
  const lista = [...jugadores];
  if (lista.length < 2) return [];
  const bye = '__descansa__';
  if (lista.length % 2 === 1) lista.push(bye);

  const n = lista.length;
  const jornadas: PartidoPlantilla[][] = [];
  const rotacion = lista.slice(1);

  for (let j = 0; j < n - 1; j++) {
    const vuelta = [lista[0], ...rotacion];
    const partidos: PartidoPlantilla[] = [];
    for (let k = 0; k < n / 2; k++) {
      const uno = vuelta[k];
      const otro = vuelta[n - 1 - k];
      if (uno === bye || otro === bye) continue;
      // Alternar local/visitante para repartir el saque inicial.
      const [a, b] = j % 2 === 0 ? [uno, otro] : [otro, uno];
      partidos.push({
        ronda: `Jornada ${j + 1}`,
        orden: partidos.length,
        equipoA: [a],
        equipoB: [b],
      });
    }
    jornadas.push(partidos);
    rotacion.unshift(rotacion.pop() as string);
  }

  return jornadas;
}
