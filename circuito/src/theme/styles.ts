import { StyleSheet } from 'react-native';

import { T } from './colors';
import { FONT } from './typography';

// Sistema de estilos compartido: tarjetas blancas radio 16, labels en
// versalitas de Chakra Petch y botones primario/secundario.
export const S = StyleSheet.create({
  pantalla: {
    flex: 1,
    backgroundColor: T.fondo,
  },
  contenido: {
    padding: 16,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  titulo: {
    fontSize: 22,
    color: T.tinta,
    fontFamily: FONT.display,
  },
  subtitulo: {
    fontSize: 16,
    color: T.tinta,
    fontFamily: FONT.displaySemi,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
  },
  texto: {
    color: T.tinta,
    fontSize: 15,
    fontFamily: FONT.texto,
  },
  textoSuave: {
    color: T.tintaSuave,
    fontSize: 14,
    fontFamily: FONT.texto,
  },
  input: {
    backgroundColor: T.fondo,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 10,
    color: T.tinta,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 16,
    fontFamily: FONT.texto,
    marginTop: 6,
  },
  btnPrim: {
    width: '100%',
    backgroundColor: T.pista,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimText: {
    color: T.blanco,
    fontSize: 16,
    fontFamily: FONT.display,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  btnSec: {
    width: '100%',
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: T.pista,
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
  },
  btnSecText: {
    color: T.pista,
    fontSize: 15,
    fontFamily: FONT.display,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  fila: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filaEntre: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
