# Norte para Android

App Android (Capacitor) con la misma lógica de Norte: subes el gráfico 4H y el 15m y devuelve un plan.
Todo corre en el teléfono; la lectura se hace llamando directamente a la API de xAI con **tu propia clave**
(se pide dentro de la app, en Ajustes, y se guarda solo en el dispositivo).

## Opción A: APK con GitHub (sin instalar nada)
1. Crea un repositorio en GitHub y sube el contenido de esta carpeta.
2. Pestaña **Actions** → **Build APK** → **Run workflow**.
3. Cuando termine (unos 5–8 min), descarga el artefacto **Norte-APK** → dentro está `app-debug.apk`.
4. Pásalo al móvil, ábrelo y permite "instalar apps desconocidas" cuando lo pida.

## Opción B: en tu ordenador (Node 20+ y Android Studio / JDK 21)
```bash
npm install
npm run build
npx cap add android
npx cap sync android
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk
```
O abre el proyecto con `npx cap open android` y pulsa ▶ con el móvil conectado.

## Notas
- El APK es de *debug*: se instala directamente. Para publicar en Play Store hay que firmar una versión *release*.
- Esta versión no usa la base de datos ni el login del proyecto original (no se usaban con `VITE_AUTH_ENABLED=false`).
