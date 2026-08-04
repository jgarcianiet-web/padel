import { StyleSheet, Text, View } from 'react-native';

import { ResumenMes } from '../lib/metrics';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

interface Props {
  actual: ResumenMes;
  anterior: ResumenMes;
  objetivos: string[];
  cumplimiento: (number | null)[];
}

const fmt = (v: number | null, sufijo = '') => (v != null ? `${v}${sufijo}` : '—');

// Tarjeta "Resumen del mes": comparativa con el mes anterior + % de
// cumplimiento de cada objetivo activo.
export default function MonthSummaryCard({ actual, anterior, objetivos, cumplimiento }: Props) {
  const filas: { l: string; a: string; b: string }[] = [
    { l: 'Partidos', a: String(actual.n), b: String(anterior.n) },
    { l: 'Victorias', a: fmt(actual.pctV, '%'), b: fmt(anterior.pctV, '%') },
    { l: 'Bien jugados', a: fmt(actual.pctBJ, '%'), b: fmt(anterior.pctBJ, '%') },
    {
      l: 'Nivel al cierre',
      a: actual.nivelCierre != null ? actual.nivelCierre.toFixed(2) : '—',
      b: anterior.nivelCierre != null ? anterior.nivelCierre.toFixed(2) : '—',
    },
  ];

  return (
    <View style={S.card}>
      <Text style={[S.label, { marginBottom: 12 }]}>Resumen del mes</Text>

      {/* cabecera de columnas */}
      <View style={styles.fila}>
        <View style={styles.colConcepto} />
        <Text style={[styles.colValor, styles.mesActual]}>{actual.clave.split(' de ')[0]}</Text>
        <Text style={[styles.colValor, styles.mesAnterior]}>
          {anterior.clave.split(' de ')[0]}
        </Text>
      </View>
      {filas.map((f) => (
        <View key={f.l} style={[styles.fila, styles.filaDatos]}>
          <Text style={styles.concepto}>{f.l}</Text>
          <Text style={[styles.colValor, styles.valorActual]}>{f.a}</Text>
          <Text style={[styles.colValor, styles.valorAnterior]}>{f.b}</Text>
        </View>
      ))}

      <View style={styles.separador} />
      <Text style={[S.labelSmall, { marginBottom: 10 }]}>Cumplimiento de tus objetivos</Text>
      {objetivos.map((o, i) => (
        <View key={i} style={styles.objetivo}>
          <View style={styles.objetivoCabecera}>
            <Text style={styles.objetivoTexto} numberOfLines={2}>
              {o}
            </Text>
            <Text style={styles.objetivoPct}>{fmt(cumplimiento[i], '%')}</Text>
          </View>
          <View style={styles.pista}>
            <View style={[styles.barra, { width: `${cumplimiento[i] ?? 0}%` }]} />
          </View>
        </View>
      ))}
      <Text style={styles.nota}>
        Sobre todos tus partidos. El entrenador considera dominado un objetivo a partir del 70%.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fila: { flexDirection: 'row', alignItems: 'baseline' },
  filaDatos: { paddingVertical: 5, borderTopWidth: 1, borderTopColor: T.borde },
  colConcepto: { flex: 1.4 },
  concepto: { flex: 1.4, fontSize: 13.5, color: T.tintaSuave, fontFamily: FONT.texto },
  colValor: { flex: 1, textAlign: 'center' },
  mesActual: { fontFamily: FONT.display, fontSize: 11, color: T.pista, textTransform: 'uppercase', letterSpacing: 1 },
  mesAnterior: { fontFamily: FONT.display, fontSize: 11, color: T.tintaSuave, textTransform: 'uppercase', letterSpacing: 1 },
  valorActual: { fontFamily: FONT.display, fontSize: 16, color: T.tinta },
  valorAnterior: { fontFamily: FONT.display, fontSize: 16, color: T.tintaSuave },
  separador: { height: 1, backgroundColor: T.borde, marginVertical: 12 },
  objetivo: { marginBottom: 10 },
  objetivoCabecera: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 10,
    marginBottom: 4,
  },
  objetivoTexto: { flex: 1, fontSize: 13, color: T.tinta, fontFamily: FONT.texto },
  objetivoPct: { fontFamily: FONT.display, fontSize: 14, color: T.pista },
  pista: { height: 6, borderRadius: 3, backgroundColor: T.pistaTinte, overflow: 'hidden' },
  barra: { height: '100%', backgroundColor: T.pista, borderRadius: 3 },
  nota: { fontSize: 11, color: T.tintaSuave, marginTop: 2, fontFamily: FONT.texto },
});
