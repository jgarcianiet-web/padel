import { Pressable, StyleSheet, Text, View } from 'react-native';

import { GOLPES } from '../constants/catalogos';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

interface Props {
  titulo: string;
  golpe: string;
  punt: number;
  onGolpe: (g: string) => void;
  onPunt: (p: number) => void;
}

// Sustituto nativo del <select> de la web: chips con los 14 golpes (tocar el
// activo lo quita) + puntuador 1-7 cuando hay golpe elegido.
export default function GolpeSelector({ titulo, golpe, punt, onGolpe, onPunt }: Props) {
  return (
    <View>
      <Text style={[S.labelSmall, { marginTop: 12 }]}>{titulo}</Text>
      <View style={styles.chips}>
        {GOLPES.map((g) => {
          const activo = golpe === g;
          return (
            <Pressable
              key={g}
              onPress={() => onGolpe(activo ? '' : g)}
              style={[styles.chip, activo && styles.chipActivo]}>
              <Text style={[styles.chipTexto, activo && styles.chipTextoActivo]}>{g}</Text>
            </Pressable>
          );
        })}
      </View>
      {golpe !== '' && (
        <View style={styles.puntuador}>
          {[1, 2, 3, 4, 5, 6, 7].map((n) => {
            const activo = punt === n;
            return (
              <Pressable
                key={n}
                onPress={() => onPunt(n)}
                style={[styles.nota, activo && styles.notaActiva]}>
                <Text style={[styles.notaTexto, activo && styles.notaTextoActiva]}>{n}</Text>
              </Pressable>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 8 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 11,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: T.borde,
    backgroundColor: T.blanco,
  },
  chipActivo: { borderColor: T.pista, backgroundColor: T.pista },
  chipTexto: { fontSize: 12.5, fontFamily: FONT.textoSemi, color: T.tintaSuave },
  chipTextoActivo: { color: T.blanco },
  puntuador: { flexDirection: 'row', gap: 5, marginTop: 8 },
  nota: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: T.borde,
    backgroundColor: T.blanco,
    alignItems: 'center',
  },
  notaActiva: { borderColor: T.pista, backgroundColor: T.pista },
  notaTexto: { fontFamily: FONT.display, fontSize: 14, color: T.tintaSuave },
  notaTextoActiva: { color: T.blanco },
});
