import {
  Reglas,
  ReglasEscalera,
  ReglasLigaDivisiones,
  ReglasLigaIndividual,
  ReglasTorneoParejas,
  TipoCompeticion,
} from '../types/domain';

export const TIPOS: {
  tipo: TipoCompeticion;
  titulo: string;
  resumen: string;
  icono: { ios: string; android: string; web: string };
}[] = [
  {
    tipo: 'liga_divisiones',
    titulo: 'Liga por divisiones',
    resumen:
      'Te apuntas solo. Cada jornada juegas en una mesa de tu nivel rotando de compañero, y los puntos son tuyos. Al final de la temporada se sube y se baja de división.',
    icono: { ios: 'square.stack.3d.up.fill', android: 'layers', web: 'layers' },
  },
  {
    tipo: 'escalera',
    titulo: 'Escalera individual',
    resumen:
      'Un ranking de escalones: retas a quien tienes justo por encima y, si ganas, le quitas el puesto. Individual y sin calendario fijo.',
    icono: { ios: 'stairs', android: 'stairs', web: 'stairs' },
  },
  {
    tipo: 'torneo_parejas',
    titulo: 'Torneo de parejas',
    resumen:
      'Pareja fija, fase de grupos opcional y cuadro eliminatorio con siembra. Para un fin de semana o un torneo de club.',
    icono: { ios: 'person.2.fill', android: 'group', web: 'group' },
  },
  {
    tipo: 'liga_individual',
    titulo: 'Liga individual',
    resumen:
      'Pádel 1 vs 1, todos contra todos. Solo en los clubes que tienen pista individual, que están marcados en el directorio.',
    icono: { ios: 'person.fill', android: 'person', web: 'person' },
  },
];

export const tituloTipo = (tipo: TipoCompeticion): string =>
  TIPOS.find((t) => t.tipo === tipo)?.titulo ?? tipo;

const comunes = {
  setsParaGanar: 1 as const,
  puntoOro: true,
  puntosVictoria: 3,
  puntosDerrota: 0,
};

export const REGLAS_POR_DEFECTO: {
  liga_divisiones: ReglasLigaDivisiones;
  escalera: ReglasEscalera;
  torneo_parejas: ReglasTorneoParejas;
  liga_individual: ReglasLigaIndividual;
} = {
  liga_divisiones: {
    ...comunes,
    tipo: 'liga_divisiones',
    jugadoresPorMesa: 4,
    jornadas: 8,
    sube: 2,
    baja: 2,
  },
  escalera: {
    ...comunes,
    tipo: 'escalera',
    setsParaGanar: 2,
    rangoReto: 3,
    diasParaJugar: 14,
    retosSimultaneos: 1,
  },
  torneo_parejas: {
    ...comunes,
    tipo: 'torneo_parejas',
    setsParaGanar: 2,
    faseGrupos: true,
    equiposPorGrupo: 4,
    clasificanPorGrupo: 2,
  },
  liga_individual: {
    ...comunes,
    tipo: 'liga_individual',
    setsParaGanar: 1,
    jornadas: 7,
    sube: 2,
    baja: 2,
  },
};

export const reglasPorDefecto = (tipo: TipoCompeticion): Reglas =>
  REGLAS_POR_DEFECTO[tipo];

export const modalidadDe = (tipo: TipoCompeticion) =>
  tipo === 'escalera' || tipo === 'liga_individual'
    ? ('individual' as const)
    : ('parejas' as const);
