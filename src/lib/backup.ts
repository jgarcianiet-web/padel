import { DEFAULT_OBJETIVOS } from '../constants/catalogos';
import { LigaState, Perfil } from '../types/domain';
import { hoy } from './date';

export const perfilVacio = (): Perfil => ({
  nivelPlaytomic: '',
  nivelBand: '',
  nivelObjetivo: '',
  fechaInicio: hoy(),
});

export const estadoInicial = (): LigaState => ({
  matches: [],
  objetivos: [...DEFAULT_OBJETIVOS],
  perfil: perfilVacio(),
  analisis: null,
  analisisHistorial: [],
});

// El backup es el estado serializado tal cual: mismo shape que la web-app
// más analisisHistorial (la web-app ignora las claves que no conoce).
export const exportarBackup = (state: LigaState): string =>
  JSON.stringify({
    matches: state.matches,
    objetivos: state.objetivos,
    perfil: state.perfil,
    analisis: state.analisis,
    analisisHistorial: state.analisisHistorial,
  });

// Lanza si el texto no es un backup válido. Misma validación que la web-app:
// matches debe ser un array; el resto de campos caen a los actuales/por defecto.
export const importarBackup = (raw: string, actual: LigaState): LigaState => {
  const data = JSON.parse(raw.trim());
  if (!Array.isArray(data.matches)) throw new Error('formato');
  const analisis = data.analisis || actual.analisis;
  return {
    matches: data.matches,
    objetivos:
      data.objetivos && data.objetivos.length === 3 ? data.objetivos : actual.objetivos,
    perfil: data.perfil || actual.perfil,
    analisis,
    // los backups de la web-app no traen historial: se siembra con el último
    analisisHistorial: Array.isArray(data.analisisHistorial)
      ? data.analisisHistorial
      : analisis
        ? [analisis]
        : [],
  };
};
