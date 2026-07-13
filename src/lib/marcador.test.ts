import {
  calcularResultado,
  esTiebreak,
  formatearSets,
  marcadorVacio,
  setCompleto,
} from './marcador';
import { SetMarcador } from '../types/domain';

const set = (yo: string, rival: string, tbYo = '', tbRival = ''): SetMarcador => ({
  yo,
  rival,
  tbYo,
  tbRival,
});

describe('marcador', () => {
  test('esTiebreak detecta 7-6 y 6-7, no otros', () => {
    expect(esTiebreak(set('7', '6'))).toBe(true);
    expect(esTiebreak(set('6', '7'))).toBe(true);
    expect(esTiebreak(set('6', '4'))).toBe(false);
    expect(esTiebreak(set('7', '5'))).toBe(false);
    expect(esTiebreak(set('', ''))).toBe(false);
  });

  test('setCompleto exige ambos valores', () => {
    expect(setCompleto(set('6', '4'))).toBe(true);
    expect(setCompleto(set('6', ''))).toBe(false);
    expect(setCompleto(set('', ''))).toBe(false);
  });

  test('resultado null sin sets completos', () => {
    expect(calcularResultado(marcadorVacio())).toBeNull();
  });

  test('victoria y derrota por sets', () => {
    expect(calcularResultado([set('6', '4'), set('6', '3'), set('', '')])).toBe('victoria');
    expect(calcularResultado([set('4', '6'), set('3', '6'), set('', '')])).toBe('derrota');
  });

  test('empate a un set', () => {
    expect(calcularResultado([set('6', '4'), set('4', '6'), set('', '')])).toBe('empate');
  });

  test('tercer set decide', () => {
    expect(calcularResultado([set('6', '4'), set('4', '6'), set('7', '6')])).toBe('victoria');
  });

  test('formatearSets con y sin tie-break', () => {
    expect(formatearSets([set('6', '4'), set('7', '6', '8', '6'), set('3', '6')])).toBe(
      '6-4, 7-6(8-6), 3-6'
    );
    expect(formatearSets([set('6', '4'), set('', ''), set('', '')])).toBe('6-4');
    // tie-break sin resultado anotado: se muestra sin paréntesis
    expect(formatearSets([set('7', '6'), set('', ''), set('', '')])).toBe('7-6');
  });
});
