# Despliegue y rutas API (Sistemicar)

## Dos backends

| Entorno | Quién atiende `/api/*` | Entry |
|--------|-------------------------|--------|
| **Vercel** (según [vercel.json](../vercel.json)) | Función serverless | [api/index.ts](../api/index.ts) |
| **Node** (`npm start` → `dist/index.cjs`) | Express monolítico | [server/index.ts](../server/index.ts) |

El build ([script/build.ts](../script/build.ts)) empaqueta solo `server/index.ts` para producción en un proceso Node. El front se genera en `dist/public`. En Vercel, las peticiones a `/api/*` se reescriben a la función que exporta la app de `api/index.ts`, **no** al bundle del servidor.

**Riesgo de deriva:** las rutas duplicadas en ambos sitios deben mantenerse alineadas. La configuración compartida vive en [shared/publicBaseUrl.ts](../shared/publicBaseUrl.ts) y [shared/mercadopagoPlans.ts](../shared/mercadopagoPlans.ts).

**Webhooks Mercado Pago:** el webhook en [server/index.ts](../server/index.ts) actualiza base de datos, claves API y correos. El handler en [api/index.ts](../api/index.ts) solo registra eventos en log. Si Mercado Pago llama a `notification_url` apuntando al dominio de Vercel, **no** se ejecutará la lógica completa de entrega. Para cobros que requieran DB y emails, usa `PUBLIC_APP_URL` apuntando al origen donde corre el servidor Node completo, o extiende la función serverless con la misma lógica (y variables de entorno de DB).

## Variables de entorno relevantes

| Variable | Uso |
|----------|-----|
| `PUBLIC_APP_URL` | Origen HTTPS (sin barra final) para `back_urls` y `notification_url` de Mercado Pago. Prioridad sobre el fallback. |
| `VERCEL_URL` | Solo en Vercel; usado como fallback de `PUBLIC_APP_URL` si esta no está definida. |
| `MP_ACCESS_TOKEN` | Token de Mercado Pago (servidor y función). |
| `GEMINI_API_KEY` / `AI_INTEGRATIONS_GEMINI_API_KEY` | IA en `api/index.ts` (cliente OpenAI-compatible hacia Gemini). |
| `DATABASE_URL` | Solo necesaria para rutas que usan Drizzle/PG en el servidor. |

## Rutas en la función Vercel (`api/index.ts`)

Todas bajo el prefijo que expone Express (normalmente `/api/...` respecto al origen de la app).

- `POST /api/alquimia/validate`
- `POST /api/cierre-jornada`
- `POST /api/embudo/clasificar`
- `POST /api/send-welcome-email` (stub: no envía correo)
- `POST /api/proyector/generate-narrative`
- `POST /api/proyector/guided-prompt`
- `POST /api/proyector/guided-synthesis`
- `POST /api/embudo/lead`
- `POST /api/mercadopago/create-preference`
- `POST /api/mercadopago/webhook` (solo logging)
- `POST /api/seduction-message`
- `GET /api/health`

## Rutas solo en el servidor Node (`server/index.ts`)

Incluye todo lo anterior con distinta implementación en varios casos (p. ej. alquimía usa `callGemini` nativo; cierre de jornada con más campos y zona horaria), **más** entre otras:

- `POST /api/send-offer-email`, `POST /api/knowledge-export`
- `POST /api/doctor-ia`, `POST /api/doctor-ia-chat`
- `POST /api/mineria-consciencia`, `POST /api/filtro-adn-soberano`
- `GET /api/mercadopago/test-link/:planId`
- `POST /api/espejo/*`, `POST /api/espejo-doctor-ia`, `POST /api/espejo-mapa-voltaje`
- `POST /api/semillas/*`, `GET/POST` compilar libro, etc.
- `POST /api/fabrica-sensorial/*`, `POST /api/youtube-educator/*`
- `POST /api/desglosador-sugerir`, `POST /api/video-estratega/chat`
- `POST /api/taller-libros/*`, `POST /api/radiografia/generar`
- `GET /api/public/docs`, `POST /api/public/detect-interface` (clave API)
- `GET/POST/DELETE /api/admin/public-keys/*`
- `GET/POST /api/vehicle-history`
- Cualquier otra ruta definida en `server/index.ts` y el fallback SPA `GET *`

Si el cliente llama a una ruta **solo servidor** mientras el usuario está en el despliegue de Vercel, obtendrá error o HTML según rewrites.

## Desarrollo local

El script `npm run dev` ejecuta `server/index.ts` (usa `cross-env` para `NODE_ENV` en Windows). Las rutas `/api/*` del cliente (proxy Vite si existe) deben apuntar a ese servidor para tener el conjunto completo de endpoints.

## Comprobación TypeScript

`npm run check` ejecuta `tsc` en el proyecto principal (cliente, servidor, `shared/`) y `tsc -p api/tsconfig.json` para la función serverless (config propia bajo [api/tsconfig.json](../api/tsconfig.json), sin mezclar tipos DOM del cliente).
