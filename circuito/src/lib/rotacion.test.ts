import {
  formarMesas,
  generarJornada,
  repartoMesas,
  rondasMesa,
  roundRobinIndividual,
} from './rotacion';

const parejasDe = (rondas: ReturnType<typeof rondasMesa>) =>
  rondas.flatMap((r) => [
    [...r.equipoA].sort().join('-'),
    [...r.equipoB].sort().join('-'),
  ]);

describe('rondasMesa', () => {
  it('con 4 jugadores cada uno juega una vez con cada compañero', () => {
    const rondas = rondasMesa(['a', 'b', 'c', 'd']);
    expect(rondas).toHaveLength(3);
    const parejas = parejasDe(rondas);
    expect(new Set(parejas).size).toBe(6); // las 6 parejas posibles
  });

  it('con 5 jugadores descansa uno por ronda y no se repite pareja', () => {
    const rondas = rondasMesa(['a', 'b', 'c', 'd', 'e']);
    expect(rondas).toHaveLength(5);
    const parejas = parejasDe(rondas);
    expect(parejas).toHaveLength(10);
    expect(new Set(parejas).size).toBe(10); // las 10 parejas posibles

    // cada jugador descansa exactamente una vez y juega cuatro rondas
    for (const j of ['a', 'b', 'c', 'd', 'e']) {
      expect(rondas.filter((r) => r.descansan.includes(j))).toHaveLength(1);
      expect(
        rondas.filter((r) => [...r.equipoA, ...r.equipoB].includes(j))
      ).toHaveLength(4);
    }
  });

  it('rechaza tamaños que no sabe rotar', () => {
    expect(() => rondasMesa(['a', 'b', 'c'])).toThrow(/4 o 5/);
  });
});

describe('repartoMesas', () => {
  it.each([
    [8, [4, 4]],
    [9, [4, 5]],
    [10, [5, 5]],
    [12, [4, 4, 4]],
    [16, [4, 4, 4, 4]],
  ])('reparte %i jugadores en %j', (total, esperado) => {
    expect(repartoMesas(total, 4).sort()).toEqual([...esperado].sort());
  });

  it('sienta a todo el mundo que puede cuando no hay reparto exacto', () => {
    expect(repartoMesas(6, 4)).toEqual([5]); // uno descansa
    expect(repartoMesas(7, 4)).toEqual([5]); // dos descansan
    expect(repartoMesas(11, 4).sort()).toEqual([5, 5]); // uno descansa
  });

  it('con menos de 4 no hay mesa', () => {
    expect(repartoMesas(3, 4)).toEqual([]);
  });
});

describe('formarMesas', () => {
  it('agrupa por orden de clasificación', () => {
    const orden = ['1', '2', '3', '4', '5', '6', '7', '8'];
    expect(formarMesas(orden, 4).mesas).toEqual([
      ['1', '2', '3', '4'],
      ['5', '6', '7', '8'],
    ]);
  });

  it('deja fuera a la cola cuando no cuadra', () => {
    const orden = ['1', '2', '3', '4', '5', '6'];
    const { mesas, sinMesa } = formarMesas(orden, 4);
    expect(mesas).toEqual([['1', '2', '3', '4', '5']]);
    expect(sinMesa).toEqual(['6']);
  });
});

describe('generarJornada', () => {
  it('expande cada mesa en sus rondas', () => {
    const orden = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const { partidos, descansan } = generarJornada(orden, 4);
    expect(partidos).toHaveLength(6); // 2 mesas × 3 rondas
    expect(descansan).toEqual([]);
    expect(new Set(partidos.map((p) => p.ronda))).toEqual(
      new Set(['Mesa 1', 'Mesa 2'])
    );
  });
});

describe('roundRobinIndividual', () => {
  it('cada jugador se enfrenta una vez a cada rival', () => {
    const jugadas = roundRobinIndividual(['a', 'b', 'c', 'd']);
    expect(jugadas).toHaveLength(3);
    const cruces = jugadas
      .flat()
      .map((p) => [p.equipoA[0], p.equipoB[0]].sort().join('-'));
    expect(new Set(cruces).size).toBe(6);
  });

  it('con impares cada jornada descansa uno', () => {
    const jugadas = roundRobinIndividual(['a', 'b', 'c']);
    expect(jugadas).toHaveLength(3);
    expect(jugadas.every((j) => j.length === 1)).toBe(true);
  });
});
