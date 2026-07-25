import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { formatearSets, resumirSets } from '../lib/marcador';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { Partido } from '../types/domain';

const ORDEN_RONDAS = [
  'Ronda de 32',
  'Octavos de final',
  'Cuartos de final',
  'Semifinales',
  'Final',
];

const peso = (ronda: string) => {
  const i = ORDEN_RONDAS.indexOf(ronda);
  return i === -1 ? -1 : i;
};

/** Agrupa los partidos del cuadro por ronda, de la primera a la final. */
export function agruparPorRonda<P extends Partido>(
  partidos: P[]
): { ronda: string; partidos: P[] }[] {
  const mapa = new Map<string, P[]>();
  for (const p of partidos) {
    const clave = p.ronda ?? 'Cuadro';
    mapa.set(clave, [...(mapa.get(clave) ?? []), p]);
  }
  return [...mapa.entries()]
    .map(([ronda, lista]) => ({ ronda, partidos: lista.sort((x, y) => x.orden - y.orden) }))
    .sort((x, y) => peso(x.ronda) - peso(y.ronda));
}

/** Cuadro eliminatorio en columnas, una por ronda, con scroll horizontal. */
export function Cuadro<P extends Partido>({
  partidos,
  etiqueta,
  onPress,
}: {
  partidos: P[];
  etiqueta: (partido: P, lado: 'a' | 'b') => string;
  onPress?: (partido: P) => void;
}) {
  const rondas = agruparPorRonda(partidos);

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={{ flexDirection: 'row', gap: 12, paddingVertical: 4 }}>
        {rondas.map((r) => (
          <View key={r.ronda} style={{ width: 200 }}>
            <Text style={e.ronda}>{r.ronda}</Text>
            <View style={{ justifyContent: 'space-around', flex: 1, gap: 10 }}>
              {r.partidos.map((p) => {
                const res = resumirSets(p.sets);
                const jugado = p.estado === 'confirmado';
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => onPress?.(p)}
                    style={({ pressed }) => [e.nodo, pressed && { opacity: 0.85 }]}>
                    <Text
                      style={[e.equipo, jugado && res.ganador === 'a' && e.gana]}
                      numberOfLines={1}>
                      {etiqueta(p, 'a')}
                    </Text>
                    <View style={e.separador} />
                    <Text
                      style={[e.equipo, jugado && res.ganador === 'b' && e.gana]}
                      numberOfLines={1}>
                      {etiqueta(p, 'b')}
                    </Text>
                    {jugado ? (
                      <Text style={e.marcador}>{formatearSets(p.sets)}</Text>
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const e = StyleSheet.create({
  ronda: {
    fontFamily: FONT.display,
    fontSize: 11,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    marginBottom: 8,
  },
  nodo: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 12,
    padding: 10,
  },
  equipo: {
    fontFamily: FONT.texto,
    fontSize: 14,
    color: T.tinta,
  },
  gana: {
    fontFamily: FONT.textoBold,
    color: T.pista,
  },
  separador: {
    height: 1,
    backgroundColor: T.borde,
    marginVertical: 6,
  },
  marcador: {
    marginTop: 6,
    fontFamily: FONT.displaySemi,
    fontSize: 12,
    color: T.tintaSuave,
  },
});
