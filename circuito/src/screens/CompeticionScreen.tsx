import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Alert, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  abrirPartidoDeReto,
  borrarseDe,
  cambiarEstado,
  cargarCompeticion,
  crearPareja,
  crearReto,
  DatosCompeticion,
  generarJornadaDivision,
  generarLigaIndividual,
  generarTorneoParejas,
  inscribirse,
  responderReto,
  sembrarEscalera,
} from '../api/consultas';
import { Aviso, Boton, Cargando, Card, Chip, Vacio } from '../components/base';
import { Cuadro } from '../components/Cuadro';
import { Escalones, EscalonVista } from '../components/Escalones';
import { TablaClasificacion } from '../components/TablaClasificacion';
import { TarjetaPartido } from '../components/TarjetaPartido';
import { tituloTipo } from '../constants/reglas';
import { calcularClasificacion } from '../lib/clasificacion';
import { puedeRetar } from '../lib/escalera';
import { fechaCorta } from '../lib/fecha';
import { useCarga } from '../lib/useCarga';
import { useUid } from '../store/sesion';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';
import {
  Partido,
  ReglasEscalera,
  ReglasLigaDivisiones,
  ReglasTorneoParejas,
} from '../types/domain';

type Pestana = 'principal' | 'partidos' | 'jugadores' | 'reglamento';

