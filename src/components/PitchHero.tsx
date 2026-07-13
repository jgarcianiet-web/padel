import { StyleSheet, Text, View } from 'react-native';

import { bienJugado } from '../lib/metrics';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { Match } from '../types/domain';
import FormStrip from './FormStrip';

interface Props {
  racha: number;
  mejorRacha: number;
  ultimos8: Match[];
  totalPartidos: number;
}

export default function PitchHero({ racha, mejorRacha, ultimos8, totalPartidos }: Props) {
  const subtexto =
    totalPartidos === 0
      ? 'Cumple 2 de tus 3 objetivos para arrancarla'
      : racha === 0
        ? `El próximo partido arranca una nueva · tu mejor: ${mejorRacha}`
        : `Tu mejor racha: ${mejorRacha}`;

  return (
    <View style={styles.hero}>
      {/* líneas de pista */}
      <View pointerEvents="none" style={styles.lineasBorde} />
      <View pointerEvents="none" style={styles.lineaCentral} />

      <View style={styles.contenido}>
        <Text style={styles.label}>Racha de partidos bien jugados</Text>
        <Text style={[styles.racha, racha > 0 && { color: T.bola }]}>{racha}</Text>
        <Text style={styles.subtexto}>{subtexto}</Text>

        {ultimos8.length > 0 && (
          <View style={styles.forma}>
            <Text style={styles.formaLabel}>Forma reciente</Text>
            <FormStrip matches={ultimos8} bienJugado={bienJugado} />
            <Text style={styles.leyenda}>subrayado blanco = partido bien jugado</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    position: 'relative',
    backgroundColor: T.pista,
    borderRadius: 18,
    paddingTop: 24,
    paddingBottom: 20,
    paddingHorizontal: 18,
    marginBottom: 12,
    overflow: 'hidden',
  },
  lineasBorde: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    left: 10,
    right: 10,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.35)',
    borderRadius: 12,
  },
  lineaCentral: {
    position: 'absolute',
    top: 10,
    bottom: 10,
    left: '50%',
    width: 2,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  contenido: { alignItems: 'center' },
  label: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
    fontFamily: FONT.display,
  },
  racha: {
    fontSize: 76,
    lineHeight: 84,
    color: T.blanco,
    fontFamily: FONT.display,
  },
  subtexto: { fontSize: 12.5, color: 'rgba(255,255,255,0.75)', fontFamily: FONT.texto },
  forma: { marginTop: 16, alignItems: 'center' },
  formaLabel: {
    fontSize: 10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.6)',
    fontFamily: FONT.display,
    marginBottom: 7,
  },
  leyenda: { fontSize: 10.5, color: 'rgba(255,255,255,0.55)', marginTop: 6, fontFamily: FONT.texto },
});
