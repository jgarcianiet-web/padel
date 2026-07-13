import DateTimePicker from '@react-native-community/datetimepicker';
import * as Clipboard from 'expo-clipboard';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import Cabecera from '../components/Cabecera';
import Card from '../components/Card';
import { CATALOGO_OBJETIVOS } from '../constants/catalogos';
import { deleteApiKey, getApiKey, setApiKey } from '../lib/anthropic';
import { exportarBackup, importarBackup } from '../lib/backup';
import { fmtFecha, hoy } from '../lib/date';
import { MSG_SIN_HEALTH, healthDisponible, pedirPermisos } from '../lib/health';
import { compartirJSON } from '../lib/share';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';

export default function AjustesScreen() {
  const matches = useLigaStore((s) => s.matches);
  const objetivos = useLigaStore((s) => s.objetivos);
  const perfil = useLigaStore((s) => s.perfil);
  const analisis = useLigaStore((s) => s.analisis);
  const guardarObjetivos = useLigaStore((s) => s.guardarObjetivos);
  const guardarPerfil = useLigaStore((s) => s.guardarPerfil);
  const importarEstado = useLigaStore((s) => s.importarEstado);

  // borradores locales: se persisten solo al pulsar Guardar, como en la web-app
  const [perfilDraft, setPerfilDraft] = useState(perfil);
  const [objetivosDraft, setObjetivosDraft] = useState(objetivos);
  const [slotSel, setSlotSel] = useState(0);
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [msgPerfil, setMsgPerfil] = useState('');
  const [msgObjetivos, setMsgObjetivos] = useState('');

  const [claveDraft, setClaveDraft] = useState('');
  const [hayClave, setHayClave] = useState(false);
  const [msgClave, setMsgClave] = useState('');

  const [textoImport, setTextoImport] = useState('');
  const [msgImport, setMsgImport] = useState('');
  const [msgBackup, setMsgBackup] = useState('');

  const [pidiendoPermisos, setPidiendoPermisos] = useState(false);
  const [msgHealth, setMsgHealth] = useState('');

  useEffect(() => {
    setPerfilDraft(perfil);
  }, [perfil]);
  useEffect(() => {
    setObjetivosDraft(objetivos);
  }, [objetivos]);
  useEffect(() => {
    getApiKey().then((k) => setHayClave(!!k));
  }, []);

  const avisar = (setter: (v: string) => void, msg: string) => {
    setter(msg);
    setTimeout(() => setter(''), 4000);
  };

  const onGuardarPerfil = async () => {
    await guardarPerfil(perfilDraft);
    avisar(setMsgPerfil, '✓ Perfil guardado');
  };

  const onGuardarObjetivos = async () => {
    await guardarObjetivos(objetivosDraft);
    avisar(setMsgObjetivos, '✓ Objetivos guardados');
  };

  const toggleIdea = (idea: string) => {
    const n = [...objetivosDraft];
    const idx = n.indexOf(idea);
    if (idx !== -1) {
      n[idx] = '';
      setObjetivosDraft(n);
      setSlotSel(idx);
    } else {
      n[slotSel] = idea;
      setObjetivosDraft(n);
      setSlotSel((slotSel + 1) % 3);
    }
  };

  const onGuardarClave = async () => {
    const clave = claveDraft.trim();
    if (!clave) return;
    await setApiKey(clave);
    setClaveDraft('');
    setHayClave(true);
    avisar(setMsgClave, '✓ Clave guardada de forma segura');
  };

  const onBorrarClave = () => {
    Alert.alert('Borrar clave', '¿Quitar la clave de API guardada?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Borrar',
        style: 'destructive',
        onPress: async () => {
          await deleteApiKey();
          setHayClave(false);
        },
      },
    ]);
  };

  const onPedirPermisos = async () => {
    if (pidiendoPermisos) return;
    setPidiendoPermisos(true);
    try {
      await pedirPermisos();
      setMsgHealth('✓ Acceso gestionado: elige qué datos compartir en el diálogo de iOS');
    } catch (e) {
      setMsgHealth(e instanceof Error ? e.message : 'No se pudo solicitar el acceso.');
    }
    setPidiendoPermisos(false);
  };

  const estado = { matches, objetivos, perfil, analisis };

  const onExportarArchivo = async () => {
    try {
      await compartirJSON(`liga-padel-copia-${hoy()}.json`, exportarBackup(estado));
    } catch {
      avisar(setMsgBackup, 'No se pudo generar la copia. Inténtalo de nuevo.');
    }
  };

  const onCopiarPortapapeles = async () => {
    await Clipboard.setStringAsync(exportarBackup(estado));
    avisar(setMsgBackup, '✓ Copia copiada al portapapeles — pégala en tus Notas');
  };

  const importar = async (raw: string) => {
    try {
      const nuevo = importarBackup(raw, estado);
      await importarEstado(nuevo);
      setTextoImport('');
      avisar(setMsgImport, `Importados ${nuevo.matches.length} partidos correctamente.`);
    } catch {
      avisar(
        setMsgImport,
        'No se pudo leer: pega el contenido completo del archivo de copia (.json).'
      );
    }
  };

  const onImportarArchivo = async () => {
    const res = await DocumentPicker.getDocumentAsync({
      type: ['application/json', 'text/plain'],
    });
    if (res.canceled || !res.assets[0]) return;
    try {
      const contenido = await new File(res.assets[0].uri).text();
      await importar(contenido);
    } catch {
      avisar(setMsgImport, 'No se pudo leer el archivo seleccionado.');
    }
  };

  return (
    <View style={styles.pantalla}>
      <Cabecera fechaInicio={perfil.fechaInicio} totalPartidos={matches.length} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Perfil inicial */}
          <Card style={!perfil.nivelPlaytomic ? styles.cardDestacada : undefined}>
            <Text style={S.label}>Perfil inicial de la liga</Text>
            <Text style={styles.ayuda}>
              Tu punto de partida. Todo el progreso se mide desde aquí.
            </Text>

            <Text style={S.labelSmall}>Fecha de inicio</Text>
            <Pressable style={S.input} onPress={() => setMostrarPicker(!mostrarPicker)}>
              <Text style={styles.fechaTexto}>{fmtFecha(perfilDraft.fechaInicio || hoy())}</Text>
            </Pressable>
            {mostrarPicker && (
              <DateTimePicker
                value={new Date((perfilDraft.fechaInicio || hoy()) + 'T12:00:00')}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setMostrarPicker(false);
                  if (date)
                    setPerfilDraft({ ...perfilDraft, fechaInicio: date.toISOString().slice(0, 10) });
                }}
              />
            )}

            <Text style={[S.labelSmall, { marginTop: 12 }]}>Nivel Playtomic actual</Text>
            <TextInput
              value={perfilDraft.nivelPlaytomic}
              onChangeText={(v) => setPerfilDraft({ ...perfilDraft, nivelPlaytomic: v })}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.20"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />

            <Text style={[S.labelSmall, { marginTop: 12 }]}>
              Meta de nivel Playtomic para la temporada
            </Text>
            <TextInput
              value={perfilDraft.nivelObjetivo}
              onChangeText={(v) => setPerfilDraft({ ...perfilDraft, nivelObjetivo: v })}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.50"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />

            <Text style={[S.labelSmall, { marginTop: 12 }]}>
              Nivel Padel Band habitual (por sesión)
            </Text>
            <TextInput
              value={perfilDraft.nivelBand}
              onChangeText={(v) => setPerfilDraft({ ...perfilDraft, nivelBand: v })}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.5 (escala 1-7)"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />

            {msgPerfil ? <Text style={styles.ok}>{msgPerfil}</Text> : null}
            <Pressable style={[S.btnPrim, { marginTop: 12 }]} onPress={onGuardarPerfil}>
              <Text style={S.btnPrimText}>Guardar perfil</Text>
            </Pressable>
          </Card>

          {/* Objetivos */}
          <Card>
            <Text style={S.label}>Tus 3 objetivos por partido</Text>
            <Text style={styles.ayuda}>
              Normalmente te los prescribirá el entrenador tras cada análisis. Aquí puedes
              ajustarlos a mano o elegir ideas de la lista de abajo.
            </Text>
            {objetivosDraft.map((o, i) => (
              <TextInput
                key={i}
                value={o}
                onFocus={() => setSlotSel(i)}
                onChangeText={(v) => {
                  const n = [...objetivosDraft];
                  n[i] = v;
                  setObjetivosDraft(n);
                }}
                placeholder={`Objetivo ${i + 1}`}
                placeholderTextColor={T.tintaSuave}
                style={[
                  S.input,
                  { marginBottom: 8 },
                  slotSel === i && { borderColor: T.pista, borderWidth: 2 },
                ]}
              />
            ))}
            {msgObjetivos ? <Text style={styles.ok}>{msgObjetivos}</Text> : null}
            <Pressable style={[S.btnPrim, { marginTop: 6 }]} onPress={onGuardarObjetivos}>
              <Text style={S.btnPrimText}>Guardar objetivos</Text>
            </Pressable>
          </Card>

          {/* Catálogo de ideas */}
          <Card>
            <Text style={S.label}>Ideas de objetivos</Text>
            <Text style={styles.ayuda}>
              Toca una para ponerla en el slot {slotSel + 1}. Toca una en uso para quitarla.
            </Text>
            {CATALOGO_OBJETIVOS.map((o) => {
              const enUso = objetivosDraft.includes(o);
              return (
                <Pressable
                  key={o}
                  onPress={() => toggleIdea(o)}
                  style={[styles.idea, enUso && styles.ideaEnUso]}>
                  <Text style={[styles.ideaTexto, enUso && styles.ideaTextoEnUso]}>{o}</Text>
                </Pressable>
              );
            })}
            <Text style={styles.notaPie}>
              Recuerda guardar los objetivos arriba después de elegir.
            </Text>
          </Card>

          {/* Clave de API */}
          <Card>
            <Text style={S.label}>Clave de API de Anthropic</Text>
            <Text style={styles.ayuda}>
              Necesaria para el entrenador y la lectura de capturas de Padel Band. Se guarda
              cifrada en el llavero del iPhone, nunca en la copia de seguridad.
            </Text>
            <Text style={hayClave ? styles.claveEstadoOk : styles.claveEstadoNo}>
              {hayClave ? '✓ Hay una clave guardada' : 'Sin clave guardada'}
            </Text>
            <TextInput
              value={claveDraft}
              onChangeText={setClaveDraft}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              placeholder="sk-ant-…"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />
            {msgClave ? <Text style={styles.ok}>{msgClave}</Text> : null}
            <Pressable
              style={[S.btnPrim, { marginTop: 10 }, !claveDraft.trim() && { opacity: 0.5 }]}
              disabled={!claveDraft.trim()}
              onPress={onGuardarClave}>
              <Text style={S.btnPrimText}>Guardar clave</Text>
            </Pressable>
            {hayClave && (
              <Pressable style={styles.borrarClave} onPress={onBorrarClave}>
                <Text style={styles.borrarClaveTexto}>Borrar clave guardada</Text>
              </Pressable>
            )}
          </Card>

          {/* Copia de seguridad */}
          <Card>
            <Text style={S.label}>Copia de seguridad</Text>
            <Text style={styles.ayuda}>
              Exporta todos tus datos como archivo .json o texto. Para recuperarlos (o traer los
              de la web-app), pega el texto o elige el archivo en "Restaurar copia".
            </Text>
            <Pressable style={S.btnSec} onPress={onExportarArchivo}>
              <Text style={S.btnSecText}>Compartir archivo .json</Text>
            </Pressable>
            <Pressable style={[S.btnSec, { marginTop: 8 }]} onPress={onCopiarPortapapeles}>
              <Text style={S.btnSecText}>Copiar al portapapeles</Text>
            </Pressable>
            {msgBackup ? (
              <Text style={msgBackup.startsWith('✓') ? styles.ok : styles.error}>{msgBackup}</Text>
            ) : null}

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Restaurar copia</Text>
            <TextInput
              value={textoImport}
              onChangeText={setTextoImport}
              placeholder="Pega aquí el contenido del archivo de copia…"
              placeholderTextColor={T.tintaSuave}
              multiline
              numberOfLines={3}
              style={[S.input, styles.areaImport]}
            />
            {msgImport ? (
              <Text style={msgImport.startsWith('Importados') ? styles.ok : styles.error}>
                {msgImport}
              </Text>
            ) : null}
            <Pressable
              style={[S.btnPrim, { marginTop: 10 }, !textoImport.trim() && { opacity: 0.5 }]}
              disabled={!textoImport.trim()}
              onPress={() => importar(textoImport)}>
              <Text style={S.btnPrimText}>Importar datos</Text>
            </Pressable>
            <Pressable style={[S.btnSec, { marginTop: 8 }]} onPress={onImportarArchivo}>
              <Text style={S.btnSecText}>Importar desde archivo…</Text>
            </Pressable>
          </Card>

          {/* Apple Health */}
          <Card>
            <Text style={S.label}>Apple Health</Text>
            <Text style={styles.ayuda}>
              Vincula tus entrenamientos de pádel del Apple Watch (duración, pulso, calorías) con
              cada partido desde el formulario de registro.
            </Text>
            {healthDisponible() ? (
              <>
                {msgHealth ? (
                  <Text style={msgHealth.startsWith('✓') ? styles.ok : styles.error}>
                    {msgHealth}
                  </Text>
                ) : null}
                <Pressable
                  style={[S.btnSec, { marginTop: 10 }, pidiendoPermisos && { opacity: 0.55 }]}
                  disabled={pidiendoPermisos}
                  onPress={onPedirPermisos}>
                  <Text style={S.btnSecText}>
                    {pidiendoPermisos ? 'Solicitando…' : 'Conceder acceso a Salud'}
                  </Text>
                </Pressable>
                <Text style={styles.notaPie}>
                  iOS no revela si el permiso de lectura está concedido: si al buscar
                  entrenamientos no aparece ninguno, revisa Ajustes → Salud → Acceso a datos.
                </Text>
              </>
            ) : (
              <Text style={styles.ayuda}>{MSG_SIN_HEALTH}</Text>
            )}
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  cardDestacada: { borderLeftWidth: 4, borderLeftColor: T.pista },
  ayuda: {
    fontSize: 12.5,
    color: T.tintaSuave,
    marginTop: 4,
    marginBottom: 10,
    lineHeight: 19,
    fontFamily: FONT.texto,
  },
  fechaTexto: { fontSize: 16, color: T.tinta, fontFamily: FONT.texto },
  ok: { fontSize: 13, marginTop: 8, color: T.bolaOscura, fontFamily: FONT.textoBold },
  error: { fontSize: 13, marginTop: 8, color: T.rojo, fontFamily: FONT.textoBold },
  idea: {
    backgroundColor: T.blanco,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 10,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 7,
  },
  ideaEnUso: { backgroundColor: T.pistaTinte, borderColor: T.pista },
  ideaTexto: { fontSize: 13.5, color: T.tinta, fontFamily: FONT.texto },
  ideaTextoEnUso: { color: T.pista, fontFamily: FONT.textoBold },
  notaPie: { fontSize: 11.5, color: T.tintaSuave, marginTop: 4, fontFamily: FONT.texto },
  claveEstadoOk: { fontSize: 13, color: T.bolaOscura, fontFamily: FONT.textoBold },
  claveEstadoNo: { fontSize: 13, color: T.tintaSuave, fontFamily: FONT.texto },
  borrarClave: { marginTop: 10, alignItems: 'center', paddingVertical: 6 },
  borrarClaveTexto: { fontSize: 13, color: T.rojo, fontFamily: FONT.texto },
  areaImport: { minHeight: 80, textAlignVertical: 'top' },
});
