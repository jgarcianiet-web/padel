import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { Analisis } from '../types/domain';

interface Props {
  analisis: Analisis;
  mostrarFoco?: boolean; // la tarjeta plegada ya muestra el foco fuera
  // si se pasan, los objetivos prescritos muestran el botón de aplicar
  objetivosActuales?: string[];
  onAplicarObjetivos?: (objetivos: string[]) => void;
}

// Cuerpo completo de un análisis del entrenador: lectura, patrones, plan,
// foco y objetivos prescritos. Se usa en la CoachCard y en el historial.
export default function AnalisisDetalle({
  analisis,
  mostrarFoco = true,
  objetivosActuales,
  onAplicarObjetivos,
}: Props) {
  const objetivosAplicados =
    analisis.objetivos?.length === 3 &&
    objetivosActuales != null &&
    JSON.stringify(analisis.objetivos) === JSON.stringify(objetivosActuales);

  return (
    <View>
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
          <Text style={[S.labelSmall, { marginTop: 12, marginBottom: 6 }]}>Plan de trabajo</Text>
          {analisis.plan.map((p, i) => (
            <View key={i} style={styles.item}>
              <Text style={styles.numero}>{i + 1}</Text>
              <Text style={styles.itemTexto}>{p}</Text>
            </View>
          ))}
        </>
      )}

      {mostrarFoco && analisis.foco ? <FocoBox foco={analisis.foco} /> : null}

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
          {onAplicarObjetivos &&
            (objetivosAplicados ? (
              <Text style={styles.aplicados}>✓ Aplicados — son tus objetivos actuales</Text>
            ) : (
              <Pressable
                onPress={() => onAplicarObjetivos(analisis.objetivos)}
                style={[S.btnPrim, styles.btnAplicar]}>
                <Text style={[S.btnPrimText, { fontSize: 14 }]}>Aplicar estos objetivos</Text>
              </Pressable>
            ))}
        </View>
      )}
    </View>
  );
}

export function FocoBox({ foco }: { foco: string }) {
  return (
    <View style={styles.foco}>
      <Text style={styles.focoTexto}>🎾 Próximo partido: {foco}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
});
