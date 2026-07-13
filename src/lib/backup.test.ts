import { estadoInicial, exportarBackup, importarBackup } from './backup';
import { BACKUP_BRIEF, mkMatch } from './fixtures';

describe('backup', () => {
  test('round-trip: exportar e importar el backup del brief no pierde nada', () => {
    const texto = exportarBackup(BACKUP_BRIEF);
    const importado = importarBackup(texto, estadoInicial());
    expect(importado).toEqual(BACKUP_BRIEF);
  });

  test('importa el JSON crudo de la web-app (shape del brief)', () => {
    const raw = JSON.stringify(BACKUP_BRIEF);
    const importado = importarBackup(raw, estadoInicial());
    expect(importado.matches).toHaveLength(1);
    expect(importado.matches[0].sets).toBe('6-4, 7-6(8-6), 3-6');
    expect(importado.perfil.nivelPlaytomic).toBe('3.20');
    expect(importado.analisis?.nPartidos).toBe(3);
  });

  test('acepta espacios alrededor del texto pegado', () => {
    const raw = '  ' + JSON.stringify(BACKUP_BRIEF) + '\n';
    expect(importarBackup(raw, estadoInicial()).matches).toHaveLength(1);
  });

  test('backup sin objetivos/perfil/analisis conserva los actuales', () => {
    const actual = {
      ...estadoInicial(),
      objetivos: ['a', 'b', 'c'],
    };
    const importado = importarBackup(JSON.stringify({ matches: [mkMatch()] }), actual);
    expect(importado.objetivos).toEqual(['a', 'b', 'c']);
    expect(importado.perfil).toEqual(actual.perfil);
    expect(importado.analisis).toBeNull();
  });

  test('rechaza texto que no es backup', () => {
    expect(() => importarBackup('hola', estadoInicial())).toThrow();
    expect(() => importarBackup('{"matches": 5}', estadoInicial())).toThrow('formato');
    expect(() => importarBackup('{}', estadoInicial())).toThrow('formato');
  });

  test('el export solo contiene las 4 claves del contrato', () => {
    const texto = exportarBackup(estadoInicial());
    expect(Object.keys(JSON.parse(texto))).toEqual([
      'matches',
      'objetivos',
      'perfil',
      'analisis',
    ]);
  });
});
