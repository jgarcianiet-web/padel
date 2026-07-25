import { reglasPorDefecto } from '../constants/reglas';
import {
  Club,
  Competicion,
  Division,
  Inscripcion,
  Jornada,
  Pareja,
  Partido,
  Perfil,
  PuestoEscalera,
  Reglas,
  Reto,
  SetMarcador,
  TipoCompeticion,
} from '../types/domain';

// Traducción snake_case (Postgres) ⇄ camelCase (app). Todo el resto del
// código trabaja solo con los tipos de domain.ts.

type Fila = Record<string, any>;

export const aPerfil = (f: Fila): Perfil => ({
  id: f.id,
  nombre: f.nombre ?? 'Jugador',
  apodo: f.apodo ?? null,
  ciudad: f.ciudad ?? null,
  posicion: f.posicion ?? null,
  nivel: f.nivel === null || f.nivel === undefined ? null : Number(f.nivel),
  telefono: f.telefono ?? null,
  avatarUrl: f.avatar_url ?? null,
});

export const dePerfil = (p: Partial<Perfil>): Fila => ({
  nombre: p.nombre,
  apodo: p.apodo,
  ciudad: p.ciudad,
  posicion: p.posicion,
  nivel: p.nivel,
  telefono: p.telefono,
  avatar_url: p.avatarUrl,
});

export const aClub = (f: Fila): Club => ({
  id: f.id,
  nombre: f.nombre,
  ciudad: f.ciudad,
  direccion: f.direccion ?? null,
  web: f.web ?? null,
  telefono: f.telefono ?? null,
  pistasDobles: f.pistas_dobles ?? 0,
  pistasIndividuales: f.pistas_individuales ?? 0,
  indoor: f.indoor ?? null,
  notas: f.notas ?? null,
});

export const deClub = (c: Partial<Club> & { creadoPor?: string }): Fila => ({
  nombre: c.nombre,
  ciudad: c.ciudad,
  direccion: c.direccion,
  web: c.web,
  telefono: c.telefono,
  pistas_dobles: c.pistasDobles ?? 0,
  pistas_individuales: c.pistasIndividuales ?? 0,
  indoor: c.indoor,
  notas: c.notas,
  creado_por: c.creadoPor,
});

/** Las reglas viven en un jsonb: si vienen incompletas, se completan con las de fábrica. */
export const aReglas = (tipo: TipoCompeticion, valor: unknown): Reglas => {
  const base = reglasPorDefecto(tipo);
  if (!valor || typeof valor !== 'object') return base;
  return { ...base, ...(valor as object), tipo } as Reglas;
};

export const aCompeticion = (f: Fila): Competicion => ({
  id: f.id,
  tipo: f.tipo,
  nombre: f.nombre,
  descripcion: f.descripcion ?? null,
  ciudad: f.ciudad ?? null,
  clubId: f.club_id ?? null,
  organizadorId: f.organizador_id,
  estado: f.estado,
  temporada: f.temporada ?? null,
  fechaInicio: f.fecha_inicio ?? null,
  fechaFin: f.fecha_fin ?? null,
  plazas: f.plazas ?? null,
  reglas: aReglas(f.tipo, f.reglas),
  creadaEn: f.creada_en ?? '',
});

export const deCompeticion = (c: Partial<Competicion>): Fila => ({
  tipo: c.tipo,
  nombre: c.nombre,
  descripcion: c.descripcion,
  ciudad: c.ciudad,
  club_id: c.clubId,
  organizador_id: c.organizadorId,
  estado: c.estado,
  temporada: c.temporada,
  fecha_inicio: c.fechaInicio,
  fecha_fin: c.fechaFin,
  plazas: c.plazas,
  reglas: c.reglas,
});

export const aDivision = (f: Fila): Division => ({
  id: f.id,
  competicionId: f.competicion_id,
  nombre: f.nombre,
  orden: f.orden,
});

export const aJornada = (f: Fila): Jornada => ({
  id: f.id,
  competicionId: f.competicion_id,
  divisionId: f.division_id ?? null,
  numero: f.numero,
  fechaInicio: f.fecha_inicio ?? null,
  fechaFin: f.fecha_fin ?? null,
});

export const aInscripcion = (f: Fila): Inscripcion => ({
  id: f.id,
  competicionId: f.competicion_id,
  jugadorId: f.jugador_id,
  divisionId: f.division_id ?? null,
  parejaId: f.pareja_id ?? null,
  estado: f.estado,
  creadaEn: f.creada_en ?? '',
});

export const aPareja = (f: Fila): Pareja => ({
  id: f.id,
  competicionId: f.competicion_id,
  nombre: f.nombre ?? null,
  jugadorA: f.jugador_a,
  jugadorB: f.jugador_b,
});

const aSets = (valor: unknown): SetMarcador[] | null => {
  if (!Array.isArray(valor)) return null;
  return valor.map((s: Fila) => ({
    a: Number(s.a ?? 0),
    b: Number(s.b ?? 0),
    tbA: s.tbA === null || s.tbA === undefined ? null : Number(s.tbA),
    tbB: s.tbB === null || s.tbB === undefined ? null : Number(s.tbB),
  }));
};

export const aPartido = (f: Fila): Partido & { parejaA: string | null; parejaB: string | null } => ({
  id: f.id,
  competicionId: f.competicion_id,
  divisionId: f.division_id ?? null,
  jornadaId: f.jornada_id ?? null,
  modalidad: f.modalidad,
  ronda: f.ronda ?? null,
  orden: f.orden ?? 0,
  clubId: f.club_id ?? null,
  fecha: f.fecha ?? null,
  estado: f.estado,
  equipoA: f.equipo_a ?? [],
  equipoB: f.equipo_b ?? [],
  sets: aSets(f.sets),
  ganador: f.ganador ?? null,
  reportadoPor: f.reportado_por ?? null,
  confirmadoPor: f.confirmado_por ?? null,
  parejaA: f.pareja_a ?? null,
  parejaB: f.pareja_b ?? null,
});

export const aPuesto = (f: Fila): PuestoEscalera => ({
  competicionId: f.competicion_id,
  jugadorId: f.jugador_id,
  posicion: f.posicion,
});

export const aReto = (f: Fila): Reto => ({
  id: f.id,
  competicionId: f.competicion_id,
  retadorId: f.retador_id,
  retadoId: f.retado_id,
  estado: f.estado,
  fechaLimite: f.fecha_limite ?? null,
  partidoId: f.partido_id ?? null,
  creadoEn: f.creado_en ?? '',
});
