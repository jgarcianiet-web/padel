import { modalidadDe } from '../constants/reglas';
import { generarCuadro, generarFaseGrupos } from '../lib/cuadro';
import { generarJornada, roundRobinIndividual } from '../lib/rotacion';
import {
  Club,
  Competicion,
  Division,
  Inscripcion,
  Jornada,
  Lado,
  Pareja,
  Partido,
  Perfil,
  PuestoEscalera,
  Reglas,
  ReglasLigaDivisiones,
  Reto,
  SetMarcador,
  TipoCompeticion,
} from '../types/domain';
import { cliente } from './cliente';
import {
  aClub,
  aCompeticion,
  aDivision,
  aInscripcion,
  aJornada,
  aPareja,
  aPartido,
  aPerfil,
  aPuesto,
  aReto,
  deClub,
  deCompeticion,
  dePerfil,
} from './mapeo';

const revienta = (error: { message: string } | null) => {
  if (error) throw new Error(error.message);
};

// ─── Perfil ────────────────────────────────────────────────────────────────

export async function miPerfil(id: string): Promise<Perfil | null> {
  const { data, error } = await cliente()
    .from('perfiles')
    .select('*')
    .eq('id', id)
    .maybeSingle();
  revienta(error);
  return data ? aPerfil(data) : null;
}

export async function guardarPerfil(id: string, cambios: Partial<Perfil>) {
  const { error } = await cliente()
    .from('perfiles')
    .update(dePerfil(cambios))
    .eq('id', id);
  revienta(error);
}

export async function perfilesPorId(ids: string[]): Promise<Record<string, Perfil>> {
  const unicos = [...new Set(ids)].filter(Boolean);
  if (unicos.length === 0) return {};
  const { data, error } = await cliente().from('perfiles').select('*').in('id', unicos);
  revienta(error);
  return Object.fromEntries((data ?? []).map((f) => [f.id, aPerfil(f)]));
}

// ─── Clubes ────────────────────────────────────────────────────────────────

export async function listarClubes(opciones?: {
  ciudad?: string;
  soloIndividual?: boolean;
}): Promise<Club[]> {
  let q = cliente().from('clubes').select('*').order('nombre');
  if (opciones?.ciudad) q = q.eq('ciudad', opciones.ciudad);
  if (opciones?.soloIndividual) q = q.gt('pistas_individuales', 0);
  const { data, error } = await q;
  revienta(error);
  return (data ?? []).map(aClub);
}

export async function crearClub(club: Partial<Club>, creadoPor: string): Promise<Club> {
  const { data, error } = await cliente()
    .from('clubes')
    .insert(deClub({ ...club, creadoPor }))
    .select()
    .single();
  revienta(error);
  return aClub(data);
}

// ─── Competiciones ─────────────────────────────────────────────────────────

export async function listarCompeticiones(filtros?: {
  tipo?: TipoCompeticion;
  ciudad?: string;
  abiertas?: boolean;
}): Promise<Competicion[]> {
  let q = cliente().from('competiciones').select('*').order('creada_en', { ascending: false });
  if (filtros?.tipo) q = q.eq('tipo', filtros.tipo);
  if (filtros?.ciudad) q = q.eq('ciudad', filtros.ciudad);
  if (filtros?.abiertas) q = q.in('estado', ['inscripcion', 'en_curso']);
  const { data, error } = await q;
  revienta(error);
  return (data ?? []).map(aCompeticion);
}

/** Competiciones en las que juego o que organizo. */
export async function misCompeticiones(uid: string): Promise<Competicion[]> {
  const [inscritas, organizadas] = await Promise.all([
    cliente().from('inscripciones').select('competicion_id').eq('jugador_id', uid),
    cliente().from('competiciones').select('*').eq('organizador_id', uid),
  ]);
  revienta(inscritas.error);
  revienta(organizadas.error);

  const ids = (inscritas.data ?? []).map((f) => f.competicion_id);
  const propias = (organizadas.data ?? []).map(aCompeticion);
  const faltan = ids.filter((id) => !propias.some((c) => c.id === id));
  if (faltan.length === 0) return propias;

  const { data, error } = await cliente().from('competiciones').select('*').in('id', faltan);
  revienta(error);
  return [...propias, ...(data ?? []).map(aCompeticion)].sort((a, b) =>
    b.creadaEn.localeCompare(a.creadaEn)
  );
}

export async function crearCompeticion(datos: {
  tipo: TipoCompeticion;
  nombre: string;
  descripcion?: string | null;
  ciudad?: string | null;
  clubId?: string | null;
  temporada?: string | null;
  fechaInicio?: string | null;
  plazas?: number | null;
  reglas: Reglas;
  organizadorId: string;
}): Promise<Competicion> {
  const { data, error } = await cliente()
    .from('competiciones')
    .insert(deCompeticion({ ...datos, estado: 'inscripcion' }))
    .select()
    .single();
  revienta(error);
  return aCompeticion(data);
}

