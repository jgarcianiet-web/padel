import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fmtFecha } from '../lib/date';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';

interface Props {
  fechaInicio: string;
  totalPartidos: number;
}

export default function Cabecera({ fechaInicio, totalPartidos }: Props) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
      <View>
        <Text style={styles.titulo}>Liga personal</Text>
        <Text style={styles.subtitulo}>
          {fechaInicio
            ? `Temporada desde el ${fmtFecha(fechaInicio)}`
            : 'Tu competición contra ti mismo'}
        </Text>
      </View>
      <Text style={styles.contador}>
        {totalPartidos} PARTIDO{totalPartidos === 1 ? '' : 'S'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  cabecera: {
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  titulo: {
    fontSize: 24,
    fontFamily: FONT.display,
    color: T.tinta,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitulo: { fontSize: 12.5, color: T.tintaSuave, marginTop: 2, fontFamily: FONT.texto },
  contador: {
    fontSize: 12,
    fontFamily: FONT.display,
    color: T.pista,
    letterSpacing: 1.5,
  },
});
