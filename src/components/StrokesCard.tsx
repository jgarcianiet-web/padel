import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { GolpeAgregado } from '../types/domain';

interface Props {
  mejores: GolpeAgregado[];
  peores: GolpeAgregado[];
}

export default function StrokesCard({ mejores, peores }: Props) {
  const Columna = ({
    titulo,
    color,
    golpes,
  }: {
    titulo: string;
    color: string;
    golpes: GolpeAgregado[];
  }) => (
    <View style={styles.col}>
      <Text style={[styles.colTitulo, { color }]}>{titulo}</Text>
      {golpes.length === 0 && <Text style={styles.sinDatos}>Sin datos aún</Text>}
      {golpes.map((g) => (
        <Pressable
          key={g.golpe}
          onPress={() => router.push(`/golpe?nombre=${encodeURIComponent(g.golpe)}`)}>
          <Text style={styles.golpe}>
            <Text style={styles.golpeNombre}>{g.golpe}</Text>
            <Text style={styles.golpeDetalle}>
              {' '}· {g.veces}× · media {g.media.toFixed(1)}/7 ›
            </Text>
          </Text>
        </Pressable>
      ))}
    </View>
  );

  return (
    <View style={S.card}>
      <Text style={[S.label, { marginBottom: 4 }]}>Tus golpes</Text>
      <Text style={styles.ayuda}>Toca un golpe para ver su evolución sesión a sesión</Text>
      <View style={styles.filas}>
        <Columna titulo="ARMAS 👍" color={T.bolaOscura} golpes={mejores} />
        <View style={styles.separador} />
        <Columna titulo="A ENTRENAR 👎" color={T.rojo} golpes={peores} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  ayuda: { fontSize: 11.5, color: T.tintaSuave, marginBottom: 10, fontFamily: FONT.texto },
  filas: { flexDirection: 'row', gap: 14 },
  col: { flex: 1 },
  colTitulo: { fontSize: 11.5, fontFamily: FONT.textoBold, marginBottom: 6 },
  sinDatos: { fontSize: 12.5, color: T.tintaSuave, fontFamily: FONT.texto },
  golpe: { fontSize: 13, marginBottom: 5, lineHeight: 17.5 },
  golpeNombre: { fontFamily: FONT.textoBold, color: T.tinta },
  golpeDetalle: { color: T.tintaSuave, fontFamily: FONT.texto },
  separador: { width: 1, backgroundColor: T.borde },
});
