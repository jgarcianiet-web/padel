import type { EventSubscription } from 'expo-modules-core';
import { requireOptionalNativeModule } from 'expo-modules-core';

// Puente con el receptor WatchConnectivity nativo (ios/WatchSyncReceiver.swift).
// Solo existe en builds de iOS con el módulo compilado; en Android, web, Expo Go
// o tests el módulo es null y la app se comporta como si no hubiera reloj.

/** Sesión recibida del reloj: `datos` es el JSON del contrato de Rising Padel Watch. */
export interface SesionRelojCruda {
  id: string;
  datos: string;
}

// addListener declarado a mano: el tipo `NativeModule` que exporta
// expo-modules-core es el lado estático de la clase y no lo expone.
interface ModuloWatchSync {
  soportado(): boolean;
  getPendientes(): SesionRelojCruda[];
  consumir(sessionId: string): void;
  addListener(
    eventName: 'onSesionReloj',
    listener: (sesion: SesionRelojCruda) => void
  ): EventSubscription;
}

const modulo = requireOptionalNativeModule<ModuloWatchSync>('WatchSync');

/** true si este build puede recibir sesiones de un Apple Watch emparejado. */
export const relojDisponible: boolean = modulo?.soportado() ?? false;

/** Sesiones recibidas del reloj y aún no importadas, en orden de llegada. */
export function getPendientes(): SesionRelojCruda[] {
  return modulo?.getPendientes() ?? [];
}

/** Saca la sesión de la cola nativa (ya importada o descartada). */
export function consumir(sessionId: string): void {
  modulo?.consumir(sessionId);
}

/** Avisa cuando entra una sesión con la app abierta. Devuelve null sin módulo. */
export function alRecibirSesion(
  listener: (sesion: SesionRelojCruda) => void
): EventSubscription | null {
  return modulo?.addListener('onSesionReloj', listener) ?? null;
}
