// Helpers de fecha portados de la web-app. Se usa mediodía para evitar
// desplazamientos de día por zona horaria al parsear el ISO.

export const hoy = (): string => new Date().toISOString().slice(0, 10);

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

// Nota: no usamos toLocaleDateString porque el runtime Hermes de RN no
// garantiza los datos de locale es-ES; las tablas fijas dan siempre el
// mismo resultado que la web-app ("12 jul", "Julio de 2026").
export const fmtFecha = (iso: string): string => {
  const d = new Date(iso + 'T12:00:00');
  return `${d.getDate()} ${MESES_CORTOS[d.getMonth()]}`;
};

export const fmtMes = (iso: string): string => {
  const d = new Date(iso + 'T12:00:00');
  const mes = MESES_LARGOS[d.getMonth()];
  return `${mes.charAt(0).toUpperCase()}${mes.slice(1)} de ${d.getFullYear()}`;
};