export async function cambiarEstado(
  competicionId: string,
  estado: Competicion['estado']
) {
  const { error } = await cliente()
    .from('competiciones')
    .update({ estado })
    .eq('id', competicionId);
  revienta(error);
}

// ─── Carga completa de una competición ─────────────────────────────────────

export interface DatosCompeticion {
  competicion: Competicion;
  divisiones: Division[];
  jornadas: Jornada[];
  inscripciones: Inscripcion[];
  parejas: Pareja[];
  partidos: (Partido & { parejaA: string | null; parejaB: string | null })[];
  puestos: PuestoEscalera[];
  retos: Reto[];
  perfiles: Record<string, Perfil>;
}

export async function cargarCompeticion(id: string): Promise<DatosCompeticion> {
  const cab = await cliente().from('competiciones').select('*').eq('id', id).single();
  revienta(cab.error);
  const competicion = aCompeticion(cab.data);

  const [divisiones, jornadas, inscripciones, parejas, partidos, puestos, retos] =
    await Promise.all([
      cliente().from('divisiones').select('*').eq('competicion_id', id).order('orden'),
      cliente().from('jornadas').select('*').eq('competicion_id', id).order('numero'),
      cliente().from('inscripciones').select('*').eq('competicion_id', id),
      cliente().from('parejas').select('*').eq('competicion_id', id),
      cliente().from('partidos').select('*').eq('competicion_id', id).order('orden'),
      cliente().from('escalera_puestos').select('*').eq('competicion_id', id).order('posicion'),
      cliente().from('retos').select('*').eq('competicion_id', id).order('creado_en'),
    ]);

  for (const r of [divisiones, jornadas, inscripciones, parejas, partidos, puestos, retos])
    revienta(r.error);

  const ids = [
    competicion.organizadorId,
    ...(inscripciones.data ?? []).map((f) => f.jugador_id),
    ...(puestos.data ?? []).map((f) => f.jugador_id),
  ];

  return {
    competicion,
    divisiones: (divisiones.data ?? []).map(aDivision),
    jornadas: (jornadas.data ?? []).map(aJornada),
    inscripciones: (inscripciones.data ?? []).map(aInscripcion),
    parejas: (parejas.data ?? []).map(aPareja),
    partidos: (partidos.data ?? []).map(aPartido),
    puestos: (puestos.data ?? []).map(aPuesto),
    retos: (retos.data ?? []).map(aReto),
    perfiles: await perfilesPorId(ids),
  };
}

// ─── Inscripciones ─────────────────────────────────────────────────────────

export async function inscribirse(competicionId: string, jugadorId: string) {
  const { error } = await cliente()
    .from('inscripciones')
    .insert({ competicion_id: competicionId, jugador_id: jugadorId });
  revienta(error);
}

export async function borrarseDe(competicionId: string, jugadorId: string) {
  const { error } = await cliente()
    .from('inscripciones')
    .delete()
    .eq('competicion_id', competicionId)
    .eq('jugador_id', jugadorId);
  revienta(error);
}

export async function asignarDivision(inscripcionId: string, divisionId: string | null) {
  const { error } = await cliente()
    .from('inscripciones')
    .update({ division_id: divisionId })
    .eq('id', inscripcionId);
  revienta(error);
}

export async function crearDivisiones(competicionId: string, nombres: string[]) {
  const { error } = await cliente().from('divisiones').insert(
    nombres.map((nombre, i) => ({
      competicion_id: competicionId,
      nombre,
      orden: i + 1,
    }))
  );
  revienta(error);
}

export async function crearPareja(
  competicionId: string,
  jugadorA: string,
  jugadorB: string,
  nombre?: string | null
): Promise<Pareja> {
  const { data, error } = await cliente()
    .from('parejas')
    .insert({
      competicion_id: competicionId,
      jugador_a: jugadorA,
      jugador_b: jugadorB,
      nombre: nombre ?? null,
    })
    .select()
    .single();
  revienta(error);
  return aPareja(data);
}

// ─── Resultados ────────────────────────────────────────────────────────────

export async function reportarResultado(
  partidoId: string,
  sets: SetMarcador[],
  ganador: Lado
) {
  const { error } = await cliente().rpc('reportar_resultado', {
    p_partido: partidoId,
    p_sets: sets,
    p_ganador: ganador,
  });
  revienta(error);
}

export async function confirmarResultado(partidoId: string) {
  const { error } = await cliente().rpc('confirmar_resultado', { p_partido: partidoId });
  revienta(error);
}

export async function partidosDe(jugadorId: string): Promise<Partido[]> {
  const { data, error } = await cliente()
    .from('partidos')
    .select('*')
    .or(`equipo_a.cs.{${jugadorId}},equipo_b.cs.{${jugadorId}}`)
    .order('fecha', { ascending: true });
  revienta(error);
  return (data ?? []).map(aPartido);
}

// ─── Escalera ──────────────────────────────────────────────────────────────

export async function sembrarEscalera(competicionId: string, jugadorIds: string[]) {
  const { error } = await cliente().from('escalera_puestos').upsert(
    jugadorIds.map((jugadorId, i) => ({
      competicion_id: competicionId,
      jugador_id: jugadorId,
      posicion: i + 1,
    }))
  );
  revienta(error);
}

