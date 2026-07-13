import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import AnalisisDetalle from '../components/AnalisisDetalle';
import Card from '../components/Card';
import { fmtFecha } from '../lib/date';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

// Historial de análisis del entrenador: uno por fila con su fecha; tocar
// una fila despliega el análisis completo (acordeón).
export default function AnalisisHistorialScreen() {
  const insets = useSafeAreaInsets();
  const analisisHistorial = useLigaStore((s) => s.analisisHistorial);
  const [abierto, setAbierto] = useState<number | null>(0); // índice en la lista invertida

  const lista = [...analisisHistorial].reverse(); // más reciente primero

  return (
    <View style={styles.pantalla}>
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.volver}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.titulo}>Análisis del entrenador</Text>
        <Text style={styles.contador}>
          {lista.length} ANÁLISIS
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {lista.length === 0 && (
          <Card style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              Aún no hay análisis. Pídele el primero a tu entrenador desde el panel.
            </Text>
          </Card>
        )}

        {lista.map((a, i) => {
          const desplegado = abierto === i;
          return (
            <Card key={`${a.fecha}-${a.nPartidos}-${i}`}>
              <Pressable onPress={() => setAbierto(desplegado ? null : i)}>
                <View style={styles.fila}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fecha}>
                      {fmtFecha(a.fecha)}
                      {i === 0 ? <Text style={styles.actual}>  · el más reciente</Text> : null}
                    </Text>
                    <Text style={styles.detalle}>
                      sobre {a.nPartidos} partidos{a.foco ? ` · foco: ${a.foco}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.flecha}>{desplegado ? '▴' : '▾'}</Text>
                </View>
              </Pressable>
              {desplegado && (
                <View style={styles.cuerpo}>
                  <AnalisisDetalle analisis={a} />
                </View>
              )}
            </Card>
          );
        })}
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
  contador: {
    fontSize: 12,
    fontFamily: FONT.display,
    color: T.pista,
    letterSpacing: 1.5,
    marginTop: 2,
  },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  vacio: { alignItems: 'center', padding: 26 },
  vacioTexto: {
    fontSize: 13.5,
    color: T.tintaSuave,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: FONT.texto,
  },
  fila: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  fecha: { fontSize: 15.5, fontFamily: FONT.display, color: T.tinta },
  actual: { fontSize: 11.5, color: T.bolaOscura, fontFamily: FONT.textoBold },
  detalle: { fontSize: 12.5, color: T.tintaSuave, marginTop: 2, fontFamily: FONT.texto },
  flecha: { fontSize: 16, color: T.pista, fontFamily: FONT.textoBold },
  cuerpo: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: T.borde,
    paddingTop: 12,
  },
});
