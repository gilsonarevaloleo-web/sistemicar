# SISTEMICAR v2.5 - Guía Técnica para Desarrolladores

## Resumen Ejecutivo

SISTEMICAR es una aplicación web de productividad personal con gamificación, diseñada para usuarios hispanohablantes. Utiliza metáforas de "alquimia mental" y "comando personal" para enmarcar conceptos de productividad.

**URL de producción**: sistemicar.app

---

## Arquitectura del Sistema

### Stack Tecnológico

| Capa | Tecnología |
|------|------------|
| Frontend | React 18 + TypeScript |
| Build | Vite 5 |
| Estilos | Tailwind CSS v4 + shadcn/ui |
| Animaciones | Framer Motion |
| Routing | Wouter |
| Estado | TanStack React Query |
| Persistencia | Firebase Firestore / localStorage (dual) |
| Autenticación | Firebase Auth (anónimo) |
| IA | Google Gemini 2.0 Flash Lite (cliente) |
| Gráficos | Recharts |
| Iconos | Lucide React |

### Modo de Operación

La app funciona en **modo dual**:

1. **Con Firebase configurado**: Usa Firestore para persistencia y Auth anónimo
2. **Sin Firebase**: Fallback automático a localStorage (desarrollo/demo)

```typescript
// client/src/lib/firebase.ts
export const isFirebaseConfigured = (): boolean => {
  const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  return !!(apiKey && projectId && apiKey.length > 10);
};
```

---

## Estructura del Proyecto

```
sistemicar/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── components/        # Componentes reutilizables
│   │   │   ├── ui/            # shadcn/ui primitivos
│   │   │   ├── sidebar.tsx    # Navegación principal
│   │   │   ├── hero-dopamine.tsx
│   │   │   ├── best-moment-recall.tsx
│   │   │   └── ...
│   │   ├── pages/             # Páginas/rutas
│   │   │   ├── console.tsx    # Consola principal
│   │   │   ├── alquimia.tsx   # Ventana de Sabiduría
│   │   │   ├── planeacion.tsx # Vehículos y misiones
│   │   │   ├── esperanza.tsx  # Registro de esperanza
│   │   │   ├── radar.tsx      # Análisis IA
│   │   │   ├── analytics.tsx  # Estadísticas
│   │   │   └── ...
│   │   ├── hooks/             # Custom hooks
│   │   │   └── useAuth.ts
│   │   ├── lib/               # Utilidades
│   │   │   ├── firebase.ts    # Config Firebase
│   │   │   ├── persistence.ts # Capa de datos dual
│   │   │   ├── gemini.ts      # Integración IA
│   │   │   ├── session.ts     # Manejo de sesión
│   │   │   └── utils.ts
│   │   └── App.tsx            # Rutas y providers
│   └── index.html
├── server/                    # Backend Express (mínimo)
│   ├── index.ts               # Entry point
│   └── vite.ts                # Dev middleware
├── shared/                    # Código compartido
│   └── schema.ts              # Tipos Drizzle (legacy)
└── attached_assets/           # Assets estáticos
```

---

## Variables de Entorno

### Requeridas para Producción

```env
# Firebase (obligatorio para persistencia en la nube)
VITE_FIREBASE_API_KEY=AIzaSy...
VITE_FIREBASE_PROJECT_ID=sistemicar-xxxxx
VITE_FIREBASE_APP_ID=1:xxxxx:web:xxxxx

# Gemini IA (obligatorio para Radar)
VITE_GEMINI_API_KEY=AIzaSy...
```

### Opcionales

```env
VITE_FIREBASE_AUTH_DOMAIN=sistemicar-xxxxx.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=sistemicar-xxxxx.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=xxxxx
```

---

## Capa de Persistencia

### Archivo Principal: `client/src/lib/persistence.ts`

Implementa el patrón **dual-mode** para todas las entidades:

```typescript
// Ejemplo: subscribeToAcervo
export function subscribeToAcervo(
  userId: string,
  onData: (entries: AcervoEntry[]) => void,
  onError: (error: Error) => void
): () => void {
  if (isFirebaseConfigured() && db) {
    // Modo Firebase: suscripción en tiempo real
    const path = getPrivatePath(userId, "acervo");
    return onSnapshot(query(...), (snapshot) => {
      onData(snapshot.docs.map(...));
    }, onError);
  } else {
    // Modo localStorage: lectura local
    onData(getLocalEntries());
    return () => {};
  }
}
```

### Entidades de Datos

| Entidad | Descripción | Colección Firestore |
|---------|-------------|---------------------|
| AcervoEntry | Registros de energía (4 ejes) | `users/{uid}/acervo` |
| Vehicle | Vehículos de planificación | `users/{uid}/vehicles` |
| BossStep | Paso jefe actual | `users/{uid}/boss_step` |
| Chispazo | Insights/reflexiones | `users/{uid}/chispazos` |
| Mision | Misiones planificadas | `users/{uid}/misiones` |
| UserProgression | Progreso del usuario | `users/{uid}/progression` |

