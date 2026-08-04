import {
  ChartPoint,
  GolpeAgregado,
  Match,
  MesGrupo,
  Perfil,
  StatsFila,
} from '../types/domain';
import { golpeCanonico } from './band';
import { fmtFecha, fmtMes } from './date';

// "Partido bien jugado" = cumplir 2 de los 3 objetivos. Métrica estrella.
export const bienJugado = (m: Match): boolean =>
  m.objetivos.filter(Boolean).length >= 2;

// Racha actual: partidos bien jugados consecutivos desde el más reciente.
export const calcRacha = (matches: Match[]): number => {
  let racha = 0;
  for (let i = matches.length - 1; i >= 0; i--) {
    if (bienJugado(matches[i])) racha++;
    else break;
  }
  return racha;
};

export const calcMejorRacha = (matches: Match[]): number => {
  let mejor = 0;
  let r = 0;
  matches.forEach((m) => {
    r = bienJugado(m) ? r + 1 : 0;
    if (r > mejor) mejor = r;
  });
  return mejor;
};

export const calcPctVictorias = (matches: Match[]): number => {
  const victorias = matches.filter((m) => m.resultado === 'victoria').length;
  return matches.length ? Math.round((victorias / matches.length) * 100) : 0;
};

export const calcNivelActual = (matches: Match[], perfil: Perfil): number | null => {
  const conNivel = matches.filter((m) => m.nivel != null);
  if (conNivel.length) return conNivel[conNivel.length - 1].nivel as number;
  return perfil.nivelPlaytomic ? parseFloat(perfil.nivelPlaytomic) : null;
};

export const calcNivelInicial = (matches: Match[], perfil: Perfil): number | null => {
  if (perfil.nivelPlaytomic) return parseFloat(perfil.nivelPlaytomic);
  const conNivel = matches.filter((m) => m.nivel != null);
  return conNivel.length ? (conNivel[0].nivel as number) : null;
};

// Delta como string con signo ya redondeado a 2 decimales (igual que la web).
export const calcDeltaNivel = (matches: Match[], perfil: Perfil): string | null => {
  const actual = calcNivelActual(matches, perfil);
  const inicial = calcNivelInicial(matches, perfil);
  return actual != null && inicial != null ? (actual - inicial).toFixed(2) : null;
};

// Nivel Band de la sesión de un partido: el campo directo si existe y, si no,
// derivado de la curva "Progreso de la sesión" (media de inicio y fin).
export const bandDeSesion = (m: Match): number | null => {
  if (m.nivelBand != null) return m.nivelBand;
  const puntos = [m.bandInicio, m.bandFin].filter((v): v is number => v != null);
  return puntos.length ? puntos.reduce((a, v) => a + v, 0) / puntos.length : null;
};

// Media de TODOS los puntos Band de la gráfica (uno por partido con dato).
// El nivel del perfil solo entra como último recurso, cuando no hay ninguno.
export const calcBandMedia = (matches: Match[], perfil: Perfil): number | null => {
  const puntos = matches.map(bandDeSesion).filter((v): v is number => v != null);
  if (puntos.length) {
    return puntos.reduce((a, v) => a + v, 0) / puntos.length;
  }
  return perfil.nivelBand ? parseFloat(perfil.nivelBand) : null;
};

const statsDe = (etiqueta: string, ms: Match[]): StatsFila => {
  const v = ms.filter((m) => m.resultado === 'victoria').length;
  const bj = ms.filter((m) => bienJugado(m)).length;
  return {
    etiqueta,
    n: ms.length,
    pctV: ms.length ? Math.round((v / ms.length) * 100) : null,
    pctBJ: ms.length ? Math.round((bj / ms.length) * 100) : null,
  };
};

export const calcStatsTipo = (matches: Match[]): StatsFila[] => [
  statsDe('Competitivo', matches.filter((m) => m.tipo === 'competitivo')),
  statsDe('Amistoso', matches.filter((m) => m.tipo === 'amistoso')),
];

