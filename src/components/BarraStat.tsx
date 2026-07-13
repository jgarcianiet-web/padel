import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { StatsFila } from '../types/domain';

interface Props {
  filas: StatsFila[];
}

export default function BarraStat({ filas }: Props) {
  return (
    <View>
      {filas.map(
        (f) =>
          f.n > 0 && (
            <View key={f.etiqueta} style={styles.fila}>
              <View style={styles.cabecera}>
                <Text style={styles.etiqueta}>
                  {f.etiqueta} <Text style={styles.n}>({f.n})</Text>
                </Text>
                <Text style={styles.pcts}>
                  {f.pctV}% victorias · {f.pctBJ}% bien jugados
                </Text>
              </View>
              <View style={styles.pista}>
                <View style={[styles.barra, { width: `${f.pctV ?? 0}%` }]} />
              </View>
            </View>
          )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { marginBottom: 12 },
  cabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 5,
    alignItems: 'baseline',
    gap: 8,
  },
  etiqueta: { fontSize: 13.5, fontFamily: FONT.textoBold, color: T.tinta, flexShrink: 1 },
  n: { color: T.tintaSuave, fontFamily: FONT.texto },
  pcts: { fontSize: 12.5, color: T.tintaSuave, fontFamily: FONT.texto },
  pista: { height: 8, borderRadius: 4, backgroundColor: T.pistaTinte, overflow: 'hidden' },
  barra: { height: '100%', backgroundColor: T.pista, borderRadius: 4 },
});
