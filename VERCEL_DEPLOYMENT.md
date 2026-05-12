# Guía de Despliegue en Vercel - SISTEMICAR

## Opción Rápida: Despliegue con CLI

```bash
# 1. Instalar Vercel CLI (si no lo tienes)
npm i -g vercel

# 2. Login
vercel login

# 3. Desplegar (primera vez - te preguntará configuración)
vercel

# 4. Configurar variables de entorno en vercel.com
# 5. Redesplegar para aplicar variables
vercel --prod
```

## Variables de Entorno Requeridas

Configura estas variables en Vercel Dashboard > Settings > Environment Variables:

### Requeridas
| Variable | Descripción |
|----------|-------------|
| `GEMINI_API_KEY` | Tu API key de Google Gemini |
| `VITE_FIREBASE_API_KEY` | Firebase API Key (público) |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID |
| `VITE_FIREBASE_APP_ID` | Firebase App ID |
| `VITE_GEMINI_API_KEY` | Gemini API key para el cliente |

### Opcionales (para pagos)
| Variable | Descripción |
|----------|-------------|
| `MP_ACCESS_TOKEN` | Mercado Pago Access Token |
| `PAYPAL_CLIENT_ID` | PayPal Client ID |
| `PAYPAL_CLIENT_SECRET` | PayPal Client Secret |
| `RESEND_API_KEY` | Resend API key para emails |

## Pasos para Desplegar

### 1. Preparar el Código

El proyecto ya está configurado con:
- `vercel.json` - Configuración de rutas y funciones
- `api/index.ts` - Función serverless para todas las APIs

### 2. Conectar con Vercel

Opción A - Desde GitHub:
1. Sube tu código a un repositorio de GitHub
2. Ve a vercel.com y conecta tu cuenta de GitHub
3. Importa el repositorio
4. Configura las variables de entorno
5. Deploy

Opción B - Vercel CLI:
```bash
npm i -g vercel
vercel login
vercel
```

### 3. Configurar Dominio Personalizado

1. En Vercel Dashboard > Domains
2. Agrega: sistemicar.app
3. Configura los DNS:
   - Tipo A: @ -> 76.76.21.21
   - Tipo CNAME: www -> cname.vercel-dns.com

### 4. Verificar Despliegue

Visita tu URL de Vercel para confirmar:
- Frontend carga correctamente
- `/api/health` responde con `{ status: "ok" }`
- Las funciones de IA funcionan

## Estructura del Proyecto en Vercel

```
/
├── api/
│   └── index.ts      → Serverless function (todas las APIs)
├── dist/public/      → Frontend compilado (Vite build)
└── vercel.json       → Configuración de rutas
```

## Notas Importantes

1. **Firebase**: Ya está en la nube, no requiere configuración adicional
2. **Gemini AI**: Usa la API key configurada en variables de entorno
3. **Mercado Pago**: Los webhooks deben apuntar a tu dominio de producción
4. **Build**: Vercel ejecutará `npm run build` automáticamente
