import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

interface Props {
  progreso: number; // 0-100
  nivelActual: number;
  nivelObjetivo: number;
}

export default function GoalProgressBar({ progreso, nivelActual, nivelObjetivo }: Props) {
  const cumplida = progreso >= 100;
  return (
    <View style={[S.card, styles.card]}>
      <View style={styles.cabecera}>
        <Text style={S.label}>Meta de temporada</Text>
        <Text style={styles.niveles}>
          {nivelActual.toFixed(2)} → {nivelObjetivo.toFixed(2)}
        </Text>
      </View>
      <View style={styles.pista}>
        <View
          style={[
            styles.barra,
            { width: `${progreso}%`, backgroundColor: cumplida ? T.bola : T.pista },
          ]}
        />
      </View>
      <Text style={styles.pie}>
        {cumplida
          ? '🏆 Meta cumplida — sube el listón en Ajustes'
          : `${progreso}% del camino recorrido`}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { paddingVertical: 14, paddingHorizontal: 16 },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginBottom: 7,
  },
  niveles: { fontSize: 15, fontFamily: FONT.display, color: T.pista },
  pista: { height: 10, borderRadius: 5, backgroundColor: T.pistaTinte, overflow: 'hidden' },
  barra: { height: '100%', borderRadius: 5 },
  pie: { fontSize: 12, color: T.tintaSuave, marginTop: 5, fontFamily: FONT.texto },
});