export const calcStatsPos = (matches: Match[]): StatsFila[] => [
  statsDe('Revés', matches.filter((m) => m.posicion === 'reves')),
  statsDe('Derecha', matches.filter((m) => m.posicion === 'derecha')),
];

// Últimos 6 valores únicos, como la web-app (chips de club/compañero).
export const calcClubesPrevios = (matches: Match[]): string[] =>
  [...new Set(matches.map((m) => m.club).filter(Boolean))].slice(-6);

export const calcCompanerosPrevios = (matches: Match[]): string[] =>
  [...new Set(matches.map((m) => m.companero).filter(Boolean))].slice(-6);

export const calcStatsCompanero = (matches: Match[]): StatsFila[] =>
  calcCompanerosPrevios(matches)
    .map((c) => statsDe(c, matches.filter((m) => m.companero === c)))
    .sort((a, b) => b.n - a.n)
    .slice(0, 4);

const agregaGolpes = (
  matches: Match[],
  campo: 'mejorGolpe' | 'peorGolpe',
  puntCampo: 'mejorPunt' | 'peorPunt'
): GolpeAgregado[] => {
  const mapa: Record<string, { veces: number; suma: number }> = {};
  matches.forEach((m) => {
    // canónico: unifica datos antiguos guardados como "Volea de derecha", etc.
    const golpe = m[campo] ? golpeCanonico(m[campo] as string) : null;
    const punt = m[puntCampo];
    if (golpe && punt) {
      if (!mapa[golpe]) mapa[golpe] = { veces: 0, suma: 0 };
      mapa[golpe].veces++;
      mapa[golpe].suma += punt;
    }
  });
  return Object.entries(mapa)
    .map(([golpe, d]) => ({ golpe, veces: d.veces, media: d.suma / d.veces }))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 3);
};

export const calcTopMejores = (matches: Match[]): GolpeAgregado[] =>
  agregaGolpes(matches, 'mejorGolpe', 'mejorPunt');

export const calcTopPeores = (matches: Match[]): GolpeAgregado[] =>
  agregaGolpes(matches, 'peorGolpe', 'peorPunt');

// Progreso hacia la meta de temporada, 0-100 (null si falta algún dato o la
// meta no supera el nivel inicial).
export const calcProgresoMeta = (matches: Match[], perfil: Perfil): number | null => {
  const objetivo = perfil.nivelObjetivo ? parseFloat(perfil.nivelObjetivo) : null;
  const inicial = calcNivelInicial(matches, perfil);
  const actual = calcNivelActual(matches, perfil);
  if (objetivo == null || inicial == null || actual == null || objetivo <= inicial) return null;
  return Math.max(0, Math.min(100, Math.round(((actual - inicial) / (objetivo - inicial)) * 100)));
};

export const calcChartData = (matches: Match[]): ChartPoint[] =>
  matches
    .filter((m) => m.nivel != null || bandDeSesion(m) != null)
    .map((m) => ({ fecha: fmtFecha(m.fecha), nivel: m.nivel, band: bandDeSesion(m) }));

export const calcUltimos8 = (matches: Match[]): Match[] => matches.slice(-8);

// Historial agrupado por mes, del más reciente al más antiguo.
export const calcMeses = (matches: Match[]): MesGrupo[] => {
  const meses: MesGrupo[] = [];
  [...matches].reverse().forEach((m) => {
    const clave = fmtMes(m.fecha);
    let g = meses.find((x) => x.clave === clave);
    if (!g) {
      g = { clave, items: [] };
      meses.push(g);
    }
    g.items.push(m);
  });
  return meses;
};

// Inserta o reemplaza un partido y mantiene el orden cronológico ascendente.
export const upsertMatch = (matches: Match[], match: Match): Match[] =>
  [...matches.filter((m) => m.id !== match.id), match].sort((a, b) =>
    a.fecha < b.fecha ? -1 : 1
  );

// ─── resumen mensual y cumplimiento de objetivos ───

