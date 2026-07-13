import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { ChartPoint } from '../types/domain';

interface Props {
  data: ChartPoint[];
  nivelInicial: number | null;
}

const ALTO = 170;
const M = { top: 10, right: 12, bottom: 24, left: 34 };

// Línea doble: Playtomic (azul continua) y Band por sesión (lima discontinua),
// con línea de referencia punteada en el nivel inicial. Equivalente al
// LineChart de recharts de la web-app.
export default function EvolutionChart({ data, nivelInicial }: Props) {
  const [ancho, setAncho] = useState(0);
  const hayBand = data.some((d) => d.band != null);

  const valores = data
    .flatMap((d) => [d.nivel, d.band])
    .concat(nivelInicial != null ? [nivelInicial] : [])
    .filter((v): v is number => v != null);
  if (valores.length === 0) return null;

  const yMin = Math.min(...valores) - 0.1;
  const yMax = Math.max(...valores) + 0.1;

  const plotW = ancho - M.left - M.right;
  const plotH = ALTO - M.top - M.bottom;
  const x = (i: number) =>
    M.left + (data.length === 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const y = (v: number) => M.top + plotH - ((v - yMin) / (yMax - yMin)) * plotH;

  // connectNulls: la línea une solo los puntos existentes de cada serie
  const puntosSerie = (campo: 'nivel' | 'band') =>
    data
      .map((d, i) => ({ v: d[campo], i }))
      .filter((p): p is { v: number; i: number } => p.v != null);

  const aPolyline = (pts: { v: number; i: number }[]) =>
    pts.map((p) => `${x(p.i)},${y(p.v)}`).join(' ');

  const serieNivel = puntosSerie('nivel');
  const serieBand = puntosSerie('band');

  // hasta 4 etiquetas en el eje X para que no se solapen
  const paso = Math.max(1, Math.ceil(data.length / 4));
  const ticksX = data.map((d, i) => ({ d, i })).filter(({ i }) => i % paso === 0);

  return (
    <View style={[S.card, { paddingBottom: 8 }]}>
      <Text style={[S.label, { marginBottom: 2 }]}>Evolución</Text>
      <View style={styles.leyenda}>
        <Text style={[styles.leyendaItem, { color: T.pista }]}>— Playtomic</Text>
        {hayBand && (
          <Text style={[styles.leyendaItem, { color: T.bolaOscura }]}>- - - Band por sesión</Text>
        )}
      </View>
      <View onLayout={(e) => setAncho(e.nativeEvent.layout.width)} style={{ height: ALTO }}>
        {ancho > 0 && (
          <Svg width={ancho} height={ALTO}>
            {/* eje Y: min y max */}
            {[yMin + 0.1, yMax - 0.1].map((v) => (
              <SvgText
                key={v}
                x={M.left - 6}
                y={y(v) + 4}
                fontSize={10}
                fill={T.tintaSuave}
                textAnchor="end">
                {v.toFixed(2)}
              </SvgText>
            ))}
            {/* referencia del nivel inicial */}
            {nivelInicial != null && (
              <Line
                x1={M.left}
                x2={ancho - M.right}
                y1={y(nivelInicial)}
                y2={y(nivelInicial)}
                stroke={T.tintaSuave}
                strokeWidth={1}
                strokeDasharray="4 4"
              />
            )}
            {serieNivel.length > 1 && (
              <Polyline
                points={aPolyline(serieNivel)}
                fill="none"
                stroke={T.pista}
                strokeWidth={2.5}
              />
            )}
            {serieBand.length > 1 && (
              <Polyline
                points={aPolyline(serieBand)}
                fill="none"
                stroke={T.bolaOscura}
                strokeWidth={2.5}
                strokeDasharray="6 3"
              />
            )}
            {serieNivel.map((p) => (
              <Circle key={`n${p.i}`} cx={x(p.i)} cy={y(p.v)} r={3} fill={T.pista} />
            ))}
            {serieBand.map((p) => (
              <Circle key={`b${p.i}`} cx={x(p.i)} cy={y(p.v)} r={3} fill={T.bolaOscura} />
            ))}
            {ticksX.map(({ d, i }) => (
              <SvgText
                key={i}
                x={x(i)}
                y={ALTO - 8}
                fontSize={10}
                fill={T.tintaSuave}
                textAnchor="middle">
                {d.fecha}
              </SvgText>
            ))}
          </Svg>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  leyenda: { flexDirection: 'row', gap: 10, marginBottom: 8 },
  leyendaItem: { fontSize: 12, fontFamily: FONT.textoBold },
});
