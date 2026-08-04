/** @type {import('@bacons/apple-targets/app.plugin').Config} */
// App de Apple Watch embebida: detecta los golpeos en la muñeca y entrega la
// sesión a esta app por WatchConnectivity (módulo local `watch-sync`). El
// código viene de rising-padel-watch (ios/RisingPadelWatch + PadelCore); los
// tests del algoritmo siguen viviendo en aquel repo.
module.exports = {
  type: 'watch',
  name: 'RisingPadelWatch',
  displayName: 'Rising Padel',
  // Prefijado con punto: se cuelga del bundle id de la app (requisito de
  // watchOS para el emparejado app-reloj).
  bundleIdentifier: '.watchkitapp',
  deploymentTarget: '10.0',
  // El plugin genera Assets.xcassets/AppIcon.appiconset (formato watchOS) a
  // partir de este PNG y activa ASSETCATALOG_COMPILER_APPICON_NAME.
  icon: './icon.png',
  entitlements: {
    'com.apple.developer.healthkit': true,
    'com.apple.developer.healthkit.access': [],
  },
};