export function CompeticionScreen({ id }: { id: string }) {
  const uid = useUid();
  const [pestana, setPestana] = useState<Pestana>('principal');
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { datos, cargando, recargar } = useCarga(() => cargarCompeticion(id), [id]);

  const nombreDe = (jid: string) => datos?.perfiles[jid]?.apodo || datos?.perfiles[jid]?.nombre || 'Jugador';

  const nombrePareja = (parejaId: string | null) => {
    if (!parejaId) return null;
    const p = datos?.parejas.find((x) => x.id === parejaId);
    if (!p) return null;
    return p.nombre || `${nombreDe(p.jugadorA)} / ${nombreDe(p.jugadorB)}`;
  };

  const conAviso = async (accion: () => Promise<void>) => {
    setTrabajando(true);
    setError(null);
    try {
      await accion();
      recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido completar');
    } finally {
      setTrabajando(false);
    }
  };

  if (cargando && !datos) return <Cargando texto="Cargando la competición…" />;
  if (!datos)
    return (
      <SafeAreaView style={S.pantalla}>
        <View style={S.contenido}>
          <Aviso texto={error ?? 'No se ha podido cargar la competición.'} />
        </View>
      </SafeAreaView>
    );

  const { competicion, inscripciones, parejas, partidos, puestos, retos } = datos;
  const reglas = competicion.reglas;
  const soyOrganizador = competicion.organizadorId === uid;
  const miInscripcion = inscripciones.find((i) => i.jugadorId === uid);
  const jugadores = inscripciones.map((i) => i.jugadorId);
  const esTorneo = competicion.tipo === 'torneo_parejas';

  return (
    <SafeAreaView style={S.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={S.contenido}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={e.volver}>‹ Volver</Text>
        </Pressable>

        <Text style={S.titulo}>{competicion.nombre}</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8, flexWrap: 'wrap' }}>
          <Chip texto={tituloTipo(competicion.tipo)} tono="pista" />
          {competicion.temporada ? <Chip texto={competicion.temporada} /> : null}
          <Chip
            texto={
              competicion.estado === 'inscripcion'
                ? 'Inscripción abierta'
                : competicion.estado === 'en_curso'
                  ? 'En juego'
                  : competicion.estado === 'finalizada'
                    ? 'Finalizada'
                    : 'Borrador'
            }
            tono={competicion.estado === 'inscripcion' ? 'verde' : 'neutro'}
          />
        </View>
        {competicion.descripcion ? (
          <Text style={[S.textoSuave, { marginTop: 10 }]}>{competicion.descripcion}</Text>
        ) : null}
        <Text style={[S.textoSuave, { marginTop: 6 }]}>
          Organiza {nombreDe(competicion.organizadorId)} · {inscripciones.length} inscritos
        </Text>

        {error ? <View style={{ marginTop: 12 }}><Aviso texto={error} /></View> : null}

        {competicion.estado === 'inscripcion' && uid ? (
          miInscripcion ? (
            <Boton
              titulo="Darme de baja"
              variante="secundario"
              cargando={trabajando}
              onPress={() => conAviso(() => borrarseDe(competicion.id, uid))}
            />
          ) : (
            <Boton
              titulo="Apuntarme"
              cargando={trabajando}
              onPress={() => conAviso(() => inscribirse(competicion.id, uid))}
            />
          )
        ) : null}

        {soyOrganizador ? (
          <PanelOrganizador
            datos={datos}
            trabajando={trabajando}
            onAccion={conAviso}
            nombreDe={nombreDe}
          />
        ) : null}

        <View style={e.pestanas}>
          {(
            [
              ['principal', esTorneo ? 'Cuadro' : competicion.tipo === 'escalera' ? 'Escalera' : 'Clasificación'],
              ['partidos', 'Partidos'],
              ['jugadores', esTorneo ? 'Parejas' : 'Jugadores'],
              ['reglamento', 'Reglamento'],
            ] as [Pestana, string][]
          ).map(([clave, texto]) => (
            <Pressable key={clave} onPress={() => setPestana(clave)} style={e.pestana}>
              <Text style={[e.pestanaTexto, pestana === clave && e.pestanaActiva]}>{texto}</Text>
              {pestana === clave ? <View style={e.subrayado} /> : null}
            </Pressable>
          ))}
        </View>

        {pestana === 'principal' ? (
          competicion.tipo === 'escalera' ? (
            <VistaEscalera
              datos={datos}
              uid={uid}
              trabajando={trabajando}
              onAccion={conAviso}
              nombreDe={nombreDe}
            />
          ) : esTorneo ? (
            <VistaTorneo datos={datos} nombrePareja={nombrePareja} />
          ) : (
            <Card>
              <TablaClasificacion
                filas={calcularClasificacion(partidos, {
                  puntosVictoria: reglas.puntosVictoria,
                  puntosDerrota: reglas.puntosDerrota,
                  participantes: jugadores,
                })}
                nombreDe={nombreDe}
                destacado={uid}
                sube={'sube' in reglas ? reglas.sube : 0}
                baja={'baja' in reglas ? reglas.baja : 0}
              />
            </Card>
          )
        ) : null}

        {pestana === 'partidos' ? (
          partidos.length === 0 ? (
            <Vacio texto="Todavía no hay partidos. El organizador genera el calendario al cerrar las inscripciones." />
          ) : (
            partidos.map((p) => (
              <TarjetaPartido
                key={p.id}
                partido={p}
                nombreDe={nombreDe}
                uid={uid}
                etiquetaEquipo={(partido, lado) =>
                  nombrePareja(lado === 'a' ? p.parejaA : p.parejaB) ?? null
                }
                onPress={() => router.push(`/partido?id=${p.id}`)}
              />
            ))
          )
        ) : null}

        {pestana === 'jugadores' ? (
          <VistaJugadores
            datos={datos}
            soyOrganizador={soyOrganizador}
            trabajando={trabajando}
            onAccion={conAviso}
            nombreDe={nombreDe}
          />
        ) : null}

        {pestana === 'reglamento' ? (
          <Reglamento competicion={competicion} clubNombre={null} />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Escalera ──────────────────────────────────────────────────────────────

function VistaEscalera({
  datos,
  uid,
  trabajando,
  onAccion,
  nombreDe,
}: {
  datos: DatosCompeticion;
  uid: string | null;
  trabajando: boolean;
  onAccion: (a: () => Promise<void>) => Promise<void>;
  nombreDe: (id: string) => string;
}) {
  const reglas = datos.competicion.reglas as ReglasEscalera;
  const escalones = datos.puestos.map((p) => ({ jugadorId: p.jugadorId, posicion: p.posicion }));

  const vista: EscalonVista[] = escalones.map((p) => ({
    ...p,
    nombre: nombreDe(p.jugadorId),
    retable: uid
      ? puedeRetar(escalones, uid, p.jugadorId, reglas, datos.retos).ok
      : false,
  }));

  const misRetos = datos.retos.filter(
    (r) => (r.retadorId === uid || r.retadoId === uid) && ['propuesto', 'aceptado'].includes(r.estado)
  );

  return (
    <View>
      {misRetos.map((r) => {
        const soyRetado = r.retadoId === uid;
        return (
          <Card key={r.id}>
            <Text style={S.subtitulo}>
              {soyRetado
                ? `${nombreDe(r.retadorId)} te ha retado`
                : `Has retado a ${nombreDe(r.retadoId)}`}
            </Text>
            <Text style={[S.textoSuave, { marginTop: 4 }]}>
              {r.estado === 'propuesto' ? 'Pendiente de aceptar' : 'Aceptado'}
              {r.fechaLimite ? ` · hasta el ${fechaCorta(r.fechaLimite)}` : ''}
            </Text>
            {soyRetado && r.estado === 'propuesto' ? (
              <>
                <Boton
                  titulo="Aceptar el reto"
                  cargando={trabajando}
                  onPress={() => onAccion(() => responderReto(r.id, 'aceptado'))}
                />
                <Boton
                  titulo="Rechazar"
                  variante="secundario"
                  cargando={trabajando}
                  onPress={() => onAccion(() => responderReto(r.id, 'rechazado'))}
                />
              </>
            ) : null}
            {r.estado === 'aceptado' ? (
              <Boton
                titulo={r.partidoId ? 'Ir al partido' : 'Abrir el partido'}
                cargando={trabajando}
                onPress={() =>
                  onAccion(async () => {
                    const partido = await abrirPartidoDeReto(r.id);
                    router.push(`/partido?id=${partido.id}`);
                  })
                }
              />
            ) : null}
          </Card>
        );
      })}

      <Card>
        <Text style={[S.textoSuave, { marginBottom: 12 }]}>
          Puedes retar hasta {reglas.rangoReto} puestos por encima. Si ganas, te
          quedas su escalón.
        </Text>
        <Escalones
          escalones={vista}
          uid={uid}
          onRetar={(jugadorId) =>
            Alert.alert(
              'Lanzar reto',
              `¿Retar a ${nombreDe(jugadorId)}?`,
              [
                { text: 'Cancelar', style: 'cancel' },
                {
                  text: 'Retar',
                  onPress: () =>
                    onAccion(async () => {
                      await crearReto(datos.competicion.id, jugadorId);
                    }),
                },
              ]
            )
          }
        />
      </Card>
    </View>
  );
}

// ─── Torneo de parejas ─────────────────────────────────────────────────────

function VistaTorneo({
  datos,
  nombrePareja,
}: {
  datos: DatosCompeticion;
  nombrePareja: (id: string | null) => string | null;
}) {
  const reglas = datos.competicion.reglas as ReglasTorneoParejas;
  const grupos = datos.partidos.filter((p) => (p.ronda ?? '').startsWith('Grupo'));
  const cuadro = datos.partidos.filter((p) => !(p.ronda ?? '').startsWith('Grupo'));

  // En el torneo la clasificación es por pareja, así que se recalcula sobre
  // los ids de pareja en lugar de los de jugador.
  const porGrupo = useMemo(() => {
    const mapa = new Map<string, typeof grupos>();
    for (const p of grupos) mapa.set(p.ronda ?? '', [...(mapa.get(p.ronda ?? '') ?? []), p]);
    return [...mapa.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [grupos]);

  return (
    <View>
      {porGrupo.map(([nombre, lista]) => {
        const comoParejas: Partido[] = lista.map((p) => ({
          ...p,
          equipoA: p.parejaA ? [p.parejaA] : [],
          equipoB: p.parejaB ? [p.parejaB] : [],
        }));
        const participantes = [
          ...new Set(comoParejas.flatMap((p) => [...p.equipoA, ...p.equipoB])),
        ];
        return (
          <Card key={nombre}>
            <Text style={[S.subtitulo, { marginBottom: 8 }]}>{nombre}</Text>
            <TablaClasificacion
              filas={calcularClasificacion(comoParejas, {
                puntosVictoria: reglas.puntosVictoria,
                puntosDerrota: reglas.puntosDerrota,
                participantes,
              })}
              nombreDe={(pid) => nombrePareja(pid) ?? 'Pareja'}
              sube={reglas.clasificanPorGrupo}
            />
          </Card>
        );
      })}

      {cuadro.length > 0 ? (
        <Card>
          <Text style={[S.subtitulo, { marginBottom: 10 }]}>Cuadro</Text>
          <Cuadro
            partidos={cuadro}
            etiqueta={(p, lado) =>
              nombrePareja(lado === 'a' ? p.parejaA : p.parejaB) ?? 'Por determinar'
            }
            onPress={(p) => router.push(`/partido?id=${p.id}`)}
          />
        </Card>
      ) : null}

      {porGrupo.length === 0 && cuadro.length === 0 ? (
        <Vacio texto="El cuadro se genera cuando el organizador cierra las inscripciones." />
      ) : null}
    </View>
  );
}

// ─── Jugadores y parejas ───────────────────────────────────────────────────

function VistaJugadores({
  datos,
  soyOrganizador,
  trabajando,
  onAccion,
  nombreDe,
}: {
  datos: DatosCompeticion;
  soyOrganizador: boolean;
  trabajando: boolean;
  onAccion: (a: () => Promise<void>) => Promise<void>;
  nombreDe: (id: string) => string;
}) {
  const [seleccion, setSeleccion] = useState<string[]>([]);
  const esTorneo = datos.competicion.tipo === 'torneo_parejas';
  const emparejados = new Set(datos.parejas.flatMap((p) => [p.jugadorA, p.jugadorB]));

  const alternar = (jid: string) =>
    setSeleccion((s) =>
      s.includes(jid) ? s.filter((x) => x !== jid) : s.length < 2 ? [...s, jid] : [s[1], jid]
    );

  return (
    <View>
      {esTorneo && datos.parejas.length > 0 ? (
        <Card>
          <Text style={[S.subtitulo, { marginBottom: 10 }]}>Parejas</Text>
          {datos.parejas.map((p) => (
            <Text key={p.id} style={[S.texto, { paddingVertical: 4 }]}>
              {p.nombre || `${nombreDe(p.jugadorA)} / ${nombreDe(p.jugadorB)}`}
            </Text>
          ))}
        </Card>
      ) : null}

      <Card>
        <Text style={[S.subtitulo, { marginBottom: 10 }]}>
          Inscritos ({datos.inscripciones.length})
        </Text>
        {datos.inscripciones.map((i) => {
          const elegido = seleccion.includes(i.jugadorId);
          const yaTienePareja = emparejados.has(i.jugadorId);
          const perfil = datos.perfiles[i.jugadorId];
          return (
            <Pressable
              key={i.id}
              disabled={!esTorneo || !soyOrganizador || yaTienePareja}
              onPress={() => alternar(i.jugadorId)}
              style={[e.jugador, elegido && { backgroundColor: T.pistaTinte }]}>
              <Text style={S.texto}>{nombreDe(i.jugadorId)}</Text>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                {perfil?.nivel ? <Chip texto={`Nivel ${perfil.nivel}`} /> : null}
                {yaTienePareja ? <Chip texto="Con pareja" tono="verde" /> : null}
              </View>
            </Pressable>
          );
        })}

        {datos.inscripciones.length === 0 ? (
          <Text style={S.textoSuave}>Todavía no se ha apuntado nadie.</Text>
        ) : null}

        {esTorneo && soyOrganizador ? (
          <Boton
            titulo={
              seleccion.length === 2
                ? `Emparejar a ${nombreDe(seleccion[0])} y ${nombreDe(seleccion[1])}`
                : 'Elige dos jugadores para formar pareja'
            }
            deshabilitado={seleccion.length !== 2}
            cargando={trabajando}
            onPress={() =>
              onAccion(async () => {
                await crearPareja(datos.competicion.id, seleccion[0], seleccion[1]);
                setSeleccion([]);
              })
            }
          />
        ) : null}
      </Card>
    </View>
  );
}

// ─── Panel del organizador ─────────────────────────────────────────────────

function PanelOrganizador({
  datos,
  trabajando,
  onAccion,
  nombreDe,
}: {
  datos: DatosCompeticion;
  trabajando: boolean;
  onAccion: (a: () => Promise<void>) => Promise<void>;
  nombreDe: (id: string) => string;
}) {
  const { competicion, inscripciones, parejas, partidos, jornadas } = datos;
  const reglas = competicion.reglas;
  const jugadores = inscripciones.map((i) => i.jugadorId);

  const ordenActual = () => {
    const tabla = calcularClasificacion(partidos, {
      puntosVictoria: reglas.puntosVictoria,
      puntosDerrota: reglas.puntosDerrota,
      participantes: jugadores,
    });
    return tabla.map((f) => f.participanteId);
  };

  const arrancar = () =>
    onAccion(async () => {
      switch (competicion.tipo) {
        case 'liga_divisiones': {
          const r = await generarJornadaDivision(
            competicion.id,
            null,
            1,
            jugadores,
            reglas as ReglasLigaDivisiones
          );
          if (r.descansan.length)
            Alert.alert(
              'Jornada creada',
              `Descansan esta jornada: ${r.descansan.map(nombreDe).join(', ')}`
            );
          break;
        }
        case 'liga_individual':
          await generarLigaIndividual(competicion.id, null, jugadores);
          break;
        case 'escalera':
          await sembrarEscalera(competicion.id, jugadores);
          break;
        case 'torneo_parejas':
          await generarTorneoParejas(competicion.id, parejas, reglas as ReglasTorneoParejas);
          break;
      }
      await cambiarEstado(competicion.id, 'en_curso');
    });

  const siguienteJornada = () =>
    onAccion(async () => {
      const numero = jornadas.length + 1;
      const r = await generarJornadaDivision(
        competicion.id,
        null,
        numero,
        ordenActual(),
        reglas as ReglasLigaDivisiones
      );
      if (r.descansan.length)
        Alert.alert(
          `Jornada ${numero} creada`,
          `Descansan: ${r.descansan.map(nombreDe).join(', ')}`
        );
    });

  const faltanParejas =
    competicion.tipo === 'torneo_parejas' && parejas.length < 2;

  return (
    <Card style={{ borderColor: T.pista, borderWidth: 1.5 }}>
      <Text style={[S.label, { marginBottom: 8 }]}>Organizas tú</Text>

      {competicion.estado === 'inscripcion' ? (
        <>
          <Text style={S.textoSuave}>
            {competicion.tipo === 'torneo_parejas'
              ? 'Forma las parejas en la pestaña Parejas y luego genera el cuadro.'
              : competicion.tipo === 'escalera'
                ? 'Al cerrar inscripciones se siembra la escalera con el orden de inscripción.'
                : 'Al cerrar inscripciones se genera el calendario.'}
          </Text>
          <Boton
            titulo="Cerrar inscripciones y generar"
            cargando={trabajando}
            deshabilitado={jugadores.length < 2 || faltanParejas}
            onPress={arrancar}
          />
        </>
      ) : null}

      {competicion.estado === 'en_curso' && competicion.tipo === 'liga_divisiones' ? (
        <Boton
          titulo={`Generar jornada ${jornadas.length + 1}`}
          cargando={trabajando}
          onPress={siguienteJornada}
        />
      ) : null}

      {competicion.estado === 'en_curso' ? (
        <Boton
          titulo="Finalizar competición"
          variante="secundario"
          cargando={trabajando}
          onPress={() => onAccion(() => cambiarEstado(competicion.id, 'finalizada'))}
        />
      ) : null}
    </Card>
  );
}

// ─── Reglamento ────────────────────────────────────────────────────────────

function Reglamento({
  competicion,
  clubNombre,
}: {
  competicion: DatosCompeticion['competicion'];
  clubNombre: string | null;
}) {
  const r = competicion.reglas;
  const lineas: string[] = [
    `Formato: ${tituloTipo(competicion.tipo)}.`,
    r.setsParaGanar === 1 ? 'Partidos a un set.' : 'Partidos al mejor de tres sets.',
    r.puntoOro ? 'Se juega con punto de oro.' : 'Se juega con ventajas.',
    `Victoria: ${r.puntosVictoria} puntos. Derrota: ${r.puntosDerrota}.`,
    'Todos los partidos tienen que tener un ganador: no hay empates.',
    'El resultado lo sube cualquiera de los dos equipos y lo confirma el rival; hasta entonces no cuenta para la clasificación.',
  ];

  if (r.tipo === 'liga_divisiones')
    lineas.push(
      `Cada jornada se juega en mesas de ${r.jugadoresPorMesa} jugadores rotando de compañero, así juegas con y contra todos los de tu mesa.`,
      `Las mesas se forman por orden de clasificación, de modo que siempre juegas contra gente de tu nivel.`,
      `Temporada de ${r.jornadas} jornadas. Ascienden ${r.sube} y descienden ${r.baja} por división.`
    );

  if (r.tipo === 'escalera')
    lineas.push(
      `Puedes retar hasta ${r.rangoReto} puestos por encima del tuyo.`,
      `Un reto aceptado se juega en ${r.diasParaJugar} días; pasado el plazo se resuelve a favor del retador.`,
      'Si gana el retador ocupa el puesto del retado y los de en medio bajan un escalón.',
      `Solo puedes tener ${r.retosSimultaneos} reto abierto a la vez.`
    );

  if (r.tipo === 'torneo_parejas')
    lineas.push(
      r.faseGrupos
        ? `Fase de grupos de ${r.equiposPorGrupo} parejas; pasan ${r.clasificanPorGrupo} de cada grupo al cuadro.`
        : 'Cuadro eliminatorio directo con siembra: los cabezas de serie no se cruzan hasta el final.'
    );

  if (r.tipo === 'liga_individual')
    lineas.push(
      'Partidos 1 vs 1, todos contra todos.',
      'Solo se juega en clubes con pista individual; los tienes marcados en el directorio de clubes.'
    );

  if (clubNombre) lineas.push(`Sede: ${clubNombre}.`);

  return (
    <Card>
      {lineas.map((l, i) => (
        <View key={i} style={{ flexDirection: 'row', marginBottom: 8 }}>
          <Text style={[S.texto, { color: T.pista, marginRight: 8 }]}>·</Text>
          <Text style={[S.texto, { flex: 1 }]}>{l}</Text>
        </View>
      ))}
    </Card>
  );
}

const e = StyleSheet.create({
  volver: {
    fontFamily: FONT.displaySemi,
    fontSize: 14,
    color: T.pista,
  },
  pestanas: {
    flexDirection: 'row',
    gap: 18,
    marginTop: 20,
    marginBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.borde,
  },
  pestana: {
    paddingBottom: 8,
  },
  pestanaTexto: {
    fontFamily: FONT.displaySemi,
    fontSize: 12,
    letterSpacing: 1,
    textTransform: 'uppercase',
    color: T.tintaSuave,
  },
  pestanaActiva: {
    color: T.pista,
  },
  subrayado: {
    height: 2,
    backgroundColor: T.pista,
    position: 'absolute',
    bottom: -1,
    left: 0,
    right: 0,
  },
  jugador: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.borde,
    borderRadius: 8,
  },
});
