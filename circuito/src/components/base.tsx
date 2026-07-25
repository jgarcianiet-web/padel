import { SymbolView } from 'expo-symbols';
import { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
} from 'react-native';

import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';

export function Card({
  children,
  style,
}: {
  children: ReactNode;
  style?: ViewStyle;
}) {
  return <View style={[S.card, style]}>{children}</View>;
}

export function Boton({
  titulo,
  onPress,
  variante = 'primario',
  cargando,
  deshabilitado,
}: {
  titulo: string;
  onPress: () => void;
  variante?: 'primario' | 'secundario' | 'peligro';
  cargando?: boolean;
  deshabilitado?: boolean;
}) {
  const off = deshabilitado || cargando;
  const base =
    variante === 'secundario'
      ? [S.btnSec]
      : [S.btnPrim, variante === 'peligro' && { backgroundColor: T.rojo }];
  const texto = variante === 'secundario' ? S.btnSecText : S.btnPrimText;

  return (
    <Pressable
      onPress={onPress}
      disabled={off}
      style={({ pressed }) => [
        ...base,
        { opacity: off ? 0.45 : pressed ? 0.85 : 1, marginTop: 8 },
      ]}>
      {cargando ? (
        <ActivityIndicator color={variante === 'secundario' ? T.pista : T.blanco} />
      ) : (
        <Text style={texto}>{titulo}</Text>
      )}
    </Pressable>
  );
}

export function Campo({
  label,
  ...props
}: TextInputProps & { label: string }) {
  return (
    <View style={{ marginBottom: 12 }}>
      <Text style={S.label}>{label}</Text>
      <TextInput
        placeholderTextColor={T.tintaTenue}
        {...props}
        style={[S.input, props.style]}
      />
    </View>
  );
}

export function Chip({
  texto,
  tono = 'neutro',
  onPress,
  activo,
}: {
  texto: string;
  tono?: 'neutro' | 'pista' | 'verde' | 'rojo' | 'ambar';
  onPress?: () => void;
  activo?: boolean;
}) {
  const tonos = {
    neutro: { fondo: T.fondo, color: T.tintaSuave },
    pista: { fondo: T.pistaTinte, color: T.pista },
    verde: { fondo: T.verdeTinte, color: T.verde },
    rojo: { fondo: T.rojoTinte, color: T.rojo },
    ambar: { fondo: T.ambarTinte, color: T.ambar },
  }[tono];

  const contenido = (
    <View
      style={[
        e.chip,
        { backgroundColor: activo ? T.pista : tonos.fondo },
        activo && { borderColor: T.pista },
      ]}>
      <Text style={[e.chipTexto, { color: activo ? T.blanco : tonos.color }]}>{texto}</Text>
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{contenido}</Pressable> : contenido;
}

export function Cabecera({
  titulo,
  subtitulo,
  derecha,
}: {
  titulo: string;
  subtitulo?: string;
  derecha?: ReactNode;
}) {
  return (
    <View style={[S.filaEntre, { marginBottom: 16 }]}>
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={S.titulo}>{titulo}</Text>
        {subtitulo ? <Text style={S.textoSuave}>{subtitulo}</Text> : null}
      </View>
      {derecha}
    </View>
  );
}

export function Vacio({ texto }: { texto: string }) {
  return (
    <View style={e.vacio}>
      <SymbolView
        name={{ ios: 'tennisball', android: 'sports_tennis', web: 'sports_tennis' }}
        tintColor={T.tintaTenue}
        size={30}
      />
      <Text style={[S.textoSuave, { textAlign: 'center', marginTop: 8 }]}>{texto}</Text>
    </View>
  );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
  return (
    <View style={e.vacio}>
      <ActivityIndicator color={T.pista} />
      <Text style={[S.textoSuave, { marginTop: 8 }]}>{texto}</Text>
    </View>
  );
}

export function Aviso({ texto, tono = 'rojo' }: { texto: string; tono?: 'rojo' | 'ambar' }) {
  const fondo = tono === 'rojo' ? T.rojoTinte : T.ambarTinte;
  const color = tono === 'rojo' ? T.rojo : T.ambar;
  return (
    <View style={[e.aviso, { backgroundColor: fondo, borderColor: color }]}>
      <Text style={[S.texto, { color, fontSize: 14 }]}>{texto}</Text>
    </View>
  );
}

/** Iniciales del jugador sobre un círculo: no dependemos de que haya foto. */
export function Avatar({ nombre, tamano = 36 }: { nombre: string; tamano?: number }) {
  const iniciales = nombre
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');
  return (
    <View
      style={[
        e.avatar,
        { width: tamano, height: tamano, borderRadius: tamano / 2 },
      ]}>
      <Text style={[e.avatarTexto, { fontSize: tamano * 0.38 }]}>{iniciales || '?'}</Text>
    </View>
  );
}

const e = StyleSheet.create({
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: T.borde,
    alignSelf: 'flex-start',
  },
  chipTexto: {
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    fontFamily: FONT.displaySemi,
  },
  vacio: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  aviso: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    backgroundColor: T.pistaTinte,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarTexto: {
    color: T.pista,
    fontFamily: FONT.display,
  },
});