export interface ResumenMes {
  clave: string; // "Julio de 2026"
  n: number;
  pctV: number | null;
  pctBJ: number | null;
  nivelCierre: number | null; // último nivel Playtomic anotado en el mes
}

const resumenDeMes = (matches: Match[], anoMes: string, clave: string): ResumenMes => {
  const ms = matches.filter((m) => m.fecha.startsWith(anoMes));
  const v = ms.filter((m) => m.resultado === 'victoria').length;
  const bj = ms.filter((m) => bienJugado(m)).length;
  const conNivel = ms.filter((m) => m.nivel != null);
  return {
    clave,
    n: ms.length,
    pctV: ms.length ? Math.round((v / ms.length) * 100) : null,
    pctBJ: ms.length ? Math.round((bj / ms.length) * 100) : null,
    nivelCierre: conNivel.length ? (conNivel[conNivel.length - 1].nivel as number) : null,
  };
};

// Mes en curso vs mes anterior (según la fecha "hoy" en ISO yyyy-mm-dd).
export const calcResumenMensual = (
  matches: Match[],
  hoyIso: string
): { actual: ResumenMes; anterior: ResumenMes } => {
  const [ano, mes] = hoyIso.split('-').map(Number);
  const actualKey = `${ano}-${String(mes).padStart(2, '0')}`;
  const anoPrev = mes === 1 ? ano - 1 : ano;
  const mesPrev = mes === 1 ? 12 : mes - 1;
  const prevKey = `${anoPrev}-${String(mesPrev).padStart(2, '0')}`;
  return {
    actual: resumenDeMes(matches, actualKey, fmtMes(`${actualKey}-15`)),
    anterior: resumenDeMes(matches, prevKey, fmtMes(`${prevKey}-15`)),
  };
};

// % de cumplimiento de cada uno de los 3 objetivos sobre todos los partidos.
export const calcCumplimientoObjetivos = (matches: Match[]): (number | null)[] =>
  [0, 1, 2].map((i) => {
    if (matches.length === 0) return null;
    const cumplidos = matches.filter((m) => m.objetivos[i]).length;
    return Math.round((cumplidos / matches.length) * 100);
  });

// ─── ficha de evolución de un golpe ───

export interface PuntoGolpe {
  fecha: string; // formateada para el eje
  fechaISO: string;
  nota: number; // de golpesSesion (capturas de la Band)
  cantidad: number | null; // de golpesVolumen si existe ese día
}

export interface EvolucionGolpe {
  puntos: PuntoGolpe[];
  veces: number;
  media: number | null;
  mejor: number | null;
  peor: number | null;
}

// Trayectoria de un golpe a través de las sesiones capturadas de Padel Band.
// Compara por nombre canónico y fusiona variantes por lado dentro de una
// misma sesión (datos antiguos con "Volea de derecha" + "Volea de revés").
export const calcEvolucionGolpe = (matches: Match[], nombre: string): EvolucionGolpe => {
  const clave = golpeCanonico(nombre).toLowerCase();
  const puntos: PuntoGolpe[] = [];
  matches.forEach((m) => {
    const notas = (m.golpesSesion ?? [])
      .filter((g) => golpeCanonico(g.nombre).toLowerCase() === clave)
      .map((g) => g.nota);
    if (notas.length === 0) return;
    const cantidades = (m.golpesVolumen ?? [])
      .filter((g) => golpeCanonico(g.nombre).toLowerCase() === clave)
      .map((g) => g.cantidad);
    puntos.push({
      fecha: fmtFecha(m.fecha),
      fechaISO: m.fecha,
      nota: Math.round((notas.reduce((a, n) => a + n, 0) / notas.length) * 10) / 10,
      cantidad: cantidades.length ? cantidades.reduce((a, c) => a + c, 0) : null,
    });
  });
  const notas = puntos.map((p) => p.nota);
  return {
    puntos,
    veces: puntos.length,
    media: notas.length ? notas.reduce((a, n) => a + n, 0) / notas.length : null,
    mejor: notas.length ? Math.max(...notas) : null,
    peor: notas.length ? Math.min(...notas) : null,
  };
};
