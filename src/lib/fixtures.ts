import { LigaState, Match } from '../types/domain';

// Fábrica de partidos para tests: por defecto un partido "bien jugado".
export const mkMatch = (over: Partial<Match> = {}): Match => ({
  id: Math.floor(Math.random() * 1e9),
  fecha: '2026-07-12',
  tipo: 'competitivo',
  resultado: 'victoria',
  posicion: 'reves',
  sets: '6-4, 6-3',
  marcador: [
    { yo: '6', rival: '4', tbYo: '', tbRival: '' },
    { yo: '6', rival: '3', tbYo: '', tbRival: '' },
  ],
  club: 'Padel Indoor',
  companero: 'Luis',
  nivel: 3.42,
  nivelBand: 3.5,
  mejorGolpe: 'Bandeja',
  mejorPunt: 5,
  peorGolpe: 'Revés',
  peorPunt: 2,
  golpesSesion: [{ nombre: 'Bandeja', nota: 4.2 }],
  objetivos: [true, false, true],
  nota: '',
  ...over,
});

// Backup con el shape EXACTO del brief — round-trip de importación.
export const BACKUP_BRIEF: LigaState = {
  matches: [
    {
      id: 1234567890,
      fecha: '2026-07-12',
      tipo: 'competitivo',
      resultado: 'victoria',
      posicion: 'reves',
      sets: '6-4, 7-6(8-6), 3-6',
      marcador: [{ yo: '6', rival: '4', tbYo: '', tbRival: '' }],
      club: 'string',
      companero: 'string',
      nivel: 3.42,
      nivelBand: 3.5,
      mejorGolpe: 'Bandeja',
      mejorPunt: 5,
      peorGolpe: 'Revés',
      peorPunt: 2,
      golpesSesion: [{ nombre: 'Bandeja', nota: 4.2 }],
      objetivos: [true, false, true],
      nota: 'string',
    },
  ],
  objetivos: ['obj1', 'obj2', 'obj3'],
  perfil: {
    nivelPlaytomic: '3.20',
    nivelBand: '3.5',
    nivelObjetivo: '3.50',
    fechaInicio: '2026-07-12',
  },
  analisis: {
    lectura: '...',
    patrones: [],
    plan: [],
    foco: '...',
    objetivos: [],
    fecha: '...',
    nPartidos: 3,
  },
};
