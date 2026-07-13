import { StyleSheet, Text, TextInput, View } from 'react-native';

import { esTiebreak } from '../lib/marcador';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { SetMarcador } from '../types/domain';

interface Props {
  marcador: SetMarcador[];
  onChange: (marcador: SetMarcador[]) => void;
}

// Marcador visual 2 filas (Tú/Rivales) × 3 sets. Si un set es 7-6/6-7 se pide
// el tie-break y se muestra en pequeño dentro de la celda.
export default function Marcador({ marcador, onChange }: Props) {
  const setCampo = (i: number, campo: keyof SetMarcador, valor: string, maxLen: number) => {
    const n = marcador.map((x) => ({ ...x }));
    n[i][campo] = valor.replace(/[^0-9]/g, '').slice(0, maxLen);
    onChange(n);
  };

  const filas: { etiqueta: string; campo: 'yo' | 'rival'; tb: 'tbYo' | 'tbRival' }[] = [
    { etiqueta: 'Tú', campo: 'yo', tb: 'tbYo' },
    { etiqueta: 'Rivales', campo: 'rival', tb: 'tbRival' },
  ];

  return (
    <View>
      <View style={styles.tabla}>
        {/* cabecera de sets */}
        <View style={styles.cabecera}>
          <View style={styles.colEtiqueta} />
          {[1, 2, 3].map((n) => (
            <Text key={n} style={styles.setTitulo}>
              SET {n}
            </Text>
          ))}
        </View>
        {filas.map((fila, fi) => (
          <View key={fila.campo} style={styles.fila}>
            <View style={[styles.colEtiqueta, styles.celdaEtiqueta, fi === 0 && styles.filaTu]}>
              <Text style={styles.etiqueta}>{fila.etiqueta}</Text>
            </View>
            {marcador.map((s, i) => (
              <View key={i} style={styles.celda}>
                <TextInput
                  value={s[fila.campo]}
                  onChangeText={(v) => setCampo(i, fila.campo, v, 1)}
                  keyboardType="number-pad"
                  maxLength={1}
                  style={styles.inputSet}
                />
                {esTiebreak(s) && s[fila.tb] !== '' && (
                  <Text pointerEvents="none" style={styles.tbCelda}>
                    {s[fila.tb]}
                  </Text>
                )}
              </View>
            ))}
          </View>
        ))}
      </View>

      {/* petición de tie-break */}
      {marcador.map(
        (s, i) =>
          esTiebreak(s) && (
            <View key={i} style={styles.tbFila}>
              <Text style={styles.tbTexto}>Set {i + 1} con tie-break — ¿resultado?</Text>
              <TextInput
                value={s.tbYo}
                onChangeText={(v) => setCampo(i, 'tbYo', v, 2)}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Tú"
                placeholderTextColor={T.tintaSuave}
                style={[S.input, styles.tbInput]}
              />
              <Text style={styles.tbGuion}>–</Text>
              <TextInput
                value={s.tbRival}
                onChangeText={(v) => setCampo(i, 'tbRival', v, 2)}
                keyboardType="number-pad"
                maxLength={2}
                placeholder="Ellos"
                placeholderTextColor={T.tintaSuave}
                style={[S.input, styles.tbInput]}
              />
            </View>
          )
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tabla: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cabecera: { flexDirection: 'row', backgroundColor: T.pistaTinte },
  colEtiqueta: { flex: 1.4, paddingVertical: 8, paddingHorizontal: 12 },
  setTitulo: {
    flex: 1,
    paddingVertical: 8,
    textAlign: 'center',
    fontFamily: FONT.display,
    fontSize: 11,
    color: T.pista,
    letterSpacing: 1,
  },
  fila: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: T.borde },
  celdaEtiqueta: { justifyContent: 'center' },
  filaTu: { backgroundColor: 'rgba(30,86,168,0.05)' },
  etiqueta: { fontFamily: FONT.textoBold, fontSize: 14, color: T.tinta },
  celda: { flex: 1, borderLeftWidth: 1, borderLeftColor: T.borde },
  inputSet: {
    width: '100%',
    textAlign: 'center',
    paddingVertical: 13,
    fontSize: 19,
    color: T.tinta,
    fontFamily: FONT.display,
  },
  tbCelda: {
    position: 'absolute',
    bottom: 2,
    left: 0,
    right: 0,
    textAlign: 'center',
    fontSize: 10,
    color: T.tintaSuave,
    fontFamily: FONT.textoBold,
  },
  tbFila: {
    marginTop: 8,
    backgroundColor: 'rgba(201,214,33,0.16)',
    borderWidth: 1.5,
    borderColor: T.bolaOscura,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tbTexto: { fontSize: 13, fontFamily: FONT.textoBold, flex: 1, color: T.tinta },
  tbInput: { width: 56, marginTop: 0, textAlign: 'center', paddingVertical: 8, paddingHorizontal: 4 },
  tbGuion: { fontFamily: FONT.textoBold, color: T.tinta },
});
