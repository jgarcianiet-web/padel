// Contrato de datos: idéntico al de la web-app original para que la copia de
// seguridad JSON existente del usuario importe sin transformación alguna.
// No normalizar la asimetría string/number: perfil.* son strings (inputs de
// texto) y match.nivel/nivelBand son numbers.

export type TipoPartido = 'competitivo' | 'amistoso';
export type ResultadoPartido = 'victoria' | 'empate' | 'derrota';
export type Posicion = 'reves' | 'derecha';

export interface SetMarcador {
  yo: string;
  rival: string;
  tbYo: string;
  tbRival: string;
}

export interface GolpeSesion {
  nombre: string;
  nota: number;
}

// Recuento de golpes por tipo (pantalla de volumen de golpeo de Padel Band)
export interface GolpeVolumen {
  nombre: string;
  cantidad: number;
}

// Datos de salud del workout de Apple Watch vinculado al partido (fase 2).
export interface SaludPartido {
  duracionMin: number;
  pulsoMedio: number | null;
  pulsoMax: number | null;
  calorias: number | null;
}

export interface Match {
  id: number;
  fecha: string; // ISO yyyy-mm-dd
  tipo: TipoPartido;
  resultado: ResultadoPartido;
  posicion: Posicion;
  sets: string; // "6-4, 7-6(8-6), 3-6"
  marcador: SetMarcador[] | null;
  club: string;
  companero: string;
  nivel: number | null;
  nivelBand: number | null;
  mejorGolpe: string | null;
  mejorPunt: number | null;
  peorGolpe: string | null;
  peorPunt: number | null;
  golpesSesion: GolpeSesion[] | null;
  objetivos: boolean[]; // longitud 3
  nota: string;
  // Curva "Progreso de la sesión" de Padel Band (opcional; no existe en
  // backups de la web-app). NO alimenta nivelBand.
  bandInicio?: number | null;
  bandFin?: number | null;
  bandMediaJugador?: number | null;
  // Volumen de golpeo de la sesión (pantalla de recuento de Padel Band)
  golpesVolumen?: GolpeVolumen[] | null;
  totalGolpes?: number | null;
  // Workout de Apple Watch vinculado (opcional, fase 2)
  salud?: SaludPartido | null;
}

export interface Perfil {
  nivelPlaytomic: string;
  nivelBand: string;
  nivelObjetivo: string;
  fechaInicio: string;
}

export interface Analisis {
  lectura: string;
  patrones: string[];
  plan: string[];
  foco: string;
  objetivos: string[]; // 3 objetivos prescritos
  fecha: string;
  nPartidos: number;
}

export interface LigaState {
  matches: Match[];
  objetivos: string[]; // los 3 objetivos activos por partido
  perfil: Perfil;
  analisis: Analisis | null; // el último análisis (compatible con la web-app)
  analisisHistorial: Analisis[]; // todos los generados, en orden cronológico
}

export interface StatsFila {
  etiqueta: string;
  n: number;
  pctV: number | null;
  pctBJ: number | null;
}

export interface GolpeAgregado {
  golpe: string;
  veces: number;
  media: number;
}

export interface ChartPoint {
  fecha: string; // ya formateada para el eje X
  nivel: number | null;
  band: number | null;
}

export interface MesGrupo {
  clave: string; // "Julio de 2026"
  items: Match[];
}

// Respuesta de la lectura de captura de Padel Band (visión). Hay tres
// pantallas: notas de golpes, "Progreso de la sesión" y volumen de golpeo.
export type CapturaBand =
  | { tipo: 'golpes'; nivelSesion: number | null; golpes: GolpeSesion[] }
  | {
      tipo: 'progreso';
      inicio: number | null;
      fin: number | null;
      mediaJugador: number | null;
    }
  | { tipo: 'volumen'; total: number | null; golpes: GolpeVolumen[] }
  | { tipo: 'desconocido' };
