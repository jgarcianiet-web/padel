import { fmtFecha, fmtMes, hoy } from './date';

describe('date', () => {
  test('hoy devuelve ISO yyyy-mm-dd', () => {
    expect(hoy()).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  test('fmtFecha formatea día y mes corto en español', () => {
    expect(fmtFecha('2026-07-12')).toBe('12 jul');
    expect(fmtFecha('2026-01-01')).toBe('1 ene');
    expect(fmtFecha('2026-12-31')).toBe('31 dic');
  });

  test('fmtMes formatea mes largo capitalizado con año', () => {
    expect(fmtMes('2026-07-12')).toBe('Julio de 2026');
    expect(fmtMes('2025-09-03')).toBe('Septiembre de 2025');
  });
});
