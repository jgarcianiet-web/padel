import DateTimePicker from '@react-native-community/datetimepicker';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BandCapture from '../components/BandCapture';
import Cabecera from '../components/Cabecera';
import Card from '../components/Card';
import ChipList from '../components/ChipList';
import GolpeSelector from '../components/GolpeSelector';
import MarcadorGrid from '../components/Marcador';
import ObjectivesChecklist from '../components/ObjectivesChecklist';
import Toggle from '../components/Toggle';
import { aplicarCaptura } from '../lib/band';
import { fmtFecha, hoy } from '../lib/date';
import {
  calcularResultado,
  formatearSets,
  marcadorVacio,
  setsGanados,
  setsJugados,
  setsPerdidos,
} from '../lib/marcador';
import { calcClubesPrevios, calcCompanerosPrevios } from '../lib/metrics';
import { useLigaStore } from '../store/ligaStore';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import {
  CapturaBand,
  GolpeSesion,
  Match,
  Posicion,
  ResultadoPartido,
  SetMarcador,
  TipoPartido,
} from '../types/domain';

export default function PartidoScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const matches = useLigaStore((s) => s.matches);
  const objetivos = useLigaStore((s) => s.objetivos);
  const perfil = useLigaStore((s) => s.perfil);
  const analisis = useLigaStore((s) => s.analisis);
  const guardarPartido = useLigaStore((s) => s.guardarPartido);

  const editando = id ? (matches.find((m) => m.id === Number(id)) ?? null) : null;

  const [fecha, setFecha] = useState(hoy());
  const [mostrarPicker, setMostrarPicker] = useState(false);
  const [tipo, setTipo] = useState<TipoPartido>('competitivo');
  const [resultado, setResultado] = useState<ResultadoPartido>('victoria');
  const [posicion, setPosicion] = useState<Posicion>('reves');
  const [marcador, setMarcador] = useState<SetMarcador[]>(marcadorVacio());
  const [club, setClub] = useState('');
  const [companero, setCompanero] = useState('');
  const [nivel, setNivel] = useState('');
  const [nivelBand, setNivelBand] = useState('');
  const [mejorGolpe, setMejorGolpe] = useState('');
  const [mejorPunt, setMejorPunt] = useState(0);
  const [peorGolpe, setPeorGolpe] = useState('');
  const [peorPunt, setPeorPunt] = useState(0);
  const [golpesSesion, setGolpesSesion] = useState<GolpeSesion[]>([]);
  const [bandInicio, setBandInicio] = useState('');
  const [bandFin, setBandFin] = useState('');
  const [bandMediaJugador, setBandMediaJugador] = useState('');
  const [objsCumplidos, setObjsCumplidos] = useState([false, false, false]);
  const [nota, setNota] = useState('');
  const [guardando, setGuardando] = useState(false);

  const limpiarFormulario = () => {
    setFecha(hoy());
    setMostrarPicker(false);
    setTipo('competitivo');
    setResultado('victoria');
    setPosicion('reves');
    setMarcador(marcadorVacio());
    setClub('');
    setCompanero('');
    setNivel('');
    setNivelBand('');
    setMejorGolpe('');
    setMejorPunt(0);
    setPeorGolpe('');
    setPeorPunt(0);
    setGolpesSesion([]);
    setBandInicio('');
    setBandFin('');
    setBandMediaJugador('');
    setObjsCumplidos([false, false, false]);
    setNota('');
  };

  // precarga del partido en edición (navegación desde Historial con ?id=)
  useEffect(() => {
    if (!editando) {
      limpiarFormulario();
      return;
    }
    setFecha(editando.fecha);
    setTipo(editando.tipo);
    setResultado(editando.resultado);
    setPosicion(editando.posicion || 'reves');
    const mc = marcadorVacio();
    (editando.marcador || []).forEach((s, i) => {
      if (i < 3)
        mc[i] = {
          yo: String(s.yo),
          rival: String(s.rival),
          tbYo: s.tbYo != null ? String(s.tbYo) : '',
          tbRival: s.tbRival != null ? String(s.tbRival) : '',
        };
    });
    setMarcador(mc);
    setClub(editando.club || '');
    setCompanero(editando.companero || '');
    setNivel(editando.nivel != null ? String(editando.nivel) : '');
    setNivelBand(editando.nivelBand != null ? String(editando.nivelBand) : '');
    setMejorGolpe(editando.mejorGolpe || '');
    setMejorPunt(editando.mejorPunt || 0);
    setPeorGolpe(editando.peorGolpe || '');
    setPeorPunt(editando.peorPunt || 0);
    setGolpesSesion(editando.golpesSesion || []);
    setBandInicio(editando.bandInicio != null ? String(editando.bandInicio) : '');
    setBandFin(editando.bandFin != null ? String(editando.bandFin) : '');
    setBandMediaJugador(
      editando.bandMediaJugador != null ? String(editando.bandMediaJugador) : ''
    );
    setObjsCumplidos([...editando.objetivos]);
    setNota(editando.nota || '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editando?.id]);

  const resultadoCalc = calcularResultado(marcador);
  const clubesPrevios = calcClubesPrevios(matches);
  const companerosPrevios = calcCompanerosPrevios(matches);

  // Cada tipo de captura rellena solo sus campos (ver src/lib/band.ts), de
  // modo que da igual el orden en que se suban las dos pantallas. El nivel de
  // la sesión sigue siendo editable a mano después.
  const onCaptura = (captura: CapturaBand) => {
    const patch = aplicarCaptura(captura);
    if (patch.nivelBand !== undefined) setNivelBand(patch.nivelBand);
    if (patch.golpesSesion !== undefined) setGolpesSesion(patch.golpesSesion);
    if (patch.mejorGolpe !== undefined) setMejorGolpe(patch.mejorGolpe);
    if (patch.mejorPunt !== undefined) setMejorPunt(patch.mejorPunt);
    if (patch.peorGolpe !== undefined) setPeorGolpe(patch.peorGolpe);
    if (patch.peorPunt !== undefined) setPeorPunt(patch.peorPunt);
    if (patch.bandInicio !== undefined) setBandInicio(patch.bandInicio);
    if (patch.bandFin !== undefined) setBandFin(patch.bandFin);
    if (patch.bandMediaJugador !== undefined) setBandMediaJugador(patch.bandMediaJugador);
  };

  const descartarCurva = () => {
    setBandInicio('');
    setBandFin('');
    setBandMediaJugador('');
  };

  const salir = () => {
    const eraEdicion = !!editando;
    // limpia el ?id= de la pestaña para que el próximo "+ Partido" abra en blanco
    router.setParams({ id: undefined });
    limpiarFormulario();
    router.navigate(eraEdicion ? '/historial' : '/');
  };

  const onGuardar = async () => {
    if (guardando) return;
    setGuardando(true);
    const setsStr = formatearSets(marcador);
    const m: Match = {
      id: editando ? editando.id : Date.now(),
      fecha,
      tipo,
      resultado: setsStr ? (resultadoCalc as ResultadoPartido) : resultado,
      posicion,
      sets: setsStr || (editando ? editando.sets : ''),
      marcador: setsStr ? setsJugados(marcador) : editando ? editando.marcador : null,
      club: club.trim(),
      companero: companero.trim(),
      nivel: nivel ? parseFloat(nivel) : null,
      nivelBand: nivelBand ? parseFloat(nivelBand) : null,
      mejorGolpe: mejorGolpe || null,
      mejorPunt: mejorGolpe && mejorPunt ? mejorPunt : null,
      peorGolpe: peorGolpe || null,
      peorPunt: peorGolpe && peorPunt ? peorPunt : null,
      golpesSesion: golpesSesion.length > 0 ? golpesSesion : null,
      objetivos: [...objsCumplidos],
      nota: nota.trim(),
      bandInicio: bandInicio ? parseFloat(bandInicio) : null,
      bandFin: bandFin ? parseFloat(bandFin) : null,
      bandMediaJugador: bandMediaJugador ? parseFloat(bandMediaJugador) : null,
      salud: editando ? (editando.salud ?? null) : null,
    };
    await guardarPartido(m);
    setGuardando(false);
    salir();
  };

  return (
    <View style={styles.pantalla}>
      <Cabecera fechaInicio={perfil.fechaInicio} totalPartidos={matches.length} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {editando && (
            <View style={styles.bannerEdicion}>
              <Text style={styles.bannerEdicionTexto}>
                ✎ Editando el partido del {fmtFecha(editando.fecha)}
              </Text>
            </View>
          )}
          {analisis?.foco ? (
            <View style={styles.bannerFoco}>
              <Text style={styles.bannerFocoTexto}>🎾 Foco de tu entrenador: {analisis.foco}</Text>
            </View>
          ) : null}

          <Card>
            <Text style={S.label}>El partido</Text>

            <Text style={[S.labelSmall, { marginTop: 12 }]}>Fecha</Text>
            <Pressable style={S.input} onPress={() => setMostrarPicker(!mostrarPicker)}>
              <Text style={styles.fechaTexto}>{fmtFecha(fecha)}</Text>
            </Pressable>
            {mostrarPicker && (
              <DateTimePicker
                value={new Date(fecha + 'T12:00:00')}
                mode="date"
                display={Platform.OS === 'ios' ? 'inline' : 'default'}
                onChange={(event, date) => {
                  if (Platform.OS !== 'ios') setMostrarPicker(false);
                  if (date) setFecha(date.toISOString().slice(0, 10));
                }}
              />
            )}

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Tipo</Text>
            <Toggle
              opciones={[
                { v: 'competitivo', t: 'Competitivo' },
                { v: 'amistoso', t: 'Amistoso' },
              ]}
              valor={tipo}
              onChange={setTipo}
            />

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Posición</Text>
            <Toggle
              opciones={[
                { v: 'reves', t: 'Revés' },
                { v: 'derecha', t: 'Derecha' },
              ]}
              valor={posicion}
              onChange={setPosicion}
            />

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Marcador</Text>
            <MarcadorGrid marcador={marcador} onChange={setMarcador} />

            {resultadoCalc ? (
              <View
                style={[
                  styles.badgeResultado,
                  {
                    backgroundColor:
                      resultadoCalc === 'victoria'
                        ? T.pista
                        : resultadoCalc === 'empate'
                          ? T.tintaSuave
                          : T.rojo,
                  },
                ]}>
                <Text style={styles.badgeTexto}>
                  {resultadoCalc} {setsGanados(marcador)}–{setsPerdidos(marcador)}
                </Text>
              </View>
            ) : (
              <>
                <Text style={styles.avisoManual}>Sin marcador, indica el resultado a mano:</Text>
                <Toggle
                  opciones={[
                    { v: 'victoria', t: 'Victoria' },
                    { v: 'empate', t: 'Empate' },
                    { v: 'derrota', t: 'Derrota' },
                  ]}
                  valor={resultado}
                  onChange={setResultado}
                />
              </>
            )}

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Club / pista</Text>
            <ChipList opciones={clubesPrevios} valor={club} onChange={setClub} />
            <TextInput
              value={club}
              onChangeText={setClub}
              placeholder="Ej: Padel Indoor Leganés"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Compañero</Text>
            <ChipList opciones={companerosPrevios} valor={companero} onChange={setCompanero} />
            <TextInput
              value={companero}
              onChangeText={setCompanero}
              placeholder="Con quién jugaste (opcional)"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />
          </Card>

          <Card>
            <Text style={S.label}>Niveles de la sesión</Text>

            <Text style={[S.labelSmall, { marginTop: 12 }]}>Nivel Playtomic tras el partido</Text>
            <TextInput
              value={nivel}
              onChangeText={setNivel}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.42"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />

            <Text style={[S.labelSmall, { marginTop: 14 }]}>Nivel Padel Band de la sesión</Text>
            <TextInput
              value={nivelBand}
              onChangeText={setNivelBand}
              keyboardType="decimal-pad"
              placeholder="Ej: 3.5 (escala 1-7)"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />
          </Card>

          <Card>
            <Text style={S.label}>Golpes destacados</Text>
            <BandCapture
              golpesSesion={golpesSesion}
              bandInicio={bandInicio}
              bandFin={bandFin}
              bandMediaJugador={bandMediaJugador}
              onResultado={onCaptura}
              onDescartarGolpes={() => setGolpesSesion([])}
              onDescartarCurva={descartarCurva}
            />
            <GolpeSelector
              titulo="Mejor golpe"
              golpe={mejorGolpe}
              punt={mejorPunt}
              onGolpe={setMejorGolpe}
              onPunt={setMejorPunt}
            />
            <GolpeSelector
              titulo="Peor golpe"
              golpe={peorGolpe}
              punt={peorPunt}
              onGolpe={setPeorGolpe}
              onPunt={setPeorPunt}
            />
            <Text style={styles.escala}>Escala: 1 peor · 7 mejor</Text>
          </Card>

          <Card>
            <Text style={S.label}>Tus objetivos</Text>
            <Text style={styles.ayudaObjetivos}>Cumple 2 de 3 para mantener la racha</Text>
            <ObjectivesChecklist
              objetivos={objetivos}
              cumplidos={objsCumplidos}
              onChange={setObjsCumplidos}
            />
            <Text style={[S.labelSmall, { marginTop: 10 }]}>Nota (opcional)</Text>
            <TextInput
              value={nota}
              onChangeText={setNota}
              placeholder="Ej: buen compañero, repetir con él"
              placeholderTextColor={T.tintaSuave}
              style={S.input}
            />
          </Card>

          <Pressable style={[S.btnPrim, guardando && { opacity: 0.55 }]} onPress={onGuardar}>
            <Text style={S.btnPrimText}>
              {guardando ? 'Guardando…' : editando ? 'Guardar cambios' : 'Guardar partido'}
            </Text>
          </Pressable>
          <Pressable style={styles.cancelar} onPress={salir}>
            <Text style={styles.cancelarTexto}>Cancelar</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  pantalla: { flex: 1, backgroundColor: T.fondo },
  scroll: { paddingHorizontal: 16, paddingBottom: 24 },
  bannerEdicion: {
    backgroundColor: T.pistaTinte,
    borderWidth: 1.5,
    borderColor: T.pista,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  bannerEdicionTexto: { fontSize: 13.5, fontFamily: FONT.textoBold, color: T.pista },
  bannerFoco: {
    backgroundColor: 'rgba(201,214,33,0.18)',
    borderWidth: 1.5,
    borderColor: T.bolaOscura,
    borderRadius: 12,
    paddingVertical: 11,
    paddingHorizontal: 14,
    marginBottom: 12,
  },
  bannerFocoTexto: { fontSize: 13.5, fontFamily: FONT.textoBold, color: T.tinta },
  fechaTexto: { fontSize: 16, color: T.tinta, fontFamily: FONT.texto },
  badgeResultado: {
    marginTop: 10,
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 16,
  },
  badgeTexto: {
    color: T.blanco,
    fontFamily: FONT.display,
    fontSize: 13.5,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  avisoManual: { fontSize: 12, color: T.tintaSuave, marginTop: 10, fontFamily: FONT.texto },
  escala: { fontSize: 11.5, color: T.tintaSuave, marginTop: 8, fontFamily: FONT.texto },
  ayudaObjetivos: {
    fontSize: 12.5,
    color: T.tintaSuave,
    marginTop: 4,
    marginBottom: 10,
    fontFamily: FONT.texto,
  },
  cancelar: { marginTop: 8, paddingVertical: 10, alignItems: 'center' },
  cancelarTexto: { fontSize: 14, color: T.tintaSuave, fontFamily: FONT.texto },
});
