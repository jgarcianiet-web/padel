import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { crearClub, listarClubes } from '../api/consultas';
import { Aviso, Boton, Cabecera, Cargando, Campo, Card, Chip, Vacio } from '../components/base';
import { avisar } from '../components/Dialogo';
import { Pantalla } from '../components/Pantalla';
import { useCarga } from '../lib/useCarga';
import { useUid } from '../store/sesion';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';

/**
 * Directorio de clubes. La columna que manda aquí es `pistasIndividuales`:
 * la liga individual solo se puede jugar donde hay pista de individual, y son
 * las menos, así que el filtro es la funcionalidad principal de la pantalla.
 */
export function ClubesScreen() {
  const uid = useUid();
  const [soloIndividual, setSoloIndividual] = useState(false);
  const [alta, setAlta] = useState(false);
  const { datos, cargando, recargar } = useCarga(() => listarClubes(), []);

  const lista = (datos ?? []).filter(
    (c) => !soloIndividual || c.pistasIndividuales > 0
  );
  const conIndividual = (datos ?? []).filter((c) => c.pistasIndividuales > 0).length;

  return (
    <Pantalla refrescando={cargando} onRefrescar={recargar}>
      <Cabecera
        titulo="Clubes"
        subtitulo={`${datos?.length ?? 0} clubes · ${conIndividual} con pista individual`}
      />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 16 }}>
        <Chip
          texto="Todos"
          activo={!soloIndividual}
          onPress={() => setSoloIndividual(false)}
        />
        <Chip
          texto="Con pista individual"
          activo={soloIndividual}
          onPress={() => setSoloIndividual(true)}
        />
      </View>

      {cargando && !datos ? <Cargando /> : null}

      {lista.map((c) => (
        <Card key={c.id}>
          <View style={S.filaEntre}>
            <Text style={e.nombre} numberOfLines={1}>
              {c.nombre}
            </Text>
            {c.pistasIndividuales > 0 ? (
              <Chip texto={`${c.pistasIndividuales} individual`} tono="verde" />
            ) : null}
          </View>
          <Text style={S.textoSuave}>
            {[c.ciudad, c.direccion].filter(Boolean).join(' · ')}
          </Text>
          <Text style={[S.textoSuave, { marginTop: 6 }]}>
            {c.pistasDobles} pistas de dobles
            {c.indoor === true ? ' · indoor' : c.indoor === false ? ' · exterior' : ''}
            {c.telefono ? ` · ${c.telefono}` : ''}
          </Text>
          {c.notas ? (
            <Text style={[S.textoSuave, { marginTop: 6, fontStyle: 'italic' }]}>{c.notas}</Text>
          ) : null}
        </Card>
      ))}

      {datos && lista.length === 0 ? (
        <Vacio
          texto={
            soloIndividual
              ? 'Ningún club del directorio tiene pista individual todavía. Añade el tuyo si sabes de alguno.'
              : 'El directorio está vacío. Añade el primer club.'
          }
        />
      ) : null}

      {alta ? (
        <FormularioClub
          onCancelar={() => setAlta(false)}
          onCreado={() => {
            setAlta(false);
            recargar();
          }}
          uid={uid}
        />
      ) : (
        <Boton titulo="Añadir club" variante="secundario" onPress={() => setAlta(true)} />
      )}
    </Pantalla>
  );
}

function FormularioClub({
  uid,
  onCreado,
  onCancelar,
}: {
  uid: string | null;
  onCreado: () => void;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState('');
  const [ciudad, setCiudad] = useState('');
  const [direccion, setDireccion] = useState('');
  const [dobles, setDobles] = useState('');
  const [individuales, setIndividuales] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  const guardar = async () => {
    if (!uid) return;
    setGuardando(true);
    setError(null);
    try {
      await crearClub(
        {
          nombre: nombre.trim(),
          ciudad: ciudad.trim(),
          direccion: direccion.trim() || null,
          pistasDobles: Number(dobles) || 0,
          pistasIndividuales: Number(individuales) || 0,
        },
        uid
      );
      avisar('Club añadido', 'Ya aparece en el directorio.');
      onCreado();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se ha podido guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Card>
      <Text style={[S.subtitulo, { marginBottom: 12 }]}>Nuevo club</Text>
      <Campo label="Nombre" value={nombre} onChangeText={setNombre} />
      <Campo label="Ciudad" value={ciudad} onChangeText={setCiudad} />
      <Campo label="Dirección" value={direccion} onChangeText={setDireccion} />
      <Campo
        label="Pistas de dobles"
        value={dobles}
        onChangeText={setDobles}
        keyboardType="number-pad"
      />
      <Campo
        label="Pistas individuales"
        value={individuales}
        onChangeText={setIndividuales}
        keyboardType="number-pad"
        placeholder="0"
      />
      <Text style={S.textoSuave}>
        Si el club tiene pista de pádel individual, ponla aquí: es lo que
        habilita las ligas 1 vs 1 en ese club.
      </Text>
      {error ? <Aviso texto={error} /> : null}
      <Boton
        titulo="Guardar club"
        onPress={guardar}
        cargando={guardando}
        deshabilitado={!nombre.trim() || !ciudad.trim()}
      />
      <Boton titulo="Cancelar" variante="secundario" onPress={onCancelar} />
    </Card>
  );
}

const e = StyleSheet.create({
  nombre: {
    flex: 1,
    fontFamily: FONT.display,
    fontSize: 17,
    color: T.tinta,
    paddingRight: 8,
  },
});
