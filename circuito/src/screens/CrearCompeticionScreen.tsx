import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { crearCompeticion, listarClubes } from '../api/consultas';
import { Aviso, Boton, Cabecera, Campo, Card, Chip } from '../components/base';
import { reglasPorDefecto, TIPOS } from '../constants/reglas';
import { hoyISO, temporadaDe } from '../lib/fecha';
import { useCarga } from '../lib/useCarga';
import { useUid } from '../store/sesion';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import { Reglas, TipoCompeticion } from '../types/domain';

export function CrearCompeticionScreen() {
  const uid = useUid();
  const [tipo, setTipo] = useState<TipoCompeticion>('liga_divisiones');
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [clubId, setClubId] = useState<string | null>(null);
  const [reglas, setReglas] = useState<Reglas>(reglasPorDefecto('liga_divisiones'));
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const { datos: clubes } = useCarga(() => listarClubes(), []);
  // La liga individual solo puede celebrarse donde hay pista de individual.
  const clubesElegibles = (clubes ?? []).filter(
    (c) => tipo !== 'liga_individual' || c.pistasIndividuales > 0
  );

  const cambiarTipo = (nuevo: TipoCompeticion) => {
    setTipo(nuevo);
    setReglas(reglasPorDefecto(nuevo));
    setClubId(null);
  };

  const num = (valor: string, porDefecto: number) => {
    const n = Number(valor.replace(/\D/g, ''));
    return Number.isFinite(n) && n > 0 ? n : porDefecto;
  };

  const crear = async () => {
    if (!uid) return;
    setGuardando(true);
    setError(null);
    try {
      const comp = await crearCompeticion({
        tipo,
        nombre: nombre.trim(),
        descripcion: descripcion.trim() || null,
        ciudad: ciudad.trim() || null,
        clubId,
        temporada: temporadaDe(),
        fechaInicio: hoyISO(),
        reglas,
        organizadorId: uid,
      });
      router.replace(`/competicion?id=${comp.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido crear');
      setGuardando(false);
    }
  };

  return (
    <SafeAreaView style={S.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={S.contenido}>
        <Cabecera
          titulo="Nueva competición"
          subtitulo="Tú organizas: la app pone el calendario y la clasificación"
        />

        <Text style={[S.label, { marginBottom: 8 }]}>Formato</Text>
        {TIPOS.map((t) => (
          <Pressable
            key={t.tipo}
            onPress={() => cambiarTipo(t.tipo)}
            style={[e.opcion, tipo === t.tipo && e.opcionActiva]}>
            <Text style={[e.opcionTitulo, tipo === t.tipo && { color: T.pista }]}>
              {t.titulo}
            </Text>
            <Text style={S.textoSuave}>{t.resumen}</Text>
          </Pressable>
        ))}

        <Card>
          <Campo
            label="Nombre"
            value={nombre}
            onChangeText={setNombre}
            placeholder="Liga de los martes"
          />
          <Campo label="Ciudad" value={ciudad} onChangeText={setCiudad} />
          <Campo
            label="Descripción"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            placeholder="Horarios, precio de pista, grupo de WhatsApp…"
          />

          {clubesElegibles.length > 0 ? (
            <>
              <Text style={S.label}>
                {tipo === 'liga_individual' ? 'Club con pista individual' : 'Club (opcional)'}
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
                {clubesElegibles.map((c) => (
                  <Chip
                    key={c.id}
                    texto={c.nombre}
                    activo={clubId === c.id}
                    onPress={() => setClubId(clubId === c.id ? null : c.id)}
                  />
                ))}
              </View>
            </>
          ) : tipo === 'liga_individual' ? (
            <Aviso
              tono="ambar"
              texto="No hay ningún club con pista individual en el directorio. Añade uno desde la pestaña Clubes antes de montar una liga 1 vs 1."
            />
          ) : null}
        </Card>

        <Card>
          <Text style={[S.subtitulo, { marginBottom: 12 }]}>Reglamento</Text>

          <Text style={S.label}>Formato de partido</Text>
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 14 }}>
            <Chip
              texto="A un set"
              activo={reglas.setsParaGanar === 1}
              onPress={() => setReglas({ ...reglas, setsParaGanar: 1 })}
            />
            <Chip
              texto="Al mejor de 3"
              activo={reglas.setsParaGanar === 2}
              onPress={() => setReglas({ ...reglas, setsParaGanar: 2 })}
            />
            <Chip
              texto="Punto de oro"
              activo={reglas.puntoOro}
              onPress={() => setReglas({ ...reglas, puntoOro: !reglas.puntoOro })}
            />
          </View>

          <Campo
            label="Puntos por victoria"
            value={String(reglas.puntosVictoria)}
            onChangeText={(v) => setReglas({ ...reglas, puntosVictoria: num(v, 3) })}
            keyboardType="number-pad"
          />

          {reglas.tipo === 'liga_divisiones' ? (
            <>
              <Text style={S.label}>Jugadores por mesa</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 14 }}>
                <Chip
                  texto="4 (3 partidos)"
                  activo={reglas.jugadoresPorMesa === 4}
                  onPress={() => setReglas({ ...reglas, jugadoresPorMesa: 4 })}
                />
                <Chip
                  texto="5 (5 partidos)"
                  activo={reglas.jugadoresPorMesa === 5}
                  onPress={() => setReglas({ ...reglas, jugadoresPorMesa: 5 })}
                />
              </View>
              <Campo
                label="Jornadas de la temporada"
                value={String(reglas.jornadas)}
                onChangeText={(v) => setReglas({ ...reglas, jornadas: num(v, 8) })}
                keyboardType="number-pad"
              />
              <Campo
                label="Ascienden por división"
                value={String(reglas.sube)}
                onChangeText={(v) => setReglas({ ...reglas, sube: num(v, 2) })}
                keyboardType="number-pad"
              />
              <Campo
                label="Descienden por división"
                value={String(reglas.baja)}
                onChangeText={(v) => setReglas({ ...reglas, baja: num(v, 2) })}
                keyboardType="number-pad"
              />
            </>
          ) : null}

          {reglas.tipo === 'escalera' ? (
            <>
              <Campo
                label="Puestos que puedes retar hacia arriba"
                value={String(reglas.rangoReto)}
                onChangeText={(v) => setReglas({ ...reglas, rangoReto: num(v, 3) })}
                keyboardType="number-pad"
              />
              <Campo
                label="Días para jugar un reto"
                value={String(reglas.diasParaJugar)}
                onChangeText={(v) => setReglas({ ...reglas, diasParaJugar: num(v, 14) })}
                keyboardType="number-pad"
              />
            </>
          ) : null}

          {reglas.tipo === 'torneo_parejas' ? (
            <>
              <Text style={S.label}>Estructura</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, marginBottom: 14 }}>
                <Chip
                  texto="Grupos + cuadro"
                  activo={reglas.faseGrupos}
                  onPress={() => setReglas({ ...reglas, faseGrupos: true })}
                />
                <Chip
                  texto="Solo cuadro"
                  activo={!reglas.faseGrupos}
                  onPress={() => setReglas({ ...reglas, faseGrupos: false })}
                />
              </View>
              {reglas.faseGrupos ? (
                <Campo
                  label="Parejas por grupo"
                  value={String(reglas.equiposPorGrupo)}
                  onChangeText={(v) => setReglas({ ...reglas, equiposPorGrupo: num(v, 4) })}
                  keyboardType="number-pad"
                />
              ) : null}
            </>
          ) : null}

          {reglas.tipo === 'liga_individual' ? (
            <Text style={S.textoSuave}>
              Todos contra todos a una vuelta. El calendario se genera cuando
              cierres las inscripciones.
            </Text>
          ) : null}
        </Card>

        {error ? <Aviso texto={error} /> : null}

        <Boton
          titulo="Crear y abrir inscripciones"
          onPress={crear}
          cargando={guardando}
          deshabilitado={!nombre.trim()}
        />
      </ScrollView>
    </SafeAreaView>
  );
}

const e = StyleSheet.create({
  opcion: {
    backgroundColor: T.blanco,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  opcionActiva: {
    borderColor: T.pista,
    backgroundColor: T.pistaTinte,
  },
  opcionTitulo: {
    fontFamily: FONT.display,
    fontSize: 16,
    color: T.tinta,
    marginBottom: 4,
  },
});
