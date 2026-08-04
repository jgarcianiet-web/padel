import { clasificarPendientes } from './sesionesReloj';

const sesionValida = JSON.stringify({
  sessionId: 'abc',
  schemaVersion: 1,
  startedAt: '2026-08-04T10:00:00Z',
  durationSeconds: 3600,
  shots: { total: 30, byType: { bandeja: 12, vibora: 8, smash: 10 } },
});

describe('clasificarPendientes (cola del reloj embebido)', () => {
  test('parsea cada sesión de la cola con su id nativo', () => {
    const [p] = clasificarPendientes([{ id: 'abc', datos: sesionValida }]);
    expect(p.id).toBe('abc');
    expect(p.error).toBeNull();
    expect(p.sesion?.totalGolpes).toBe(30);
    expect(p.sesion?.golpesVolumen).toEqual([
      { nombre: 'Bandeja', cantidad: 12 },
      { nombre: 'Víbora', cantidad: 8 },
      { nombre: 'Remate', cantidad: 10 },
    ]);
  });

  test('una sesión rota no tumba a las demás: queda con su error', () => {
    const pendientes = clasificarPendientes([
      { id: 'rota', datos: 'esto no es JSON' },
      { id: 'abc', datos: sesionValida },
    ]);
    expect(pendientes).toHaveLength(2);
    expect(pendientes[0].sesion).toBeNull();
    expect(pendientes[0].error).toMatch(/JSON válido/);
    expect(pendientes[1].sesion).not.toBeNull();
  });

  test('formato futuro: el error pide actualizar la app, como en el deep link', () => {
    const [p] = clasificarPendientes([
      {
        id: 'v9',
        datos: JSON.stringify({ schemaVersion: 9, startedAt: '2026-08-04T10:00:00Z' }),
      },
    ]);
    expect(p.sesion).toBeNull();
    expect(p.error).toMatch(/Actualiza Liga Personal Pádel/);
  });
});
