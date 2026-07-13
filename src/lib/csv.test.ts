import { exportarCSV } from './csv';
import { mkMatch } from './fixtures';

describe('exportarCSV', () => {
  test('empieza con BOM y cabecera de 19 columnas', () => {
    const csv = exportarCSV([]);
    expect(csv.charCodeAt(0)).toBe(0xfeff);
    const cabecera = csv.slice(1).split('\n')[0].split(';');
    expect(cabecera).toEqual([
      'fecha', 'tipo', 'resultado', 'sets', 'posicion', 'club', 'companero',
      'nivel_playtomic', 'nivel_padel_band_sesion', 'mejor_golpe',
      'mejor_golpe_punt', 'peor_golpe', 'peor_golpe_punt', 'objetivo_1',
      'objetivo_2', 'objetivo_3', 'objetivos_cumplidos', 'bien_jugado', 'nota',
    ]);
  });

  test('fila con decimales con coma, escapado y bien_jugado', () => {
    const m = mkMatch({
      fecha: '2026-07-12',
      sets: '6-4, 7-6(8-6)',
      nivel: 3.42,
      nivelBand: 3.5,
      club: 'Club "El 20"',
      objetivos: [true, false, true],
      nota: 'gran partido',
    });
    const fila = exportarCSV([m]).split('\n')[1].split(';');
    expect(fila[0]).toBe('2026-07-12');
    expect(fila[3]).toBe('"6-4, 7-6(8-6)"');
    expect(fila[5]).toBe('"Club ""El 20"""');
    expect(fila[7]).toBe('3,42');
    expect(fila[8]).toBe('3,5');
    expect(fila.slice(13, 18)).toEqual(['1', '0', '1', '2', '1']);
    expect(fila[18]).toBe('"gran partido"');
  });

  test('campos nulos quedan vacíos', () => {
    const m = mkMatch({
      nivel: null,
      nivelBand: null,
      mejorGolpe: null,
      mejorPunt: null,
      peorGolpe: null,
      peorPunt: null,
      objetivos: [false, false, false],
    });
    const fila = exportarCSV([m]).split('\n')[1].split(';');
    expect(fila[7]).toBe('');
    expect(fila[8]).toBe('');
    expect(fila[10]).toBe('');
    expect(fila[17]).toBe('0');
  });
});
