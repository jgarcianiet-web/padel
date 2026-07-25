import { useState } from 'react';
import { Text, View } from 'react-native';

import { Aviso, Avatar, Boton, Cabecera, Campo, Card, Chip } from '../components/base';
import { Pantalla } from '../components/Pantalla';
import { useSesion } from '../store/sesion';
import { S } from '../theme/styles';
import { PosicionPista } from '../types/domain';

const POSICIONES: { valor: PosicionPista; texto: string }[] = [
  { valor: 'reves', texto: 'Revés' },
  { valor: 'derecha', texto: 'Derecha' },
  { valor: 'ambas', texto: 'Indiferente' },
];

export function PerfilScreen() {
  const { perfil, sesion, actualizarPerfil, salir } = useSesion();
  const [nombre, setNombre] = useState(perfil?.nombre ?? '');
  const [apodo, setApodo] = useState(perfil?.apodo ?? '');
  const [ciudad, setCiudad] = useState(perfil?.ciudad ?? '');
  const [nivel, setNivel] = useState(perfil?.nivel ? String(perfil.nivel) : '');
  const [telefono, setTelefono] = useState(perfil?.telefono ?? '');
  const [posicion, setPosicion] = useState<PosicionPista | null>(perfil?.posicion ?? null);
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  const guardar = async () => {
    setGuardando(true);
    setAviso(null);
    try {
      const n = Number(nivel.replace(',', '.'));
      await actualizarPerfil({
        nombre: nombre.trim() || 'Jugador',
        apodo: apodo.trim() || null,
        ciudad: ciudad.trim() || null,
        nivel: Number.isFinite(n) && n >= 1 && n <= 7 ? n : null,
        telefono: telefono.trim() || null,
        posicion,
      });
      setAviso('Perfil guardado.');
    } catch (e) {
      setAviso(e instanceof Error ? e.message : 'No se ha podido guardar');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <Pantalla>
      <Cabecera
        titulo="Tu perfil"
        subtitulo={sesion?.user.email ?? ''}
        derecha={<Avatar nombre={perfil?.nombre ?? 'Jugador'} tamano={46} />}
      />

      <Card>
        <Campo label="Nombre" value={nombre} onChangeText={setNombre} />
        <Campo label="Apodo" value={apodo} onChangeText={setApodo} placeholder="Cómo te llaman en la pista" />
        <Campo label="Ciudad" value={ciudad} onChangeText={setCiudad} />
        <Campo
          label="Nivel (1.0 – 7.0)"
          value={nivel}
          onChangeText={setNivel}
          keyboardType="decimal-pad"
          placeholder="3.5"
        />
        <Campo
          label="Teléfono"
          value={telefono}
          onChangeText={setTelefono}
          keyboardType="phone-pad"
          placeholder="Para cuadrar partidos con tus rivales"
        />

        <Text style={S.label}>Lado de la pista</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>
          {POSICIONES.map((p) => (
            <Chip
              key={p.valor}
              texto={p.texto}
              activo={posicion === p.valor}
              onPress={() => setPosicion(posicion === p.valor ? null : p.valor)}
            />
          ))}
        </View>

        {aviso ? (
          <View style={{ marginTop: 12 }}>
            <Aviso texto={aviso} tono={aviso.includes('guardado') ? 'ambar' : 'rojo'} />
          </View>
        ) : null}

        <Boton titulo="Guardar" onPress={guardar} cargando={guardando} />
      </Card>

      <Boton titulo="Cerrar sesión" variante="secundario" onPress={salir} />
    </Pantalla>
  );
}
