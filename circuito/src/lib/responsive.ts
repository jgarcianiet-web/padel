import { useWindowDimensions } from 'react-native';

// La misma app se usa desde el móvil en la pista y desde el ordenador en casa.
// Estos cortes son los que deciden si la navegación va abajo (pulgar) o a un
// lateral (ratón), y hasta dónde se deja crecer el contenido: una tabla de
// clasificación estirada a 1900 px no se lee.
export const CORTE_TABLET = 700;
export const CORTE_ESCRITORIO = 900;

/** Ancho máximo de una columna de lectura cómoda. */
export const ANCHO_LECTURA = 760;
/** Ancho para vistas que agradecen sitio: cuadros de torneo, calendarios. */
export const ANCHO_AMPLIO = 1100;

export interface Disposicion {
  ancho: number;
  alto: number;
  esTablet: boolean;
  esEscritorio: boolean;
}

export function useDisposicion(): Disposicion {
  const { width, height } = useWindowDimensions();
  return {
    ancho: width,
    alto: height,
    esTablet: width >= CORTE_TABLET,
    esEscritorio: width >= CORTE_ESCRITORIO,
  };
}
