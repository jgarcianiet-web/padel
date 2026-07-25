import { Lado, ReglasComunes, SetMarcador } from '../types/domain';

// Marcador de un partido: parseo desde texto ("6-4, 7-6(8-6)"), formateo y
// resumen. Es la única pieza que decide quién gana un partido, así que la
// usan tanto la clasificación como la escalera y el cuadro.

export const setVacio = (): SetMarcador => ({ a: 0, b: 0, tbA: null, tbB: null });

/** "6-4, 7-6(8-6), 3-6" → SetMarcador[]. Devuelve [] si no hay nada legible. */
export function parseSets(texto: string): SetMarcador[] {
  return texto
    .split(/[,;]/)
    .map((trozo) => trozo.trim())
    .filter(Boolean)
    .map((trozo) => {
      const m = trozo.match(/^(\d+)\s*[-/]\s*(\d+)(?:\s*\((\d+)\s*[-/]\s*(\d+)\))?$/);
      if (!m) return null;
      return {
        a: Number(m[1]),
        b: Number(m[2]),
        tbA: m[3] !== undefined ? Number(m[3]) : null,
        tbB: m[4] !== undefined ? Number(m[4]) : null,
      };
    })
    .filter((s): s is SetMarcador => s !== null);
}

export function formatearSets(sets: SetMarcador[] | null): string {
  if (!sets || sets.length === 0) return '';
  return sets
    .map((s) =>
      s.tbA !== null && s.tbB !== null
        ? `${s.a}-${s.b}(${s.tbA}-${s.tbB})`
        : `${s.a}-${s.b}`
    )
    .join(', ');
}

export interface ResumenPartido {
  setsA: number;
  setsB: number;
  juegosA: number;
  juegosB: number;
  ganador: Lado | null;
}

export function resumirSets(sets: SetMarcador[] | null): ResumenPartido {
  const base: ResumenPartido = {
    setsA: 0,
    setsB: 0,
    juegosA: 0,
    juegosB: 0,
    ganador: null,
  };
  if (!sets || sets.length === 0) return base;

  for (const s of sets) {
    base.juegosA += s.a;
    base.juegosB += s.b;
    if (s.a > s.b) base.setsA += 1;
    else if (s.b > s.a) base.setsB += 1;
    else if (s.tbA !== null && s.tbB !== null) {
      // set decidido solo en el tie-break (formatos cortos)
      if (s.tbA > s.tbB) base.setsA += 1;
      else if (s.tbB > s.tbA) base.setsB += 1;
    }
  }

  if (base.setsA > base.setsB) base.ganador = 'a';
  else if (base.setsB > base.setsA) base.ganador = 'b';
  return base;
}

/**
 * Valida un marcador contra las reglas de la competición. En estas ligas no
 * hay empates: todo partido subido tiene que tener ganador.
 */
export function validarSets(
  sets: SetMarcador[],
  reglas: Pick<ReglasComunes, 'setsParaGanar'>
): string | null {
  if (sets.length === 0) return 'Añade al menos un set.';
  if (sets.length > reglas.setsParaGanar * 2 - 1)
    return `Este formato es al mejor de ${reglas.setsParaGanar * 2 - 1} sets.`;

  for (const s of sets) {
    if (s.a < 0 || s.b < 0) return 'Los juegos no pueden ser negativos.';
    if (s.a === s.b && (s.tbA === null || s.tbB === null))
      return 'Un set no puede acabar en empate.';
    if (s.tbA !== null && s.tbB !== null && s.tbA === s.tbB)
      return 'Un tie-break no puede acabar en empate.';
  }

  const { setsA, setsB, ganador } = resumirSets(sets);
  if (!ganador) return 'El partido tiene que tener un ganador.';
  if (Math.max(setsA, setsB) < reglas.setsParaGanar)
    return `Faltan sets: se gana con ${reglas.setsParaGanar}.`;
  return null;
}
