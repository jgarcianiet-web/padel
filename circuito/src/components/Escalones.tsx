import { Pressable, StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { Avatar, Chip } from './base';

export interface EscalonVista {
  jugadorId: string;
  posicion: number;
  nombre: string;
  retable: boolean;
  motivo?: string;
}

/**
 * La escalera dibujada como escalones: cuanto más arriba, más ancho el peldaño.
 * Los que puedes retar aparecen con el botón activo.
 */
export function Escalones({
  escalones,
  uid,
  onRetar,
}: {
  escalones: EscalonVista[];
  uid: string | null;
  onRetar: (jugadorId: string) => void;
}) {
  const total = escalones.length || 1;

  return (
    <View>
      {escalones.map((p) => {
        const yo = p.jugadorId === uid;
        const ancho = 60 + (40 * (total - p.posicion + 1)) / total;
        return (
          <View
            key={p.jugadorId}
            style={[
              e.escalon,
              { width: `${ancho}%` },
              yo && { borderColor: T.pista, borderWidth: 1.5, backgroundColor: T.pistaTinte },
            ]}>
            <Text style={e.posicion}>{p.posicion}</Text>
            <Avatar nombre={p.nombre} tamano={30} />
            <Text style={[e.nombre, yo && { fontFamily: FONT.textoBold }]} numberOfLines={1}>
              {p.nombre}
            </Text>
            {yo ? (
              <Chip texto="Tú" tono="pista" />
            ) : p.retable ? (
              <Pressable onPress={() => onRetar(p.jugadorId)} style={e.btnRetar}>
                <Text style={e.btnRetarTexto}>Retar</Text>
              </Pressable>
            ) : null}
          </View>
        );
      })}

      {escalones.length === 0 ? (
        <Text style={[S.textoSuave, { paddingVertical: 16 }]}>
          La escalera todavía no está sembrada.
        </Text>
      ) : null}
    </View>
  );
}

const e = StyleSheet.create({
  escalon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 8,
    minWidth: 240,
  },
  posicion: {
    width: 22,
    fontFamily: FONT.display,
    fontSize: 15,
    color: T.tintaSuave,
  },
  nombre: {
    flex: 1,
    fontFamily: FONT.texto,
    fontSize: 15,
    color: T.tinta,
  },
  btnRetar: {
    backgroundColor: T.pista,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  btnRetarTexto: {
    color: T.blanco,
    fontFamily: FONT.displaySemi,
    fontSize: 11,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
