import { router, useLocalSearchParams } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '../components/Card';
import { fmtFecha } from '../lib/date';
import { SesionImportada, dejarSesionPendiente, parseSesion } from '../lib/importSesion';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

// Destino del deep link ligapadel://importar?datos=<JSON percent-encoded>
// que envía Rising Padel Watch. Muestra el resumen y, si el usuario acepta,
// prerrellena el formulario de partido.
export default function ImportarSesionScreen() {
  const insets = useSafeAreaInsets();
  const { datos } = useLocalSearchParams<{ datos?: string }>();
  const matches = useLigaStore((s) => s.matches);

  const resultado = useMemo((): { sesion: SesionImportada } | { error: string } => {
    if (!datos) return { error: 'No ha llegado ninguna sesión en el enlace.' };
    try {
      return { sesion: parseSesion(datos) };
    } catch (e) {
      return { error: e instanceof Error ? e.message : 'Sesión ilegible.' };
    }
  }, [datos]);

  const sesion = 'sesion' in resultado ? resultado.sesion : null;
  const yaHayPartidoEseDia = sesion != null && matches.some((m) => m.fecha === sesion.fecha);

  const usar = () => {
    if (!sesion) return;
    dejarSesionPendiente(sesion);
    router.replace('/partido');
  };

  return (
    <View style={styles.pantalla}>
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.replace('/')} hitSlop={10}>
          <Text style={styles.volver}>‹ Panel</Text>
        </Pressable>
        <Text style={styles.titulo}>Sesión del reloj</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!sesion ? (
          <Card style={styles.centro}>
            <Text style={styles.error}>
              {'error' in resultado ? resultado.error : 'Sesión ilegible.'}
            </Text>
          </Card>
        ) : (
          <>
            <Card>
              <Text style={[S.label, { marginBottom: 8 }]}>
                {fmtFecha(sesion.fecha)} · {sesion.tipo === 'competitivo' ? 'partido' : 'entreno'}
              </Text>
              <Text style={styles.resumen}>{sesion.resumen}</Text>
              {sesion.nivelBand !== '' && (
                <Text style={styles.nivel}>Nivel de la sesión: {sesion.nivelBand}/7</Text>
              )}
              {yaHayPartidoEseDia && (
                <Text style={styles.aviso}>
                  Ya tienes un partido registrado ese día. Esta importación crea uno nuevo: si
                  era el mismo, borra el antiguo desde el historial.
                </Text>
              )}
            </Card>

            <Pressable style={S.btnPrim} onPress={usar}>
              <Text style={S.btnPrimText}>Rellenar partido con la sesión</Text>
            </Pressable>
            <Pressable style={styles.cancelar} onPress={() => router.replace('/')}>
              <Text style={styles.cancelarTexto}>Descartar</Text>
            </Pressable>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  cabecera: { paddingHorizontal: 18, paddingBottom: 12 },
  volver: { fontSize: 15, color: T.pista, fontFamily: FONT.textoBold, marginBottom: 6 },
  titulo: {
    fontSize: 24,
    fontFamily: FONT.display,
    color: T.tinta,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  centro: { alignItems: 'center', padding: 26 },
  error: { fontSize: 14, color: T.rojo, fontFamily: FONT.textoBold, textAlign: 'center' },
  resumen: { fontSize: 14.5, color: T.tinta, fontFamily: FONT.textoBold, lineHeight: 21 },
  nivel: { fontSize: 13.5, color: T.pista, fontFamily: FONT.textoBold, marginTop: 6 },
  aviso: { fontSize: 12.5, color: T.rojo, fontFamily: FONT.texto, marginTop: 10, lineHeight: 18 },
  cancelar: { marginTop: 8, paddingVertical: 10, alignItems: 'center' },
  cancelarTexto: { fontSize: 14, color: T.tintaSuave, fontFamily: FONT.texto },
});
