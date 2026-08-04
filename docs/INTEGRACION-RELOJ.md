# Integración con Rising Padel Watch

Liga Personal Pádel no tiene servidor: el volcado de sesiones se hace **en el
dispositivo**, sin red ni tokens. Hay dos vías, ambas con el MISMO JSON del
contrato (`docs/api-contract.md` de `rising-padel-watch`, el cuerpo del
`POST /v1/padel-sessions`):

1. **Reloj embebido (la vía principal).** La app del Apple Watch vive dentro de
   esta app (`targets/watch/`) y entrega cada sesión por WatchConnectivity al
   módulo local `modules/watch-sync`. No hay que abrir nada: la sesión llega
   sola, queda guardada en nativo aunque la app esté cerrada, y el Panel avisa
   con un banner que lleva a la pantalla "Sesiones del reloj" (`/reloj`).
2. **Deep link (respaldo).** La antigua app compañera `RisingPadel` puede
   seguir volcando con `ligapadel://importar?datos=...`. Se mantiene por las
   instalaciones que aún la usen y como vía de prueba manual.

## Reloj embebido: cómo encaja

```
Apple Watch (targets/watch, detección + PadelCore)
        │ transferUserInfo: { padel_session_id, padel_session_contract }
        ▼
modules/watch-sync (WCSessionDelegate nativo, cola en UserDefaults)
        │ getPendientes() / evento onSesionReloj
        ▼
src/lib/sesionesReloj.ts → parseSesion() → pantalla /reloj → formulario + Partido
```

- El reloj construye el JSON del contrato **en la muñeca** (`PhoneTransport`,
  clave `padel_session_contract`): el módulo receptor no necesita el modelo de
  dominio, solo reenviar la cadena. Sin eventos golpe a golpe, igual que el
  deep link: la liga usa agregados.
- La cola pendiente vive en `UserDefaults` del lado nativo porque
  `transferUserInfo` puede despertar la app en segundo plano sin que React
  Native llegue a cargar. JS la lee al abrir, al volver a primer plano y al
  recibir el evento.
- La idempotencia es por `sessionId`: una sesión consumida (importada o
  descartada) se recuerda y un reenvío del reloj no la resucita.
- El código del reloj (`targets/watch/`, incluido `PadelCore/`) viene de
  `rising-padel-watch/ios`; los tests del algoritmo siguen viviendo allí. Si
  se toca el core, tocarlo en los dos sitios.

## Compilar con el reloj

El target lo genera `@bacons/apple-targets` en `expo prebuild`. Hace falta
`APPLE_TEAM_ID` en el entorno (va a `ios.appleTeamId`) y, en EAS, credenciales
para el bundle `com.jesus.ligapadel.watchkitapp` además del principal — el
plugin declara el target extra en `extra.eas.build.experimental.ios.appExtensions`
y `eas credentials` se encarga del perfil al configurarlo una vez.

# Deep link (respaldo)

## Qué debe hacer la app del reloj (lado iOS/compañera)

Construir la URL y abrirla:

```
ligapadel://importar?datos=<JSON percent-encoded>
```

- `datos` es **exactamente el mismo JSON** que el cuerpo del
  `POST /v1/padel-sessions` del contrato (`sessionId`, `schemaVersion`,
  `startedAt`, `durationSeconds`, `shots`, `health`, `score`, `level`), pasado
  por `encodeURIComponent` / `addingPercentEncoding`.
- Recomendado **omitir `shots.events`** (la serie golpe a golpe): la liga solo
  usa agregados y las URLs tienen límite práctico de tamaño. Con `total`,
  `byType`, `health`, `score` y `level` sobra.
- En Swift: `UIApplication.shared.open(url)`. Si `canOpenURL` devuelve false
  (liga no instalada), añadir `ligapadel` a `LSApplicationQueriesSchemes`.

## Qué hace la liga al recibirlo

1. Abre la pantalla "Sesión del reloj" con el resumen (fecha, golpeos, marcador,
   pulso, nivel) y avisa si ya existe un partido ese día.
2. Al confirmar, prerrellena el formulario de **+ Partido**: fecha, tipo
   (partido si trae `score`, entreno si no), marcador y resultado, nivel Band
   (`level.overall`, salvo `reliable: false`), notas por golpe
   (`level.byShotType`), volumen (`shots.byType` + `total`) y salud (duración,
   pulso medio/máx, kcal). El usuario añade club/compañero/objetivos y guarda.

## Mapeo de tipos de golpeo

| Reloj | Liga |
|---|---|
| `forehand` | Derecha |
| `backhand` | Revés |
| `forehandVolley` + `backhandVolley` | Volea (nota media, volumen sumado) |
| `overhead` | Bandeja |
| `serve` | Saque |
| `unknown` | descartado (sí cuenta en `total`) |

## Versionado

La liga acepta `schemaVersion` ≤ 2 (igual que el contrato). Con una versión
mayor muestra "actualiza Liga Personal Pádel" en vez de importar a medias —
mismo espíritu que el `400 unsupported_schema_version` del contrato.

## Prueba manual sin el reloj

Desde Safari en el iPhone (o en el simulador con `npx uri-scheme open`):

```
ligapadel://importar?datos=%7B%22sessionId%22%3A%22test%22%2C%22schemaVersion%22%3A1%2C%22startedAt%22%3A%222026-08-04T10%3A00%3A00Z%22%2C%22durationSeconds%22%3A3600%2C%22shots%22%3A%7B%22total%22%3A200%2C%22byType%22%3A%7B%22forehand%22%3A80%2C%22backhand%22%3A60%2C%22forehandVolley%22%3A30%2C%22backhandVolley%22%3A30%7D%7D%7D
```
