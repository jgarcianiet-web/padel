import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, Text, View } from 'react-native';

import { AnthropicError, procesarCapturaBand } from '../lib/anthropic';
import { capturaVacia, mediaGolpes } from '../lib/band';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { CapturaBand, GolpeSesion } from '../types/domain';

interface Props {
  golpesSesion: GolpeSesion[];
  bandInicio: string;
  bandFin: string;
  bandMediaJugador: string;
  onResultado: (captura: CapturaBand) => void;
  onDescartarGolpes: () => void;
  onDescartarCurva: () => void;
}

// Captura de Padel Band: foto o imagen de la galería → visión → autorrelleno.
// Acepta las dos pantallas de la app (golpes y "Progreso de la sesión") en
// cualquier orden; cada una rellena solo sus campos.
export default function BandCapture({
  golpesSesion,
  bandInicio,
  bandFin,
  bandMediaJugador,
  onResultado,
  onDescartarGolpes,
  onDescartarCurva,
}: Props) {
  const [capturando, setCapturando] = useState(false);
  const [error, setError] = useState('');

  const procesar = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!asset.base64) {
      setError('No se pudo leer la imagen. Inténtalo de nuevo.');
      return;
    }
    setCapturando(true);
    setError('');
    try {
      const captura = await procesarCapturaBand(asset.base64, asset.mimeType ?? 'image/jpeg');
      if (capturaVacia(captura)) {
        setError(
          'No he podido leer datos en esa imagen. Prueba con una captura más nítida de la pantalla de golpes o de progreso de la sesión.'
        );
      } else {
        onResultado(captura);
      }
    } catch (e) {
      setError(
        e instanceof AnthropicError
          ? e.message
          : 'No se pudo procesar la captura. Inténtalo de nuevo.'
      );
    }
    setCapturando(false);
  };

  const elegirImagen = async (desdeCamara: boolean) => {
    if (capturando) return;
    const permiso = desdeCamara
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permiso.granted) {
      Alert.alert(
        'Permiso necesario',
        desdeCamara
          ? 'Activa el acceso a la cámara en Ajustes de iOS para fotografiar la pantalla de Padel Band.'
          : 'Activa el acceso a fotos en Ajustes de iOS para elegir la captura de Padel Band.'
      );
      return;
    }
    const opciones: ImagePicker.ImagePickerOptions = { base64: true, quality: 0.8 };
    const resultado = desdeCamara
      ? await ImagePicker.launchCameraAsync(opciones)
      : await ImagePicker.launchImageLibraryAsync(opciones);
    if (!resultado.canceled && resultado.assets[0]) {
      await procesar(resultado.assets[0]);
    }
  };

  const hayCurva = bandInicio !== '' || bandFin !== '' || bandMediaJugador !== '';

  return (
    <View>
      <View style={styles.botones}>
        <Pressable
          onPress={() => elegirImagen(false)}
          disabled={capturando}
          style={[S.btnSec, styles.btn, capturando && { opacity: 0.55 }]}>
          {capturando ? (
            <View style={styles.leyendo}>
              <ActivityIndicator size="small" color={T.pista} />
              <Text style={[S.btnSecText, { fontSize: 13 }]}>Leyendo captura…</Text>
            </View>
          ) : (
            <Text style={[S.btnSecText, { fontSize: 13 }]}>🖼 Elegir captura</Text>
          )}
        </Pressable>
        {!capturando && (
          <Pressable onPress={() => elegirImagen(true)} style={[S.btnSec, styles.btn]}>
            <Text style={[S.btnSecText, { fontSize: 13 }]}>📷 Hacer foto</Text>
          </Pressable>
        )}
      </View>
      <Text style={styles.ayuda}>
        Sube la pantalla de golpes (rellena el nivel de la sesión con la media, tu mejor y peor
        golpe y el desglose) y/o la pantalla "Progreso de la sesión" (rellena la curva
        inicio/fin y tu media histórica). En cualquier orden.
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}

      {golpesSesion.length > 0 && (
        <View style={styles.resumen}>
          <Text style={[S.labelSmall, { color: T.pista, marginBottom: 6 }]}>
            ✓ {golpesSesion.length} golpes capturados · media {mediaGolpes(golpesSesion)}/7
          </Text>
          <View style={styles.chips}>
            {golpesSesion.map((g, i) => (
              <View key={i} style={styles.chip}>
                <Text style={styles.chipTexto}>
                  {g.nombre} <Text style={styles.chipNota}>{g.nota}</Text>
                </Text>
              </View>
            ))}
          </View>
          <Pressable onPress={onDescartarGolpes}>
            <Text style={styles.descartar}>Descartar captura de golpes</Text>
          </Pressable>
        </View>
      )}

      {hayCurva && (
        <View style={styles.resumen}>
          <Text style={[S.labelSmall, { color: T.pista, marginBottom: 6 }]}>
            ✓ Progreso de la sesión
          </Text>
          <Text style={styles.curva}>
            {bandInicio !== '' ? `Inicio ${bandInicio}` : ''}
            {bandInicio !== '' && bandFin !== '' ? ' → ' : ''}
            {bandFin !== '' ? `Fin ${bandFin}` : ''}
            {bandMediaJugador !== ''
              ? `${bandInicio !== '' || bandFin !== '' ? ' · ' : ''}Tu media ${bandMediaJugador}`
              : ''}
          </Text>
          <Pressable onPress={onDescartarCurva}>
            <Text style={styles.descartar}>Descartar captura de progreso</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  botones: { flexDirection: 'row', gap: 8, marginTop: 10 },
  btn: { flex: 1, paddingVertical: 13 },
  leyendo: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ayuda: { fontSize: 11.5, color: T.tintaSuave, marginTop: 6, fontFamily: FONT.texto, lineHeight: 16 },
  error: { fontSize: 13, color: T.rojo, marginTop: 8, fontFamily: FONT.texto },
  resumen: {
    marginTop: 10,
    backgroundColor: T.pistaTinte,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 14,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  chipTexto: { fontSize: 12, color: T.tinta, fontFamily: FONT.texto },
  chipNota: { fontFamily: FONT.textoBold },
  curva: { fontSize: 13.5, color: T.tinta, fontFamily: FONT.textoBold },
  descartar: { fontSize: 12, color: T.tintaSuave, marginTop: 6, fontFamily: FONT.texto },
});
