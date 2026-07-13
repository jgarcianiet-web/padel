import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

interface Props {
  label: string;
  valor: string;
  color?: string;
}

export default function StatMarker({ label, valor, color }: Props) {
  return (
    <View style={[S.card, styles.card]}>
      <Text style={[styles.valor, color ? { color } : null]}>{valor}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexBasis: '47%',
    flexGrow: 1,
    marginBottom: 0,
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 10,
  },
  valor: { fontSize: 26, fontFamily: FONT.display, color: T.tinta },
  label: {
    fontSize: 10,
    marginTop: 3,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
  },
});
