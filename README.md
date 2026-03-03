# NadarPro

## Cómo convertir en APK

Este proyecto está configurado para ser convertido en una aplicación Android utilizando Capacitor.

### Requisitos previos

1.  Tener instalado Node.js y npm.
2.  Tener instalado Android Studio.

### Pasos para generar el APK

1.  Instalar las dependencias:
    ```bash
    npm install
    ```

2.  Construir la aplicación web:
    ```bash
    npm run build
    ```

3.  Sincronizar con Capacitor:
    ```bash
    npx cap sync
    ```

4.  Abrir el proyecto en Android Studio:
    ```bash
    npx cap open android
    ```

5.  En Android Studio, esperar a que Gradle sincronice el proyecto y luego ir a `Build > Build Bundle(s) / APK(s) > Build APK(s)`.

### Comandos útiles

-   `npm run mobile:init`: Inicializa Capacitor.
-   `npm run mobile:add`: Añade la plataforma Android.
-   `npm run mobile:open`: Abre Android Studio.
-   `npm run mobile:sync`: Sincroniza los cambios de la web con la app nativa.
-   `npm run build:mobile`: Construye la web y sincroniza con Capacitor.

### Configuración PWA

El archivo `public/manifest.json` contiene la configuración para que la aplicación sea instalable como PWA.
El archivo `vite.config.ts` tiene `base: './'` para asegurar que los assets carguen correctamente en el dispositivo móvil.
