import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { resumirSets, validarSets } from '../lib/marcador';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { SetMarcador } from '../types/domain';
import { Aviso, Boton } from './base';

interface Props {
  etiquetaA: string;
  etiquetaB: string;
  setsParaGanar: 1 | 2;
  guardando?: boolean;
  onGuardar: (sets: SetMarcador[], ganador: 'a' | 'b') => void;
}

const nuevoSet = (): SetMarcador => ({ a: 0, b: 0, tbA: null, tbB: null });

/** Marcador set a set. El ganador sale del propio marcador, no se elige. */
export function EditorMarcador({
  etiquetaA,
  etiquetaB,
  setsParaGanar,
  guardando,
  onGuardar,
}: Props) {
  const [sets, setSets] = useState<SetMarcador[]>([nuevoSet()]);
  const [error, setError] = useState<string | null>(null);

  const maxSets = setsParaGanar * 2 - 1;
  const resumen = resumirSets(sets);

  const cambiar = (i: number, campo: 'a' | 'b', valor: string) => {
    const n = Math.max(0, Math.min(99, Number(valor.replace(/\D/g, '')) || 0));
    setSets(sets.map((s, k) => (k === i ? { ...s, [campo]: n } : s)));
    setError(null);
  };

  const guardar = () => {
    const fallo = validarSets(sets, { setsParaGanar });
    if (fallo) {
      setError(fallo);
      return;
    }
    onGuardar(sets, resumirSets(sets).ganador as 'a' | 'b');
  };

  return (
    <View>
      <View style={[S.filaEntre, { marginBottom: 10 }]}>
        <Text style={[e.equipo]} numberOfLines={2}>
          {etiquetaA}
        </Text>
        <Text style={[e.equipo, { textAlign: 'right' }]} numberOfLines={2}>
          {etiquetaB}
        </Text>
      </View>

      {sets.map((s, i) => (
        <View key={i} style={e.filaSet}>
          <Text style={e.numSet}>Set {i + 1}</Text>
          <TextInput
            value={String(s.a)}
            onChangeText={(v) => cambiar(i, 'a', v)}
            keyboardType="number-pad"
            style={e.casilla}
            maxLength={2}
          />
          <Text style={e.guion}>–</Text>
          <TextInput
            value={String(s.b)}
            onChangeText={(v) => cambiar(i, 'b', v)}
            keyboardType="number-pad"
            style={e.casilla}
            maxLength={2}
          />
          {sets.length > 1 ? (
            <Pressable onPress={() => setSets(sets.filter((_, k) => k !== i))}>
              <Text style={e.quitar}>Quitar</Text>
            </Pressable>
          ) : null}
        </View>
      ))}

      {sets.length < maxSets ? (
        <Pressable onPress={() => setSets([...sets, nuevoSet()])}>
          <Text style={e.anadir}>+ Añadir set</Text>
        </Pressable>
      ) : null}

      <Text style={[S.textoSuave, { marginTop: 12 }]}>
        {resumen.ganador
          ? `Gana ${resumen.ganador === 'a' ? etiquetaA : etiquetaB} (${resumen.setsA}-${resumen.setsB})`
          : 'Todo partido tiene que acabar con un ganador.'}
      </Text>

      {error ? <View style={{ marginTop: 10 }}><Aviso texto={error} /></View> : null}

      <Boton titulo="Subir resultado" onPress={guardar} cargando={guardando} />
    </View>
  );
}

const e = StyleSheet.create({
  equipo: {
    flex: 1,
    fontFamily: FONT.displaySemi,
    fontSize: 15,
    color: T.tinta,
  },
  filaSet: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  numSet: {
    width: 54,
    fontFamily: FONT.display,
    fontSize: 11,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    color: T.tintaSuave,
  },
  casilla: {
    width: 56,
    backgroundColor: T.fondo,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 10,
    paddingVertical: 10,
    textAlign: 'center',
    fontSize: 20,
    fontFamily: FONT.displaySemi,
    color: T.tinta,
  },
  guion: {
    paddingHorizontal: 10,
    color: T.tintaTenue,
    fontSize: 18,
  },
  quitar: {
    marginLeft: 12,
    color: T.rojo,
    fontFamily: FONT.texto,
    fontSize: 13,
  },
  anadir: {
    color: T.pista,
    fontFamily: FONT.displaySemi,
    fontSize: 13,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 4,
  },
});
