const MESES = [
  'enero',
  'febrero',
  'marzo',
  'abril',
  'mayo',
  'junio',
  'julio',
  'agosto',
  'septiembre',
  'octubre',
  'noviembre',
  'diciembre',
];

export const hoyISO = (): string => new Date().toISOString().slice(0, 10);

/** "2026-07-25" → "25 de julio" (o "25 jul 2026" si es de otro año). */
export function fechaCorta(iso: string | null): string {
  if (!iso) return 'Sin fecha';
  const [y, m, d] = iso.slice(0, 10).split('-').map(Number);
  if (!y || !m || !d) return iso;
  const esteAno = new Date().getFullYear();
  const mes = MESES[m - 1] ?? '';
  return y === esteAno ? `${d} de ${mes}` : `${d} ${mes.slice(0, 3)} ${y}`;
}

export function diasHasta(iso: string | null, desde = hoyISO()): number | null {
  if (!iso) return null;
  const a = Date.parse(`${desde}T00:00:00Z`);
  const b = Date.parse(`${iso.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(a) || Number.isNaN(b)) return null;
  return Math.round((b - a) / 86_400_000);
}

export function sumarDias(iso: string, dias: number): string {
  const d = new Date(`${iso.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

/**
 * Temporada natural del pádel amateur, calcada de las tres tandas anuales de
 * las ligas sociales: T1 septiembre-noviembre, T2 enero-marzo, T3 abril-junio.
 */
export function temporadaDe(iso = hoyISO()): string {
  const [y, m] = iso.split('-').map(Number);
  if (m >= 9) return `T1 ${y}`;
  if (m <= 3) return `T2 ${y}`;
  return `T3 ${y}`;
}
