import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';

interface Opcion<V extends string> {
  v: V;
  t: string;
}

interface Props<V extends string> {
  opciones: Opcion<V>[];
  valor: V;
  onChange: (v: V) => void;
}

export default function Toggle<V extends string>({ opciones, valor, onChange }: Props<V>) {
  return (
    <View style={styles.fila}>
      {opciones.map((o) => {
        const activo = valor === o.v;
        return (
          <Pressable
            key={o.v}
            onPress={() => onChange(o.v)}
            style={[styles.btn, activo && styles.btnActivo]}>
            <Text style={[styles.texto, activo && styles.textoActivo]}>{o.t}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', gap: 8, marginTop: 6 },
  btn: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: T.borde,
    backgroundColor: T.blanco,
    alignItems: 'center',
  },
  btnActivo: {
    borderColor: T.pista,
    backgroundColor: T.pista,
  },
  texto: {
    fontFamily: FONT.textoBold,
    fontSize: 14,
    color: T.tintaSuave,
  },
  textoActivo: { color: T.blanco },
});
