import { fusionarGolpes, fusionarVolumen } from './band';
import { calcularResultado, formatearSets } from './marcador';
import {
  GolpeSesion,
  GolpeVolumen,
  ResultadoPartido,
  SaludPartido,
  SetMarcador,
  TipoPartido,
} from '../types/domain';

// Receptor del contrato de Rising Padel Watch (docs/api-contract.md de ese
// repo). La app del reloj abre ligapadel://importar?datos=<JSON percent-
// encoded> con el MISMO payload que definiría su POST /v1/padel-sessions.

interface PayloadSesion {
  sessionId?: string;
  schemaVersion?: number;
  startedAt?: string;
  durationSeconds?: number;
  shots?: {
    total?: number;
    byType?: Record<string, number>;
  };
  health?: {
    heartRate?: { meanBpm?: number; maxBpm?: number };
    activeEnergyKcal?: number;
  };
  score?: {
    sets?: { us?: number; them?: number }[];
    winner?: 'us' | 'them';
    completed?: boolean;
  };
  level?: {
    overall?: number;
    byShotType?: Record<string, number>;
    reliable?: boolean;
  };
}

// Lo que la sesión del reloj puede prerrellenar de un partido.
export interface SesionImportada {
  sessionId: string | null;
  fecha: string; // yyyy-mm-dd local
  tipo: TipoPartido;
  resultado: ResultadoPartido | null;
  marcador: SetMarcador[] | null;
  sets: string;
  nivelBand: string; // '' si el nivel no es fiable o no existe
  golpesSesion: GolpeSesion[];
  golpesVolumen: GolpeVolumen[];
  totalGolpes: number | null;
  salud: SaludPartido | null;
  resumen: string; // línea legible para la pantalla de confirmación
}

// Tipos de golpeo del reloj → catálogo de la liga (volea unificada; el
// overhead del reloj agrupa bandeja/smash → Bandeja).
const TIPO_GOLPE: Record<string, string> = {
  forehand: 'Derecha',
  backhand: 'Revés',
  forehandVolley: 'Volea',
  backhandVolley: 'Volea',
  overhead: 'Bandeja',
  serve: 'Saque',
};

const MAX_SCHEMA_VERSION = 2;

const fechaLocal = (iso: string): string => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// Lanza con mensaje legible si el payload no es utilizable.
export function parseSesion(raw: string): SesionImportada {
  let p: PayloadSesion;
  try {
    p = JSON.parse(raw);
  } catch {
    throw new Error('Los datos recibidos no son un JSON válido.');
  }
  if (p.schemaVersion != null && p.schemaVersion > MAX_SCHEMA_VERSION) {
    throw new Error(
      `La sesión usa un formato más nuevo (v${p.schemaVersion}) que esta app. Actualiza Liga Personal Pádel.`
    );
  }
  if (!p.startedAt || Number.isNaN(Date.parse(p.startedAt))) {
    throw new Error('La sesión no trae una fecha de inicio válida.');
  }

  // marcador: us/them → Tú/Rivales; sin detalle de tie-break en el contrato
  const setsOrigen = p.score?.sets ?? [];
  const marcador: SetMarcador[] = setsOrigen
    .filter((s) => s.us != null && s.them != null)
    .slice(0, 3)
    .map((s) => ({ yo: String(s.us), rival: String(s.them), tbYo: '', tbRival: '' }));
  const resultado: ResultadoPartido | null =
    p.score?.winner === 'us'
      ? 'victoria'
      : p.score?.winner === 'them'
        ? 'derrota'
        : marcador.length
          ? calcularResultado(marcador)
          : null;

  // nivel por golpe (1-7) → notas de sesión; unifica voleas con la media
  const golpesSesion = fusionarGolpes(
    Object.entries(p.level?.byShotType ?? {})
      .filter(([tipo, nota]) => TIPO_GOLPE[tipo] && typeof nota === 'number')
      .map(([tipo, nota]) => ({ nombre: TIPO_GOLPE[tipo], nota }))
  );

  // recuento por golpe → volumen; unifica voleas sumando
  const golpesVolumen = fusionarVolumen(
    Object.entries(p.shots?.byType ?? {})
      .filter(([tipo, n]) => TIPO_GOLPE[tipo] && typeof n === 'number' && n > 0)
      .map(([tipo, n]) => ({ nombre: TIPO_GOLPE[tipo], cantidad: n }))
  );

  const salud: SaludPartido | null =
    p.health || p.durationSeconds
      ? {
          duracionMin: p.durationSeconds ? Math.round(p.durationSeconds / 60) : 0,
          pulsoMedio: p.health?.heartRate?.meanBpm ?? null,
          pulsoMax: p.health?.heartRate?.maxBpm ?? null,
          calorias: p.health?.activeEnergyKcal != null ? Math.round(p.health.activeEnergyKcal) : null,
        }
      : null;

  // el propio contrato pide no apoyarse en el nivel si reliable es false
  const nivelFiable = p.level?.overall != null && p.level?.reliable !== false;

  const partes = [
    p.shots?.total != null ? `${p.shots.total} golpeos` : null,
    golpesSesion.length ? `${golpesSesion.length} golpes puntuados` : null,
    marcador.length ? `marcador ${formatearSets(marcador)}` : null,
    salud?.pulsoMedio != null ? `♥ ${salud.pulsoMedio} ppm` : null,
    salud?.duracionMin ? `${salud.duracionMin} min` : null,
  ].filter(Boolean);

  return {
    sessionId: p.sessionId ?? null,
    fecha: fechaLocal(p.startedAt),
    tipo: p.score ? 'competitivo' : 'amistoso',
    resultado,
    marcador: marcador.length ? marcador : null,
    sets: marcador.length ? formatearSets(marcador) : '',
    nivelBand: nivelFiable ? String(p.level!.overall) : '',
    golpesSesion,
    golpesVolumen,
    totalGolpes: p.shots?.total ?? null,
    salud,
    resumen: partes.join(' · ') || 'sesión sin datos agregados',
  };
}

// Entrega en mano entre la pantalla de importación y el formulario de
// partido. No se persiste: si la app se reinicia a mitad, se pierde y ya está.
let pendiente: SesionImportada | null = null;

export const dejarSesionPendiente = (s: SesionImportada) => {
  pendiente = s;
};

export const recogerSesionPendiente = (): SesionImportada | null => {
  const s = pendiente;
  pendiente = null;
  return s;
};
