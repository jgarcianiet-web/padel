# Integración con Rising Padel Watch (deep link)

Liga Personal Pádel no tiene servidor: ambas apps viven en el mismo iPhone, así
que el volcado de sesiones se hace **en el dispositivo** con un deep link, sin
red ni tokens. Es el "adaptador" que contempla el `docs/api-contract.md` de
`rising-padel-watch`.

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
