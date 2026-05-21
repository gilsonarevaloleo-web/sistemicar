# Despliegue en Netlify ù SISTEMICAR

Frontend estùtico (`dist/public`) + API Express en **una funciùn serverless** (`netlify/functions/api.ts`).

## Configuraciùn en Netlify UI

En **Site configuration ? Build & deploy ? Build settings** (o dejar que lea `netlify.toml`):

| Campo | Valor |
|-------|--------|
| Branch | `main` |
| Build command | `npm run build` |
| Publish directory | `dist/public` |
| Functions directory | `netlify/functions` |

## Variables de entorno (Site ? Environment variables)

### Build time (prefijo `VITE_` ù embebidas en el cliente)

| Variable | Obligatoria |
|----------|-------------|
| `VITE_FIREBASE_API_KEY` | Sù |
| `VITE_FIREBASE_AUTH_DOMAIN` | Sù |
| `VITE_FIREBASE_PROJECT_ID` | Sù |
| `VITE_FIREBASE_STORAGE_BUCKET` | Sù |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Sù |
| `VITE_FIREBASE_APP_ID` | Sù |
| `VITE_GEMINI_API_KEY` | Sù (radar, seducciùn en cliente) |

### Runtime (funciùn `/api/*` ù solo servidor)

| Variable | Uso |
|----------|-----|
| `GEMINI_API_KEY` | Doctor IA, Espejo, alquimia, taller libros, etc. |
| `PUBLIC_APP_URL` | URL canùnica (`https://tu-sitio.netlify.app` o dominio custom). Mercado Pago back_urls y webhooks. |
| `DATABASE_URL` | PostgreSQL (Neon) ù API pùblica, historial vehùculos |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | JSON en una lùnea ù crùditos Espejo tras pago MP |
| `MERCADOPAGO_ACCESS_TOKEN` | Pagos y webhooks |
| `MERCADOPAGO_WEBHOOK_SECRET` | Validaciùn webhook (si aplica) |
| `ADMIN_API_TOKEN` | Panel admin Gilson |
| `ELEVENLABS_API_KEY` | Voz Espejo / fùbrica sensorial (opcional) |
| `SMTP_*` / email vars | Emails de bienvenida (ver `server/emailService.ts`) |

`PUBLIC_APP_URL`: si no la defines, se usa la variable automùtica `URL` de Netlify (`https://sistemicar-2026.netlify.app`, etc.).

## Firebase Auth en producciùn

En Google Cloud + Firebase Console, agrega:

- **Authorized JavaScript origins:** `https://tu-dominio.netlify.app` (y dominio custom si tienes)
- **Authorized redirect URI:** `https://sistemicar-app.firebaseapp.com/__/auth/handler`
- **Firebase ? Authorized domains:** tu dominio Netlify

## Mercado Pago

Webhook URL en el panel MP:

```
https://TU-DOMINIO/api/mercadopago/webhook
```

## Verificaciùn post-deploy

1. Abrir `https://TU-DOMINIO/menu` ù UI carga
2. **`GET https://TU-DOMINIO/api/health`** ? JSON `{ "status": "ok" }`. Si ves el 404 de la SPA (ùDid you forget to add the page to the router?ù), **la API no estù activa**.
3. Doctor IA (chat) y generar capùtulos en `/admin-semillas`
4. Taller: `/admin-semillas` o botùn ùTaller de libros / Semillasù en `/menu` (solo owner)

## Troubleshooting ù chat y capùtulos no funcionan

**Sùntoma:** ùError de conexiùnù en Doctor IA; capùtulos no generan; `/api/health` devuelve HTML de la app.

**Causa:** Netlify publicù solo el frontend. Falta la funciùn `netlify/functions/api.ts` y/o el redirect `/api/*` en el commit desplegado.

**En el log de deploy debe aparecer:**
- Bundling de **Functions** (funciùn `api`)
- **2** reglas de redirect (API + SPA), no solo 1

**Pasos:**
1. Push de todo el repo a la rama que usa Netlify (**`principal`** en tu proyecto, commit reciente).
2. Variables: **`GEMINI_API_KEY`** obligatoria (chat + taller libros).
3. Netlify ? Deploys ? **Clear cache and deploy site**
4. Reprobar `/api/health`

## Desarrollo local con Netlify

```bash
npm install -g netlify-cli   # una vez
npm run build
netlify dev
```

Sirve frontend + functions como en producciùn.

## Lùmites a tener en cuenta

- **Timeout:** 26 s mùximo en plan Pro (10 s en free). Rutas pesadas (`generar-capitulo`, renders de video) pueden necesitar optimizaciùn o cola externa.
- **Filesystem:** `/videos` y renders locales no persisten en serverless; la fùbrica sensorial con ffmpeg puede no funcionar en Netlify Functions.
- **Tamaùo del bundle:** la funciùn incluye todo `server/index.ts`; el cold start puede tardar unos segundos.

## Flujo de deploy

1. Commit + push a **`principal`** (rama de producciÛn en Netlify) en GitHub (`gilson-leos/sistemicar-2026`)
2. Netlify build automùtico
3. Revisar **Deploy log** ? Build succeeded ? Functions bundled
4. Probar `/api/health`
