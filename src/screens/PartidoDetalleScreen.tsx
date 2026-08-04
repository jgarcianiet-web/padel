import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import Card from '../components/Card';
import { fmtSalud } from '../components/HealthCard';
import { fmtFecha, fmtMes } from '../lib/date';
import { bienJugado } from '../lib/metrics';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

// Ficha completa de un partido: marcador, niveles, golpes de la Band,
// volumen, curva, salud, objetivos y nota.
export default function PartidoDetalleScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const matches = useLigaStore((s) => s.matches);
  const objetivos = useLigaStore((s) => s.objetivos);

  const m = matches.find((x) => x.id === Number(id));

  if (!m) {
    return (
      <View style={styles.pantalla}>
        <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
          <Pressable onPress={() => router.back()} hitSlop={10}>
            <Text style={styles.volver}>‹ Volver</Text>
          </Pressable>
          <Text style={styles.titulo}>Partido no encontrado</Text>
        </View>
      </View>
    );
  }

  const letra = m.resultado === 'victoria' ? 'V' : m.resultado === 'empate' ? 'E' : 'D';
  const colorBadge =
    m.resultado === 'victoria' ? T.pista : m.resultado === 'empate' ? T.tintaSuave : T.rojo;
  const hayCurva = m.bandInicio != null || m.bandFin != null;

  const Linea = ({ l, v }: { l: string; v: string }) => (
    <View style={styles.linea}>
      <Text style={styles.lineaLabel}>{l}</Text>
      <Text style={styles.lineaValor}>{v}</Text>
    </View>
  );

  return (
    <View style={styles.pantalla}>
      <View style={[styles.cabecera, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10}>
          <Text style={styles.volver}>‹ Volver</Text>
        </Pressable>
        <View style={styles.filaTitulo}>
          <View style={[styles.badge, { backgroundColor: colorBadge }]}>
            <Text style={styles.badgeLetra}>{letra}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.titulo}>
              {fmtFecha(m.fecha)} · {fmtMes(m.fecha).split(' de ')[1]}
            </Text>
            <Text style={styles.subtitulo}>
              {m.tipo} · {m.posicion === 'reves' ? 'revés' : 'derecha'}
              {bienJugado(m) ? ' · bien jugado 🔥' : ''}
            </Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          <Text style={[S.label, { marginBottom: 8 }]}>El partido</Text>
          {m.sets ? <Text style={styles.sets}>{m.sets}</Text> : null}
          {m.club ? <Linea l="Club" v={m.club} /> : null}
          {m.companero ? <Linea l="Compañero" v={m.companero} /> : null}
        </Card>

        {(m.nivel != null || m.nivelBand != null || hayCurva || m.totalGolpes != null) && (
          <Card>
            <Text style={[S.label, { marginBottom: 8 }]}>Niveles de la sesión</Text>
            {m.nivel != null && <Linea l="Playtomic tras el partido" v={m.nivel.toFixed(2)} />}
            {m.nivelBand != null && <Linea l="Band de la sesión" v={`${m.nivelBand.toFixed(1)}/7`} />}
            {hayCurva && (
              <Linea
                l="Curva de la sesión"
                v={`${m.bandInicio ?? '?'} → ${m.bandFin ?? '?'}${m.bandMediaJugador != null ? ` (media ${m.bandMediaJugador})` : ''}`}
              />
            )}
            {m.totalGolpes != null && <Linea l="Total de golpeos" v={String(m.totalGolpes)} />}
          </Card>
        )}

        {(m.mejorGolpe || m.peorGolpe || (m.golpesSesion?.length ?? 0) > 0 || (m.golpesVolumen?.length ?? 0) > 0) && (
          <Card>
            <Text style={[S.label, { marginBottom: 8 }]}>Golpes</Text>
            {m.mejorGolpe && (
              <Linea l="👍 Mejor" v={`${m.mejorGolpe}${m.mejorPunt ? ` · ${m.mejorPunt}/7` : ''}`} />
            )}
            {m.peorGolpe && (
              <Linea l="👎 Peor" v={`${m.peorGolpe}${m.peorPunt ? ` · ${m.peorPunt}/7` : ''}`} />
            )}
            {(m.golpesSesion?.length ?? 0) > 0 && (
              <>
                <Text style={[S.labelSmall, { marginTop: 10, marginBottom: 6 }]}>
                  Notas de la Band
                </Text>
                <View style={styles.chips}>
                  {m.golpesSesion!.map((g, i) => (
                    <Pressable
                      key={i}
                      onPress={() => router.push(`/golpe?nombre=${encodeURIComponent(g.nombre)}`)}
                      style={styles.chip}>
                      <Text style={styles.chipTexto}>
                        {g.nombre} <Text style={styles.chipNota}>{g.nota}</Text>
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </>
            )}
            {(m.golpesVolumen?.length ?? 0) > 0 && (
              <>
                <Text style={[S.labelSmall, { marginTop: 10, marginBottom: 6 }]}>
                  Volumen de golpeo
                </Text>
                <View style={styles.chips}>
                  {m.golpesVolumen!.map((g, i) => (
                    <View key={i} style={styles.chip}>
                      <Text style={styles.chipTexto}>
                        {g.nombre} <Text style={styles.chipNota}>×{g.cantidad}</Text>
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </Card>
        )}

        {m.salud && (
          <Card>
            <Text style={[S.label, { marginBottom: 8 }]}>Salud (Apple Watch)</Text>
            <Text style={styles.salud}>{fmtSalud(m.salud)}</Text>
          </Card>
        )}

        <Card>
          <Text style={[S.label, { marginBottom: 8 }]}>
            Objetivos · {m.objetivos.filter(Boolean).length}/3
          </Text>
          {m.objetivos.map((cumplido, i) => (
            <View key={i} style={styles.objetivo}>
              <Text style={[styles.objetivoCheck, { color: cumplido ? T.bolaOscura : T.rojo }]}>
                {cumplido ? '✓' : '✗'}
              </Text>
              <Text style={styles.objetivoTexto}>{objetivos[i]}</Text>
            </View>
          ))}
          <Text style={styles.avisoObjetivos}>
            Los textos son tus objetivos actuales; los checks, lo que marcaste ese día.
          </Text>
          {m.nota ? <Text style={styles.nota}>“{m.nota}”</Text> : null}
        </Card>

        <Pressable
          style={S.btnSec}
          onPress={() => router.push(`/partido?id=${m.id}`)}>
          <Text style={S.btnSecText}>✎ Editar partido</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  cabecera: { paddingHorizontal: 18, paddingBottom: 12 },
  volver: { fontSize: 15, color: T.pista, fontFamily: FONT.textoBold, marginBottom: 8 },
  filaTitulo: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  badge: {
    width: 46,
    height: 46,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeLetra: { color: T.blanco, fontFamily: FONT.display, fontSize: 21 },
  titulo: {
    fontSize: 22,
    fontFamily: FONT.display,
    color: T.tinta,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  subtitulo: { fontSize: 12.5, color: T.tintaSuave, marginTop: 2, fontFamily: FONT.texto },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  sets: { fontSize: 22, fontFamily: FONT.display, color: T.pista, marginBottom: 8 },
  linea: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: T.borde,
  },
  lineaLabel: { fontSize: 13.5, color: T.tintaSuave, fontFamily: FONT.texto },
  lineaValor: { fontSize: 13.5, color: T.tinta, fontFamily: FONT.textoBold, flexShrink: 1, textAlign: 'right' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: T.fondo,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipTexto: { fontSize: 12, color: T.tinta, fontFamily: FONT.texto },
  chipNota: { fontFamily: FONT.textoBold, color: T.pista },
  salud: { fontSize: 14, color: T.tinta, fontFamily: FONT.textoBold },
  objetivo: { flexDirection: 'row', gap: 10, marginBottom: 7, alignItems: 'flex-start' },
  objetivoCheck: { fontFamily: FONT.textoBold, fontSize: 15, width: 16 },
  objetivoTexto: { flex: 1, fontSize: 13.5, color: T.tinta, fontFamily: FONT.texto, lineHeight: 19 },
  avisoObjetivos: { fontSize: 11, color: T.tintaSuave, fontFamily: FONT.texto, marginTop: 2 },
  nota: {
    fontSize: 14,
    fontStyle: 'italic',
    color: T.tinta,
    fontFamily: FONT.texto,
    marginTop: 10,
  },
});
