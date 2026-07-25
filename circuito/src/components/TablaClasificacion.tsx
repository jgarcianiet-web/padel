import { StyleSheet, Text, View } from 'react-native';

import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { FilaClasificacion } from '../types/domain';

interface Props {
  filas: FilaClasificacion[];
  nombreDe: (id: string) => string;
  destacado?: string | null;
  /** Nº de plazas de ascenso y de descenso, para pintar las zonas. */
  sube?: number;
  baja?: number;
}

export function TablaClasificacion({ filas, nombreDe, destacado, sube = 0, baja = 0 }: Props) {
  return (
    <View>
      <View style={[e.fila, e.cabecera]}>
        <Text style={[e.puesto, e.cab]}>#</Text>
        <Text style={[e.nombre, e.cab]}>Jugador</Text>
        <Text style={[e.dato, e.cab]}>PJ</Text>
        <Text style={[e.dato, e.cab]}>PG</Text>
        <Text style={[e.dato, e.cab]}>+/−</Text>
        <Text style={[e.dato, e.cab, e.puntos]}>Pts</Text>
      </View>

      {filas.map((f) => {
        const zonaSube = sube > 0 && f.puesto <= sube;
        const zonaBaja = baja > 0 && f.puesto > filas.length - baja;
        const yo = destacado === f.participanteId;
        return (
          <View
            key={f.participanteId}
            style={[
              e.fila,
              yo && { backgroundColor: T.pistaTinte },
              zonaSube && e.bordeSube,
              zonaBaja && e.bordeBaja,
            ]}>
            <Text style={e.puesto}>{f.puesto}</Text>
            <Text style={[e.nombre, yo && { fontFamily: FONT.textoBold }]} numberOfLines={1}>
              {nombreDe(f.participanteId)}
            </Text>
            <Text style={e.dato}>{f.jugados}</Text>
            <Text style={e.dato}>{f.ganados}</Text>
            <Text style={e.dato}>{f.juegosFavor - f.juegosContra}</Text>
            <Text style={[e.dato, e.puntos]}>{f.puntos}</Text>
          </View>
        );
      })}

      {filas.length === 0 ? (
        <Text style={[S.textoSuave, { paddingVertical: 16 }]}>
          Todavía no hay resultados confirmados.
        </Text>
      ) : null}
    </View>
  );
}

const e = StyleSheet.create({
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    paddingHorizontal: 6,
    borderBottomWidth: 1,
    borderBottomColor: T.borde,
    borderLeftWidth: 3,
    borderLeftColor: 'transparent',
  },
  cabecera: {
    borderBottomWidth: 1.5,
    borderBottomColor: T.tintaTenue,
  },
  cab: {
    fontFamily: FONT.display,
    fontSize: 10.5,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: T.tintaSuave,
  },
  puesto: {
    width: 26,
    fontFamily: FONT.displaySemi,
    color: T.tintaSuave,
    fontSize: 13,
  },
  nombre: {
    flex: 1,
    fontFamily: FONT.texto,
    color: T.tinta,
    fontSize: 15,
    paddingRight: 8,
  },
  dato: {
    width: 34,
    textAlign: 'center',
    fontFamily: FONT.texto,
    color: T.tintaSuave,
    fontSize: 14,
  },
  puntos: {
    color: T.tinta,
    fontFamily: FONT.textoBold,
  },
  bordeSube: { borderLeftColor: T.verde },
  bordeBaja: { borderLeftColor: T.rojo },
});
