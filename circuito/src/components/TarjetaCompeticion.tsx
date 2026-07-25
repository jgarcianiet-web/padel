import { Pressable, StyleSheet, Text, View } from 'react-native';

import { tituloTipo } from '../constants/reglas';
import { fechaCorta } from '../lib/fecha';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { Competicion } from '../types/domain';
import { Chip } from './base';

const ESTADOS: Record<
  Competicion['estado'],
  { texto: string; tono: 'neutro' | 'pista' | 'verde' | 'ambar' }
> = {
  borrador: { texto: 'Borrador', tono: 'neutro' },
  inscripcion: { texto: 'Inscripción abierta', tono: 'verde' },
  en_curso: { texto: 'En juego', tono: 'pista' },
  finalizada: { texto: 'Finalizada', tono: 'neutro' },
};

export function TarjetaCompeticion({
  competicion,
  inscritos,
  onPress,
}: {
  competicion: Competicion;
  inscritos?: number;
  onPress: () => void;
}) {
  const estado = ESTADOS[competicion.estado];
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [e.tarjeta, pressed && { opacity: 0.85 }]}>
      <View style={[S.filaEntre, { marginBottom: 6 }]}>
        <Chip texto={tituloTipo(competicion.tipo)} tono="pista" />
        <Chip texto={estado.texto} tono={estado.tono} />
      </View>
      <Text style={e.nombre} numberOfLines={2}>
        {competicion.nombre}
      </Text>
      <Text style={S.textoSuave} numberOfLines={1}>
        {[
          competicion.ciudad,
          competicion.temporada,
          competicion.fechaInicio ? `desde el ${fechaCorta(competicion.fechaInicio)}` : null,
          inscritos !== undefined ? `${inscritos} inscritos` : null,
        ]
          .filter(Boolean)
          .join(' · ')}
      </Text>
    </Pressable>
  );
}

const e = StyleSheet.create({
  tarjeta: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  nombre: {
    fontFamily: FONT.display,
    fontSize: 18,
    color: T.tinta,
    marginBottom: 2,
  },
});
