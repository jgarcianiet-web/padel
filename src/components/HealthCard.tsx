import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { fmtFecha } from '../lib/date';
import {
  MSG_SIN_HEALTH,
  WorkoutDia,
  healthDisponible,
  saludDeWorkout,
  workoutsDelDia,
} from '../lib/health';
import { T } from '../theme/colors';
import { FONT } from '../theme/typography';
import { S } from '../theme/styles';
import { SaludPartido } from '../types/domain';

interface Props {
  fecha: string; // fecha del partido seleccionada en el formulario
  salud: SaludPartido | null;
  onVincular: (salud: SaludPartido) => void;
  onDesvincular: () => void;
}

export const fmtSalud = (s: SaludPartido): string =>
  [
    `⌚ ${s.duracionMin} min`,
    s.pulsoMedio != null ? `♥ ${s.pulsoMedio}${s.pulsoMax != null ? `/${s.pulsoMax}` : ''} ppm` : null,
    s.calorias != null ? `${s.calorias} kcal` : null,
  ]
    .filter(Boolean)
    .join(' · ');

// Busca los entrenamientos de pádel/raqueta del Apple Watch del día del
// partido y permite vincular uno al registro.
export default function HealthCard({ fecha, salud, onVincular, onDesvincular }: Props) {
  const [buscando, setBuscando] = useState(false);
  const [vinculando, setVinculando] = useState(false);
  const [candidatos, setCandidatos] = useState<WorkoutDia[] | null>(null);
  const [error, setError] = useState('');

  const disponible = healthDisponible();

  const buscar = async () => {
    if (buscando) return;
    setBuscando(true);
    setError('');
    setCandidatos(null);
    try {
      setCandidatos(await workoutsDelDia(fecha));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo consultar Apple Health.');
    }
    setBuscando(false);
  };

  const vincular = async (w: WorkoutDia) => {
    if (vinculando) return;
    setVinculando(true);
    setError('');
    try {
      onVincular(await saludDeWorkout(w));
      setCandidatos(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo leer el workout.');
    }
    setVinculando(false);
  };

  if (!disponible) {
    return <Text style={styles.noDisponible}>{MSG_SIN_HEALTH}</Text>;
  }

  if (salud) {
    return (
      <View style={styles.vinculado}>
        <Text style={[S.labelSmall, { color: T.pista, marginBottom: 6 }]}>
          ✓ Entrenamiento vinculado
        </Text>
        <Text style={styles.resumen}>{fmtSalud(salud)}</Text>
        <Pressable onPress={onDesvincular}>
          <Text style={styles.quitar}>Quitar vínculo</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View>
      <Pressable
        onPress={buscar}
        disabled={buscando}
        style={[S.btnSec, { marginTop: 10 }, buscando && { opacity: 0.55 }]}>
        {buscando ? (
          <View style={styles.buscando}>
            <ActivityIndicator size="small" color={T.pista} />
            <Text style={[S.btnSecText, { fontSize: 13 }]}>Buscando en Apple Health…</Text>
          </View>
        ) : (
          <Text style={[S.btnSecText, { fontSize: 13 }]}>
            ⌚ Buscar entrenamiento del {fmtFecha(fecha)}
          </Text>
        )}
      </Pressable>
      <Text style={styles.ayuda}>
        Busca el workout de pádel del Apple Watch de ese día y guarda duración, pulso medio/máximo
        y calorías con el partido.
      </Text>

      {candidatos != null && candidatos.length === 0 && (
        <Text style={styles.sinResultados}>
          No hay entrenamientos de pádel/raqueta ese día en Apple Health.
        </Text>
      )}
      {candidatos?.map((w) => (
        <Pressable
          key={w.id}
          onPress={() => vincular(w)}
          disabled={vinculando}
          style={[styles.candidato, vinculando && { opacity: 0.55 }]}>
          <Text style={styles.candidatoTitulo}>
            {w.actividad} ·{' '}
            {new Date(w.inicio).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </Text>
          <Text style={styles.candidatoDetalle}>
            {w.duracionMin} min{w.calorias != null ? ` · ${w.calorias} kcal` : ''} · toca para
            vincular
          </Text>
        </Pressable>
      ))}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  noDisponible: {
    fontSize: 12.5,
    color: T.tintaSuave,
    marginTop: 8,
    lineHeight: 18,
    fontFamily: FONT.texto,
  },
  vinculado: {
    marginTop: 10,
    backgroundColor: T.pistaTinte,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  resumen: { fontSize: 13.5, color: T.tinta, fontFamily: FONT.textoBold },
  quitar: { fontSize: 12, color: T.tintaSuave, marginTop: 6, fontFamily: FONT.texto },
  buscando: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  ayuda: { fontSize: 11.5, color: T.tintaSuave, marginTop: 6, fontFamily: FONT.texto, lineHeight: 16 },
  sinResultados: { fontSize: 13, color: T.tintaSuave, marginTop: 8, fontFamily: FONT.texto },
  candidato: {
    marginTop: 8,
    borderWidth: 1.5,
    borderColor: T.borde,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: T.blanco,
  },
  candidatoTitulo: { fontSize: 14, fontFamily: FONT.textoBold, color: T.tinta },
  candidatoDetalle: { fontSize: 12.5, color: T.tintaSuave, marginTop: 2, fontFamily: FONT.texto },
  error: { fontSize: 13, color: T.rojo, marginTop: 8, fontFamily: FONT.texto },
});
