import {
  aplicarReto,
  estadoTrasPlazo,
  fechaLimiteReto,
  normalizar,
  puedeRetar,
  retablesPara,
  sembrarEscalera,
} from './escalera';

const escalera = sembrarEscalera(['a', 'b', 'c', 'd', 'e']).map(
  ({ jugadorId, posicion }) => ({ jugadorId, posicion })
);
const reglas = { rangoReto: 3, retosSimultaneos: 1 };

describe('puedeRetar', () => {
  it('permite retar hacia arriba dentro del rango', () => {
    expect(puedeRetar(escalera, 'd', 'b', reglas, []).ok).toBe(true);
  });

  it('no permite retar hacia abajo', () => {
    expect(puedeRetar(escalera, 'b', 'd', reglas, []).motivo).toMatch(/hacia arriba/i);
  });

  it('no permite saltarse el rango', () => {
    expect(puedeRetar(escalera, 'e', 'a', reglas, []).motivo).toMatch(/3 puestos/i);
  });

  it('bloquea si el retador ya tiene un reto abierto', () => {
    const retos = [{ retadorId: 'd', retadoId: 'c', estado: 'aceptado' as const }];
    expect(puedeRetar(escalera, 'd', 'b', reglas, retos).motivo).toMatch(/en marcha/i);
  });

  it('bloquea si el retado ya está defendiendo otro reto', () => {
    const retos = [{ retadorId: 'e', retadoId: 'b', estado: 'propuesto' as const }];
    expect(puedeRetar(escalera, 'd', 'b', reglas, retos).motivo).toMatch(/ese jugador/i);
  });

  it('los retos cerrados no bloquean', () => {
    const retos = [{ retadorId: 'd', retadoId: 'c', estado: 'jugado' as const }];
    expect(puedeRetar(escalera, 'd', 'b', reglas, retos).ok).toBe(true);
  });
});

describe('retablesPara', () => {
  it('devuelve solo los que están dentro del rango', () => {
    expect(retablesPara(escalera, 'd', reglas, []).map((p) => p.jugadorId)).toEqual([
      'a',
      'b',
      'c',
    ]);
  });

  it('el primero no puede retar a nadie', () => {
    expect(retablesPara(escalera, 'a', reglas, [])).toEqual([]);
  });
});

describe('aplicarReto', () => {
  it('si gana el retador le quita el puesto y los de en medio bajan', () => {
    const tras = aplicarReto(escalera, 'd', 'b', true);
    expect(tras).toEqual([
      { jugadorId: 'a', posicion: 1 },
      { jugadorId: 'd', posicion: 2 },
      { jugadorId: 'b', posicion: 3 },
      { jugadorId: 'c', posicion: 4 },
      { jugadorId: 'e', posicion: 5 },
    ]);
  });

  it('si gana el retado la escalera no se mueve', () => {
    expect(aplicarReto(escalera, 'd', 'b', false)).toEqual(normalizar(escalera));
  });

  it('ignora un resultado incoherente con las posiciones', () => {
    expect(aplicarReto(escalera, 'b', 'd', true)).toEqual(normalizar(escalera));
  });
});

describe('plazos', () => {
  it('suma los días del reglamento', () => {
    expect(fechaLimiteReto('2026-07-25', 14)).toBe('2026-08-08');
  });

  it('un reto aceptado fuera de plazo caduca', () => {
    const reto = { estado: 'aceptado' as const, fechaLimite: '2026-07-01' };
    expect(estadoTrasPlazo(reto, '2026-07-25')).toBe('caducado');
  });

  it('dentro de plazo sigue vivo', () => {
    const reto = { estado: 'aceptado' as const, fechaLimite: '2026-08-01' };
    expect(estadoTrasPlazo(reto, '2026-07-25')).toBe('aceptado');
  });
});
