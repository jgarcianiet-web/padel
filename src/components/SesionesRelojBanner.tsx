import { router } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { useSesionesReloj } from '../lib/useSesionesReloj';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

/** Aviso en el Panel cuando hay sesiones del reloj sin importar. No pinta nada
 * si la cola está vacía o el build no tiene el módulo del reloj. */
export default function SesionesRelojBanner() {
  const { pendientes } = useSesionesReloj();
  if (!pendientes.length) return null;

  return (
    <Pressable style={[S.card, styles.banner]} onPress={() => router.push('/reloj')}>
      <Text style={styles.icono}>⌚</Text>
      <Text style={styles.texto}>
        {pendientes.length === 1
          ? 'Tienes una sesión del reloj sin importar'
          : `Tienes ${pendientes.length} sesiones del reloj sin importar`}
      </Text>
      <Text style={styles.flecha}>›</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  icono: { fontSize: 20 },
  texto: { flex: 1, fontSize: 14, color: T.tinta, fontFamily: FONT.textoBold },
  flecha: { fontSize: 22, color: T.pista, fontFamily: FONT.textoBold },
});
