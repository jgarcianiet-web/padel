import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';

import { listarCompeticiones } from '../api/consultas';
import { Boton, Cabecera, Cargando, Card, Chip, Vacio } from '../components/base';
import { Pantalla } from '../components/Pantalla';
import { TarjetaCompeticion } from '../components/TarjetaCompeticion';
import { TIPOS } from '../constants/reglas';
import { useCarga } from '../lib/useCarga';
import { S } from '../theme/styles';
import { TipoCompeticion } from '../types/domain';

export function ExplorarScreen() {
  const [filtro, setFiltro] = useState<TipoCompeticion | null>(null);
  const { datos, cargando, recargar } = useCarga(
    () => listarCompeticiones({ abiertas: true }),
    []
  );

  const lista = (datos ?? []).filter((c) => !filtro || c.tipo === filtro);

  return (
    <Pantalla refrescando={cargando} onRefrescar={recargar}>
      <Cabecera
        titulo="Competiciones"
        subtitulo="Apúntate a una liga abierta o monta la tuya"
      />

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        <Chip texto="Todas" activo={filtro === null} onPress={() => setFiltro(null)} />
        {TIPOS.map((t) => (
          <Chip
            key={t.tipo}
            texto={t.titulo}
            activo={filtro === t.tipo}
            onPress={() => setFiltro(filtro === t.tipo ? null : t.tipo)}
          />
        ))}
      </View>

      {cargando && !datos ? <Cargando /> : null}

      {lista.map((c) => (
        <TarjetaCompeticion
          key={c.id}
          competicion={c}
          onPress={() => router.push(`/competicion?id=${c.id}`)}
        />
      ))}

      {datos && lista.length === 0 ? (
        <Vacio texto="No hay competiciones abiertas con ese filtro." />
      ) : null}

      <Card>
        <Text style={S.subtitulo}>¿Organizas tú?</Text>
        <Text style={[S.textoSuave, { marginTop: 4 }]}>
          Crea la competición, comparte el enlace con tu grupo y la app se
          encarga del calendario, los resultados y la clasificación.
        </Text>
        <Boton
          titulo="Crear competición"
          onPress={() => router.push('/crear')}
        />
      </Card>
    </Pantalla>
  );
}
