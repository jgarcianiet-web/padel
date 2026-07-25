# Circuito Pádel

App de competición de pádel: la idea de las ligas sociales tipo *Pádel o Nada*
—te apuntas solo, juegas rotando de compañero y tienes tu propia clasificación—
fusionada con torneos de parejas y escalera individual.

Es una app **independiente** de la de seguimiento personal que vive en la raíz
del repositorio (`Liga Personal Pádel`): comparten tema y estilo, pero no
código ni datos. Esta tiene backend y varios jugadores; aquélla es de uso
personal y guarda todo en el móvil.

## Los cuatro formatos

| Formato | Cómo funciona |
| --- | --- |
| **Liga por divisiones** | Inscripción individual. Cada jornada se forman mesas de 4 o 5 jugadores por orden de clasificación y dentro de la mesa se rota de compañero, así juegas con y contra todos. Los puntos son individuales y al final de la temporada se sube y se baja de división. |
| **Escalera individual** | Ranking de escalones: retas a quien tienes hasta N puestos por encima y, si ganas, te quedas su puesto y los de en medio bajan uno. Sin calendario: se juega cuando podéis. |
| **Torneo de parejas** | Pareja fija, fase de grupos opcional y cuadro eliminatorio con siembra estándar y byes para los cabezas de serie. |
| **Liga individual** | Pádel 1 vs 1, todos contra todos. Solo se puede jugar en clubes con pista individual, que es justo lo que marca el directorio de clubes. |

## Móvil y web, la misma app

Un único código para iOS, Android y navegador:

- **Web**: se exporta estática (`output: 'static'`), así que cada pantalla tiene
  su URL y el enlace de una competición se puede pegar en el grupo de WhatsApp.
  Desde el navegador se puede hacer todo: apuntarse, subir resultados, retar.
- **Instalable**: el manifiesto (`web` en `app.config.ts`) permite añadirla a la
  pantalla de inicio desde el propio navegador, en escritorio y en móvil, sin
  pasar por las tiendas.
- **Se adapta al sitio**: la navegación va abajo en el móvil y pasa a barra
  lateral a partir de 900 px; el contenido se centra en una columna legible en
  lugar de estirarse de lado a lado del monitor (`src/lib/responsive.ts`).
- **Nada de `Alert`**: `Alert.alert` es una función vacía en react-native-web
  —en el navegador no pasaría nada al confirmar un reto—, así que las
  confirmaciones usan un diálogo propio (`src/components/Dialogo.tsx`) que
  funciona igual en las tres plataformas.

## Reglas comunes

- Ningún partido acaba en empate: todos tienen ganador.
- El resultado lo sube cualquiera de los dos equipos y **lo confirma el rival**.
  Hasta que no está confirmado no cuenta para la clasificación.
- Desempates, en este orden: puntos → diferencia de sets → diferencia de juegos
  → enfrentamiento directo → juegos a favor.

## Estructura

```
app/                      rutas de expo-router (tabs + detalle + alta)
src/lib/                  el motor, sin dependencias de red ni de React
  rotacion.ts             mesas y rotación de parejas, round robin individual
  cuadro.ts               grupos, siembra y cuadro eliminatorio
  escalera.ts             retos, rangos y recolocación de escalones
  clasificacion.ts        puntos, desempates, ascensos y descensos
  marcador.ts             parseo y validación de sets
src/api/                  cliente de Supabase, mapeo snake_case ⇄ camelCase y consultas
src/screens/              pantallas
supabase/migrations/      esquema, RLS y funciones del servidor
docs/SUPABASE.md          puesta en marcha del backend, paso a paso
```

El motor (`src/lib`) es código puro y está cubierto por tests: el reparto de
mesas, la rotación de parejas, la siembra del cuadro y el movimiento de la
escalera se pueden verificar sin levantar nada.

## Arrancar

```bash
cd circuito
npm install
cp .env.example .env.local   # y rellena las dos claves de Supabase
npx expo start
```

Sin claves la app arranca igual y te enseña qué falta. La puesta en marcha del
backend está en [docs/SUPABASE.md](docs/SUPABASE.md).

```bash
npm test        # motor de competición
npm run typecheck
```
