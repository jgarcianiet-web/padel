import { aplicarCaptura, capturaVacia, mediaGolpes, parseCapturaBand } from './band';
import { CapturaBand } from '../types/domain';

const capturaGolpes: CapturaBand = {
  tipo: 'golpes',
  nivelSesion: null,
  golpes: [
    { nombre: 'Bandeja', nota: 4.2 },
    { nombre: 'revés', nota: 2.1 },
    { nombre: 'Saque', nota: 5.5 },
  ],
};

const capturaProgreso: CapturaBand = {
  tipo: 'progreso',
  inicio: 3.2,
  fin: 3.8,
  mediaJugador: 3.5,
};

describe('aplicarCaptura: pantalla de golpes', () => {
  test('nivelBand = media aritmética redondeada a 1 decimal', () => {
    // (4.2 + 2.1 + 5.5) / 3 = 3.9333… → "3.9"
    expect(aplicarCaptura(capturaGolpes).nivelBand).toBe('3.9');
    expect(mediaGolpes(capturaGolpes.golpes)).toBe('3.9');
  });

  test('rellena mejor/peor golpe normalizando el nombre al catálogo', () => {
    const patch = aplicarCaptura(capturaGolpes);
    expect(patch.mejorGolpe).toBe('Saque');
    expect(patch.mejorPunt).toBe(6); // 5.5 redondeado
    expect(patch.peorGolpe).toBe('Revés'); // "revés" normalizado
    expect(patch.peorPunt).toBe(2);
    expect(patch.golpesSesion).toHaveLength(3);
  });

  test('NO toca los campos de la curva de progreso', () => {
    const patch = aplicarCaptura(capturaGolpes);
    expect(patch.bandInicio).toBeUndefined();
    expect(patch.bandFin).toBeUndefined();
    expect(patch.bandMediaJugador).toBeUndefined();
  });

  test('sin golpes pero con nivel global: usa nivelSesion', () => {
    const patch = aplicarCaptura({ tipo: 'golpes', nivelSesion: 4.1, golpes: [] });
    expect(patch.nivelBand).toBe('4.1');
    expect(patch.golpesSesion).toBeUndefined();
  });
});

describe('aplicarCaptura: pantalla Progreso de la sesión', () => {
  test('rellena solo bandInicio/bandFin/bandMediaJugador', () => {
    const patch = aplicarCaptura(capturaProgreso);
    expect(patch).toEqual({ bandInicio: '3.2', bandFin: '3.8', bandMediaJugador: '3.5' });
  });

  test('NO modifica el nivel Band de la sesión ni los golpes', () => {
    const patch = aplicarCaptura(capturaProgreso);
    expect(patch.nivelBand).toBeUndefined();
    expect(patch.golpesSesion).toBeUndefined();
    expect(patch.mejorGolpe).toBeUndefined();
  });

  test('valores ausentes no pisan nada', () => {
    const patch = aplicarCaptura({ tipo: 'progreso', inicio: 3.1, fin: null, mediaJugador: null });
    expect(patch).toEqual({ bandInicio: '3.1' });
  });
});

describe('independencia del orden', () => {
  test('golpes→progreso y progreso→golpes dan el mismo formulario', () => {
    const base = { nivelBand: '', bandInicio: '', bandFin: '', bandMediaJugador: '' };
    const ordenA = { ...base, ...aplicarCaptura(capturaGolpes), ...aplicarCaptura(capturaProgreso) };
    const ordenB = { ...base, ...aplicarCaptura(capturaProgreso), ...aplicarCaptura(capturaGolpes) };
    expect(ordenA).toEqual(ordenB);
    expect(ordenA.nivelBand).toBe('3.9'); // sigue siendo la media de los golpes
    expect(ordenA.bandInicio).toBe('3.2');
  });
});

describe('capturaVacia', () => {
  test('detecta capturas sin datos', () => {
    expect(capturaVacia({ tipo: 'desconocido' })).toBe(true);
    expect(capturaVacia({ tipo: 'golpes', nivelSesion: null, golpes: [] })).toBe(true);
    expect(capturaVacia({ tipo: 'progreso', inicio: null, fin: null, mediaJugador: null })).toBe(true);
    expect(capturaVacia(capturaGolpes)).toBe(false);
    expect(capturaVacia(capturaProgreso)).toBe(false);
  });
});

describe('parseCapturaBand', () => {
  test('parsea respuesta de golpes', () => {
    const c = parseCapturaBand(
      '{"tipo":"golpes","nivelSesion":3.5,"golpes":[{"nombre":"Bandeja","nota":4}]}'
    );
    expect(c.tipo).toBe('golpes');
    if (c.tipo === 'golpes') {
      expect(c.golpes).toEqual([{ nombre: 'Bandeja', nota: 4 }]);
      expect(c.nivelSesion).toBe(3.5);
    }
  });

  test('parsea respuesta de progreso', () => {
    const c = parseCapturaBand('{"tipo":"progreso","inicio":3.2,"fin":3.8,"mediaJugador":3.5}');
    expect(c).toEqual(capturaProgreso);
  });

  test('retro-compatible con respuestas sin tipo (formato web-app)', () => {
    const c = parseCapturaBand('{"nivelSesion":null,"golpes":[{"nombre":"Saque","nota":5}]}');
    expect(c.tipo).toBe('golpes');
  });

  test('descarta golpes malformados y tipos desconocidos', () => {
    const c = parseCapturaBand('{"tipo":"golpes","golpes":[{"nombre":"X"},{"nota":3},{"nombre":"Saque","nota":5}]}');
    if (c.tipo === 'golpes') expect(c.golpes).toEqual([{ nombre: 'Saque', nota: 5 }]);
    expect(parseCapturaBand('{"otra":"cosa"}')).toEqual({ tipo: 'desconocido' });
  });
});
