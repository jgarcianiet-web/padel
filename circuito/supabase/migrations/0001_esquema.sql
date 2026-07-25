-- Circuito Pádel — esquema base.
-- Ejecutar en el SQL Editor de Supabase en orden: 0001, 0002 y (opcional) 0003.

create extension if not exists "pgcrypto";

-- ─── Perfiles ──────────────────────────────────────────────────────────────
-- Una fila por usuario de auth.users. La crea el trigger de abajo al
-- registrarse, así nunca hay sesión sin perfil.

create table if not exists public.perfiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  nombre      text not null default 'Jugador',
  apodo       text,
  ciudad      text,
  posicion    text check (posicion in ('reves', 'derecha', 'ambas')),
  nivel       numeric(2, 1) check (nivel between 1.0 and 7.0),
  telefono    text,
  avatar_url  text,
  creado_en   timestamptz not null default now()
);

create or replace function public.crear_perfil()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfiles (id, nombre)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists al_crear_usuario on auth.users;
create trigger al_crear_usuario
  after insert on auth.users
  for each row execute function public.crear_perfil();

-- ─── Clubes ────────────────────────────────────────────────────────────────
-- pistas_individuales es la columna que sostiene la liga individual: casi
-- ningún club tiene pista de pádel individual, así que el directorio marca
-- cuáles sí y solo esos pueden albergar una competición 1 vs 1.

create table if not exists public.clubes (
  id                   uuid primary key default gen_random_uuid(),
  nombre               text not null,
  ciudad               text not null,
  direccion            text,
  web                  text,
  telefono             text,
  pistas_dobles        int not null default 0 check (pistas_dobles >= 0),
  pistas_individuales  int not null default 0 check (pistas_individuales >= 0),
  indoor               boolean,
  notas                text,
  creado_por           uuid references public.perfiles (id) on delete set null,
  creado_en            timestamptz not null default now(),
  unique (nombre, ciudad)
);

create index if not exists idx_clubes_ciudad on public.clubes (ciudad);
create index if not exists idx_clubes_individuales
  on public.clubes (pistas_individuales)
  where pistas_individuales > 0;

-- ─── Competiciones ─────────────────────────────────────────────────────────

create table if not exists public.competiciones (
  id             uuid primary key default gen_random_uuid(),
  tipo           text not null check (tipo in (
                   'liga_divisiones', 'escalera', 'torneo_parejas', 'liga_individual')),
  nombre         text not null,
  descripcion    text,
  ciudad         text,
  club_id        uuid references public.clubes (id) on delete set null,
  organizador_id uuid not null references public.perfiles (id) on delete cascade,
  estado         text not null default 'borrador' check (estado in (
                   'borrador', 'inscripcion', 'en_curso', 'finalizada')),
  temporada      text,
  fecha_inicio   date,
  fecha_fin      date,
  plazas         int check (plazas is null or plazas > 0),
  reglas         jsonb not null default '{}'::jsonb,
  creada_en      timestamptz not null default now()
);

create index if not exists idx_competiciones_estado on public.competiciones (estado);
create index if not exists idx_competiciones_organizador
  on public.competiciones (organizador_id);

create table if not exists public.divisiones (
  id             uuid primary key default gen_random_uuid(),
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  nombre         text not null,
  orden          int not null, -- 1 = la división más alta
  unique (competicion_id, orden)
);

create table if not exists public.jornadas (
  id             uuid primary key default gen_random_uuid(),
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  division_id    uuid references public.divisiones (id) on delete cascade,
  numero         int not null,
  fecha_inicio   date,
  fecha_fin      date,
  unique (competicion_id, division_id, numero)
);

create table if not exists public.parejas (
  id             uuid primary key default gen_random_uuid(),
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  nombre         text,
  jugador_a      uuid not null references public.perfiles (id) on delete cascade,
  jugador_b      uuid not null references public.perfiles (id) on delete cascade,
  check (jugador_a <> jugador_b),
  unique (competicion_id, jugador_a, jugador_b)
);

create table if not exists public.inscripciones (
  id             uuid primary key default gen_random_uuid(),
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  jugador_id     uuid not null references public.perfiles (id) on delete cascade,
  division_id    uuid references public.divisiones (id) on delete set null,
  pareja_id      uuid references public.parejas (id) on delete set null,
  estado         text not null default 'aceptada'
                 check (estado in ('pendiente', 'aceptada', 'baja')),
  creada_en      timestamptz not null default now(),
  unique (competicion_id, jugador_id)
);

create index if not exists idx_inscripciones_jugador
  on public.inscripciones (jugador_id);

-- ─── Partidos ──────────────────────────────────────────────────────────────
-- equipo_a / equipo_b guardan siempre ids de jugador (1 en individual, 2 en
-- parejas). pareja_a / pareja_b solo se rellenan en torneos de parejas, donde
-- la clasificación es por pareja y no por jugador.

create table if not exists public.partidos (
  id              uuid primary key default gen_random_uuid(),
  competicion_id  uuid not null references public.competiciones (id) on delete cascade,
  division_id     uuid references public.divisiones (id) on delete set null,
  jornada_id      uuid references public.jornadas (id) on delete set null,
  modalidad       text not null check (modalidad in ('parejas', 'individual')),
  ronda           text,
  orden           int not null default 0,
  club_id         uuid references public.clubes (id) on delete set null,
  fecha           date,
  estado          text not null default 'programado'
                  check (estado in ('programado', 'pendiente', 'confirmado', 'anulado')),
  equipo_a        uuid[] not null default '{}',
  equipo_b        uuid[] not null default '{}',
  pareja_a        uuid references public.parejas (id) on delete set null,
  pareja_b        uuid references public.parejas (id) on delete set null,
  sets            jsonb,
  ganador         text check (ganador in ('a', 'b')),
  reportado_por   uuid references public.perfiles (id) on delete set null,
  confirmado_por  uuid references public.perfiles (id) on delete set null,
  creado_en       timestamptz not null default now()
);

create index if not exists idx_partidos_competicion on public.partidos (competicion_id);
create index if not exists idx_partidos_jornada on public.partidos (jornada_id);
create index if not exists idx_partidos_equipo_a on public.partidos using gin (equipo_a);
create index if not exists idx_partidos_equipo_b on public.partidos using gin (equipo_b);

-- ─── Escalera ──────────────────────────────────────────────────────────────

create table if not exists public.escalera_puestos (
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  jugador_id     uuid not null references public.perfiles (id) on delete cascade,
  posicion       int not null check (posicion > 0),
  primary key (competicion_id, jugador_id),
  unique (competicion_id, posicion) deferrable initially deferred
);

create table if not exists public.retos (
  id             uuid primary key default gen_random_uuid(),
  competicion_id uuid not null references public.competiciones (id) on delete cascade,
  retador_id     uuid not null references public.perfiles (id) on delete cascade,
  retado_id      uuid not null references public.perfiles (id) on delete cascade,
  estado         text not null default 'propuesto' check (estado in (
                   'propuesto', 'aceptado', 'jugado', 'rechazado', 'caducado')),
  fecha_limite   date,
  partido_id     uuid references public.partidos (id) on delete set null,
  creado_en      timestamptz not null default now(),
  check (retador_id <> retado_id)
);

create index if not exists idx_retos_competicion on public.retos (competicion_id);
-- Un jugador solo puede tener un reto abierto a la vez (por defecto del
-- reglamento); si una liga permite más, se relaja este índice.
create unique index if not exists idx_retos_abierto_retador
  on public.retos (competicion_id, retador_id)
  where estado in ('propuesto', 'aceptado');
