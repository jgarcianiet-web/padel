import { ReactNode } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ANCHO_AMPLIO, ANCHO_LECTURA, useDisposicion } from '../lib/responsive';
import { T } from '../theme/colors';
import { S } from '../theme/styles';

/**
 * Contenedor común de todas las pantallas. En el móvil ocupa el ancho
 * completo; en el navegador de un ordenador centra el contenido en una
 * columna legible en lugar de estirarlo de lado a lado del monitor.
 */
export function Pantalla({
  children,
  refrescando,
  onRefrescar,
  amplia,
  centrada,
}: {
  children: ReactNode;
  refrescando?: boolean;
  onRefrescar?: () => void;
  /** Para vistas que agradecen sitio: cuadros de torneo, calendarios. */
  amplia?: boolean;
  /** Centra en vertical y estrecha la columna: pantalla de acceso. */
  centrada?: boolean;
}) {
  const { esTablet } = useDisposicion();
  const maxWidth = centrada ? 440 : amplia ? ANCHO_AMPLIO : ANCHO_LECTURA;

  return (
    <SafeAreaView style={S.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={[
          S.contenido,
          { alignItems: 'center' },
          esTablet && { paddingHorizontal: 28, paddingTop: 28 },
          centrada && { flexGrow: 1, justifyContent: 'center' },
        ]}
        refreshControl={
          onRefrescar ? (
            <RefreshControl
              refreshing={Boolean(refrescando)}
              onRefresh={onRefrescar}
              tintColor={T.pista}
            />
          ) : undefined
        }>
        <View style={{ width: '100%', maxWidth }}>{children}</View>
      </ScrollView>
    </SafeAreaView>
  );
}
