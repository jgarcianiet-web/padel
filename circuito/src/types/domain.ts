// Contrato de datos de la competición. Es el mismo vocabulario que usan las
// tablas de Supabase (supabase/migrations), pero en camelCase: la capa de
// src/api traduce snake_case ⇄ camelCase en un único sitio.

export type TipoCompeticion =
  | 'liga_divisiones' // estilo Pádel o Nada: inscripción individual, rotación de parejas
  | 'escalera' // ranking individual por retos
  | 'torneo_parejas' // parejas fijas: grupos y/o cuadro
  | 'liga_individual'; // 1 vs 1, solo en clubes con pista individual

export type EstadoCompeticion =
  | 'borrador'
  | 'inscripcion'
  | 'en_curso'
  | 'finalizada';

export type Modalidad = 'parejas' | 'individual';

export type EstadoPartido =
  | 'programado'
  | 'pendiente' // resultado subido por un jugador, falta que lo confirme el rival
  | 'confirmado'
  | 'anulado';

export type EstadoReto =
  | 'propuesto'
  | 'aceptado'
  | 'jugado'
  | 'rechazado'
  | 'caducado';

export type Lado = 'a' | 'b';

export type PosicionPista = 'reves' | 'derecha' | 'ambas';

export interface Perfil {
  id: string;
  nombre: string;
  apodo: string | null;
  ciudad: string | null;
  posicion: PosicionPista | null;
  nivel: number | null; // escala Playtomic 1.0 – 7.0
  telefono: string | null;
  avatarUrl: string | null;
}

export interface Club {
  id: string;
  nombre: string;
  ciudad: string;
  direccion: string | null;
  web: string | null;
  telefono: string | null;
  pistasDobles: number;
  // Clave para la liga individual: casi ningún club tiene pista individual,
  // así que el directorio marca cuáles sí y la liga 1 vs 1 solo puede
  // celebrarse en ellos.
  pistasIndividuales: number;
  indoor: boolean | null;
  notas: string | null;
}

// ─── Reglas por tipo de competición (columna jsonb `reglas`) ────────────────

export interface ReglasComunes {
  /** Sets necesarios para ganar: 1 = a un set, 2 = al mejor de tres. */
  setsParaGanar: 1 | 2;
  /** Punto de oro en lugar de ventajas. */
  puntoOro: boolean;
  puntosVictoria: number;
  puntosDerrota: number;
}

export interface ReglasLigaDivisiones extends ReglasComunes {
  tipo: 'liga_divisiones';
  /** Jugadores por mesa en cada jornada. 4 → 3 partidos; 5 → 5 partidos. */
  jugadoresPorMesa: 4 | 5;
  jornadas: number;
  /** Cuántos ascienden y descienden al cerrar la temporada. */
  sube: number;
  baja: number;
}

export interface ReglasEscalera extends ReglasComunes {
  tipo: 'escalera';
  /** Cuántos puestos por encima puedes retar. */
  rangoReto: number;
  /** Días para disputar un reto aceptado antes de caducar. */
  diasParaJugar: number;
  /** Retos abiertos simultáneos por jugador. */
  retosSimultaneos: number;
}

export interface ReglasTorneoParejas extends ReglasComunes {
  tipo: 'torneo_parejas';
  faseGrupos: boolean;
  equiposPorGrupo: number;
  clasificanPorGrupo: number;
}

export interface ReglasLigaIndividual extends ReglasComunes {
  tipo: 'liga_individual';
  jornadas: number;
  sube: number;
  baja: number;
}

export type Reglas =
  | ReglasLigaDivisiones
  | ReglasEscalera
  | ReglasTorneoParejas
  | ReglasLigaIndividual;

export interface Competicion {
  id: string;
  tipo: TipoCompeticion;
  nombre: string;
  descripcion: string | null;
  ciudad: string | null;
  clubId: string | null;
  organizadorId: string;
  estado: EstadoCompeticion;
  temporada: string | null; // "T1 2026"
  fechaInicio: string | null; // ISO yyyy-mm-dd
  fechaFin: string | null;
  plazas: number | null;
  reglas: Reglas;
  creadaEn: string;
}

export interface Division {
  id: string;
  competicionId: string;
  nombre: string; // "Primera", "Segunda"…
  orden: number; // 1 = la más alta
}

export interface Jornada {
  id: string;
  competicionId: string;
  divisionId: string | null;
  numero: number;
  fechaInicio: string | null;
  fechaFin: string | null;
}

export interface Inscripcion {
  id: string;
  competicionId: string;
  jugadorId: string;
  divisionId: string | null;
  parejaId: string | null;
  estado: 'pendiente' | 'aceptada' | 'baja';
  creadaEn: string;
}

export interface Pareja {
  id: string;
  competicionId: string;
  nombre: string | null;
  jugadorA: string;
  jugadorB: string;
}

export interface SetMarcador {
  a: number;
  b: number;
  tbA: number | null;
  tbB: number | null;
}

export interface Partido {
  id: string;
  competicionId: string;
  divisionId: string | null;
  jornadaId: string | null;
  modalidad: Modalidad;
  /** "mesa-1", "grupo-A", "cuartos", "final", "reto"… */
  ronda: string | null;
  orden: number;
  clubId: string | null;
  fecha: string | null;
  estado: EstadoPartido;
  equipoA: string[]; // 1 id en individual, 2 en parejas
  equipoB: string[];
  sets: SetMarcador[] | null;
  ganador: Lado | null;
  reportadoPor: string | null;
  confirmadoPor: string | null;
}

export interface PuestoEscalera {
  competicionId: string;
  jugadorId: string;
  posicion: number; // 1 = arriba del todo
}

export interface Reto {
  id: string;
  competicionId: string;
  retadorId: string;
  retadoId: string;
  estado: EstadoReto;
  fechaLimite: string | null;
  partidoId: string | null;
  creadoEn: string;
}

// ─── Resultados calculados ─────────────────────────────────────────────────

export interface FilaClasificacion {
  /** Id de jugador o de pareja según la competición. */
  participanteId: string;
  puesto: number;
  jugados: number;
  ganados: number;
  perdidos: number;
  setsFavor: number;
  setsContra: number;
  juegosFavor: number;
  juegosContra: number;
  puntos: number;
}

export interface Enfrentamiento {
  ronda: number;
  equipoA: string[];
  equipoB: string[];
  /** Jugadores que descansan en esa ronda (mesas de 5). */
  descansan: string[];
}
