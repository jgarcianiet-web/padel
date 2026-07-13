import { ExpoConfig } from 'expo/config';

// EAS: tras ejecutar `eas init` en tu máquina, pega el projectId que te dé
// en la cadena de abajo (o exporta EAS_PROJECT_ID). Con él quedan operativos
// extra.eas.projectId y la URL de EAS Update. Guía completa: docs/TESTFLIGHT.md
const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? '';

const config: ExpoConfig = {
  name: 'Liga Personal Pádel',
  slug: 'liga-personal-padel',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'ligapadel',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.jgarcianiet.ligapadel',
    infoPlist: {
      NSCameraUsageDescription:
        'La app usa la cámara para fotografiar la pantalla de resultados de Padel Band y rellenar tus golpes automáticamente.',
      NSPhotoLibraryUsageDescription:
        'La app accede a tus fotos para leer capturas de pantalla de Padel Band y rellenar tus golpes automáticamente.',
      // Solo HTTPS estándar: exenta de declarar cifrado. Evita la pregunta
      // de "Export Compliance" en cada build de TestFlight.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.jgarcianiet.ligapadel',
    adaptiveIcon: {
      backgroundColor: '#1E56A8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
  },
  plugins: [
    'expo-router',
    [
      'expo-splash-screen',
      {
        image: './assets/images/splash-icon.png',
        resizeMode: 'contain',
        backgroundColor: '#F5F3EC',
      },
    ],
    'expo-secure-store',
    [
      'react-native-health',
      {
        healthSharePermission:
          'La app lee tus entrenamientos de pádel del Apple Watch (duración, pulso y calorías) para vincularlos a cada partido.',
      },
    ],
  ],
  experiments: {
    typedRoutes: true,
  },
  runtimeVersion: {
    policy: 'appVersion',
  },
  updates: EAS_PROJECT_ID
    ? { url: `https://u.expo.dev/${EAS_PROJECT_ID}` }
    : undefined,
  extra: EAS_PROJECT_ID ? { eas: { projectId: EAS_PROJECT_ID } } : undefined,
};

export default config;
