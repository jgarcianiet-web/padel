import { formatearSets, parseSets, resumirSets, validarSets } from './marcador';

describe('parseSets', () => {
  it('lee sets simples y con tie-break', () => {
    expect(parseSets('6-4, 7-6(8-6)')).toEqual([
      { a: 6, b: 4, tbA: null, tbB: null },
      { a: 7, b: 6, tbA: 8, tbB: 6 },
    ]);
  });

  it('ignora trozos ilegibles', () => {
    expect(parseSets('6-4, pendiente, 3-6')).toHaveLength(2);
  });

  it('formatear y parsear son inversos', () => {
    const texto = '6-4, 7-6(8-6), 3-6';
    expect(formatearSets(parseSets(texto))).toBe(texto);
  });
});

describe('resumirSets', () => {
  it('cuenta sets y juegos y decide ganador', () => {
    expect(resumirSets(parseSets('6-4, 3-6, 7-5'))).toEqual({
      setsA: 2,
      setsB: 1,
      juegosA: 16,
      juegosB: 15,
      ganador: 'a',
    });
  });

  it('resuelve por tie-break un set con juegos iguales', () => {
    expect(resumirSets(parseSets('6-6(7-5)')).ganador).toBe('a');
  });

  it('sin marcador no hay ganador', () => {
    expect(resumirSets(null).ganador).toBeNull();
  });
});

describe('validarSets', () => {
  const aUnSet = { setsParaGanar: 1 as const };
  const alMejorDeTres = { setsParaGanar: 2 as const };

  it('acepta un partido a un set', () => {
    expect(validarSets(parseSets('6-3'), aUnSet)).toBeNull();
  });

  it('rechaza el vacío', () => {
    expect(validarSets([], aUnSet)).toMatch(/al menos un set/i);
  });

  it('rechaza empate a sets', () => {
    expect(validarSets(parseSets('6-4, 3-6'), alMejorDeTres)).toMatch(/ganador/i);
  });

  it('rechaza más sets de los que permite el formato', () => {
    expect(validarSets(parseSets('6-4, 3-6, 6-4, 6-4'), alMejorDeTres)).toMatch(
      /mejor de 3/i
    );
  });

  it('rechaza un set empatado sin tie-break', () => {
    expect(validarSets(parseSets('6-6'), aUnSet)).toMatch(/empate/i);
  });
});
