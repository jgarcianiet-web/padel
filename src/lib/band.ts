import { GOLPES } from '../constants/catalogos';
import { CapturaBand, GolpeSesion } from '../types/domain';

// Campos del formulario de partido que pueden rellenar las capturas de
// Padel Band. Cada tipo de captura toca SOLO sus campos, de modo que subir
// las dos capturas produce el mismo resultado en cualquier orden.
export interface PatchCaptura {
  // pantalla de golpes
  nivelBand?: string;
  golpesSesion?: GolpeSesion[];
  mejorGolpe?: string;
  mejorPunt?: number;
  peorGolpe?: string;
  peorPunt?: number;
  // pantalla "Progreso de la sesión"
  bandInicio?: string;
  bandFin?: string;
  bandMediaJugador?: string;
}

const aLista = (n: string): string =>
  GOLPES.find((g) => g.toLowerCase() === n.toLowerCase()) || n;

// Media aritmética de las notas redondeada a 1 decimal.
export const mediaGolpes = (golpes: GolpeSesion[]): string =>
  (golpes.reduce((a, g) => a + g.nota, 0) / golpes.length).toFixed(1);

export function aplicarCaptura(captura: CapturaBand): PatchCaptura {
  if (captura.tipo === 'golpes') {
    if (captura.golpes.length > 0) {
      const mejor = [...captura.golpes].sort((a, b) => b.nota - a.nota)[0];
      const peor = [...captura.golpes].sort((a, b) => a.nota - b.nota)[0];
      return {
        nivelBand: mediaGolpes(captura.golpes),
        golpesSesion: captura.golpes,
        mejorGolpe: aLista(mejor.nombre),
        mejorPunt: Math.round(mejor.nota),
        peorGolpe: aLista(peor.nombre),
        peorPunt: Math.round(peor.nota),
      };
    }
    if (captura.nivelSesion != null) {
      return { nivelBand: String(captura.nivelSesion) };
    }
    return {};
  }
  if (captura.tipo === 'progreso') {
    const patch: PatchCaptura = {};
    if (captura.inicio != null) patch.bandInicio = String(captura.inicio);
    if (captura.fin != null) patch.bandFin = String(captura.fin);
    if (captura.mediaJugador != null) patch.bandMediaJugador = String(captura.mediaJugador);
    return patch;
  }
  return {};
}

// true cuando la captura no aporta ningún dato utilizable.
export const capturaVacia = (captura: CapturaBand): boolean =>
  Object.keys(aplicarCaptura(captura)).length === 0;

// Parseo de la respuesta JSON del modelo de visión (ya sin fences Markdown).
export function parseCapturaBand(texto: string): CapturaBand {
  const parsed = JSON.parse(texto);
  if (parsed.tipo === 'progreso') {
    return {
      tipo: 'progreso',
      inicio: typeof parsed.inicio === 'number' ? parsed.inicio : null,
      fin: typeof parsed.fin === 'number' ? parsed.fin : null,
      mediaJugador: typeof parsed.mediaJugador === 'number' ? parsed.mediaJugador : null,
    };
  }
  // retro-compatible: si el modelo no etiqueta el tipo pero devuelve golpes
  // o nivelSesion, lo tratamos como pantalla de golpes
  if (parsed.tipo === 'golpes' || parsed.golpes || parsed.nivelSesion != null) {
    const golpes: GolpeSesion[] = (parsed.golpes || []).filter(
      (g: { nombre?: string; nota?: unknown }) => g.nombre && typeof g.nota === 'number'
    );
    return {
      tipo: 'golpes',
      nivelSesion: typeof parsed.nivelSesion === 'number' ? parsed.nivelSesion : null,
      golpes,
    };
  }
  return { tipo: 'desconocido' };
}
