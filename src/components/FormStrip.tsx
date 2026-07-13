import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { Match } from '../types/domain';

interface Props {
  matches: Match[];
  bienJugado: (m: Match) => boolean;
}

// Fichas V/E/D de los últimos partidos, inclinadas como en la web-app;
// subrayado blanco cuando el partido fue "bien jugado".
export default function FormStrip({ matches, bienJugado }: Props) {
  return (
    <View style={styles.fila}>
      {matches.map((m) => {
        const letra = m.resultado === 'victoria' ? 'V' : m.resultado === 'empate' ? 'E' : 'D';
        const fondo =
          m.resultado === 'victoria'
            ? T.bola
            : m.resultado === 'empate'
              ? 'rgba(255,255,255,0.35)'
              : 'rgba(208,69,91,0.9)';
        const colorLetra = m.resultado === 'victoria' ? T.tinta : T.blanco;
        return (
          <View
            key={m.id}
            style={[
              styles.ficha,
              { backgroundColor: fondo },
              bienJugado(m) && styles.bienJugado,
            ]}>
            <Text style={[styles.letra, { color: colorLetra }]}>{letra}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 6, justifyContent: 'center' },
  ficha: {
    width: 28,
    height: 32,
    borderRadius: 5,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ skewX: '-8deg' }],
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  bienJugado: { borderBottomColor: T.blanco },
  letra: {
    fontFamily: FONT.display,
    fontSize: 14,
    transform: [{ skewX: '8deg' }],
  },
});
