import { router } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import Cabecera from '../components/Cabecera';
import Card from '../components/Card';
import { fmtSalud } from '../components/HealthCard';
import { exportarCSV } from '../lib/csv';
import { fmtFecha, hoy } from '../lib/date';
import { bienJugado, calcMeses } from '../lib/metrics';
import { compartirCSV } from '../lib/share';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { Match } from '../types/domain';

export default function HistorialScreen() {
  const matches = useLigaStore((s) => s.matches);
  const perfil = useLigaStore((s) => s.perfil);
  const borrarPartido = useLigaStore((s) => s.borrarPartido);
  const [exportando, setExportando] = useState(false);

  const meses = calcMeses(matches);

  const confirmarBorrado = (m: Match) => {
    Alert.alert(
      'Borrar partido',
      `¿Seguro que quieres borrar el partido del ${fmtFecha(m.fecha)}? No se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        { text: 'Borrar', style: 'destructive', onPress: () => borrarPartido(m.id) },
      ]
    );
  };

  const onExportar = async () => {
    if (exportando) return;
    setExportando(true);
    try {
      await compartirCSV(`liga-padel-${hoy()}.csv`, exportarCSV(matches));
    } catch {
      Alert.alert('Error', 'No se pudo generar el CSV. Inténtalo de nuevo.');
    }
    setExportando(false);
  };

  return (
    <View style={styles.pantalla}>
      <Cabecera fechaInicio={perfil.fechaInicio} totalPartidos={matches.length} />
      <ScrollView contentContainerStyle={styles.scroll}>
        {matches.length === 0 && (
          <Card style={styles.vacio}>
            <Text style={styles.vacioTexto}>
              Aún no hay partidos. Registra el primero desde el panel.
            </Text>
          </Card>
        )}

        {meses.map((g) => (
          <View key={g.clave}>
            <Text style={styles.mes}>{g.clave}</Text>
            {g.items.map((m) => {
              const letra =
                m.resultado === 'victoria' ? 'V' : m.resultado === 'empate' ? 'E' : 'D';
              const colorBadge =
                m.resultado === 'victoria'
                  ? T.pista
                  : m.resultado === 'empate'
                    ? T.tintaSuave
                    : T.rojo;
              return (
                <Card key={m.id} style={styles.tarjeta}>
                  <View style={[styles.badge, { backgroundColor: colorBadge }]}>
                    <Text style={styles.badgeLetra}>{letra}</Text>
                  </View>
                  <Pressable
                    style={styles.cuerpo}
                    onPress={() => router.push(`/detalle?id=${m.id}`)}>
                    <View style={styles.filaTitulo}>
                      <Text style={styles.titulo} numberOfLines={1}>
                        {fmtFecha(m.fecha)}
                        {m.sets ? <Text style={styles.sets}> · {m.sets}</Text> : null}
                      </Text>
                      <View style={styles.acciones}>
                        <Pressable
                          onPress={() => router.push(`/partido?id=${m.id}`)}
                          hitSlop={8}
                          accessibilityLabel="Editar partido">
                          <Text style={styles.editar}>✎</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => confirmarBorrado(m)}
                          hitSlop={8}
                          accessibilityLabel="Borrar partido">
                          <Text style={styles.borrar}>✕</Text>
                        </Pressable>
                      </View>
                    </View>
                    <Text style={styles.detalle}>
                      {m.tipo}
                      {m.posicion ? ` · ${m.posicion === 'reves' ? 'revés' : 'derecha'}` : ''}
                      {m.companero ? ` · con ${m.companero}` : ''}
                      {m.club ? ` · ${m.club}` : ''}
                      {' · objetivos '}
                      {m.objetivos.filter(Boolean).length}/3
                      {bienJugado(m) ? ' 🔥' : ''}
                    </Text>
                    {(m.nivel != null || m.nivelBand != null || m.bandInicio != null || m.bandFin != null) && (
                      <Text style={styles.detalle}>
                        {[
                          m.nivel != null ? `Playtomic ${m.nivel.toFixed(2)}` : null,
                          m.nivelBand != null ? `Band ${m.nivelBand.toFixed(1)}` : null,
                          m.bandInicio != null || m.bandFin != null
                            ? `curva ${m.bandInicio ?? '?'}→${m.bandFin ?? '?'}${m.bandMediaJugador != null ? ` (media ${m.bandMediaJugador})` : ''}`
                            : null,
                        ]
                          .filter(Boolean)
                          .join(' · ')}
                      </Text>
                    )}
                    {(m.mejorGolpe || m.peorGolpe) && (
                      <Text style={styles.detalle}>
                        {m.mejorGolpe
                          ? `👍 ${m.mejorGolpe}${m.mejorPunt ? ` ${m.mejorPunt}/7` : ''}`
                          : ''}
                        {m.mejorGolpe && m.peorGolpe ? ' · ' : ''}
                        {m.peorGolpe
                          ? `👎 ${m.peorGolpe}${m.peorPunt ? ` ${m.peorPunt}/7` : ''}`
                          : ''}
                        {m.golpesSesion ? ` · 📷 ${m.golpesSesion.length} golpes de la Band` : ''}
                        {m.totalGolpes != null ? ` · 🔢 ${m.totalGolpes} golpeos` : ''}
                      </Text>
                    )}
                    {m.salud ? <Text style={styles.detalle}>{fmtSalud(m.salud)}</Text> : null}
                    {m.nota ? <Text style={styles.nota}>{m.nota}</Text> : null}
                  </Pressable>
                </Card>
              );
            })}
          </View>
        ))}

        {matches.length > 0 && (
          <Pressable
            onPress={onExportar}
            style={[S.btnSec, { marginTop: 8 }, exportando && { opacity: 0.55 }]}>
            <Text style={S.btnSecText}>
              {exportando ? 'Generando…' : 'Exportar CSV (Excel)'}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  vacio: { alignItems: 'center', padding: 26 },
  vacioTexto: { fontSize: 13.5, color: T.tintaSuave, fontFamily: FONT.texto },
  mes: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
    marginTop: 14,
    marginBottom: 8,
    marginHorizontal: 4,
  },
  tarjeta: { padding: 14, flexDirection: 'row', gap: 12 },
  badge: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetra: { color: T.blanco, fontFamily: FONT.display, fontSize: 19 },
  cuerpo: { flex: 1, minWidth: 0 },
  filaTitulo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 8,
  },
  titulo: { fontSize: 15.5, fontFamily: FONT.display, color: T.tinta, flexShrink: 1 },
  sets: { fontFamily: FONT.displayMedium, color: T.tintaSuave },
  acciones: { flexDirection: 'row', gap: 14 },
  editar: { color: T.pista, fontSize: 16 },
  borrar: { color: T.tintaSuave, fontSize: 17 },
  detalle: { fontSize: 13, color: T.tintaSuave, marginTop: 3, fontFamily: FONT.texto },
  nota: {
    fontSize: 13,
    marginTop: 4,
    fontStyle: 'italic',
    color: T.tinta,
    fontFamily: FONT.texto,
  },
});
