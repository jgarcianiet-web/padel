import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';

interface Props {
  objetivos: string[];
  cumplidos: boolean[];
  onChange: (cumplidos: boolean[]) => void;
}

export default function ObjectivesChecklist({ objetivos, cumplidos, onChange }: Props) {
  return (
    <View>
      {objetivos.map((o, i) => {
        const activo = cumplidos[i];
        return (
          <Pressable
            key={i}
            onPress={() => {
              const n = [...cumplidos];
              n[i] = !n[i];
              onChange(n);
            }}
            style={[styles.fila, activo && styles.filaActiva]}>
            <View style={[styles.circulo, activo && styles.circuloActivo]}>
              {activo && <Text style={styles.check}>✓</Text>}
            </View>
            <Text style={styles.texto}>{o}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: T.blanco,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 10,
    paddingVertical: 13,
    paddingHorizontal: 14,
    marginBottom: 8,
  },
  filaActiva: { backgroundColor: T.pistaTinte, borderColor: T.pista },
  circulo: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: T.borde,
    alignItems: 'center',
    justifyContent: 'center',
  },
  circuloActivo: { borderColor: T.pista, backgroundColor: T.pista },
  check: { color: T.blanco, fontSize: 13, fontWeight: '800' },
  texto: { flex: 1, fontSize: 14, color: T.tinta, fontFamily: FONT.texto },
});
