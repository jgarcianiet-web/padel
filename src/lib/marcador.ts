import { ResultadoPartido, SetMarcador } from '../types/domain';

export const marcadorVacio = (): SetMarcador[] => [
  { yo: '', rival: '', tbYo: '', tbRival: '' },
  { yo: '', rival: '', tbYo: '', tbRival: '' },
  { yo: '', rival: '', tbYo: '', tbRival: '' },
];

export const esTiebreak = (s: SetMarcador): boolean => {
  const a = parseInt(s.yo, 10);
  const b = parseInt(s.rival, 10);
  return (a === 7 && b === 6) || (a === 6 && b === 7);
};

export const setCompleto = (s: SetMarcador): boolean => s.yo !== '' && s.rival !== '';

export const setsJugados = (marcador: SetMarcador[]): SetMarcador[] =>
  marcador.filter(setCompleto);

export const setsGanados = (marcador: SetMarcador[]): number =>
  setsJugados(marcador).filter((s) => parseInt(s.yo, 10) > parseInt(s.rival, 10)).length;

export const setsPerdidos = (marcador: SetMarcador[]): number =>
  setsJugados(marcador).filter((s) => parseInt(s.yo, 10) < parseInt(s.rival, 10)).length;

// null cuando no hay ningún set completo: el resultado se elige a mano.
export const calcularResultado = (marcador: SetMarcador[]): ResultadoPartido | null => {
  const jugados = setsJugados(marcador);
  if (jugados.length === 0) return null;
  const g = setsGanados(marcador);
  const p = setsPerdidos(marcador);
  return g > p ? 'victoria' : g < p ? 'derrota' : 'empate';
};

export const formatearSets = (marcador: SetMarcador[]): string =>
  setsJugados(marcador)
    .map((s) => {
      let t = `${s.yo}-${s.rival}`;
      if (esTiebreak(s) && s.tbYo !== '' && s.tbRival !== '') t += `(${s.tbYo}-${s.tbRival})`;
      return t;
    })
    .join(', ');
