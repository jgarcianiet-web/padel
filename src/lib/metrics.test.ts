import { mkMatch } from './fixtures';
import {
  bienJugado,
  calcBandMedia,
  calcChartData,
  calcClubesPrevios,
  calcCompanerosPrevios,
  calcDeltaNivel,
  calcMejorRacha,
  calcMeses,
  calcNivelActual,
  calcNivelInicial,
  calcPctVictorias,
  calcProgresoMeta,
  calcRacha,
  calcStatsCompanero,
  calcStatsPos,
  calcStatsTipo,
  calcTopMejores,
  calcTopPeores,
  calcUltimos8,
  upsertMatch,
} from './metrics';
import { Perfil } from '../types/domain';

const perfil = (over: Partial<Perfil> = {}): Perfil => ({
  nivelPlaytomic: '3.20',
  nivelBand: '3.5',
  nivelObjetivo: '3.50',
  fechaInicio: '2026-01-01',
  ...over,
});

const BJ = { objetivos: [true, true, false] }; // bien jugado
const MAL = { objetivos: [true, false, false] }; // no bien jugado

describe('bienJugado y rachas', () => {
  test('bien jugado = 2 de 3 objetivos', () => {
    expect(bienJugado(mkMatch({ objetivos: [true, true, false] }))).toBe(true);
    expect(bienJugado(mkMatch({ objetivos: [true, true, true] }))).toBe(true);
    expect(bienJugado(mkMatch({ objetivos: [true, false, false] }))).toBe(false);
    expect(bienJugado(mkMatch({ objetivos: [false, false, false] }))).toBe(false);
  });

  test('racha 0 sin partidos', () => {
    expect(calcRacha([])).toBe(0);
    expect(calcMejorRacha([])).toBe(0);
  });

  test('racha cuenta consecutivos desde el final', () => {
    const ms = [mkMatch(BJ), mkMatch(MAL), mkMatch(BJ), mkMatch(BJ)];
    expect(calcRacha(ms)).toBe(2);
    expect(calcMejorRacha(ms)).toBe(2);
  });

  test('racha rota al final', () => {
    const ms = [mkMatch(BJ), mkMatch(BJ), mkMatch(BJ), mkMatch(MAL)];
    expect(calcRacha(ms)).toBe(0);
    expect(calcMejorRacha(ms)).toBe(3);
  });

  test('todos bien jugados', () => {
    const ms = [mkMatch(BJ), mkMatch(BJ)];
    expect(calcRacha(ms)).toBe(2);
    expect(calcMejorRacha(ms)).toBe(2);
  });
});

describe('niveles', () => {
  test('pctVictorias', () => {
    expect(calcPctVictorias([])).toBe(0);
    expect(
      calcPctVictorias([
        mkMatch({ resultado: 'victoria' }),
        mkMatch({ resultado: 'derrota' }),
        mkMatch({ resultado: 'victoria' }),
      ])
    ).toBe(67);
  });

  test('nivelActual: último partido con nivel, o perfil', () => {
    const ms = [mkMatch({ nivel: 3.3 }), mkMatch({ nivel: null }), mkMatch({ nivel: 3.45 })];
    expect(calcNivelActual(ms, perfil())).toBe(3.45);
    expect(calcNivelActual([], perfil())).toBe(3.2);
    expect(calcNivelActual([], perfil({ nivelPlaytomic: '' }))).toBeNull();
  });

  test('nivelInicial: perfil primero, si no el primer partido con nivel', () => {
    const ms = [mkMatch({ nivel: 3.3 })];
    expect(calcNivelInicial(ms, perfil())).toBe(3.2);
    expect(calcNivelInicial(ms, perfil({ nivelPlaytomic: '' }))).toBe(3.3);
    expect(calcNivelInicial([], perfil({ nivelPlaytomic: '' }))).toBeNull();
  });

  test('deltaNivel con signo', () => {
    expect(calcDeltaNivel([mkMatch({ nivel: 3.45 })], perfil())).toBe('0.25');
    expect(calcDeltaNivel([mkMatch({ nivel: 3.0 })], perfil())).toBe('-0.20');
    expect(calcDeltaNivel([], perfil({ nivelPlaytomic: '' }))).toBeNull();
  });

  test('bandMedia: media de sesiones o perfil', () => {
    const ms = [mkMatch({ nivelBand: 3 }), mkMatch({ nivelBand: 4 }), mkMatch({ nivelBand: null })];
    expect(calcBandMedia(ms, perfil())).toBe(3.5);
    expect(calcBandMedia([], perfil())).toBe(3.5);
    expect(calcBandMedia([], perfil({ nivelBand: '' }))).toBeNull();
  });

  test('progresoMeta clamped y null si meta <= inicial', () => {
    expect(calcProgresoMeta([mkMatch({ nivel: 3.35 })], perfil())).toBe(50);
    expect(calcProgresoMeta([mkMatch({ nivel: 3.8 })], perfil())).toBe(100);
    expect(calcProgresoMeta([mkMatch({ nivel: 2.9 })], perfil())).toBe(0);
    expect(calcProgresoMeta([], perfil({ nivelObjetivo: '3.10' }))).toBeNull();
    expect(calcProgresoMeta([], perfil({ nivelObjetivo: '' }))).toBeNull();
  });
});

