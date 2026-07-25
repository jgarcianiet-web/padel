import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { create } from 'zustand';

import { useDisposicion } from '../lib/responsive';
import { T } from '../theme/colors';
import { S } from '../theme/styles';
import { FONT } from '../theme/typography';

// `Alert.alert` de React Native es una función vacía en react-native-web: en el
// navegador no pasa nada al pulsar. Como la app se usa igual desde el móvil que
// desde el ordenador, las confirmaciones se pintan con un Modal propio, que sí
// existe en las dos plataformas.

export interface PeticionDialogo {
  titulo: string;
  mensaje?: string;
  textoAceptar?: string;
  destructivo?: boolean;
  /** Sin acción: solo informa y se cierra. */
  soloAviso?: boolean;
  onAceptar?: () => void;
}

interface EstadoDialogo {
  peticion: PeticionDialogo | null;
  pedir: (p: PeticionDialogo) => void;
  cerrar: () => void;
}

const useEstadoDialogo = create<EstadoDialogo>((set) => ({
  peticion: null,
  pedir: (peticion) => set({ peticion }),
  cerrar: () => set({ peticion: null }),
}));

/** Pregunta antes de hacer algo. Funciona en iOS, Android y navegador. */
export const confirmar = (p: PeticionDialogo) => useEstadoDialogo.getState().pedir(p);

/** Informa de algo que ya ha pasado. */
export const avisar = (titulo: string, mensaje?: string) =>
  useEstadoDialogo.getState().pedir({ titulo, mensaje, soloAviso: true });

/** Se monta una sola vez, en el layout raíz. */
export function Dialogo() {
  const { peticion, cerrar } = useEstadoDialogo();
  const { esTablet } = useDisposicion();
  if (!peticion) return null;

  const aceptar = () => {
    cerrar();
    peticion.onAceptar?.();
  };

  return (
    <Modal transparent animationType="fade" visible onRequestClose={cerrar}>
      <Pressable style={e.fondo} onPress={cerrar}>
        <Pressable
          style={[e.caja, { maxWidth: esTablet ? 420 : 340 }]}
          onPress={(evento) => evento.stopPropagation()}>
          <Text style={e.titulo}>{peticion.titulo}</Text>
          {peticion.mensaje ? (
            <Text style={[S.textoSuave, { marginTop: 8 }]}>{peticion.mensaje}</Text>
          ) : null}

          <View style={e.botones}>
            {!peticion.soloAviso ? (
              <Pressable onPress={cerrar} style={[e.boton, e.botonSec]}>
                <Text style={e.botonSecTexto}>Cancelar</Text>
              </Pressable>
            ) : null}
            <Pressable
              onPress={aceptar}
              style={[
                e.boton,
                { backgroundColor: peticion.destructivo ? T.rojo : T.pista },
              ]}>
              <Text style={e.botonTexto}>
                {peticion.textoAceptar ?? (peticion.soloAviso ? 'Entendido' : 'Aceptar')}
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const e = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: 'rgba(21,34,56,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  caja: {
    width: '100%',
    backgroundColor: T.blanco,
    borderRadius: 18,
    padding: 20,
  },
  titulo: {
    fontFamily: FONT.display,
    fontSize: 19,
    color: T.tinta,
  },
  botones: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 20,
  },
  boton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  botonSec: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: T.borde,
  },
  botonTexto: {
    color: T.blanco,
    fontFamily: FONT.display,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  botonSecTexto: {
    color: T.tintaSuave,
    fontFamily: FONT.display,
    fontSize: 14,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
