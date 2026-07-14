import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import Card from '../components/Card';
import { calcEvolucionGolpe } from '../lib/metrics';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

const ALTO = 180;
const M = { top: 14, right: 14, bottom: 26, left: 30 };

// Ficha de un golpe: evolución de su nota (1-7) a través de las sesiones
// capturadas de Padel Band, con el volumen de golpeo cuando existe.
export default function GolpeDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { nombre } = useLocalSearchParams<{ nombre?: string }>();
  const matches = useLigaStore((s) => s.matches);
  const [ancho, setAncho] = useState(0);

  const golpe = nombre ?? '';
  const evo = calcEvolucionGolpe(matches, golpe);

  const plotW = ancho - M.left - M.right;
  const plotH = ALTO - M.top - M.bottom;
  const x = (i: number) =>
    M.left + (evo.puntos.length === 1 ? plotW / 2 : (i / (evo.puntos.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - ((v - 1) / 6) * plotH; // escala fija 1-7

  const paso = Math.max(1, Math.ceil(evo.puntos.length / 4));
  const ticksX = evo.puntos.map((p, i) => ({ p, i })).filter(({ i }) => i % paso === 0);

  return (
    <View style={styles.pantalla}>
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.volver}>‹ Volver</Text>
        </Pressable>
        <Text style={styles.titulo}>{golpe}</Text>
        <Text style={styles.contador}>
          {evo.veces} SESION{evo.veces === 1 ? '' : 'ES'} CON DATO
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        {evo.veces === 0 ? (
          <Card style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              Aún no hay sesiones de Padel Band capturadas con este golpe. Sube la pantalla de
              golpes al registrar un partido y su evolución aparecerá aquí.
            </Text>
          </Card>
        ) : (
          <>
            {/* resumen */}
            <View style={styles.marcadores}>
              {[
                { l: 'Media', v: evo.media != null ? evo.media.toFixed(1) : '—' },
                { l: 'Mejor', v: evo.mejor != null ? evo.mejor.toFixed(1) : '—' },
                { l: 'Peor', v: evo.peor != null ? evo.peor.toFixed(1) : '—' },
                {
                  l: 'Última',
                  v: evo.puntos[evo.puntos.length - 1].nota.toFixed(1),
                },
              ].map((k) => (
                <View key={k.l} style={[S.card, styles.marcador]}>
                  <Text style={styles.marcadorValor}>{k.v}</Text>
                  <Text style={styles.marcadorLabel}>{k.l}</Text>
                </View>
              ))}
            </View>

            {/* gráfica escala 1-7 */}
            <Card style={{ paddingBottom: 8 }}>
              <Text style={[S.label, { marginBottom: 8 }]}>Evolución (escala 1-7)</Text>
              <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)} style={{ height: ALTO }}>
                {ancho > 0 && (
                  <Svg width={ancho} height={ALTO}>
                    {[1, 4, 7].map((v) => (
                      <G key={v} y1={y(v)} ancho={ancho} valor={v} />
                    ))}
                    {evo.media != null && (
                      <Line
                        x1={M.left}
                        x2={ancho - M.right}
                        y1={y(evo.media)}
                        y2={y(evo.media)}
                        stroke={T.bolaOscura}
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    )}
                    {evo.puntos.length > 1 && (
                      <Polyline
                        points={evo.puntos.map((p, i) => `${x(i)},${y(p.nota)}`).join(' ')}
                        fill="none"
                        stroke={T.pista}
                        strokeWidth={2.5}
                      />
                    )}
                    {evo.puntos.map((p, i) => (
                      <Circle key={i} cx={x(i)} cy={y(p.nota)} r={3.5} fill={T.pista} />
                    ))}
                    {ticksX.map(({ p, i }) => (
                      <SvgText
                        key={i}
                        x={x(i)}
                        y={ALTO - 8}
                        fontSize={10}
                        fill={T.tintaSuave}
                        textAnchor="middle">
                        {p.fecha}
                      </SvgText>
                    ))}
                  </Svg>
                )}
              </View>
              <Text style={styles.leyenda}>- - - tu media ({evo.media?.toFixed(1)})</Text>
            </Card>

            {/* sesiones */}
            <Card>
              <Text style={[S.label, { marginBottom: 10 }]}>Sesión a sesión</Text>
              {[...evo.puntos].reverse().map((p, i) => (
                <View key={i} style={styles.sesion}>
                  <Text style={styles.sesionFecha}>{p.fecha}</Text>
                  <Text style={styles.sesionNota}>
                    {p.nota.toFixed(1)}/7
                    {p.cantidad != null ? (
                      <Text style={styles.sesionVolumen}> · ×{p.cantidad} golpes</Text>
                    ) : null}
                  </Text>
                </View>
              ))}
            </Card>
          </>
        )}
      </ScrollView>
    </View>
  );
}

// Línea de rejilla horizontal con su etiqueta de valor.
function G({ y1, ancho, valor }: { y1: number; ancho: number; valor: number }) {
  return (
    <>
      <Line x1={M.left} x2={ancho - M.right} y1={y1} y2={y1} stroke={T.borde} strokeWidth={1} />
      <SvgText x={M.left - 6} y={y1 + 4} fontSize={10} fill={T.tintaSuave} textAnchor="end">
        {valor}
      </SvgText>
    </>
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
  marcadores: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  marcador: { flex: 1, marginBottom: 0, alignItems: 'center', paddingVertical: 12, paddingHorizontal: 4 },
  marcadorValor: { fontSize: 20, fontFamily: FONT.display, color: T.tinta },
  marcadorLabel: {
    fontSize: 9.5,
    marginTop: 2,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
  },
  leyenda: { fontSize: 11.5, color: T.bolaOscura, fontFamily: FONT.textoBold, marginTop: 2 },
  sesion: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.borde,
  },
  sesionFecha: { fontSize: 14, color: T.tinta, fontFamily: FONT.texto },
  sesionNota: { fontSize: 14, fontFamily: FONT.textoBold, color: T.pista },
  sesionVolumen: { color: T.tintaSuave, fontFamily: FONT.texto },
});