export async function crearReto(competicionId: string, retadoId: string): Promise<Reto> {
  const { data, error } = await cliente().rpc('crear_reto', {
    p_competicion: competicionId,
    p_retado: retadoId,
  });
  revienta(error);
  return aReto(data);
}

export async function responderReto(retoId: string, estado: Reto['estado']) {
  const { error } = await cliente().from('retos').update({ estado }).eq('id', retoId);
  revienta(error);
}

export async function abrirPartidoDeReto(retoId: string): Promise<Partido> {
  const { data, error } = await cliente().rpc('partido_de_reto', { p_reto: retoId });
  revienta(error);
  return aPartido(data);
}

// ─── Generación de calendario (organizador) ────────────────────────────────

interface PartidoNuevo {
  competicion_id: string;
  division_id?: string | null;
  jornada_id?: string | null;
  modalidad: 'parejas' | 'individual';
  ronda: string | null;
  orden: number;
  equipo_a: string[];
  equipo_b: string[];
  pareja_a?: string | null;
  pareja_b?: string | null;
}

/**
 * Crea la siguiente jornada de una división: reparte mesas por orden de
 * clasificación y expande la rotación de parejas de cada mesa.
 */
export async function generarJornadaDivision(
  competicionId: string,
  divisionId: string | null,
  numero: number,
  ordenClasificacion: string[],
  reglas: ReglasLigaDivisiones,
  fecha?: string | null
): Promise<{ creados: number; descansan: string[] }> {
  const { partidos, descansan } = generarJornada(
    ordenClasificacion,
    reglas.jugadoresPorMesa
  );
  if (partidos.length === 0) return { creados: 0, descansan };

  const jornada = await cliente()
    .from('jornadas')
    .insert({
      competicion_id: competicionId,
      division_id: divisionId,
      numero,
      fecha_inicio: fecha ?? null,
    })
    .select()
    .single();
  revienta(jornada.error);

  const filas: PartidoNuevo[] = partidos.map((p) => ({
    competicion_id: competicionId,
    division_id: divisionId,
    jornada_id: jornada.data.id,
    modalidad: 'parejas',
    ronda: p.ronda,
    orden: p.orden,
    equipo_a: p.equipoA,
    equipo_b: p.equipoB,
  }));

  const { error } = await cliente().from('partidos').insert(filas);
  revienta(error);
  return { creados: filas.length, descansan };
}

/** Liga individual: todos contra todos, una jornada por vuelta del círculo. */
export async function generarLigaIndividual(
  competicionId: string,
  divisionId: string | null,
  jugadores: string[]
): Promise<number> {
  const jornadas = roundRobinIndividual(jugadores);
  let total = 0;

  for (const [i, partidos] of jornadas.entries()) {
    const jornada = await cliente()
      .from('jornadas')
      .insert({ competicion_id: competicionId, division_id: divisionId, numero: i + 1 })
      .select()
      .single();
    revienta(jornada.error);

    const filas: PartidoNuevo[] = partidos.map((p) => ({
      competicion_id: competicionId,
      division_id: divisionId,
      jornada_id: jornada.data.id,
      modalidad: 'individual',
      ronda: p.ronda,
      orden: p.orden,
      equipo_a: p.equipoA,
      equipo_b: p.equipoB,
    }));
    const { error } = await cliente().from('partidos').insert(filas);
    revienta(error);
    total += filas.length;
  }

  return total;
}

/** Torneo de parejas: fase de grupos y/o cuadro eliminatorio. */
export async function generarTorneoParejas(
  competicionId: string,
  parejas: Pareja[],
  reglas: { faseGrupos: boolean; equiposPorGrupo: number }
): Promise<number> {
  const porId = new Map(parejas.map((p) => [p.id, p]));
  const ids = parejas.map((p) => p.id);
  const filas: PartidoNuevo[] = [];

  const nueva = (
    ronda: string,
    orden: number,
    a: string | null,
    b: string | null
  ): PartidoNuevo => ({
    competicion_id: competicionId,
    modalidad: 'parejas',
    ronda,
    orden,
    pareja_a: a,
    pareja_b: b,
    equipo_a: a ? [porId.get(a)!.jugadorA, porId.get(a)!.jugadorB] : [],
    equipo_b: b ? [porId.get(b)!.jugadorA, porId.get(b)!.jugadorB] : [],
  });

  if (reglas.faseGrupos) {
    const { partidos } = generarFaseGrupos(ids, reglas.equiposPorGrupo);
    partidos.forEach((p, i) => filas.push(nueva(p.ronda, i, p.equipoA[0], p.equipoB[0])));
  } else {
    generarCuadro(ids).forEach((n, i) =>
      filas.push(nueva(n.nombreRonda, i, n.equipoA, n.equipoB))
    );
  }

  if (filas.length === 0) return 0;
  const { error } = await cliente().from('partidos').insert(filas);
  revienta(error);
  return filas.length;
}

export const modalidadDeCompeticion = modalidadDe;
