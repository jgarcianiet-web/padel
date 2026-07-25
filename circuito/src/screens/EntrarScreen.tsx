import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';

import { cliente, hayBackend } from '../api/cliente';
import { Aviso, Boton, Campo, Card } from '../components/base';
import { Pantalla } from '../components/Pantalla';
import { S } from '../theme/styles';

/**
 * Entrada por código de un solo uso al correo: no hace falta contraseña ni
 * enlaces profundos, que en móvil son la parte más frágil del registro.
 */
export function EntrarScreen() {
  const [correo, setCorreo] = useState('');
  const [codigo, setCodigo] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!hayBackend) return <SinConfigurar />;

  const pedirCodigo = async () => {
    setCargando(true);
    setError(null);
    const { error } = await cliente().auth.signInWithOtp({
      email: correo.trim().toLowerCase(),
      options: { shouldCreateUser: true },
    });
    setCargando(false);
    if (error) setError(error.message);
    else setEnviado(true);
  };

  const entrar = async () => {
    setCargando(true);
    setError(null);
    const { error } = await cliente().auth.verifyOtp({
      email: correo.trim().toLowerCase(),
      token: codigo.trim(),
      type: 'email',
    });
    setCargando(false);
    if (error) setError(error.message);
    // Si va bien, onAuthStateChange se encarga de mover la app.
  };

  return (
    <Pantalla centrada>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Text style={[S.titulo, { fontSize: 30 }]}>Circuito Pádel</Text>
        <Text style={[S.textoSuave, { marginBottom: 20 }]}>
          Ligas por divisiones, escalera individual, torneos de parejas y liga
          individual. El pádel que no acaba en la pista.
        </Text>

        <Card>
          {!enviado ? (
            <>
              <Campo
                label="Tu correo"
                value={correo}
                onChangeText={setCorreo}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                placeholder="tu@correo.com"
              />
              {error ? <Aviso texto={error} /> : null}
              <Boton
                titulo="Enviarme el código"
                onPress={pedirCodigo}
                cargando={cargando}
                deshabilitado={!correo.includes('@')}
              />
            </>
          ) : (
            <>
              <Text style={[S.textoSuave, { marginBottom: 12 }]}>
                Te hemos enviado un código de 6 dígitos a {correo}.
              </Text>
              <Campo
                label="Código"
                value={codigo}
                onChangeText={setCodigo}
                keyboardType="number-pad"
                maxLength={6}
                placeholder="123456"
              />
              {error ? <Aviso texto={error} /> : null}
              <Boton
                titulo="Entrar"
                onPress={entrar}
                cargando={cargando}
                deshabilitado={codigo.trim().length < 6}
              />
              <Boton
                titulo="Cambiar de correo"
                variante="secundario"
                onPress={() => {
                  setEnviado(false);
                  setCodigo('');
                  setError(null);
                }}
              />
            </>
          )}
        </Card>
      </KeyboardAvoidingView>
    </Pantalla>
  );
}

function SinConfigurar() {
  return (
    <Pantalla>
      <Text style={S.titulo}>Falta conectar Supabase</Text>
      <Card>
        <Text style={S.texto}>
          La app necesita un proyecto de Supabase para guardar jugadores,
          competiciones y resultados. Crea el proyecto, ejecuta las migraciones
          de <Text style={{ fontWeight: '700' }}>supabase/migrations</Text> y copia
          las claves en un fichero <Text style={{ fontWeight: '700' }}>.env.local</Text>:
        </Text>
        <Text style={[S.textoSuave, { marginTop: 12 }]}>
          EXPO_PUBLIC_SUPABASE_URL=…{'\n'}EXPO_PUBLIC_SUPABASE_ANON_KEY=…
        </Text>
        <View style={{ height: 8 }} />
        <Text style={S.textoSuave}>
          El paso a paso completo está en docs/SUPABASE.md.
        </Text>
      </Card>
    </Pantalla>
  );
}
