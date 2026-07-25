-- Circuito Pádel — RLS y operaciones con integridad.
-- La app solo usa la anon key, así que toda la seguridad real vive aquí:
-- quién ve qué, quién puede escribir y qué movimientos (confirmar un
-- resultado, mover la escalera) tienen que pasar sí o sí por el servidor.

alter table public.perfiles          enable row level security;
alter table public.clubes            enable row level security;
alter table public.competiciones     enable row level security;
alter table public.divisiones        enable row level security;
alter table public.jornadas          enable row level security;
alter table public.parejas           enable row level security;
alter table public.inscripciones     enable row level security;
alter table public.partidos          enable row level security;
alter table public.escalera_puestos  enable row level security;
alter table public.retos             enable row level security;

-- ─── Ayudantes ─────────────────────────────────────────────────────────────

create or replace function public.es_organizador(p_competicion uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.competiciones c
    where c.id = p_competicion and c.organizador_id = auth.uid()
  );
$$;

create or replace function public.participa_en(p_partido uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.partidos p
    where p.id = p_partido
      and auth.uid() = any (p.equipo_a || p.equipo_b)
  );
$$;

-- ─── Políticas ─────────────────────────────────────────────────────────────
-- Lectura abierta a cualquier usuario autenticado: una liga social vive de que
-- todos vean el calendario y la clasificación. La escritura, en cambio, es
-- siempre del organizador o del propio jugador.

drop policy if exists perfiles_lectura on public.perfiles;
create policy perfiles_lectura on public.perfiles
  for select to authenticated using (true);

drop policy if exists perfiles_propio_insert on public.perfiles;
create policy perfiles_propio_insert on public.perfiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists perfiles_propio_update on public.perfiles;
create policy perfiles_propio_update on public.perfiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists clubes_lectura on public.clubes;
create policy clubes_lectura on public.clubes
  for select to authenticated using (true);

drop policy if exists clubes_alta on public.clubes;
create policy clubes_alta on public.clubes
  for insert to authenticated with check (creado_por = auth.uid());

drop policy if exists clubes_edicion on public.clubes;
create policy clubes_edicion on public.clubes
  for update to authenticated using (creado_por = auth.uid());

drop policy if exists competiciones_lectura on public.competiciones;
create policy competiciones_lectura on public.competiciones
  for select to authenticated using (true);

drop policy if exists competiciones_alta on public.competiciones;
create policy competiciones_alta on public.competiciones
  for insert to authenticated with check (organizador_id = auth.uid());

drop policy if exists competiciones_edicion on public.competiciones;
create policy competiciones_edicion on public.competiciones
  for update to authenticated using (organizador_id = auth.uid());

drop policy if exists competiciones_borrado on public.competiciones;
create policy competiciones_borrado on public.competiciones
  for delete to authenticated using (organizador_id = auth.uid());

