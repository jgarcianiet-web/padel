import { router } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { cliente } from '../api/cliente';
import { aPartido } from '../api/mapeo';
import {
  confirmarResultado,
  perfilesPorId,
  reportarResultado,
} from '../api/consultas';
import { Aviso, Boton, Cargando, Card, Chip } from '../components/base';
import { EditorMarcador } from '../components/EditorMarcador';
import { fechaCorta } from '../lib/fecha';
import { formatearSets, resumirSets } from '../lib/marcador';
import { useCarga } from '../lib/useCarga';
import { useUid } from '../store/sesion';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { SetMarcador } from '../types/domain';

export function PartidoScreen({ id }: { id: string }) {
  const uid = useUid();
  const [trabajando, setTrabajando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { datos, cargando, recargar } = useCarga(async () => {
    const partido = await cliente().from('partidos').select('*').eq('id', id).single();
    if (partido.error) throw new Error(partido.error.message);
    const p = aPartido(partido.data);
    const comp = await cliente()
      .from('competiciones')
      .select('nombre, reglas, tipo')
      .eq('id', p.competicionId)
      .single();
    const perfiles = await perfilesPorId([...p.equipoA, ...p.equipoB]);
    return { partido: p, competicion: comp.data, perfiles };
  }, [id]);

  if (cargando && !datos) return <Cargando />;
  if (!datos) return <Aviso texto={error ?? 'No se ha encontrado el partido.'} />;

  const { partido, competicion, perfiles } = datos;
  const nombreDe = (jid: string) => perfiles[jid]?.apodo || perfiles[jid]?.nombre || 'Jugador';
  const etiqueta = (lado: 'a' | 'b') => {
    const ids = lado === 'a' ? partido.equipoA : partido.equipoB;
    return ids.length ? ids.map(nombreDe).join(' / ') : 'Por determinar';
  };

  const setsParaGanar = (competicion?.reglas?.setsParaGanar ?? 1) as 1 | 2;
  const juego = uid ? [...partido.equipoA, ...partido.equipoB].includes(uid) : false;
  const miLado = uid
    ? partido.equipoA.includes(uid)
      ? 'a'
      : partido.equipoB.includes(uid)
        ? 'b'
        : null
    : null;
  const ladoQueReporto = partido.reportadoPor
    ? partido.equipoA.includes(partido.reportadoPor)
      ? 'a'
      : 'b'
    : null;
  const puedoConfirmar =
    partido.estado === 'pendiente' && miLado !== null && miLado !== ladoQueReporto;

  const accion = async (fn: () => Promise<void>) => {
    setTrabajando(true);
    setError(null);
    try {
      await fn();
      recargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar');
    } finally {
      setTrabajando(false);
    }
  };

  const resumen = resumirSets(partido.sets);

  return (
    <SafeAreaView style={S.pantalla} edges={['top']}>
      <ScrollView contentContainerStyle={S.contenido}>
        <Pressable onPress={() => router.back()} style={{ marginBottom: 10 }}>
          <Text style={{ color: T.pista }}>‹ Volver</Text>
        </Pressable>

        <Text style={S.titulo}>{competicion?.nombre ?? 'Partido'}</Text>
        <Text style={[S.textoSuave, { marginBottom: 12 }]}>
          {[partido.ronda, fechaCorta(partido.fecha)].filter(Boolean).join(' · ')}
        </Text>

        <Card>
          <View style={S.filaEntre}>
            <Text style={[S.subtitulo, { flex: 1 }]}>{etiqueta('a')}</Text>
            <Text style={[S.textoSuave, { paddingHorizontal: 10 }]}>vs</Text>
            <Text style={[S.subtitulo, { flex: 1, textAlign: 'right' }]}>{etiqueta('b')}</Text>
          </View>

          {partido.sets ? (
            <View style={{ marginTop: 12, alignItems: 'center' }}>
              <Text style={[S.titulo, { fontSize: 26 }]}>{formatearSets(partido.sets)}</Text>
              <Text style={S.textoSuave}>
                Gana {resumen.ganador === 'a' ? etiqueta('a') : etiqueta('b')}
              </Text>
            </View>
          ) : null}

          <View style={{ marginTop: 12, alignItems: 'flex-start' }}>
            <Chip
              texto={
                partido.estado === 'confirmado'
                  ? 'Resultado confirmado'
                  : partido.estado === 'pendiente'
                    ? 'Esperando confirmación del rival'
                    : 'Por jugar'
              }
              tono={
                partido.estado === 'confirmado'
                  ? 'verde'
                  : partido.estado === 'pendiente'
                    ? 'ambar'
                    : 'neutro'
              }
            />
          </View>
        </Card>

        {error ? <Aviso texto={error} /> : null}

        {puedoConfirmar ? (
          <Card>
            <Text style={S.texto}>
              {nombreDe(partido.reportadoPor as string)} ha subido este resultado.
              Confírmalo para que cuente en la clasificación.
            </Text>
            <Boton
              titulo="Confirmar resultado"
              cargando={trabajando}
              onPress={() => accion(() => confirmarResultado(partido.id))}
            />
          </Card>
        ) : null}

        {juego && partido.estado === 'programado' ? (
          <Card>
            <Text style={[S.label, { marginBottom: 12 }]}>Subir resultado</Text>
            <EditorMarcador
              etiquetaA={etiqueta('a')}
              etiquetaB={etiqueta('b')}
              setsParaGanar={setsParaGanar}
              guardando={trabajando}
              onGuardar={(sets: SetMarcador[], ganador) =>
                accion(() => reportarResultado(partido.id, sets, ganador))
              }
            />
          </Card>
        ) : null}

        {partido.estado === 'pendiente' && miLado === ladoQueReporto ? (
          <Aviso
            tono="ambar"
            texto="Ya has subido el resultado. Falta que lo confirme el equipo rival."
          />
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
