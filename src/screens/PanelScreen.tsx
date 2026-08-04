import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import BarraStat from '../components/BarraStat';
import Cabecera from '../components/Cabecera';
import Card from '../components/Card';
import CoachCard from '../components/CoachCard';
import EvolutionChart from '../components/EvolutionChart';
import GoalProgressBar from '../components/GoalProgressBar';
import MonthSummaryCard from '../components/MonthSummaryCard';
import PitchHero from '../components/PitchHero';
import SesionesRelojBanner from '../components/SesionesRelojBanner';
import StatMarker from '../components/StatMarker';
import StrokesCard from '../components/StrokesCard';
import { AnthropicError, analizarLiga } from '../lib/anthropic';
import { hoy } from '../lib/date';
import {
  calcBandMedia,
  calcCumplimientoObjetivos,
  calcResumenMensual,
  calcChartData,
  calcDeltaNivel,
  calcMejorRacha,
  calcNivelActual,
  calcNivelInicial,
  calcPctVictorias,
  calcProgresoMeta,
  calcRacha,
  calcStatsCompanero,
  calcStatsPos,
  calcStatsTipo,
  calcTopMejores,
  calcTopPeores,
  calcUltimos8,
} from '../lib/metrics';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

export default function PanelScreen() {
  const matches = useLigaStore((s) => s.matches);
  const objetivos = useLigaStore((s) => s.objetivos);
  const perfil = useLigaStore((s) => s.perfil);
  const analisis = useLigaStore((s) => s.analisis);
  const analisisHistorial = useLigaStore((s) => s.analisisHistorial);
  const guardarAnalisis = useLigaStore((s) => s.guardarAnalisis);
  const guardarObjetivos = useLigaStore((s) => s.guardarObjetivos);

  const [analizando, setAnalizando] = useState(false);
  const [errorAnalisis, setErrorAnalisis] = useState('');
  // se incrementa al generar un análisis para que la tarjeta se despliegue
  // una vez; no se persiste: al reabrir la app la tarjeta empieza plegada
  const [nuevoAnalisisTick, setNuevoAnalisisTick] = useState(0);

  const racha = calcRacha(matches);
  const mejorRacha = calcMejorRacha(matches);
  const pctVictorias = calcPctVictorias(matches);
  const nivelActual = calcNivelActual(matches, perfil);
  const nivelInicial = calcNivelInicial(matches, perfil);
  const deltaNivel = calcDeltaNivel(matches, perfil);
  const bandMedia = calcBandMedia(matches, perfil);
  const progresoMeta = calcProgresoMeta(matches, perfil);
  const nivelObjetivo = perfil.nivelObjetivo ? parseFloat(perfil.nivelObjetivo) : null;
  const chartData = calcChartData(matches);
  const statsTipo = calcStatsTipo(matches);
  const statsPos = calcStatsPos(matches);
  const statsComp = calcStatsCompanero(matches);
  const topMejores = calcTopMejores(matches);
  const topPeores = calcTopPeores(matches);
  const resumenMensual = calcResumenMensual(matches, hoy());
  const cumplimiento = calcCumplimientoObjetivos(matches);

  const onAnalizar = async () => {
    if (analizando) return;
    setAnalizando(true);
    setErrorAnalisis('');
    try {
      const nuevo = await analizarLiga({ matches, objetivos, perfil, analisis, analisisHistorial });
      await guardarAnalisis(nuevo);
      setNuevoAnalisisTick((t) => t + 1);
    } catch (e) {
      setErrorAnalisis(
        e instanceof AnthropicError
          ? e.message
          : 'No se pudo generar el análisis. Inténtalo de nuevo en un momento.'
      );
    }
    setAnalizando(false);
  };

  const deltaColor =
    deltaNivel != null && parseFloat(deltaNivel) > 0
      ? T.bolaOscura
      : deltaNivel != null && parseFloat(deltaNivel) < 0
        ? T.rojo
        : undefined;

  return (
    <View style={styles.pantalla}>
      <Cabecera fechaInicio={perfil.fechaInicio} totalPartidos={matches.length} />
      <ScrollView contentContainerStyle={styles.scroll}>
        <SesionesRelojBanner />
        <PitchHero
          racha={racha}
          mejorRacha={mejorRacha}
          ultimos8={calcUltimos8(matches)}
          totalPartidos={matches.length}
        />

        {/* Marcadores */}
        <View style={styles.marcadores}>
          <StatMarker label="Playtomic" valor={nivelActual != null ? nivelActual.toFixed(2) : '—'} />
          <StatMarker
            label="Δ Temporada"
            valor={
              deltaNivel != null
                ? parseFloat(deltaNivel) > 0
                  ? `+${deltaNivel}`
                  : deltaNivel
                : '—'
            }
            color={deltaColor}
          />
          <StatMarker label="Band media" valor={bandMedia != null ? bandMedia.toFixed(1) : '—'} />
          <StatMarker label="Victorias" valor={matches.length ? `${pctVictorias}%` : '—'} />
        </View>

        {progresoMeta != null && nivelActual != null && nivelObjetivo != null && (
          <GoalProgressBar
            progreso={progresoMeta}
            nivelActual={nivelActual}
            nivelObjetivo={nivelObjetivo}
          />
        )}

        {chartData.length >= 2 && <EvolutionChart data={chartData} nivelInicial={nivelInicial} />}

        {matches.length >= 2 && (
          <MonthSummaryCard
            actual={resumenMensual.actual}
            anterior={resumenMensual.anterior}
            objetivos={objetivos}
            cumplimiento={cumplimiento}
          />
        )}

        {matches.length >= 2 && (
          <Card>
            <Text style={[S.label, { marginBottom: 12 }]}>Rendimiento</Text>
            <BarraStat filas={statsTipo} />
            {(statsPos[0].n > 0 || statsPos[1].n > 0) && (
              <>
                <View style={styles.separador} />
                <BarraStat filas={statsPos} />
              </>
            )}
            {statsComp.length > 0 && (
              <>
                <View style={styles.separador} />
                <Text style={[S.labelSmall, { marginBottom: 10 }]}>Por compañero</Text>
                <BarraStat filas={statsComp} />
              </>
            )}
          </Card>
        )}

        {(topMejores.length > 0 || topPeores.length > 0) && (
          <StrokesCard mejores={topMejores} peores={topPeores} />
        )}

        {matches.length >= 3 && (
          <CoachCard
            analisis={analisis}
            objetivosActuales={objetivos}
            analizando={analizando}
            error={errorAnalisis}
            onAnalizar={onAnalizar}
            onAplicarObjetivos={(o) => guardarObjetivos(o)}
            nuevoAnalisisTick={nuevoAnalisisTick}
            hayHistorial={analisisHistorial.length > 0}
            onVerHistorial={() => router.push('/analisis')}
          />
        )}
        {matches.length > 0 && matches.length < 3 && (
          <Text style={styles.avisoEntrenador}>
            Con 3 partidos registrados se desbloquea el análisis del entrenador (
            {matches.length}/3).
          </Text>
        )}

        {matches.length === 0 && (
          <Card style={styles.vacio}>
            {!perfil.nivelPlaytomic ? (
              <>
                <Text style={styles.vacioTitulo}>Arranca tu temporada</Text>
                <Text style={styles.vacioTexto}>
                  Ve a <Text style={styles.vacioEnlace}>Ajustes</Text> y guarda tu nivel actual:
                  será tu punto de partida y todo el progreso se medirá desde ahí.
                </Text>
              </>
            ) : (
              <Text style={styles.vacioTexto}>
                Perfil guardado. Registra tu primer partido y arranca la liga.
              </Text>
            )}
          </Card>
        )}

        <Pressable style={S.btnPrim} onPress={() => router.push('/partido')}>
          <Text style={S.btnPrimText}>+ Registrar partido</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  marcadores: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 12,
  },
  separador: { height: 1, backgroundColor: T.borde, marginTop: 4, marginBottom: 14 },
  avisoEntrenador: {
    fontSize: 12.5,
    color: T.tintaSuave,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 14,
    fontFamily: FONT.texto,
  },
  vacio: { alignItems: 'center', padding: 26 },
  vacioTitulo: { fontSize: 17, fontFamily: FONT.display, color: T.tinta, marginBottom: 6 },
  vacioTexto: {
    fontSize: 13.5,
    color: T.tintaSuave,
    lineHeight: 20,
    textAlign: 'center',
    fontFamily: FONT.texto,
  },
  vacioEnlace: { color: T.pista, fontFamily: FONT.textoBold },
});
