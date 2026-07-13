import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import AnalisisDetalle, { FocoBox } from './AnalisisDetalle';
import { fmtFecha } from '../lib/date';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { Analisis } from '../types/domain';

interface Props {
  analisis: Analisis | null;
  objetivosActuales: string[];
  analizando: boolean;
  error: string;
  onAnalizar: () => void;
  onAplicarObjetivos: (objetivos: string[]) => void;
  // se incrementa cada vez que se genera un análisis nuevo → despliega una vez
  nuevoAnalisisTick: number;
  hayHistorial: boolean;
  onVerHistorial: () => void;
}

// Tarjeta del entrenador. Plegada por defecto (solo título, fecha y foco);
// el estado no se persiste: al reabrir la app siempre empieza plegada.
export default function CoachCard({
  analisis,
  objetivosActuales,
  analizando,
  error,
  onAnalizar,
  onAplicarObjetivos,
  nuevoAnalisisTick,
  hayHistorial,
  onVerHistorial,
}: Props) {
  const [expandida, setExpandida] = useState(false);

  useEffect(() => {
    if (nuevoAnalisisTick > 0) setExpandida(true);
  }, [nuevoAnalisisTick]);

  const botonAnalizar = (
    <Pressable
      onPress={onAnalizar}
      disabled={analizando}
      style={[S.btnSec, styles.btnAnalizar, analizando && { opacity: 0.55 }]}>
      {analizando ? (
        <View style={styles.analizando}>
          <ActivityIndicator size="small" color={T.pista} />
          <Text style={S.btnSecText}>Analizando tus datos…</Text>
        </View>
      ) : (
        <Text style={S.btnSecText}>{analisis ? 'Actualizar análisis' : 'Pedir análisis'}</Text>
      )}
    </Pressable>
  );

  return (
    <View style={[S.card, styles.card]}>
      <View style={styles.cabecera}>
        <Text style={S.label}>Entrenador</Text>
        {analisis?.fecha ? (
          <Text style={styles.meta}>
            análisis del {fmtFecha(analisis.fecha)} · {analisis.nPartidos} partidos
          </Text>
        ) : null}
      </View>

      {analisis ? (
        <>
          {analisis.foco ? <View style={styles.focoPlegado}><FocoBox foco={analisis.foco} /></View> : null}

          {expandida ? (
            <>
              <View style={{ marginTop: 12 }}>
                <AnalisisDetalle
                  analisis={analisis}
                  mostrarFoco={false}
                  objetivosActuales={objetivosActuales}
                  onAplicarObjetivos={onAplicarObjetivos}
                />
              </View>

              {hayHistorial && (
                <Pressable onPress={onVerHistorial} style={styles.enlaceHistorial}>
                  <Text style={styles.enlaceHistorialTexto}>Ver análisis anteriores ›</Text>
                </Pressable>
              )}

              {error ? <Text style={styles.error}>{error}</Text> : null}
              {botonAnalizar}

              <Pressable onPress={() => setExpandida(false)} style={styles.plegador}>
                <Text style={styles.plegadorTexto}>Ocultar análisis ▴</Text>
              </Pressable>
            </>
          ) : (
            <Pressable onPress={() => setExpandida(true)} style={styles.plegador}>
              <Text style={styles.plegadorTexto}>Ver análisis completo ▾</Text>
            </Pressable>
          )}
        </>
      ) : (
        <>
          <Text style={styles.explicacion}>
            Tu entrenador leerá todos tus datos — objetivos, golpes, posición, sets, niveles — y
            te dará patrones detectados y un plan de trabajo concreto.
          </Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          {botonAnalizar}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, borderLeftColor: T.pista },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 4,
    gap: 8,
  },
  meta: { fontSize: 11.5, color: T.tintaSuave, fontFamily: FONT.texto },
  focoPlegado: { marginTop: 0 },
  plegador: { marginTop: 12, alignItems: 'center', paddingVertical: 4 },
  plegadorTexto: { fontSize: 13.5, color: T.pista, fontFamily: FONT.textoBold },
  enlaceHistorial: { marginTop: 12 },
  enlaceHistorialTexto: { fontSize: 13.5, color: T.pista, fontFamily: FONT.textoBold },
  explicacion: {
    fontSize: 13.5,
    color: T.tintaSuave,
    lineHeight: 20,
    marginBottom: 4,
    marginTop: 6,
    fontFamily: FONT.texto,
  },
  error: { fontSize: 13, color: T.rojo, marginTop: 8, fontFamily: FONT.texto },
  btnAnalizar: { marginTop: 14 },
  analizando: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
