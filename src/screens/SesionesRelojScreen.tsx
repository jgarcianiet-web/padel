import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '../components/Card';
import { fmtFecha } from '../lib/date';
import { dejarSesionPendiente } from '../lib/importSesion';
import { SesionRelojPendiente } from '../lib/sesionesReloj';
import { useSesionesReloj } from '../lib/useSesionesReloj';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

// Cola de sesiones recibidas del Apple Watch embebido por WatchConnectivity.
// Mismo destino que el deep link ligapadel://importar, pero sin abrir enlaces:
// las sesiones llegan solas y esperan aquí a que el usuario las use o descarte.
export default function SesionesRelojScreen() {
  const insets = useSafeAreaInsets();
  const { pendientes, descartar } = useSesionesReloj();
  const matches = useLigaStore((s) => s.matches);

  const usar = (p: SesionRelojPendiente) => {
    if (!p.sesion) return;
    descartar(p.id);
    dejarSesionPendiente(p.sesion);
    router.replace('/partido');
  };

  return (
    <View style={styles.pantalla}>
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.replace('/')} hitSlop={10}>
          <Text style={styles.volver}>‹ Panel</Text>
        </Pressable>
        <Text style={styles.titulo}>Sesiones del reloj</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {!pendientes.length ? (
          <Card style={styles.centro}>
            <Text style={styles.vacio}>
              No hay sesiones pendientes. Acaba un partido en el reloj y aparecerá aquí sola.
            </Text>
          </Card>
        ) : (
          pendientes.map((p) => (
            <Card key={p.id} style={styles.item}>
              {p.sesion ? (
                <>
                  <Text style={[S.label, { marginBottom: 8 }]}>
                    {fmtFecha(p.sesion.fecha)} ·{' '}
                    {p.sesion.tipo === 'competitivo' ? 'partido' : 'entreno'}
                  </Text>
                  <Text style={styles.resumen}>{p.sesion.resumen}</Text>
                  {p.sesion.nivelBand !== '' && (
                    <Text style={styles.nivel}>Nivel de la sesión: {p.sesion.nivelBand}/7</Text>
                  )}
                  {matches.some((m) => m.fecha === p.sesion!.fecha) && (
                    <Text style={styles.aviso}>
                      Ya tienes un partido registrado ese día. Esta importación crea uno
                      nuevo: si era el mismo, borra el antiguo desde el historial.
                    </Text>
                  )}
                  <Pressable style={[S.btnPrim, styles.accion]} onPress={() => usar(p)}>
                    <Text style={S.btnPrimText}>Rellenar partido con la sesión</Text>
                  </Pressable>
                </>
              ) : (
                <Text style={styles.error}>{p.error ?? 'Sesión ilegible.'}</Text>
              )}
              <Pressable style={styles.descartar} onPress={() => descartar(p.id)}>
                <Text style={styles.descartarTexto}>Descartar</Text>
              </Pressable>
            </Card>
          ))
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
  vacio: {
    fontSize: 14,
    color: T.tintaSuave,
    fontFamily: FONT.texto,
    textAlign: 'center',
    lineHeight: 20,
  },
  item: { marginBottom: 12 },
  resumen: { fontSize: 14.5, color: T.tinta, fontFamily: FONT.textoBold, lineHeight: 21 },
  nivel: { fontSize: 13.5, color: T.pista, fontFamily: FONT.textoBold, marginTop: 6 },
  aviso: { fontSize: 12.5, color: T.rojo, fontFamily: FONT.texto, marginTop: 10, lineHeight: 18 },
  accion: { marginTop: 14 },
  error: { fontSize: 14, color: T.rojo, fontFamily: FONT.textoBold, lineHeight: 20 },
  descartar: { marginTop: 8, paddingVertical: 8, alignItems: 'center' },
  descartarTexto: { fontSize: 14, color: T.tintaSuave, fontFamily: FONT.texto },
});
