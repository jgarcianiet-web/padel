import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';

interface Props {
  opciones: string[];
  valor: string;
  onChange: (v: string) => void;
}

// Chips de valores anteriores (clubes/compañeros): tocar selecciona, tocar el
// seleccionado lo des-selecciona.
export default function ChipList({ opciones, valor, onChange }: Props) {
  if (opciones.length === 0) return null;
  return (
    <View style={styles.fila}>
      {opciones.map((c) => {
        const activo = valor === c;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(activo ? '' : c)}
            style={[styles.chip, activo && styles.chipActivo]}>
            <Text style={[styles.texto, activo && styles.textoActivo]}>{c}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 },
  chip: {
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: T.borde,
    backgroundColor: T.blanco,
  },
  chipActivo: { borderColor: T.pista, backgroundColor: T.pistaTinte },
  texto: { fontSize: 13, fontFamily: FONT.textoSemi, color: T.tintaSuave },
  textoActivo: { color: T.pista },
});
