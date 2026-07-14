import { GOLPES } from '../constants/catalogos';
import { CapturaBand, GolpeSesion, GolpeVolumen } from '../types/domain';

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
  // pantalla de volumen de golpeo
  golpesVolumen?: GolpeVolumen[];
  totalGolpes?: number;
}

// Nombre canónico de un golpe: quita el sufijo de lado ("de derecha"/"de
// revés") con el que Padel Band separa volea y globo, y lo casa con el
// catálogo. "Volea de revés" → "Volea"; "globo de derecha" → "Globo".
export const golpeCanonico = (nombre: string): string => {
  const base = nombre.trim().replace(/\s+de\s+(derecha|rev[eé]s)$/i, '');
  return GOLPES.find((g) => g.toLowerCase() === base.toLowerCase()) || base;
};

const redondea1 = (n: number): number => Math.round(n * 10) / 10;

// Fusiona golpes con el mismo nombre canónico: la nota es la media de las
// variantes (1 decimal) y se conserva el orden de aparición.
export const fusionarGolpes = (golpes: GolpeSesion[]): GolpeSesion[] => {
  const orden: string[] = [];
  const acc: Record<string, { suma: number; n: number }> = {};
  golpes.forEach((g) => {
    const nombre = golpeCanonico(g.nombre);
    if (!acc[nombre]) {
      acc[nombre] = { suma: 0, n: 0 };
      orden.push(nombre);
    }
    acc[nombre].suma += g.nota;
    acc[nombre].n++;
  });
  return orden.map((nombre) => ({
    nombre,
    nota: redondea1(acc[nombre].suma / acc[nombre].n),
  }));
};

// Fusiona el volumen por nombre canónico sumando cantidades.
export const fusionarVolumen = (golpes: GolpeVolumen[]): GolpeVolumen[] => {
  const orden: string[] = [];
  const acc: Record<string, number> = {};
  golpes.forEach((g) => {
    const nombre = golpeCanonico(g.nombre);
    if (acc[nombre] == null) {
      acc[nombre] = 0;
      orden.push(nombre);
    }
    acc[nombre] += g.cantidad;
  });
  return orden.map((nombre) => ({ nombre, cantidad: acc[nombre] }));
};

// Media aritmética de las notas redondeada a 1 decimal.
export const mediaGolpes = (golpes: GolpeSesion[]): string =>
  (golpes.reduce((a, g) => a + g.nota, 0) / golpes.length).toFixed(1);

export function aplicarCaptura(captura: CapturaBand): PatchCaptura {
  if (captura.tipo === 'golpes') {
    if (captura.golpes.length > 0) {
      // unifica variantes por lado (volea/globo) antes de calcular nada
      const golpes = fusionarGolpes(captura.golpes);
      const mejor = [...golpes].sort((a, b) => b.nota - a.nota)[0];
      const peor = [...golpes].sort((a, b) => a.nota - b.nota)[0];
      return {
        nivelBand: mediaGolpes(golpes),
        golpesSesion: golpes,
        mejorGolpe: mejor.nombre,
        mejorPunt: Math.round(mejor.nota),
        peorGolpe: peor.nombre,
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
  if (captura.tipo === 'volumen') {
    const patch: PatchCaptura = {};
    if (captura.golpes.length > 0) {
      patch.golpesVolumen = fusionarVolumen(captura.golpes);
    }
    const total =
      captura.total ?? (captura.golpes.length > 0
        ? captura.golpes.reduce((a, g) => a + g.cantidad, 0)
        : null);
    if (total != null) patch.totalGolpes = total;
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
  if (parsed.tipo === 'volumen') {
    const golpes: GolpeVolumen[] = (parsed.golpes || []).filter(
      (g: { nombre?: string; cantidad?: unknown }) =>
        g.nombre && typeof g.cantidad === 'number' && g.cantidad >= 0
    );
    return {
      tipo: 'volumen',
      total: typeof parsed.total === 'number' ? parsed.total : null,
      golpes,
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
