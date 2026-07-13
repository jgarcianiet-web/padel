# Fase 3 — Build con EAS y subida a TestFlight

Guía paso a paso para compilar **Liga Personal Pádel** en la nube (sin Mac) y
instalarla en tu iPhone vía TestFlight. Los pasos 1-3 se hacen una sola vez.

## Qué necesitas

- Cuenta de **Apple Developer** de pago (ya la tienes).
- Cuenta de **Expo** (gratuita): créala en https://expo.dev si no la tienes.
- Node 20+ en tu ordenador y este repo clonado (`npm install` hecho).
- Tu iPhone con la app **TestFlight** instalada (App Store).

## 1. Instalar EAS CLI e iniciar sesión

```bash
npm install -g eas-cli
eas login
```

## 2. Vincular el proyecto con EAS (una sola vez)

```bash
eas init
```

- Acepta crear el proyecto. Al terminar te mostrará un **projectId** (un UUID).
- Ábrelo `app.config.ts` y pega ese ID en la línea:

  ```ts
  const EAS_PROJECT_ID = process.env.EAS_PROJECT_ID ?? 'PEGA-AQUÍ-TU-PROJECT-ID';
  ```

- Haz commit del cambio. Con esto quedan activos el vínculo con EAS y la URL
  de **EAS Update** (actualizaciones de JS por el aire, ver §7).

> `eas init` no puede escribir el ID automáticamente porque el config es
> dinámico (`app.config.ts`); por eso se pega a mano.

## 3. (Recomendado) Build de desarrollo para probar HealthKit primero

HealthKit no funciona en Expo Go. Antes de ir a TestFlight puedes probarlo
con una build de desarrollo instalada directamente en tu iPhone:

```bash
eas device:create        # abre un enlace/QR en el iPhone y registra el dispositivo
eas build --profile development --platform ios
```

- La primera build te pedirá **iniciar sesión con tu Apple ID**: EAS crea por
  ti el certificado, el bundle ID `com.jesus.ligapadel` y el perfil de
  aprovisionamiento, y **sincroniza la capability de HealthKit** en el App ID.
- Al acabar (~15 min) te da un enlace: ábrelo en el iPhone e instala.
- Arranca el servidor de desarrollo en tu ordenador con
  `npx expo start --dev-client` y abre la app.

## 4. Build de producción

```bash
eas build --platform ios --profile production
```

- Usa las mismas credenciales del paso anterior (o las crea si te saltaste el
  paso 3).
- El número de build se auto-incrementa en EAS (`autoIncrement` +
  `appVersionSource: remote` en `eas.json`): no toques nada entre builds.
- Espera a que la build termine en https://expo.dev (pestaña Builds).

## 5. Subir a TestFlight

```bash
eas submit --platform ios --latest
```

- La primera vez pregunta cómo autenticarse con App Store Connect. Lo más
  simple: **Apple ID + contraseña específica de app**:
  - Genera la contraseña en https://account.apple.com → *Inicio de sesión y
    seguridad* → *Contraseñas específicas de apps*.
- Si la app aún no existe en App Store Connect, EAS te ofrece **crearla**
  (nombre: Liga Personal Pádel, bundle ID `com.jesus.ligapadel`).
  Acepta.
- La subida tarda unos minutos y luego Apple la procesa (10-30 min más).

## 6. Instalarla desde TestFlight

1. Entra en https://appstoreconnect.apple.com → tu app → pestaña **TestFlight**.
2. Cuando la build deje de estar "Processing", en **Pruebas internas** crea un
   grupo (p. ej. "Yo") y añade tu propio usuario como probador.
   - No hay pregunta de cifrado: la app ya declara
     `ITSAppUsesNonExemptEncryption = false` (solo usa HTTPS estándar).
3. Te llegará un email/notificación: ábrela en el iPhone con la app
   **TestFlight** e instala.
4. Primer arranque:
   - iOS pedirá acceso a **Salud** (concede lectura de entrenamientos, pulso
     y energía), y a cámara/fotos la primera vez que subas una captura.
   - En **Ajustes** de la app: pega tu clave de API de Anthropic y restaura tu
     copia de seguridad de la web-app (pegar texto o elegir el archivo .json).

## 7. Actualizaciones sin pasar por TestFlight (EAS Update)

Para cambios **solo de JavaScript** (pantallas, lógica, prompts…):

```bash
eas update --channel production --message "descripción del cambio"
```

La app instalada descarga la actualización al reabrirse (dos arranques:
uno descarga, otro aplica). Sí necesitas **build nueva + TestFlight** cuando:

- se añade/actualiza una dependencia con código nativo,
- cambian `app.config.ts` (plugins, permisos, iconos) o `eas.json`,
- cambia `version` en el config (la `runtimeVersion` sigue a la versión).

## Problemas comunes

| Síntoma | Solución |
|---|---|
| `eas build` falla con error de credenciales | `eas credentials -p ios` y revisa/regenera; comprueba que tu membresía de Apple Developer está activa |
| La build no aparece en TestFlight | Espera al email "processing completed"; revisa en App Store Connect → TestFlight si pide cumplimiento |
| HealthKit no encuentra entrenamientos | iPhone → Ajustes → Salud → Acceso a datos y dispositivos → Liga Personal Pádel: activa Entrenamientos, Frecuencia cardiaca y Energía activa. Recuerda que el workout debe ser del mismo día que el partido |
| El análisis del entrenador da error 401 | La clave de API en Ajustes es errónea o está revocada |
| `eas update` no llega al móvil | La build debe ser del mismo canal (`production`) y de la misma `runtimeVersion` (misma `version` de app) |
