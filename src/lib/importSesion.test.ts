import { parseSesion } from './importSesion';

// Payload de ejemplo del api-contract.md de rising-padel-watch (recortado)
const PAYLOAD = {
  sessionId: '9f1b4c2e-6f7a-4a1e-9c3d-2b5e8a0d7c11',
  schemaVersion: 2,
  startedAt: '2026-07-25T12:04:12Z',
  endedAt: '2026-07-25T13:36:48Z',
  durationSeconds: 5556,
  shots: {
    total: 412,
    byType: {
      forehand: 151,
      backhand: 128,
      forehandVolley: 44,
      backhandVolley: 37,
      overhead: 39,
      serve: 11,
      unknown: 2,
    },
  },
  health: {
    heartRate: { meanBpm: 132, maxBpm: 171, restingBpm: 58 },
    activeEnergyKcal: 806.4,
    steps: 6114,
  },
  score: {
    rules: { deuceFormat: 'starPoint', setsToWin: 2 },
    sets: [
      { us: 6, them: 4 },
      { us: 3, them: 6 },
      { us: 7, them: 6 },
    ],
    winner: 'us',
    completed: true,
  },
  level: {
    overall: 4.6,
    byShotType: { forehand: 5.1, backhand: 3.9, forehandVolley: 4.4, backhandVolley: 3.8 },
    consistency: 0.78,
    gradedShots: 380,
    reliable: true,
  },
};

describe('parseSesion (contrato Rising Padel Watch)', () => {
  test('mapea el payload completo del contrato', () => {
    const s = parseSesion(JSON.stringify(PAYLOAD));
    expect(s.fecha).toBe('2026-07-25'); // 12:04Z no cruza medianoche en ningún TZ de test
    expect(s.tipo).toBe('competitivo');
    expect(s.resultado).toBe('victoria');
    expect(s.sets).toBe('6-4, 3-6, 7-6');
    expect(s.marcador).toHaveLength(3);
    expect(s.nivelBand).toBe('4.6');
    // voleas unificadas: (4.4+3.8)/2 = 4.1
    expect(s.golpesSesion).toEqual([
      { nombre: 'Derecha', nota: 5.1 },
      { nombre: 'Revés', nota: 3.9 },
      { nombre: 'Volea', nota: 4.1 },
    ]);
    // volumen: voleas 44+37=81; unknown descartado
    expect(s.golpesVolumen).toEqual([
      { nombre: 'Derecha', cantidad: 151 },
      { nombre: 'Revés', cantidad: 128 },
      { nombre: 'Volea', cantidad: 81 },
      { nombre: 'Bandeja', cantidad: 39 },
      { nombre: 'Saque', cantidad: 11 },
    ]);
    expect(s.totalGolpes).toBe(412);
    expect(s.salud).toEqual({
      duracionMin: 93,
      pulsoMedio: 132,
      pulsoMax: 171,
      calorias: 806,
    });
  });

  test('sesión de entreno (schemaVersion 1, sin score): amistoso y sin marcador', () => {
    const { score, ...resto } = PAYLOAD;
    const s = parseSesion(JSON.stringify({ ...resto, schemaVersion: 1 }));
    expect(s.tipo).toBe('amistoso');
    expect(s.resultado).toBeNull();
    expect(s.marcador).toBeNull();
    expect(s.sets).toBe('');
  });

  test('nivel no fiable: no rellena el nivel Band pero sí el resto', () => {
    const s = parseSesion(
      JSON.stringify({ ...PAYLOAD, level: { ...PAYLOAD.level, reliable: false } })
    );
    expect(s.nivelBand).toBe('');
    expect(s.golpesSesion.length).toBeGreaterThan(0);
  });

  test('partido sin winner: resultado calculado de los sets', () => {
    const s = parseSesion(
      JSON.stringify({
        ...PAYLOAD,
        score: { sets: [{ us: 6, them: 3 }, { us: 2, them: 6 }], completed: false },
      })
    );
    expect(s.resultado).toBe('empate');
  });

  test('rechaza formato futuro y payloads rotos con mensajes claros', () => {
    expect(() => parseSesion('esto no es json')).toThrow('JSON válido');
    expect(() => parseSesion(JSON.stringify({ ...PAYLOAD, schemaVersion: 9 }))).toThrow(
      'formato más nuevo'
    );
    expect(() => parseSesion(JSON.stringify({ shots: { total: 3 } }))).toThrow(
      'fecha de inicio'
    );
  });
});