-- Estructura de la competición: la maneja el organizador.
do $$
declare t text;
begin
  foreach t in array array['divisiones', 'jornadas', 'parejas'] loop
    execute format('drop policy if exists %1$s_lectura on public.%1$s', t);
    execute format(
      'create policy %1$s_lectura on public.%1$s for select to authenticated using (true)', t);
    execute format('drop policy if exists %1$s_gestion on public.%1$s', t);
    execute format(
      'create policy %1$s_gestion on public.%1$s for all to authenticated
         using (public.es_organizador(competicion_id))
         with check (public.es_organizador(competicion_id))', t);
  end loop;
end $$;

drop policy if exists inscripciones_lectura on public.inscripciones;
create policy inscripciones_lectura on public.inscripciones
  for select to authenticated using (true);

-- Te apuntas tú mismo, y solo mientras la competición esté abierta.
drop policy if exists inscripciones_alta on public.inscripciones;
create policy inscripciones_alta on public.inscripciones
  for insert to authenticated with check (
    jugador_id = auth.uid()
    and exists (
      select 1 from public.competiciones c
      where c.id = competicion_id and c.estado = 'inscripcion'
    )
  );

drop policy if exists inscripciones_baja on public.inscripciones;
create policy inscripciones_baja on public.inscripciones
  for delete to authenticated using (
    jugador_id = auth.uid() or public.es_organizador(competicion_id)
  );

-- El organizador asigna divisiones y acepta inscripciones.
drop policy if exists inscripciones_gestion on public.inscripciones;
create policy inscripciones_gestion on public.inscripciones
  for update to authenticated using (public.es_organizador(competicion_id));

drop policy if exists partidos_lectura on public.partidos;
create policy partidos_lectura on public.partidos
  for select to authenticated using (true);

drop policy if exists partidos_gestion on public.partidos;
create policy partidos_gestion on public.partidos
  for all to authenticated
  using (public.es_organizador(competicion_id))
  with check (public.es_organizador(competicion_id));

-- Los jugadores no escriben en `partidos` directamente: suben y confirman el
-- resultado por RPC para que nadie pueda validarse su propio marcador.

drop policy if exists escalera_lectura on public.escalera_puestos;
create policy escalera_lectura on public.escalera_puestos
  for select to authenticated using (true);

drop policy if exists escalera_gestion on public.escalera_puestos;
create policy escalera_gestion on public.escalera_puestos
  for all to authenticated
  using (public.es_organizador(competicion_id))
  with check (public.es_organizador(competicion_id));

drop policy if exists retos_lectura on public.retos;
create policy retos_lectura on public.retos
  for select to authenticated using (true);

-- Aceptar o rechazar un reto lo hace el retado; anularlo, el retador.
drop policy if exists retos_respuesta on public.retos;
create policy retos_respuesta on public.retos
  for update to authenticated using (
    retado_id = auth.uid()
    or retador_id = auth.uid()
    or public.es_organizador(competicion_id)
  );

drop policy if exists retos_borrado on public.retos;
create policy retos_borrado on public.retos
  for delete to authenticated using (
    retador_id = auth.uid() or public.es_organizador(competicion_id)
  );

-- ─── Operaciones con integridad ────────────────────────────────────────────

/**
 * Sube el marcador de un partido. Lo puede hacer cualquiera de los dos
 * equipos; el partido queda "pendiente" hasta que lo confirme el rival. Si lo
 * sube el organizador, queda confirmado directamente.
 */
create or replace function public.reportar_resultado(
  p_partido uuid,
  p_sets jsonb,
  p_ganador text
) returns public.partidos
language plpgsql security definer set search_path = public as $$
declare
  v_partido public.partidos;
  v_organiza boolean;
begin
  select * into v_partido from public.partidos where id = p_partido;
  if v_partido.id is null then
    raise exception 'Ese partido no existe';
  end if;
  if p_ganador not in ('a', 'b') then
    raise exception 'El partido tiene que tener un ganador';
  end if;
  if v_partido.estado = 'confirmado' then
    raise exception 'Ese resultado ya está confirmado';
  end if;

  v_organiza := public.es_organizador(v_partido.competicion_id);
  if not v_organiza and not (auth.uid() = any (v_partido.equipo_a || v_partido.equipo_b)) then
    raise exception 'Solo pueden subir el resultado los que han jugado';
  end if;

  update public.partidos set
    sets = p_sets,
    ganador = p_ganador,
    estado = case when v_organiza then 'confirmado' else 'pendiente' end,
    reportado_por = auth.uid(),
    confirmado_por = case when v_organiza then auth.uid() else null end
  where id = p_partido
  returning * into v_partido;

  if v_partido.estado = 'confirmado' then
    perform public.cerrar_reto_si_procede(v_partido);
  end if;

  return v_partido;
end;
$$;

/**
 * Confirma un resultado pendiente. Tiene que hacerlo alguien del equipo
 * contrario al que lo subió (o el organizador): así el marcador siempre pasa
 * por dos manos.
 */
create or replace function public.confirmar_resultado(p_partido uuid)
returns public.partidos
language plpgsql security definer set search_path = public as $$
declare
  v_partido public.partidos;
  v_mi_lado text;
  v_lado_reporte text;
begin
  select * into v_partido from public.partidos where id = p_partido;
  if v_partido.id is null then
    raise exception 'Ese partido no existe';
  end if;
  if v_partido.estado <> 'pendiente' then
    raise exception 'Ese partido no está pendiente de confirmar';
  end if;

  if not public.es_organizador(v_partido.competicion_id) then
    v_mi_lado := case
      when auth.uid() = any (v_partido.equipo_a) then 'a'
      when auth.uid() = any (v_partido.equipo_b) then 'b'
    end;
    v_lado_reporte := case
      when v_partido.reportado_por = any (v_partido.equipo_a) then 'a'
      when v_partido.reportado_por = any (v_partido.equipo_b) then 'b'
    end;
    if v_mi_lado is null then
      raise exception 'Solo pueden confirmar los que han jugado';
    end if;
    if v_mi_lado = v_lado_reporte then
      raise exception 'Tiene que confirmarlo el equipo rival';
    end if;
  end if;

  update public.partidos
    set estado = 'confirmado', confirmado_por = auth.uid()
    where id = p_partido
    returning * into v_partido;

  perform public.cerrar_reto_si_procede(v_partido);
  return v_partido;
end;
$$;

/**
 * Mueve la escalera: el retador ocupa el puesto del retado y todos los que
 * estaban entre medias bajan un escalón. Si gana el retado no se mueve nada.
 */
create or replace function public.aplicar_reto_escalera(
  p_competicion uuid,
  p_retador uuid,
  p_retado uuid,
  p_gana_retador boolean
) returns void
language plpgsql security definer set search_path = public as $$
declare
  v_pos_retador int;
  v_pos_retado int;
begin
  if not p_gana_retador then return; end if;

  select posicion into v_pos_retador from public.escalera_puestos
    where competicion_id = p_competicion and jugador_id = p_retador;
  select posicion into v_pos_retado from public.escalera_puestos
    where competicion_id = p_competicion and jugador_id = p_retado;

  if v_pos_retador is null or v_pos_retado is null then return; end if;
  if v_pos_retado >= v_pos_retador then return; end if;

  update public.escalera_puestos
    set posicion = posicion + 1
    where competicion_id = p_competicion
      and posicion >= v_pos_retado
      and posicion < v_pos_retador;

  update public.escalera_puestos
    set posicion = v_pos_retado
    where competicion_id = p_competicion and jugador_id = p_retador;
end;
$$;

/** Al confirmarse el partido de un reto, se cierra el reto y se mueve la escalera. */
create or replace function public.cerrar_reto_si_procede(p_partido public.partidos)
returns void
language plpgsql security definer set search_path = public as $$
declare
  v_reto public.retos;
  v_gana_retador boolean;
begin
  select * into v_reto from public.retos where partido_id = p_partido.id;
  if v_reto.id is null then return; end if;

  v_gana_retador := (p_partido.ganador = 'a')
    = (v_reto.retador_id = any (p_partido.equipo_a));

  update public.retos set estado = 'jugado' where id = v_reto.id;
  perform public.aplicar_reto_escalera(
    v_reto.competicion_id, v_reto.retador_id, v_reto.retado_id, v_gana_retador);
end;
$$;

/**
 * Lanza un reto comprobando en el servidor lo mismo que comprueba la app:
 * que se reta hacia arriba y dentro del rango que fija el reglamento.
 */
create or replace function public.crear_reto(
  p_competicion uuid,
  p_retado uuid
) returns public.retos
language plpgsql security definer set search_path = public as $$
declare
  v_reglas jsonb;
  v_rango int;
  v_dias int;
  v_pos_retador int;
  v_pos_retado int;
  v_reto public.retos;
begin
  select reglas into v_reglas from public.competiciones
    where id = p_competicion and tipo = 'escalera';
  if v_reglas is null then
    raise exception 'Esa competición no es una escalera';
  end if;

  v_rango := coalesce((v_reglas ->> 'rangoReto')::int, 3);
  v_dias := coalesce((v_reglas ->> 'diasParaJugar')::int, 14);

  select posicion into v_pos_retador from public.escalera_puestos
    where competicion_id = p_competicion and jugador_id = auth.uid();
  select posicion into v_pos_retado from public.escalera_puestos
    where competicion_id = p_competicion and jugador_id = p_retado;

  if v_pos_retador is null or v_pos_retado is null then
    raise exception 'Alguno de los dos no está en la escalera';
  end if;
  if v_pos_retado >= v_pos_retador then
    raise exception 'Solo se reta hacia arriba';
  end if;
  if v_pos_retador - v_pos_retado > v_rango then
    raise exception 'Solo puedes retar hasta % puestos por encima', v_rango;
  end if;
  if exists (
    select 1 from public.retos r
    where r.competicion_id = p_competicion
      and r.estado in ('propuesto', 'aceptado')
      and p_retado in (r.retador_id, r.retado_id)
  ) then
    raise exception 'Ese jugador ya tiene un reto en marcha';
  end if;

  insert into public.retos (competicion_id, retador_id, retado_id, fecha_limite)
  values (p_competicion, auth.uid(), p_retado, current_date + v_dias)
  returning * into v_reto;

  return v_reto;
end;
$$;

/** Crea el partido de un reto aceptado y lo deja listo para subir marcador. */
create or replace function public.partido_de_reto(p_reto uuid)
returns public.partidos
language plpgsql security definer set search_path = public as $$
declare
  v_reto public.retos;
  v_partido public.partidos;
begin
  select * into v_reto from public.retos where id = p_reto;
  if v_reto.id is null then
    raise exception 'Ese reto no existe';
  end if;
  if auth.uid() not in (v_reto.retador_id, v_reto.retado_id)
     and not public.es_organizador(v_reto.competicion_id) then
    raise exception 'Solo los implicados pueden abrir el partido del reto';
  end if;
  if v_reto.partido_id is not null then
    select * into v_partido from public.partidos where id = v_reto.partido_id;
    return v_partido;
  end if;

  insert into public.partidos (
    competicion_id, modalidad, ronda, equipo_a, equipo_b, fecha, estado)
  values (
    v_reto.competicion_id, 'individual', 'Reto',
    array[v_reto.retador_id], array[v_reto.retado_id],
    v_reto.fecha_limite, 'programado')
  returning * into v_partido;

  update public.retos
    set partido_id = v_partido.id,
        estado = case when estado = 'propuesto' then 'aceptado' else estado end
    where id = p_reto;

  return v_partido;
end;
$$;

grant execute on function public.reportar_resultado(uuid, jsonb, text) to authenticated;
grant execute on function public.confirmar_resultado(uuid) to authenticated;
grant execute on function public.crear_reto(uuid, uuid) to authenticated;
grant execute on function public.partido_de_reto(uuid) to authenticated;
