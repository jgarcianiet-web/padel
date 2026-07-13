import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

// Escribe el contenido en la caché y abre el share sheet nativo de iOS con el
// archivo real (permite Guardar en Archivos, AirDrop, correo, etc.).
export async function compartirArchivo(
  nombre: string,
  contenido: string,
  mimeType: string,
  UTI: string
): Promise<void> {
  const archivo = new File(Paths.cache, nombre);
  if (archivo.exists) archivo.delete();
  archivo.write(contenido);
  await Sharing.shareAsync(archivo.uri, { mimeType, UTI });
}

export const compartirCSV = (nombre: string, csv: string) =>
  compartirArchivo(nombre, csv, 'text/csv', 'public.comma-separated-values-text');

export const compartirJSON = (nombre: string, json: string) =>
  compartirArchivo(nombre, json, 'application/json', 'public.json');
