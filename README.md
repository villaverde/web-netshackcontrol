# Web Oficial — NetShack Control (Astro + Docker)

Sitio web y documentación interactiva bilingüe (Español / Inglés) para **NetShack Control**, construido con **Astro 5** y preparado para producción con **Docker** y **Nginx**.

## Estructura del Proyecto

```text
web-netshackcontrol/
├── public/
│   ├── favicon.svg
│   └── imagenes/
│       ├── raspberry-server.jpg
│       ├── controllers-rig.jpg
│       └── screenshots/
│           ├── Screenshot_1.jpg   # 15m (21.224 MHz) - RX/TX, DSP y Twin PBT
│           ├── Screenshot_2.png   # 40m (7.099 MHz)  - Manipulador CW y Memorias de Voz
│           └── Screenshot_3.png   # 20m (14.074 MHz) - Memorias, Escaneo y Macros P1-P12
├── src/
│   ├── components/
│   │   ├── HeroWaterfall.astro
│   │   ├── ScreenshotShowcase.astro
│   │   ├── ArchitectureSection.astro
│   │   ├── RadioCatalog.astro
│   │   └── CliAndDownloads.astro
│   ├── i18n/
│   │   └── translations.ts
│   ├── layouts/
│   │   └── Layout.astro
│   └── pages/
│       ├── index.astro            # Landing principal
│       └── manual.astro           # Manual de usuario completo ES/EN
├── Dockerfile
├── docker-compose.yml
└── nginx.conf
```

## Ejecución con Docker (Recomendado)

```bash
docker compose up -d --build
```

La web quedará disponible en: **http://localhost:8080**

## Desarrollo Local con Node.js

```bash
npm install
npm run dev
```

Compilación estática (`dist/`):

```bash
npm run build
npm run preview
```
