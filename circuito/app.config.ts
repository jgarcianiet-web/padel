import { ExpoConfig } from 'expo/config';

// App independiente de la de seguimiento personal: aquí vive la competición
// (ligas por divisiones, escalera individual, torneos de parejas y liga
// individual). El backend es Supabase; las claves se inyectan por entorno.
// Guía de puesta en marcha: docs/SUPABASE.md
const config: ExpoConfig = {
  name: 'Circuito Pádel',
  slug: 'circuito-padel',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/images/icon.png',
  scheme: 'circuitopadel',
  userInterfaceStyle: 'light',
  ios: {
    supportsTablet: false,
    bundleIdentifier: 'com.jesus.circuitopadel',
    infoPlist: {
      // Solo HTTPS estándar contra Supabase: exenta de declarar cifrado.
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: 'com.jesus.circuitopadel',
    adaptiveIcon: {
      backgroundColor: '#1E56A8',
      foregroundImage: './assets/images/android-icon-foreground.png',
      backgroundImage: './assets/images/android-icon-background.png',
      monochromeImage: './assets/images/android-icon-monochrome.png',
    },
  },
  // La misma base sirve para iOS, Android y navegador. En web se exporta
  // estático (una URL por pantalla, compartible por WhatsApp) y con los datos
  // de manifiesto para que se pueda instalar como aplicación desde el propio
  // navegador, también en móviles sin pasar por las tiendas.
  web: {
    bundler: 'metro',
    output: 'static',
    favicon: './assets/images/favicon.png',
    name: 'Circuito Pádel',
    shortName: 'Circuito',
    lang: 'es',
    description:
      'Ligas de pádel por divisiones, escalera individual, torneos de parejas y liga individual.',
    themeColor: '#1E56A8',
    backgroundColor: '#F5F3EC',
    display: 'standalone',
    startUrl: '/',
    orientation: 'portrait',
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
  ],
  experiments: {
    typedRoutes: true,
  },
  extra: {
    supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? null,
    supabaseAnonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? null,
  },
};

export default config;
