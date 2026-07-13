import { NativeModules, Platform } from 'react-native';
import AppleHealthKit, {
  HealthInputOptions,
  HealthKitPermissions,
  HKWorkoutQueriedSampleType,
} from 'react-native-health';

import { SaludPartido } from '../types/domain';

// HealthKit requiere módulo nativo: no existe en Expo Go ni en Android. Toda
// la app pasa por este guard para degradar con un mensaje en vez de crashear.
export const healthDisponible = (): boolean =>
  Platform.OS === 'ios' && !!NativeModules.AppleHealthKit;

export const MSG_SIN_HEALTH =
  'Apple Health requiere la build nativa de la app (TestFlight). En Expo Go esta sección está desactivada.';

const PERMISOS: HealthKitPermissions = {
  permissions: {
    read: [
      AppleHealthKit.Constants.Permissions.Workout,
      AppleHealthKit.Constants.Permissions.HeartRate,
      AppleHealthKit.Constants.Permissions.ActiveEnergyBurned,
    ],
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
    if (!healthDisponible()) {
      reject(new Error(MSG_SIN_HEALTH));
      return;
    }
    AppleHealthKit.initHealthKit(PERMISOS, (error) => {
      if (error) reject(new Error(String(error)));
      else resolve();
    });
  });

// Workouts de tipo raqueta/pádel del día indicado (fecha ISO yyyy-mm-dd).
export const workoutsDelDia = async (fecha: string): Promise<WorkoutDia[]> => {
  await pedirPermisos();
  const inicio = new Date(fecha + 'T00:00:00').toISOString();
  const fin = new Date(fecha + 'T23:59:59.999').toISOString();
  const workouts = await new Promise<HKWorkoutQueriedSampleType[]>((resolve, reject) => {
    AppleHealthKit.getAnchoredWorkouts(
      { startDate: inicio, endDate: fin } as HealthInputOptions,
      (err, results) => {
        if (err) reject(new Error(String(err)));
        else resolve(results?.data ?? []);
      }
    );
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
    AppleHealthKit.getHeartRateSamples(
      { startDate: inicio, endDate: fin } as HealthInputOptions,
      (err, results) => {
        if (err || !results || results.length === 0) {
          resolve({ medio: null, max: null });
          return;
        }
        const valores = results.map((r) => r.value);
        resolve({
          medio: Math.round(valores.reduce((a, v) => a + v, 0) / valores.length),
          max: Math.round(Math.max(...valores)),
        });
      }
    );
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
