import { Link } from 'expo-router';
import { Text, View } from 'react-native';

import { S } from '@/src/theme/styles';

export default function NoEncontrado() {
  return (
    <View style={[S.pantalla, { alignItems: 'center', justifyContent: 'center', padding: 24 }]}>
      <Text style={S.titulo}>Esta pantalla no existe</Text>
      <Link href="/" style={{ marginTop: 16 }}>
        <Text style={S.btnSecText}>Volver al inicio</Text>
      </Link>
    </View>
  );
}
