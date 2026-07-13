import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

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
}

export default function CoachCard({
  analisis,
  objetivosActuales,
  analizando,
  error,
  onAnalizar,
  onAplicarObjetivos,
}: Props) {
  const objetivosAplicados =
    analisis?.objetivos?.length === 3 &&
    JSON.stringify(analisis.objetivos) === JSON.stringify(objetivosActuales);

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
          <Text style={styles.lectura}>{analisis.lectura}</Text>

          {analisis.patrones?.length > 0 && (
            <>
              <Text style={[S.labelSmall, { marginBottom: 6 }]}>Patrones detectados</Text>
              {analisis.patrones.map((p, i) => (
                <View key={i} style={styles.item}>
                  <Text style={styles.vineta}>▸</Text>
                  <Text style={styles.itemTexto}>{p}</Text>
                </View>
              ))}
            </>
          )}

          {analisis.plan?.length > 0 && (
            <>
              <Text style={[S.labelSmall, { marginTop: 12, marginBottom: 6 }]}>
                Plan de trabajo
              </Text>
              {analisis.plan.map((p, i) => (
                <View key={i} style={styles.item}>
                  <Text style={styles.numero}>{i + 1}</Text>
                  <Text style={styles.itemTexto}>{p}</Text>
                </View>
              ))}
            </>
          )}

          {analisis.foco ? (
            <View style={styles.foco}>
              <Text style={styles.focoTexto}>🎾 Próximo partido: {analisis.foco}</Text>
            </View>
          ) : null}

          {analisis.objetivos?.length === 3 && (
            <View style={styles.prescritos}>
              <Text style={[S.labelSmall, { color: T.pista, marginBottom: 8 }]}>
                Objetivos que te prescribo
              </Text>
              {analisis.objetivos.map((o, i) => (
                <View key={i} style={styles.item}>
                  <Text style={styles.numeroPrescrito}>{i + 1}.</Text>
                  <Text style={styles.itemTexto}>{o}</Text>
                </View>
              ))}
              {objetivosAplicados ? (
                <Text style={styles.aplicados}>✓ Aplicados — son tus objetivos actuales</Text>
              ) : (
                <Pressable
                  onPress={() => onAplicarObjetivos(analisis.objetivos)}
                  style={[S.btnPrim, styles.btnAplicar]}>
                  <Text style={[S.btnPrimText, { fontSize: 14 }]}>Aplicar estos objetivos</Text>
                </Pressable>
              )}
            </View>
          )}
        </>
      ) : (
        <Text style={styles.explicacion}>
          Tu entrenador leerá todos tus datos — objetivos, golpes, posición, sets, niveles — y te
          dará patrones detectados y un plan de trabajo concreto.
        </Text>
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

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
          <Text style={S.btnSecText}>
            {analisis ? 'Actualizar análisis' : 'Pedir análisis'}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderLeftWidth: 4, borderLeftColor: T.pista },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 10,
    gap: 8,
  },
  meta: { fontSize: 11.5, color: T.tintaSuave, fontFamily: FONT.texto },
  lectura: {
    fontSize: 14.5,
    lineHeight: 22.5,
    marginBottom: 12,
    color: T.tinta,
    fontFamily: FONT.texto,
  },
  item: { flexDirection: 'row', gap: 8, marginBottom: 7 },
  vineta: { color: T.pista, fontFamily: FONT.textoBold },
  numero: { color: T.pista, fontFamily: FONT.display, minWidth: 16 },
  numeroPrescrito: { color: T.pista, fontFamily: FONT.textoBold },
  itemTexto: {
    flex: 1,
    fontSize: 13.5,
    lineHeight: 20,
    color: T.tinta,
    fontFamily: FONT.texto,
  },
  foco: {
    marginTop: 12,
    backgroundColor: 'rgba(201,214,33,0.18)',
    borderWidth: 1.5,
    borderColor: T.bolaOscura,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  focoTexto: { fontSize: 14, fontFamily: FONT.textoBold, color: T.tinta },
  prescritos: {
    marginTop: 14,
    backgroundColor: T.pistaTinte,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  aplicados: { fontSize: 13, fontFamily: FONT.textoBold, color: T.bolaOscura, marginTop: 8 },
  btnAplicar: { marginTop: 8, paddingVertical: 12 },
  explicacion: {
    fontSize: 13.5,
    color: T.tintaSuave,
    lineHeight: 20,
    marginBottom: 4,
    fontFamily: FONT.texto,
  },
  error: { fontSize: 13, color: T.rojo, marginTop: 8, fontFamily: FONT.texto },
  btnAnalizar: { marginTop: 14 },
  analizando: { flexDirection: 'row', gap: 8, alignItems: 'center' },
});
