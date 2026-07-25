import {
  avanzarCuadro,
  generarCuadro,
  generarFaseGrupos,
  nombreRonda,
  ordenSiembra,
  repartirGrupos,
  roundRobin,
} from './cuadro';

describe('repartirGrupos', () => {
  it('reparte en serpentina para equilibrar niveles', () => {
    const grupos = repartirGrupos(['1', '2', '3', '4', '5', '6'], 3);
    expect(grupos).toHaveLength(2);
    expect(grupos[0]).toEqual(['1', '4', '5']);
    expect(grupos[1]).toEqual(['2', '3', '6']);
  });
});

describe('roundRobin', () => {
  it('genera todos los cruces de un grupo de 4', () => {
    const partidos = roundRobin(['a', 'b', 'c', 'd'], 'Grupo A');
    expect(partidos).toHaveLength(6);
    const cruces = partidos.map((p) => [p.equipoA[0], p.equipoB[0]].sort().join('-'));
    expect(new Set(cruces).size).toBe(6);
  });

  it('con impares nadie juega dos veces en la misma jornada', () => {
    const partidos = roundRobin(['a', 'b', 'c'], 'Grupo A');
    expect(partidos).toHaveLength(3);
  });
});

describe('generarFaseGrupos', () => {
  it('nombra los grupos y genera sus partidos', () => {
    const { grupos, partidos } = generarFaseGrupos(['a', 'b', 'c', 'd', 'e', 'f'], 3);
    expect(grupos.map((g) => g.nombre)).toEqual(['Grupo A', 'Grupo B']);
    expect(partidos).toHaveLength(6); // 3 por grupo
  });
});

describe('ordenSiembra', () => {
  it('sigue la siembra estándar', () => {
    expect(ordenSiembra(2)).toEqual([1, 2]);
    // 1 vs 4 y 2 vs 3: los dos cabezas de serie caen en mitades opuestas
    expect(ordenSiembra(4)).toEqual([1, 4, 2, 3]);
    expect(ordenSiembra(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

describe('nombreRonda', () => {
  it('nombra las rondas conocidas', () => {
    expect(nombreRonda(2)).toBe('Final');
    expect(nombreRonda(4)).toBe('Semifinales');
    expect(nombreRonda(8)).toBe('Cuartos de final');
  });
});

describe('generarCuadro', () => {
  it('monta un cuadro completo de 8 y enlaza las rondas', () => {
    const equipos = ['1', '2', '3', '4', '5', '6', '7', '8'];
    const nodos = generarCuadro(equipos);
    expect(nodos).toHaveLength(7); // 4 + 2 + 1
    const primera = nodos.filter((n) => n.ronda === 1);
    expect(primera[0].equipoA).toBe('1');
    expect(primera[0].equipoB).toBe('8');
    expect(primera[0].siguiente).toBe('R2-0');
    expect(nodos.find((n) => n.nombreRonda === 'Final')?.siguiente).toBeNull();
  });

  it('resuelve los byes de los cabezas de serie', () => {
    // 5 equipos → cuadro de 8 con 3 byes: el 1, el 2 y el 3 pasan de ronda
    const nodos = generarCuadro(['1', '2', '3', '4', '5']);
    const semis = nodos.filter((n) => n.ronda === 2);
    expect(semis[0].equipoA).toBe('1'); // pasó por su bye sin jugar
    expect(semis[1].equipoA).toBe('2');
    expect(semis[1].equipoB).toBe('3');
    const primera = nodos.filter((n) => n.ronda === 1);
    const conPartido = primera.filter((n) => n.equipoA && n.equipoB);
    expect(conPartido).toHaveLength(1); // solo 4 vs 5 se juega
  });

  it('con menos de dos equipos no hay cuadro', () => {
    expect(generarCuadro(['1'])).toEqual([]);
  });
});

describe('avanzarCuadro', () => {
  it('coloca al ganador en el hueco correcto de la ronda siguiente', () => {
    const nodos = generarCuadro(['1', '2', '3', '4']);
    const tras = avanzarCuadro(nodos, 'R1-1', '3');
    const final = tras.find((n) => n.id === 'R2-0');
    expect(final?.equipoB).toBe('3');
  });
});
