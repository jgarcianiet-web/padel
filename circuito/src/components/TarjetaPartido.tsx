import { Pressable, StyleSheet, Text, View } from 'react-native';

import { fechaCorta } from '../lib/fecha';
import { formatearSets, resumirSets } from '../lib/marcador';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { Partido } from '../types/domain';
import { Chip } from './base';

const ESTADOS: Record<
  Partido['estado'],
  { texto: string; tono: 'neutro' | 'ambar' | 'verde' | 'rojo' }
> = {
  programado: { texto: 'Por jugar', tono: 'neutro' },
  pendiente: { texto: 'Sin confirmar', tono: 'ambar' },
  confirmado: { texto: 'Confirmado', tono: 'verde' },
  anulado: { texto: 'Anulado', tono: 'rojo' },
};

interface Props {
  partido: Partido;
  nombreDe: (id: string) => string;
  /** Nombre de la pareja en torneos, cuando el equipo no son ids sueltos. */
  etiquetaEquipo?: (partido: Partido, lado: 'a' | 'b') => string | null;
  uid?: string | null;
  onPress?: () => void;
}

export function TarjetaPartido({ partido, nombreDe, etiquetaEquipo, uid, onPress }: Props) {
  const { ganador } = resumirSets(partido.sets);
  const estado = ESTADOS[partido.estado];
  const juego = uid ? [...partido.equipoA, ...partido.equipoB].includes(uid) : false;

  const lado = (l: 'a' | 'b') => {
    const propia = etiquetaEquipo?.(partido, l);
    if (propia) return propia;
    const ids = l === 'a' ? partido.equipoA : partido.equipoB;
    return ids.length ? ids.map(nombreDe).join(' · ') : 'Por determinar';
  };

  const ganaA = partido.estado === 'confirmado' && ganador === 'a';
  const ganaB = partido.estado === 'confirmado' && ganador === 'b';

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        e.tarjeta,
        juego && { borderColor: T.pista, borderWidth: 1.5 },
        pressed && onPress ? { opacity: 0.85 } : null,
      ]}>
      <View style={[S.filaEntre, { marginBottom: 8 }]}>
        <Text style={S.label} numberOfLines={1}>
          {partido.ronda ?? 'Partido'}
        </Text>
        <Chip texto={estado.texto} tono={estado.tono} />
      </View>

      <View style={S.filaEntre}>
        <Text style={[e.equipo, ganaA && e.gana]} numberOfLines={2}>
          {lado('a')}
        </Text>
        <Text style={e.vs}>vs</Text>
        <Text style={[e.equipo, e.derecha, ganaB && e.gana]} numberOfLines={2}>
          {lado('b')}
        </Text>
      </View>

      <View style={[S.filaEntre, { marginTop: 8 }]}>
        <Text style={S.textoSuave}>{fechaCorta(partido.fecha)}</Text>
        <Text style={e.marcador}>{formatearSets(partido.sets) || '—'}</Text>
      </View>
    </Pressable>
  );
}

const e = StyleSheet.create({
  tarjeta: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  equipo: {
    flex: 1,
    fontFamily: FONT.texto,
    fontSize: 15,
    color: T.tinta,
  },
  derecha: { textAlign: 'right' },
  gana: { fontFamily: FONT.textoBold },
  vs: {
    fontFamily: FONT.display,
    fontSize: 11,
    color: T.tintaTenue,
    paddingHorizontal: 10,
  },
  marcador: {
    fontFamily: FONT.displaySemi,
    fontSize: 15,
    color: T.tinta,
    letterSpacing: 0.5,
  },
});
