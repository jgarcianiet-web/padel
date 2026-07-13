import { StyleSheet } from 'react-native';

import { T } from './colors';
import { FONT } from './typography';

// Sistema de estilos "S" portado de la web-app: tarjetas blancas radio 16,
// labels uppercase en Chakra Petch, botones primario/secundario.
export const S = StyleSheet.create({
  card: {
    backgroundColor: T.blanco,
    borderWidth: 1,
    borderColor: T.borde,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  label: {
    fontSize: 11,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
  },
  labelSmall: {
    fontSize: 10.5,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
    color: T.tintaSuave,
    fontFamily: FONT.display,
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
  texto: {
    color: T.tinta,
    fontFamily: FONT.texto,
  },
  textoSuave: {
    color: T.tintaSuave,
    fontFamily: FONT.texto,
  },
});
