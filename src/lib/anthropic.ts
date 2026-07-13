import * as SecureStore from 'expo-secure-store';

import { Analisis, CapturaBand, LigaState } from '../types/domain';
import { parseCapturaBand } from './band';
import { hoy } from './date';
import { bienJugado } from './metrics';

const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-4-6';
const API_KEY_STORE = 'anthropic_api_key';

// ─── clave de API (expo-secure-store, nunca en el backup) ───

export const getApiKey = (): Promise<string | null> =>
  SecureStore.getItemAsync(API_KEY_STORE);

export const setApiKey = (key: string): Promise<void> =>
  SecureStore.setItemAsync(API_KEY_STORE, key);

export const deleteApiKey = (): Promise<void> =>
  SecureStore.deleteItemAsync(API_KEY_STORE);

// ─── cliente ───

export class AnthropicError extends Error {
  status: number | null;

  constructor(mensaje: string, status: number | null = null) {
    super(mensaje);
    this.status = status;
  }
}

export const SIN_CLAVE =
  'Añade tu clave de API de Anthropic en Ajustes para usar el entrenador.';

type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; source: { type: 'base64'; media_type: string; data: string } };

async function callAnthropic(
  content: string | ContentBlock[],
  maxTokens: number
): Promise<string> {
  const apiKey = await getApiKey();
  if (!apiKey) throw new AnthropicError(SIN_CLAVE);

  let res: Response;
  try {
    res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: maxTokens,
        messages: [{ role: 'user', content }],
      }),
    });
  } catch {
    throw new AnthropicError('Sin conexión. Comprueba tu red e inténtalo de nuevo.');
  }

  if (!res.ok) {
    const msg =
      res.status === 401
        ? 'Clave de API inválida. Revísala en Ajustes.'
        : res.status === 429
          ? 'Límite de peticiones alcanzado. Espera un momento y reintenta.'
          : `Error de la API (${res.status}). Inténtalo de nuevo.`;
    throw new AnthropicError(msg, res.status);
  }

  const data = await res.json();
  return (data.content || [])
    .map((b: { type: string; text?: string }) => (b.type === 'text' ? b.text : ''))
    .filter(Boolean)
    .join('\n');
}

export const limpiarJson = (texto: string): string =>
  texto.replace(/```json|```/g, '').trim();

// ─── Entrenador: análisis estructurado (prompt literal de la web-app) ───