describe('estadísticas', () => {
  const ms = [
    mkMatch({ tipo: 'competitivo', resultado: 'victoria', posicion: 'reves', ...BJ }),
    mkMatch({ tipo: 'competitivo', resultado: 'derrota', posicion: 'derecha', ...MAL }),
    mkMatch({ tipo: 'amistoso', resultado: 'victoria', posicion: 'reves', ...BJ }),
  ];

  test('statsTipo', () => {
    const [comp, amis] = calcStatsTipo(ms);
    expect(comp).toEqual({ etiqueta: 'Competitivo', n: 2, pctV: 50, pctBJ: 50 });
    expect(amis).toEqual({ etiqueta: 'Amistoso', n: 1, pctV: 100, pctBJ: 100 });
  });

  test('statsPos', () => {
    const [reves, derecha] = calcStatsPos(ms);
    expect(reves).toEqual({ etiqueta: 'Revés', n: 2, pctV: 100, pctBJ: 100 });
    expect(derecha).toEqual({ etiqueta: 'Derecha', n: 1, pctV: 0, pctBJ: 0 });
  });

  test('stats con lista vacía dan null en porcentajes', () => {
    const [comp] = calcStatsTipo([]);
    expect(comp).toEqual({ etiqueta: 'Competitivo', n: 0, pctV: null, pctBJ: null });
  });

  test('clubes y compañeros previos: únicos, últimos 6', () => {
    const many = ['a', 'b', 'c', 'd', 'e', 'f', 'g'].map((c) =>
      mkMatch({ club: c, companero: c })
    );
    expect(calcClubesPrevios(many)).toEqual(['b', 'c', 'd', 'e', 'f', 'g']);
    expect(calcCompanerosPrevios([...many, mkMatch({ companero: 'b' })])).toContain('b');
    expect(calcClubesPrevios([mkMatch({ club: '' })])).toEqual([]);
  });

  test('statsCompanero ordena por nº de partidos, top 4', () => {
    const ms2 = [
      mkMatch({ companero: 'Ana', resultado: 'victoria', ...BJ }),
      mkMatch({ companero: 'Ana', resultado: 'derrota', ...MAL }),
      mkMatch({ companero: 'Luis', resultado: 'victoria', ...BJ }),
    ];
    const stats = calcStatsCompanero(ms2);
    expect(stats[0]).toEqual({ etiqueta: 'Ana', n: 2, pctV: 50, pctBJ: 50 });
    expect(stats[1].etiqueta).toBe('Luis');
  });

  test('agregado de golpes: top 3 por frecuencia con media', () => {
    const ms3 = [
      mkMatch({ mejorGolpe: 'Bandeja', mejorPunt: 5, peorGolpe: 'Revés', peorPunt: 2 }),
      mkMatch({ mejorGolpe: 'Bandeja', mejorPunt: 4, peorGolpe: 'Revés', peorPunt: 3 }),
      mkMatch({ mejorGolpe: 'Saque', mejorPunt: 6, peorGolpe: 'Globo', peorPunt: 1 }),
      mkMatch({ mejorGolpe: null, mejorPunt: null, peorGolpe: null, peorPunt: null }),
    ];
    const mejores = calcTopMejores(ms3);
    expect(mejores[0]).toEqual({ golpe: 'Bandeja', veces: 2, media: 4.5 });
    expect(mejores[1]).toEqual({ golpe: 'Saque', veces: 1, media: 6 });
    const peores = calcTopPeores(ms3);
    expect(peores[0]).toEqual({ golpe: 'Revés', veces: 2, media: 2.5 });
  });
});

describe('chart, forma e historial', () => {
  test('chartData solo partidos con algún nivel', () => {
    const ms = [
      mkMatch({ fecha: '2026-07-01', nivel: 3.2, nivelBand: null }),
      mkMatch({ fecha: '2026-07-02', nivel: null, nivelBand: null }),
      mkMatch({ fecha: '2026-07-03', nivel: null, nivelBand: 4 }),
    ];
    expect(calcChartData(ms)).toEqual([
      { fecha: '1 jul', nivel: 3.2, band: null },
      { fecha: '3 jul', nivel: null, band: 4 },
    ]);
  });

  test('ultimos8', () => {
    const ms = Array.from({ length: 10 }, (_, i) => mkMatch({ id: i }));
    const u = calcUltimos8(ms);
    expect(u).toHaveLength(8);
    expect(u[0].id).toBe(2);
  });

  test('meses agrupa del más reciente al más antiguo', () => {
    const ms = [
      mkMatch({ fecha: '2026-06-10' }),
      mkMatch({ fecha: '2026-07-01' }),
      mkMatch({ fecha: '2026-07-12' }),
    ];
    const meses = calcMeses(ms);
    expect(meses.map((g) => g.clave)).toEqual(['Julio de 2026', 'Junio de 2026']);
    expect(meses[0].items.map((m) => m.fecha)).toEqual(['2026-07-12', '2026-07-01']);
  });

  test('upsertMatch inserta ordenado y reemplaza por id', () => {
    const a = mkMatch({ id: 1, fecha: '2026-07-02' });
    const b = mkMatch({ id: 2, fecha: '2026-07-01' });
    const lista = upsertMatch(upsertMatch([], a), b);
    expect(lista.map((m) => m.id)).toEqual([2, 1]);
    const editado = upsertMatch(lista, { ...a, club: 'Nuevo' });
    expect(editado).toHaveLength(2);
    expect(editado.find((m) => m.id === 1)?.club).toBe('Nuevo');
  });
});
