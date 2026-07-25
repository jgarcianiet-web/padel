# Poner en marcha el backend

Circuito Pádel guarda jugadores, competiciones y resultados en Supabase. Sin
esas dos claves la app arranca pero enseña la pantalla de "Falta conectar
Supabase". Estos son todos los pasos, de cero a liga funcionando.

## 1. Crear el proyecto

1. Entra en <https://supabase.com>, crea una cuenta y pulsa **New project**.
2. Elige región Europa (Frankfurt o Londres) para que la latencia desde España
   sea baja, y guarda la contraseña de la base de datos.
3. Espera a que el proyecto termine de aprovisionarse (un par de minutos).

## 2. Ejecutar las migraciones

En el panel de Supabase, **SQL Editor → New query**, y ejecuta **en este orden**
el contenido de:

1. `supabase/migrations/0001_esquema.sql` — tablas, índices y el trigger que
   crea el perfil al registrarse.
2. `supabase/migrations/0002_seguridad.sql` — RLS y las funciones que
   garantizan que nadie se valida su propio resultado ni se salta la escalera.
3. `supabase/migrations/0003_clubes_ejemplo.sql` — *opcional*: tres clubes
   inventados para que el directorio no esté vacío. **Sustitúyelos por los
   clubes reales de tu zona**; lo importante de cada uno es la columna
   `pistas_individuales`, porque la liga 1 vs 1 solo se puede jugar donde hay
   pista individual.

Si algo falla a mitad, puedes volver a ejecutar los ficheros enteros: están
escritos con `if not exists` / `create or replace` y son idempotentes.

## 3. Configurar el acceso por correo

En **Authentication → Providers → Email**:

- Deja **Email** activado.
- Desactiva **Confirm email** si quieres que el primer acceso sea inmediato, o
  déjalo activado si prefieres verificar los correos.

La app entra con **código de un solo uso** (OTP de 6 dígitos), no con enlace
mágico, para no depender de deep links en el móvil. Para que el correo lleve el
código y no solo el enlace, en **Authentication → Emails → Magic Link** deja en
la plantilla el token:

```
Tu código para entrar en Circuito Pádel: {{ .Token }}
```

El correo de cortesía de Supabase tiene un límite bajo de envíos por hora; en
cuanto la liga tenga gente, configura un SMTP propio en **Project Settings →
Auth → SMTP Settings**.

## 4. Copiar las claves a la app

En **Project Settings → API** copia *Project URL* y la clave *anon public*, y
crea el fichero `circuito/.env.local`:

```
EXPO_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
```

La clave `anon` es pública por diseño: viaja en el cliente y toda la seguridad
real está en las políticas RLS del paso 2. **Nunca** pongas aquí la
`service_role`.

Para las builds de EAS, añade las dos variables en el panel de EAS
(*Environment variables*) o en `eas.json`; `app.config.ts` ya las replica en
`extra` para que estén disponibles en el binario.

## 5. Arrancar

```bash
cd circuito
npm install
npx expo start
```

## Cómo está protegido cada movimiento

| Acción | Quién puede | Dónde se comprueba |
| --- | --- | --- |
| Ver competiciones, clasificaciones y calendario | cualquier usuario registrado | políticas `*_lectura` |
| Crear competición | cualquiera; queda como organizador | `competiciones_alta` |
| Cambiar reglas, generar calendario, formar parejas | solo el organizador | `es_organizador()` |
| Apuntarse | uno mismo, y solo con la inscripción abierta | `inscripciones_alta` |
| Subir un resultado | los que han jugado el partido | RPC `reportar_resultado` |
| Confirmar un resultado | el equipo **rival** al que lo subió | RPC `confirmar_resultado` |
| Mover la escalera | nadie a mano: se mueve sola al confirmarse el reto | RPC `cerrar_reto_si_procede` |
| Lanzar un reto | solo hacia arriba y dentro del rango del reglamento | RPC `crear_reto` |

Los jugadores no tienen permiso de `update` directo sobre `partidos`: si lo
tuvieran, cualquiera podría confirmarse su propia victoria. Todo pasa por las
funciones `security definer`, que son las que aplican la regla.

## Copias de seguridad

El plan gratuito de Supabase hace copia diaria de los últimos 7 días. Si la
liga se consolida, sube al plan Pro o programa un `pg_dump` semanal: los
resultados de una temporada no se pueden reconstruir.
