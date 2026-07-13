import { Match } from '../types/domain';
import { bienJugado } from './metrics';

// CSV idéntico al de la web-app: separador ';', decimales con coma, BOM para
// que Excel lo abra con acentos correctos. Cabecera de 19 columnas fija.
export const exportarCSV = (matches: Match[]): string => {
  const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const filas = [
    [
      'fecha', 'tipo', 'resultado', 'sets', 'posicion', 'club', 'companero',
      'nivel_playtomic', 'nivel_padel_band_sesion', 'mejor_golpe',
      'mejor_golpe_punt', 'peor_golpe', 'peor_golpe_punt', 'objetivo_1',
      'objetivo_2', 'objetivo_3', 'objetivos_cumplidos', 'bien_jugado', 'nota',
    ].join(';'),
    ...matches.map((m) =>
      [
        m.fecha,
        m.tipo,
        m.resultado,
        esc(m.sets || ''),
        m.posicion || '',
        esc(m.club || ''),
        esc(m.companero || ''),
        m.nivel != null ? String(m.nivel).replace('.', ',') : '',
        m.nivelBand != null ? String(m.nivelBand).replace('.', ',') : '',
        esc(m.mejorGolpe || ''),
        m.mejorPunt ?? '',
        esc(m.peorGolpe || ''),
        m.peorPunt ?? '',
        m.objetivos[0] ? '1' : '0',
        m.objetivos[1] ? '1' : '0',
        m.objetivos[2] ? '1' : '0',
        m.objetivos.filter(Boolean).length,
        bienJugado(m) ? '1' : '0',
        esc(m.nota || ''),
      ].join(';')
    ),
  ];
  return '\uFEFF' + filas.join('\n');
};