export async function analizarLiga(state: LigaState): Promise<Analisis> {
  const { matches, objetivos, perfil } = state;

  const datos = matches.map((m) => ({
    fecha: m.fecha,
    tipo: m.tipo,
    resultado: m.resultado,
    sets: m.sets || null,
    posicion: m.posicion || null,
    club: m.club || null,
    companero: m.companero || null,
    nivelPlaytomic: m.nivel,
    nivelPadelBandSesion: m.nivelBand ?? null,
    mejorGolpe: m.mejorGolpe ? `${m.mejorGolpe} (${m.mejorPunt}/7)` : null,
    peorGolpe: m.peorGolpe ? `${m.peorGolpe} (${m.peorPunt}/7)` : null,
    golpesSesionPadelBand: m.golpesSesion || null,
    objetivosCumplidos: m.objetivos.map((c, i) => (c ? objetivos[i] : null)).filter(Boolean),
    objetivosFallados: m.objetivos.map((c, i) => (!c ? objetivos[i] : null)).filter(Boolean),
    bienJugado: bienJugado(m),
    nota: m.nota || null,
  }));

  const prompt = `Eres un entrenador de pádel de alto nivel, con años en pista. Analizas el registro de partidos de tu jugador. Eres directo, técnico y trabajas SIEMPRE sobre sus datos concretos: cada afirmación debe apoyarse en un número o hecho del registro. Prohibido el consejo genérico que valdría para cualquier jugador.

PERFIL INICIAL (punto de partida de su liga personal):
- Nivel Playtomic inicial: ${perfil.nivelPlaytomic || 'desconocido'}
- Meta de nivel Playtomic de la temporada: ${perfil.nivelObjetivo || 'sin definir'}
- Nivel Padel Band habitual por sesión: ${perfil.nivelBand || 'desconocido'}
- Inicio de la liga: ${perfil.fechaInicio || 'desconocido'}

SUS 3 OBJETIVOS POR PARTIDO: ${JSON.stringify(objetivos)}
(un partido se considera "bien jugado" si cumple 2 de 3)

SEMÁNTICA DE LOS DATOS:
- nivelPlaytomic es acumulativo: fluctúa con victorias/derrotas de partidos competitivos.
- nivelPadelBandSesion mide la calidad de golpeo SOLO de esa sesión (escala 1 peor - 7 mejor). No es acumulativo.
- mejorGolpe/peorGolpe van puntuados de 1 (peor) a 7 (mejor).
- golpesSesionPadelBand: cuando existe, es el desglose completo de la sesión capturado de la app Padel Band (todos los golpes con su nota 1-7). Es el dato más rico: úsalo para analizar la evolución de cada golpe entre sesiones.
- posicion: lado en que jugó (reves o derecha).

REGISTRO (orden cronológico):
${JSON.stringify(datos, null, 2)}

Antes de responder, calcula mentalmente: % de cumplimiento de cada objetivo, rendimiento por posición (victorias y bien jugados en revés vs derecha), rendimiento competitivo vs amistoso, rendimiento con cada compañero si hay datos, ritmo hacia la meta de nivel si está definida, evolución del Playtomic desde el inicial, media del Band por sesión y su tendencia, golpes que más se repiten como peor golpe y su puntuación media, y patrones en los sets (¿pierde terceros sets?, ¿arranca frío el primero?).

Responde SOLO con un objeto JSON válido, sin Markdown ni texto fuera del JSON, con esta estructura exacta:
{
  "lectura": "párrafo de 60-90 palabras con la lectura general de la temporada, citando números concretos (niveles, porcentajes, rachas)",
  "patrones": ["3 o 4 patrones detectados, cada uno de 20-35 palabras, cada uno con su dato concreto (ej: 'Tu peor golpe es la bandeja: registrada 4 veces con media 2,5/7...')"],
  "plan": ["2 o 3 acciones concretas para los próximos partidos, cada una de 20-40 palabras, con ejercicios específicos de pádel (series, repeticiones, situaciones de juego) ligados a los patrones detectados"],
  "foco": "UNA sola consigna medible para el próximo partido, máximo 15 palabras",
  "objetivos": ["exactamente 3 objetivos de partido nuevos que prescribes al jugador para su siguiente ciclo, cada uno de máximo 12 palabras"]
}

Reglas para los 3 objetivos prescritos:
- Deben salir de los patrones detectados: ataca su peor golpe, su objetivo más fallado o su punto débil por posición.
- Cada uno debe ser evaluable con sí/no al acabar un partido (con número o condición clara, ej: "Máximo 3 fallos con la bandeja").
- Si uno de sus objetivos actuales aún no lo domina (lo cumple menos del 70% de las veces), mantenlo; si ya lo cumple casi siempre, sube la exigencia o sustitúyelo.
- Deben poder cumplirse independientemente del compañero o rival.

Si hay pocos datos para algún cálculo, dilo honestamente en ese punto en vez de inventar. Trata al jugador de tú, tono de entrenador de club: cercano, exigente, sin paños calientes.`;

  const texto = await callAnthropic(prompt, 2000);
  const limpio = limpiarJson(texto);
  let parsed: Partial<Analisis>;
  try {
    parsed = JSON.parse(limpio);
  } catch {
    parsed = { lectura: limpio, patrones: [], plan: [], foco: '' };
  }
  if (!parsed.lectura) throw new AnthropicError('Respuesta vacía');
  return {
    lectura: parsed.lectura,
    patrones: parsed.patrones ?? [],
    plan: parsed.plan ?? [],
    foco: parsed.foco ?? '',
    objetivos: parsed.objetivos ?? [],
    fecha: hoy(),
    nPartidos: matches.length,
  };
}

// ─── Captura de Padel Band: visión (prompt literal de la web-app) ───

export async function procesarCapturaBand(
  base64: string,
  mediaType: string
): Promise<CapturaBand> {
  const promptVision = `Esta es una captura de pantalla de la app Padel Band de una sesión de pádel. Puede ser una de estas dos pantallas:

A) PANTALLA DE GOLPES: lista de golpes con su puntuación (escala 1 a 7, puede haber decimales). Puede incluir también una puntuación o nivel global de la sesión.

B) PANTALLA "PROGRESO DE LA SESIÓN": una curva/gráfica de evolución del nivel a lo largo de la sesión, con un valor al inicio de la curva, un valor al final, y normalmente una línea horizontal que marca la media histórica del jugador.

Identifica primero cuál de las dos es y responde SOLO con un objeto JSON válido, sin Markdown ni texto fuera del JSON.

Si es la pantalla de golpes, extrae TODOS los golpes visibles con su puntuación:
{
  "tipo": "golpes",
  "nivelSesion": número o null si no aparece,
  "golpes": [{"nombre": "nombre del golpe en español tal como aparece", "nota": número}]
}

Si es la pantalla de progreso de la sesión:
{
  "tipo": "progreso",
  "inicio": número al inicio de la curva o null si no es legible,
  "fin": número al final de la curva o null,
  "mediaJugador": número de la línea horizontal de media del jugador o null
}

Si la imagen no parece una captura de Padel Band o no hay datos legibles, responde: {"tipo": "desconocido"}`;

  const texto = await callAnthropic(
    [
      { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
      { type: 'text', text: promptVision },
    ],
    1500
  );
  return parseCapturaBand(limpiarJson(texto));
}
