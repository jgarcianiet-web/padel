import { NativeModules, Platform } from 'react-native';

import { SaludPartido } from '../types/domain';

// IMPORTANTE: no importar 'react-native-health' en runtime. Su index.js hace
// Object.assign({}, NativeModules.AppleHealthKit, ...) y, con la arquitectura
// nueva de RN (proxy de interop), los métodos del módulo nativo no son
// propiedades enumerables propias: el objeto resultante queda sin métodos
// ("undefined is not a function"). Llamamos al módulo nativo directamente.

interface WorkoutNativo {
  id: string;
  activityName: string;
  calories: number | null;
  start: string;
  end: string;
  duration: number | null;
}

interface MuestraNativa {
  value: number;
  startDate: string;
  endDate: string;
}

interface AppleHealthKitNativo {
  initHealthKit(
    permisos: { permissions: { read: string[]; write: string[] } },
    callback: (error: string | null) => void
  ): void;
  getAnchoredWorkouts(
    opciones: { startDate: string; endDate: string },
    callback: (error: string | null, resultados: { data?: WorkoutNativo[] } | null) => void
  ): void;
  getHeartRateSamples(
    opciones: { startDate: string; endDate: string },
    callback: (error: string | null, resultados: MuestraNativa[] | null) => void
  ): void;
}

const healthKit = (): AppleHealthKitNativo | null => {
  if (Platform.OS !== 'ios') return null;
  const hk = NativeModules.AppleHealthKit;
  // el módulo puede existir como proxy pero sin métodos (fallo de interop):
  // trátalo como no disponible en vez de reventar con TypeError
  if (!hk || typeof hk.initHealthKit !== 'function') return null;
  return hk;
};

// HealthKit requiere módulo nativo: no existe en Expo Go ni en Android. Toda
// la app pasa por este guard para degradar con un mensaje en vez de crashear.
export const healthDisponible = (): boolean => !!healthKit();

// Línea de diagnóstico visible en Ajustes para depurar sin acceso al dispositivo.
export const healthDiagnostico = (): string => {
  if (Platform.OS !== 'ios') return 'plataforma sin HealthKit';
  const hk = NativeModules.AppleHealthKit;
  if (!hk) return 'módulo nativo: NO presente';
  return `módulo nativo: presente · initHealthKit: ${typeof hk.initHealthKit} · getAnchoredWorkouts: ${typeof hk.getAnchoredWorkouts}`;
};

export const MSG_SIN_HEALTH =
  'Apple Health requiere la build nativa de la app (TestFlight). En Expo Go esta sección está desactivada.';

// Valores literales de HKPermissions (react-native-health/src/constants).
const PERMISOS = {
  permissions: {
    read: ['Workout', 'HeartRate', 'ActiveEnergyBurned'],
    write: [],
  },
};

// HealthKit no tiene tipo "Pádel": el Apple Watch lo registra como Tennis,
// Racquetball, PaddleSports u Other según el modelo/configuración.
const ACTIVIDADES_PADEL = new Set([
  'tennis',
  'racquetball',
  'squash',
  'badminton',
  'pickleball',
  'paddlesports',
  'padel',
  'other',
]);

export interface WorkoutDia {
  id: string;
  actividad: string;
  inicio: string; // ISO
  fin: string; // ISO
  duracionMin: number;
  calorias: number | null;
}

// Solicita (o comprueba) los permisos de lectura. HealthKit no revela si el
// usuario concedió permisos de lectura: éxito solo significa que el diálogo
// se gestionó.
export const pedirPermisos = (): Promise<void> =>
  new Promise((resolve, reject) => {
    const hk = healthKit();
    if (!hk) {
      reject(new Error(MSG_SIN_HEALTH));
      return;
    }
    hk.initHealthKit(PERMISOS, (error) => {
      if (error) reject(new Error(String(error)));
      else resolve();
    });
  });

// Workouts de tipo raqueta/pádel del día indicado (fecha ISO yyyy-mm-dd).
export const workoutsDelDia = async (fecha: string): Promise<WorkoutDia[]> => {
  await pedirPermisos();
  const hk = healthKit();
  if (!hk) throw new Error(MSG_SIN_HEALTH);
  const inicio = new Date(fecha + 'T00:00:00').toISOString();
  const fin = new Date(fecha + 'T23:59:59.999').toISOString();
  const workouts = await new Promise<WorkoutNativo[]>((resolve, reject) => {
    hk.getAnchoredWorkouts({ startDate: inicio, endDate: fin }, (err, results) => {
      if (err) reject(new Error(String(err)));
      else resolve(results?.data ?? []);
    });
  });
  return workouts
    .filter((w) => ACTIVIDADES_PADEL.has((w.activityName || '').toLowerCase()))
    .map((w) => ({
      id: w.id,
      actividad: w.activityName,
      inicio: w.start,
      fin: w.end,
      duracionMin: Math.round(
        w.duration ? w.duration / 60 : (Date.parse(w.end) - Date.parse(w.start)) / 60000
      ),
      calorias: w.calories != null ? Math.round(w.calories) : null,
    }));
};

// Pulso medio y máximo durante la ventana del workout.
const pulsoDelWorkout = (
  inicio: string,
  fin: string
): Promise<{ medio: number | null; max: number | null }> =>
  new Promise((resolve) => {
    const hk = healthKit();
    if (!hk) {
      resolve({ medio: null, max: null });
      return;
    }
    hk.getHeartRateSamples({ startDate: inicio, endDate: fin }, (err, results) => {
      if (err || !results || results.length === 0) {
        resolve({ medio: null, max: null });
        return;
      }
      const valores = results.map((r) => r.value);
      resolve({
        medio: Math.round(valores.reduce((a, v) => a + v, 0) / valores.length),
        max: Math.round(Math.max(...valores)),
      });
    });
  });

// Convierte un workout elegido por el usuario en los datos de salud del match.
export const saludDeWorkout = async (w: WorkoutDia): Promise<SaludPartido> => {
  const pulso = await pulsoDelWorkout(w.inicio, w.fin);
  return {
    duracionMin: w.duracionMin,
    pulsoMedio: pulso.medio,
    pulsoMax: pulso.max,
    calorias: w.calorias,
  };
};
