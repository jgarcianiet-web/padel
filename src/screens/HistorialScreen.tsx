import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';

export default function HistorialScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.placeholder}>Historial</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: T.fondo,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: { color: T.tintaSuave },
});
