import { Partido } from '../types/domain';
import { aplicarAscensos, calcularClasificacion } from './clasificacion';
import { parseSets } from './marcador';

const partido = (
  id: string,
  equipoA: string[],
  equipoB: string[],
  sets: string,
  estado: Partido['estado'] = 'confirmado'
): Partido => ({
  id,
  competicionId: 'c1',
  divisionId: null,
  jornadaId: null,
  modalidad: equipoA.length === 1 ? 'individual' : 'parejas',
  ronda: 'Mesa 1',
  orden: 0,
  clubId: null,
  fecha: '2026-07-20',
  estado,
  equipoA,
  equipoB,
  sets: parseSets(sets),
  ganador: null,
  reportadoPor: null,
  confirmadoPor: null,
});

const puntos = { puntosVictoria: 3, puntosDerrota: 0 };

describe('calcularClasificacion', () => {
  it('reparte los puntos a los dos miembros de la pareja ganadora', () => {
    const tabla = calcularClasificacion([partido('p1', ['a', 'b'], ['c', 'd'], '6-3')], puntos);
    expect(tabla.map((f) => [f.participanteId, f.puntos])).toEqual([
      ['a', 3],
      ['b', 3],
      ['c', 0],
      ['d', 0],
    ]);
    expect(tabla[0].puesto).toBe(1);
    expect(tabla[0].juegosFavor).toBe(6);
    expect(tabla[2].juegosContra).toBe(6);
  });

  it('resuelve una mesa completa de rotación', () => {
    // a gana los tres partidos de la mesa, d no gana ninguno
    const partidos = [
      partido('p1', ['a', 'b'], ['c', 'd'], '6-2'),
      partido('p2', ['a', 'c'], ['b', 'd'], '6-3'),
      partido('p3', ['a', 'd'], ['b', 'c'], '6-4'),
    ];
    const tabla = calcularClasificacion(partidos, puntos);
    expect(tabla[0]).toMatchObject({ participanteId: 'a', ganados: 3, puntos: 9 });
    expect(tabla.find((f) => f.participanteId === 'd')).toMatchObject({
      ganados: 1,
      puntos: 3,
    });
  });

  it('ignora los partidos sin confirmar', () => {
    const tabla = calcularClasificacion(
      [partido('p1', ['a'], ['b'], '6-3', 'pendiente')],
      { ...puntos, participantes: ['a', 'b'] }
    );
    expect(tabla.every((f) => f.jugados === 0)).toBe(true);
  });

  it('incluye a los inscritos que aún no han jugado', () => {
    const tabla = calcularClasificacion([], { ...puntos, participantes: ['a', 'b'] });
    expect(tabla).toHaveLength(2);
    expect(tabla[0].jugados).toBe(0);
  });

  it('desempata por enfrentamiento directo en individual', () => {
    // a y b acaban con los mismos puntos y la misma diferencia
    const partidos = [
      partido('p1', ['a'], ['b'], '6-4'),
      partido('p2', ['b'], ['a'], '4-6'),
      partido('p3', ['a'], ['c'], '2-6'),
      partido('p4', ['b'], ['c'], '4-6'),
    ];
    const tabla = calcularClasificacion(partidos, puntos);
    const pos = tabla.map((f) => f.participanteId);
    expect(pos.indexOf('a')).toBeLessThan(pos.indexOf('b'));
  });
});

describe('aplicarAscensos', () => {
  const clasif = (ids: string[]) =>
    ids.map((participanteId, i) => ({
      participanteId,
      puesto: i + 1,
      jugados: 0,
      ganados: 0,
      perdidos: 0,
      setsFavor: 0,
      setsContra: 0,
      juegosFavor: 0,
      juegosContra: 0,
      puntos: 0,
    }));

  it('sube a los primeros y baja a los últimos', () => {
    const movimientos = aplicarAscensos(
      [
        { orden: 1, clasificacion: clasif(['a1', 'a2', 'a3', 'a4']) },
        { orden: 2, clasificacion: clasif(['b1', 'b2', 'b3', 'b4']) },
      ],
      { sube: 1, baja: 1 }
    );
    const de = (id: string) => movimientos.find((m) => m.jugadorId === id);

    expect(de('a1')?.movimiento).toBe('permanece'); // ya está en la más alta
    expect(de('a4')).toMatchObject({ movimiento: 'desciende', hasta: 2 });
    expect(de('b1')).toMatchObject({ movimiento: 'asciende', hasta: 1 });
    expect(de('b4')?.movimiento).toBe('permanece'); // no hay división por debajo
  });
});
