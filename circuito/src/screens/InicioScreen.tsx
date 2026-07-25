import { router } from 'expo-router';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { misCompeticiones, partidosDe, perfilesPorId } from '../api/consultas';
import { Boton, Cabecera, Cargando, Card, Vacio } from '../components/base';
import { TarjetaCompeticion } from '../components/TarjetaCompeticion';
import { TarjetaPartido } from '../components/TarjetaPartido';
import { useCarga } from '../lib/useCarga';
import { useSesion, useUid } from '../store/sesion';
import { S } from '../theme/styles';

export function InicioScreen() {
  const uid = useUid();
  const perfil = useSesion((s) => s.perfil);

  const { datos, cargando, recargar } = useCarga(async () => {
    if (!uid) return null;
    const [competiciones, partidos] = await Promise.all([
      misCompeticiones(uid),
      partidosDe(uid),
    ]);
    const otros = partidos.flatMap((p) => [...p.equipoA, ...p.equipoB]);
    return { competiciones, partidos, perfiles: await perfilesPorId(otros) };
  }, [uid]);

  const nombreDe = (id: string) => datos?.perfiles[id]?.nombre ?? 'Jugador';

  const porJugar = (datos?.partidos ?? []).filter((p) => p.estado === 'programado');
  const porConfirmar = (datos?.partidos ?? []).filter(
    (p) => p.estado === 'pendiente' && p.reportadoPor !== uid
  );

  return (
    <SafeAreaView style={S.pantalla} edges={['top']}>
      <ScrollView
        contentContainerStyle={S.contenido}
        refreshControl={<RefreshControl refreshing={cargando} onRefresh={recargar} />}>
        <Cabecera
          titulo={`Hola, ${perfil?.apodo || perfil?.nombre?.split(' ')[0] || 'jugador'}`}
          subtitulo="Tus competiciones y tus próximos partidos"
        />

        {cargando && !datos ? <Cargando /> : null}

        {porConfirmar.length > 0 ? (
          <>
            <Text style={[S.label, { marginBottom: 8 }]}>Te toca confirmar</Text>
            {porConfirmar.map((p) => (
              <TarjetaPartido
                key={p.id}
                partido={p}
                nombreDe={nombreDe}
                uid={uid}
                onPress={() => router.push(`/partido?id=${p.id}`)}
              />
            ))}
          </>
        ) : null}

        {porJugar.length > 0 ? (
          <>
            <Text style={[S.label, { marginTop: 8, marginBottom: 8 }]}>Próximos partidos</Text>
            {porJugar.slice(0, 5).map((p) => (
              <TarjetaPartido
                key={p.id}
                partido={p}
                nombreDe={nombreDe}
                uid={uid}
                onPress={() => router.push(`/partido?id=${p.id}`)}
              />
            ))}
          </>
        ) : null}

        <Text style={[S.label, { marginTop: 16, marginBottom: 8 }]}>Mis competiciones</Text>
        {(datos?.competiciones ?? []).map((c) => (
          <TarjetaCompeticion
            key={c.id}
            competicion={c}
            onPress={() => router.push(`/competicion?id=${c.id}`)}
          />
        ))}

        {datos && datos.competiciones.length === 0 ? (
          <Card>
            <Vacio texto="Todavía no juegas ninguna competición. Apúntate a una abierta o monta la tuya." />
            <View>
              <Boton titulo="Ver competiciones" onPress={() => router.push('/explorar')} />
              <Boton
                titulo="Crear una"
                variante="secundario"
                onPress={() => router.push('/crear')}
              />
            </View>
          </Card>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
