import { PartidoPlantilla } from './rotacion';

// Torneo de parejas: fase de grupos (todos contra todos) y cuadro
// eliminatorio con siembra estándar y byes para los cabezas de serie.

const LETRAS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

/** Reparte equipos en grupos en serpentina para equilibrar el nivel. */
export function repartirGrupos(equipos: string[], equiposPorGrupo: number): string[][] {
  if (equiposPorGrupo < 2) throw new Error('Un grupo necesita al menos 2 equipos.');
  const nGrupos = Math.max(1, Math.ceil(equipos.length / equiposPorGrupo));
  const grupos: string[][] = Array.from({ length: nGrupos }, () => []);

  equipos.forEach((equipo, i) => {
    const vuelta = Math.floor(i / nGrupos);
    const pos = i % nGrupos;
    // Serpentina: 1→A, 2→B, 3→C, 4→C, 5→B, 6→A…
    const destino = vuelta % 2 === 0 ? pos : nGrupos - 1 - pos;
    grupos[destino].push(equipo);
  });

  return grupos;
}

/** Todos contra todos dentro de un grupo (método del círculo). */
export function roundRobin(equipos: string[], etiqueta: string): PartidoPlantilla[] {
  const lista = [...equipos];
  if (lista.length < 2) return [];
  const bye = '__bye__';
  if (lista.length % 2 === 1) lista.push(bye);

  const n = lista.length;
  const partidos: PartidoPlantilla[] = [];
  const rotacion = lista.slice(1);

  for (let j = 0; j < n - 1; j++) {
    const vuelta = [lista[0], ...rotacion];
    for (let k = 0; k < n / 2; k++) {
      const uno = vuelta[k];
      const otro = vuelta[n - 1 - k];
      if (uno === bye || otro === bye) continue;
      partidos.push({
        ronda: etiqueta,
        orden: partidos.length,
        equipoA: [uno],
        equipoB: [otro],
      });
    }
    rotacion.unshift(rotacion.pop() as string);
  }

  return partidos;
}

/** Fase de grupos completa: devuelve los grupos y sus partidos. */
export function generarFaseGrupos(
  equipos: string[],
  equiposPorGrupo: number
): { grupos: { nombre: string; equipos: string[] }[]; partidos: PartidoPlantilla[] } {
  const reparto = repartirGrupos(equipos, equiposPorGrupo);
  const grupos = reparto.map((eq, i) => ({
    nombre: `Grupo ${LETRAS[i] ?? i + 1}`,
    equipos: eq,
  }));
  const partidos = grupos.flatMap((g) => roundRobin(g.equipos, g.nombre));
  return { grupos, partidos };
}

/** Nombre de la ronda según cuántos equipos quedan vivos. */
export function nombreRonda(equiposVivos: number): string {
  switch (equiposVivos) {
    case 2:
      return 'Final';
    case 4:
      return 'Semifinales';
    case 8:
      return 'Cuartos de final';
    case 16:
      return 'Octavos de final';
    default:
      return `Ronda de ${equiposVivos}`;
  }
}

/**
 * Orden de siembra de un cuadro de tamaño potencia de 2: [1, 8, 5, 4, 3, 6, 7, 2]
 * para 8. Garantiza que los cabezas de serie no se crucen hasta el final.
 */
export function ordenSiembra(tamano: number): number[] {
  let orden = [1];
  while (orden.length < tamano) {
    const ronda = orden.length * 2;
    const siguiente: number[] = [];
    for (const s of orden) {
      siguiente.push(s, ronda + 1 - s);
    }
    orden = siguiente;
  }
  return orden;
}

export interface NodoCuadro {
  id: string; // "R1-0", "R2-1"…
  ronda: number; // 1 = primera ronda del cuadro
  nombreRonda: string;
  orden: number;
  equipoA: string | null;
  equipoB: string | null;
  /** Id del nodo al que pasa el ganador. */
  siguiente: string | null;
}

/**
 * Cuadro eliminatorio a partir de los equipos ya ordenados por siembra
 * (el primero es el cabeza de serie nº 1). Los huecos hasta la potencia de 2
 * se rellenan con byes, que se resuelven solos en `avanzarCuadro`.
 */
export function generarCuadro(equipos: string[]): NodoCuadro[] {
  if (equipos.length < 2) return [];
  const tamano = 2 ** Math.ceil(Math.log2(equipos.length));
  const siembra = ordenSiembra(tamano).map((s) => equipos[s - 1] ?? null);

  const nodos: NodoCuadro[] = [];
  let ronda = 1;
  let vivos = tamano;
  let previos: string[] = [];

  while (vivos >= 2) {
    const nEnfrentamientos = vivos / 2;
    const nuevos: string[] = [];
    for (let i = 0; i < nEnfrentamientos; i++) {
      const id = `R${ronda}-${i}`;
      nodos.push({
        id,
        ronda,
        nombreRonda: nombreRonda(vivos),
        orden: i,
        equipoA: ronda === 1 ? siembra[i * 2] : null,
        equipoB: ronda === 1 ? siembra[i * 2 + 1] : null,
        siguiente: null,
      });
      nuevos.push(id);
    }
    // Enlazar la ronda anterior con esta.
    previos.forEach((idPrevio, i) => {
      const nodo = nodos.find((n) => n.id === idPrevio);
      if (nodo) nodo.siguiente = nuevos[Math.floor(i / 2)];
    });
    previos = nuevos;
    vivos = nEnfrentamientos;
    ronda += 1;
  }

  return resolverByes(nodos);
}

/** Un enfrentamiento con un solo equipo lo gana ese equipo sin jugar. */
function resolverByes(nodos: NodoCuadro[]): NodoCuadro[] {
  let cambios = true;
  while (cambios) {
    cambios = false;
    for (const n of nodos) {
      const soloA = n.equipoA !== null && n.equipoB === null;
      const soloB = n.equipoB !== null && n.equipoA === null;
      if ((soloA || soloB) && n.siguiente) {
        const ganador = (soloA ? n.equipoA : n.equipoB) as string;
        const destino = nodos.find((x) => x.id === n.siguiente);
        if (!destino) continue;
        const hueco = n.orden % 2 === 0 ? 'equipoA' : 'equipoB';
        if (destino[hueco] !== ganador) {
          destino[hueco] = ganador;
          cambios = true;
        }
      }
    }
  }
  return nodos;
}

/** Coloca al ganador de un nodo en la ronda siguiente. */
export function avanzarCuadro(
  nodos: NodoCuadro[],
  nodoId: string,
  ganador: string
): NodoCuadro[] {
  const nodo = nodos.find((n) => n.id === nodoId);
  if (!nodo || !nodo.siguiente) return nodos;
  return nodos.map((n) => {
    if (n.id !== nodo.siguiente) return n;
    return nodo.orden % 2 === 0 ? { ...n, equipoA: ganador } : { ...n, equipoB: ganador };
  });
}