### Estructura Firestore

```
artifacts/
└── sistemicar-v2-5/
    └── users/
        └── {userId}/
            ├── acervo/
            ├── vehicles/
            ├── boss_step/
            ├── chispazos/
            ├── misiones/
            └── progression/
```

---

## Integración Gemini IA

### Archivo: `client/src/lib/gemini.ts`

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);

export async function analyzePatterns(chispazos: string[]): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const prompt = `Analiza estos registros de reflexión personal...`;
  const result = await model.generateContent(prompt);
  return result.response.text();
}
```

### Uso en Radar (`pages/radar.tsx`)

- Analiza los últimos "chispazos" del usuario
- Detecta patrones de comportamiento
- Genera recomendaciones personalizadas

---

## Sistema de Autenticación

### Flujo Actual: Auth Anónimo

```typescript
// client/src/lib/firebase.ts
export const signInAnonymousUser = async () => {
  if (!auth) throw new Error("Firebase not configured");
  return signInAnonymously(auth);
};

// client/src/hooks/useAuth.ts
useEffect(() => {
  if (isFirebaseConfigured()) {
    signInAnonymousUser().then(setUser);
  } else {
    setUser({ uid: "local-user", ... });
  }
}, []);
```

### Flujo de Usuario

1. Usuario abre la app
2. Se crea sesión anónima automáticamente
3. Datos se guardan en Firestore bajo su UID anónimo
4. Si cierra y vuelve en el mismo dispositivo, mantiene sus datos

---

## Rutas de la Aplicación

### Definidas en `client/src/App.tsx`

| Ruta | Componente | Descripción |
|------|------------|-------------|
| `/` | Bienvenida | Landing/onboarding |
| `/menu` | MenuPrincipal | Menú principal |
| `/console` | Console | Consola de registro de energía |
| `/alquimia` | Alquimia | Ventana de Sabiduría |
| `/planeacion` | Planeacion | Vehículos y misiones |
| `/esperanza` | Esperanza | Registro de esperanza |
| `/radar` | Radar | Análisis IA de patrones |
| `/analytics` | Analytics | Estadísticas y gráficos |
| `/rewards` | Rewards | Planes y beneficios |
| `/pagos` | Pagos | Proceso de pago |
| `/historial` | Historial | Historial de registros |
| `/codice` | Codice | Código de conducta |
| `/acerca` | Acerca | Manifiesto |
| `/admin-gilson` | AdminGilson | Panel admin (demo) |
| `/socios` | Socios | Dashboard afiliados (demo) |

---

## Sistema de Gamificación

### Command Points (CP)

Puntos que el usuario gana por registrar actividades:

| Tipo | Puntos |
|------|--------|
| Mastery | +15 CP |
| Flow | +10 CP |
| Conflict | +5 CP |
| Trivial | +2 CP |

### Momentum (0-100)

Indicador de "impulso" del usuario:

```
Base: 50
+ (deltaCP semanal vs promedio) * 30%
- (días sin log) * 10
- 20 si días sin boss step > 7
+ (streak activo) * 5
```

### Rangos de Usuario

1. **Iniciado** (Gratis) - Funciones básicas
2. **Operador Táctico** ($9.99/mes) - Funciones completas
3. **Arquitecto de Red** ($24.99/mes) - IA + Afiliados

---

## Despliegue

### Opción 1: Replit (Actual)

```bash
# Ya configurado, solo publicar desde la UI de Replit
```

### Opción 2: Firebase Hosting

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar (seleccionar Hosting)
firebase init

# Build
npm run build

# Deploy
firebase deploy --only hosting
```

### Opción 3: Vercel/Netlify

```bash
# Build genera carpeta dist/
npm run build

# Subir dist/ al hosting
# Configurar redirects para SPA:
# _redirects: /* /index.html 200
```

---

## Comandos de Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo local
npm run dev

# Build producción
npm run build

# Preview producción
npm run preview
```

---

## Consideraciones de Seguridad

### Firebase Security Rules (Recomendadas)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /artifacts/sistemicar-v2-5/users/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### Claves de API

- Las claves de Firebase son públicas por diseño (restringidas por dominio)
- La clave de Gemini debería estar en un backend idealmente
- En producción, configurar restricciones de dominio en Google Cloud Console

---

## Mejoras Futuras Recomendadas

1. **Autenticación completa**: Agregar Google/Email sign-in
2. **Backend para IA**: Mover Gemini a Cloud Functions
3. **Pagos automáticos**: Integrar Stripe o MercadoPago
4. **PWA**: Agregar service worker para offline
5. **Notificaciones**: Firebase Cloud Messaging para recordatorios
6. **Analytics**: Firebase Analytics para métricas de uso

---

## Contacto y Soporte

Para dudas técnicas sobre este proyecto, contactar al desarrollador original o revisar el archivo `replit.md` para más contexto.

---

*Documento generado para SISTEMICAR v2.5 - Enero 2026*
