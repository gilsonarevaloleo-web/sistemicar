# SISTEMICAR v2.5 - MASTER PLAN
## Documento Maestro de Arquitectura, Páginas, Botones y Conexiones

**Fecha**: Febrero 2026  
**Propietario**: Gilson Arevalo Pezo (gilsonarevalo.leo@gmail.com)  
**Dominio**: sistemicar.app  
**Filosofía Core**: El coraje (RETO) tiene valor intrínseco. Consciencia = Darse Cuenta.

---

## TABLA DE CONTENIDOS

1. [Arquitectura General](#1-arquitectura-general)
2. [Sistema de Autenticación y Acceso](#2-sistema-de-autenticación-y-acceso)
3. [Sistema de Puntos de Soberanía (PS)](#3-sistema-de-puntos-de-soberanía-ps)
4. [Mapa de Rutas y Páginas](#4-mapa-de-rutas-y-páginas)
5. [Detalle de Cada Página](#5-detalle-de-cada-página)
6. [Componentes Globales](#6-componentes-globales)
7. [Sistema de Monetización](#7-sistema-de-monetización)
8. [Persistencia y Firebase](#8-persistencia-y-firebase)
9. [Integración con IA (Gemini)](#9-integración-con-ia-gemini)
10. [Flujos de Usuario](#10-flujos-de-usuario)

---

## 1. ARQUITECTURA GENERAL

### Stack Técnico
| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter |
| Estado | TanStack React Query |
| Estilos | Tailwind CSS v4 + tema custom |
| UI | shadcn/ui + Radix UI |
| Animaciones | Framer Motion |
| Charts | Recharts |
| Iconos | Lucide React |
| Toasts | Sonner |
| Backend | Node.js + Express.js |
| Base de Datos | Firebase Firestore (persistencia principal) |
| Auth | Firebase Authentication (Google Sign-In) |
| IA | Gemini 2.0 Flash Lite |
| Tipografías | Inter, JetBrains Mono, Space Grotesk |

### Estética: "Alta Alquimia"
- Fondo negro profundo (#020202 / #050505)
- Oro dominante (#D4AF37)
- `backdrop-blur-2xl`, sombras luminosas, bordes iridiscentes
- Espectro Cromático de Conciencia:
  - ROJO (#EF4444): Espejo
  - NARANJA (#F97316): Depósito
  - AMARILLO (#EAB308): Alquimia
  - VERDE (#22C55E): Planificación
  - AZUL (#3B82F6): IA/Diagnóstico
  - VIOLETA (#8B5CF6): Perfil/Alianza

---

## 2. SISTEMA DE AUTENTICACIÓN Y ACCESO

### Niveles de Protección de Rutas
| Tipo | Descripción | Rutas |
|------|-------------|-------|
| **Pública** | Sin login necesario | `/bienvenida`, `/acceso`, `/pagos`, `/embudo`, `/umbral-leads`, `/ventas-espejo`, `/gracias-compra`, `/terminos-condiciones`, `/libro-reclamaciones`, `/espejo`, `/historial`, `/documentos` |
| **ProtectedRoute** | Requiere login (cualquier usuario autenticado) | `/menu`, `/tutorial`, `/console`, `/esperanza`, `/rewards`, `/analytics`, `/acerca`, `/admin-gilson`, `/alquimia`, `/historia`, `/codice`, `/escaner`, `/inmunidad`, `/como-funciona`, `/umbral` |
| **ArquitectoRoute** | Requiere login + rank "arquitecto" O ser owner | `/planeacion`, `/socios`, `/radar`, `/proyector` |

### Owner Bypass
- Email: `gilsonarevalo.leo@gmail.com`
- Acceso completo a TODAS las rutas sin verificación de rank
- Definido tanto en `App.tsx` como en `menu-principal.tsx`

### Código Secreto de Propietario
- Se activa tocando el logo 5 veces en el Menú Principal
- Código: `GILSON2025`
- Efecto: Activa rank "arquitecto" para el usuario actual

### Contraseña Admin
- Panel: `/admin-gilson`
- Contraseña: `sistemicar2025`

---

## 3. SISTEMA DE PUNTOS DE SOBERANÍA (PS)

### Fuentes de PS por Módulo

#### ESPEJO (Console) - `/console`
| Eje | PS |
|-----|-----|
| PERCIBO | +5 PS |
| RECONOZCO | +8 PS |
| CUENTO CON | +12 PS |
| TRANSFORMO | +15 PS |
| **Total por registro completo** | **+40 PS** |
- Contextos: Familia, Trabajo, Relaciones, Finanzas, Salud, Proyecto

#### ALQUIMIA - `/alquimia`
| Eje | PS |
|-----|-----|
| OBSERVACIÓN | +8 PS |
| CRISIS | +8 PS |
| LECCIÓN | +8 PS |
| MAESTRÍA | +8 PS |
| **Total por registro completo** | **+32 PS** |

#### DEPÓSITO (Esperanza) - `/esperanza`
| Eje | PS |
|-----|-----|
| CAPTURA | +10 PS |
| CONTEXTO | +20 PS |
| ACCIÓN | +30 PS |
| TRANSMUTACIÓN | +40 PS |
| **Total por registro completo** | **+100 PS** |

#### UMBRAL - `/umbral`
**Fase Sombra (4 ejes × 8 PS):**
| Eje | PS |
|-----|-----|
| IDENTIDAD | +8 PS |
| LENGUAJE | +8 PS |
| ACCIÓN | +8 PS |
| TIEMPO | +8 PS |

**Fase Expansión (4 ejes × 10 PS):**
| Eje | PS |
|-----|-----|
| DESPIERTO | +10 PS |
| LUGAR | +10 PS |
| ACCIÓN EXPANDIDA | +10 PS |
| HORIZONTE | +10 PS |
| **Total por cápsula completa** | **+72 PS** |

#### PROYECTOR - `/proyector`
**4 Ejes × 5 Niveles cada uno:**
| Eje | Nivel 1 | Nivel 2 | Nivel 3 | Nivel 4 | Nivel 5 | Total |
|-----|---------|---------|---------|---------|---------|-------|
| VISIÓN | 5 | 8 | 12 | 15 | 20 | 60 |
| TENSIÓN | 5 | 8 | 12 | 15 | 20 | 60 |
| ACCIÓN | 5 | 8 | 12 | 15 | 20 | 60 |
| COLAPSO | 5 | 8 | 12 | 15 | 20 | 60 |
| **Total por proyección completa** | | | | | | **240 PS** |

#### PLANIFICACIÓN (Vehículos) - `/planeacion`
**Vehículos Express:**
| Tipo | PS Completado | PS Fallido |
|------|--------------|------------|
| HORA | +10 PS | +5 PS |
| SITUACIÓN | +5 PS | +2 PS |
| OMITIR | +1 PS | +0 PS |

**Vehículos Profundo (Máximo 50 PS):**
| Eje | Base PS |
|-----|---------|
| ENFOQUE | 5 |
| CONFLICTO | 10 |
| PASOS | 15 |
| ALCANCE | 20 |
| **Total (todos RETO)** | **50 PS** |

- Multiplicadores por dificultad: SEGURO (×1), DESAFÍO (×1.5), RETO (×2)
- Misiones difíciles (RETO) otorgan PS incluso al ser archivadas (fallidas)

### Audit Trail
- Cada otorgamiento de PS se registra en Firestore con: `source`, `amount`, `description`, `timestamp`
- `subscribeToDailyPoints()` y `getDailyPoints()` rastrean PS del día en tiempo Lima (UTC-5)

---

## 4. MAPA DE RUTAS Y PÁGINAS

```
/ → Redirect → /menu

PÚBLICAS (Sin login):
├── /bienvenida        → Landing page principal
├── /acceso            → Login con Google
├── /embudo            → Embudo de ventas IA
├── /umbral-leads      → Captura de leads (nombre, WhatsApp, correo)
├── /ventas-espejo     → Venta del módulo Espejo (S/ 58.08)
├── /gracias-compra    → Post-compra con tracking Facebook Pixel
├── /espejo            → Landing + herramienta Espejo (dual)
├── /pagos             → Planes y pagos
├── /historial         → Historial de registros
├── /documentos        → Especificaciones técnicas
├── /terminos-condiciones
└── /libro-reclamaciones

PROTEGIDAS (Login requerido):
├── /menu              → Menú Principal (Centro de Comando)
├── /tutorial          → Tutorial de onboarding
├── /console           → ESPEJO - Inteligencia Emocional
├── /esperanza         → DEPÓSITO - Batería de Certeza
├── /alquimia          → ALQUIMIA - Sabiduría de Experiencia
├── /umbral            → UMBRAL - Expansión de Límites
├── /rewards           → Niveles de Acceso
├── /analytics         → Panel Analítico
├── /escaner           → Escáner de Creencias
├── /inmunidad         → Cámara de Inmunidad
├── /como-funciona     → Guía explicativa
├── /historia          → Historia de Misiones
├── /codice            → Códice del Sistema
├── /acerca            → Acerca de
└── /admin-gilson      → Panel de Admin

ARQUITECTO (Login + rank arquitecto o Owner):
├── /planeacion        → PLANIFICACIÓN - Motor de 4 Ejes
├── /radar             → RADAR - Chispazos + IA
├── /socios            → ALIANZA - Red de Poder
└── /proyector         → PROYECTOR - Arquitectura de Realidad
```

---

## 5. DETALLE DE CADA PÁGINA

### 5.1 BIENVENIDA (`/bienvenida` → `bienvenida.tsx`)
**Propósito**: Landing page de entrada y conversión

**Elementos**:
- Logo SISTEMICAR
- Testimonios rotativos (5 historias de transformación):
  1. "Del Abandono a la Soberanía" (47 días)
  2. "La Claridad del Guerrero" (23 días)
  3. "La Muerte de la Dopamina Barata" (35 días)
  4. "El Puente sobre la Culpa" (19 días)
  5. "El Aliado que Buscaba" (?)

**Botones**:
| Botón | Acción | Destino |
|-------|--------|---------|
| Entrar con Google | `signInWithGoogle()` → envía welcome email → navega | `/menu` |
| Explorar Sin Cuenta | Navegar sin login | `/espejo` |
| Enlace Términos | Navegación | `/terminos-condiciones` |
| Enlace Reclamos | Navegación | `/libro-reclamaciones` |

---

### 5.2 ACCESO (`/acceso` → `acceso.tsx`)
**Propósito**: Página dedicada de login con Google

**Botones**:
| Botón | Acción | Destino |
|-------|--------|---------|
| Entrar con Google | `signInWithGoogle()` → welcome email si nuevo | `/menu` |
| Volver (ArrowLeft) | Navegación | Anterior |

---

### 5.3 MENÚ PRINCIPAL (`/menu` → `menu-principal.tsx`)
**Propósito**: Centro de comando - hub de navegación principal

**Elementos Superiores**:
- Logo SISTEMICAR (tap 5 veces → código secreto)
- Panel de cuenta (anónima: botón Google login / vinculada: email + botón migrar + botón cerrar sesión)
- Resumen Diario (ResumenDiario component)
- Status Alianza (StatusAlianza component)
- Onboarding modal (si es primer uso)

**Menú Base (Todos los usuarios logueados)**:
| Módulo | Icono | Ruta | Color |
|--------|-------|------|-------|
| ESPEJO | Eye | `/console` | ROJO |
| ALQUIMIA | Wand2 | `/alquimia` | AMARILLO |
| UMBRAL | Zap | `/umbral` | AZUL |
| DEPÓSITO | Sunrise | `/esperanza` | NARANJA |

**Menú Arquitecto (Adicional)**:
| Módulo | Icono | Ruta | Color |
|--------|-------|------|-------|
| PLANIFICACIÓN | Heart | `/planeacion` | VERDE |
| MENTOR IA | MessageCircle | `/mentor` | AZUL |
| ALIANZA | Crown | `/socios` | VIOLETA |
| PROYECTOR | Rocket | `/proyector` | INDIGO |

**Items Secundarios**:
| Item | Icono | Ruta |
|------|-------|------|
| Historia | History | `/historial` |
| Códice | BookOpen | `/codice` |
| ¿Cómo funciona? | HelpCircle | `/como-funciona` |

**Botones de Acción en Menú**:
| Botón | test-id | Acción |
|-------|---------|--------|
| Entrar con Google | `button-login-google-main` | Google Sign-In |
| Migrar | `button-migrate-google` | Migrar datos a Google |
| Cerrar Sesión | - | `logOut()` |
| Reiniciar Datos | - | `clearAllLocalData()` + reload |
| Código Propietario | - | Input modal → `GILSON2025` → rank arquitecto |

**Sección Footer**: Links a Escáner, Cámara de Inmunidad, Niveles, Analytics, Pagos, Admin

---

### 5.4 ESPEJO / CONSOLE (`/console` → `console.tsx`)
**Propósito**: Módulo de Inteligencia Emocional - "¿Cómo te sientes frente a X?"

**Dos Modos**:
1. **Captura Libre**: Fragmentos emocionales sin estructura
2. **Estructurado**: Análisis profundo con 4 ejes

**Contextos de Reflexión**:
- Familia (Heart, rojo)
- Trabajo (Briefcase, azul)
- Relaciones (Users, violeta)
- Finanzas (DollarSign, verde)
- Salud (Activity, naranja)
- Proyecto (Target, oro)

**4 Ejes de Inteligencia Emocional**:
| Eje | Pregunta | PS |
|-----|----------|-----|
| PERCIBO | ¿Qué siento/percibo? | +5 |
| RECONOZCO | ¿Qué patrones identifico? | +8 |
| CUENTO CON | ¿Qué recursos tengo? | +12 |
| TRANSFORMO | ¿Qué nueva perspectiva emerge? | +15 |

**Componentes Integrados**:
- ConfettiCelebration, PointsPulse
- RankBadge, WarriorChallengeIndicator
- AllianceProposalModal, CooldownOverlay
- ManualTriggerButton (Manuales de Maestría)

**Botones**:
| Botón | Acción |
|-------|--------|
| Selección de Contexto | Define el área de reflexión |
| Toggle Captura Libre / Estructurado | Cambia modo |
| Guardar Registro | `addEnergyLog()` + `awardSovereigntyPoints()` |
| Ver Historial | Navega a historial |

---

### 5.5 ALQUIMIA (`/alquimia` → `alquimia.tsx`)
**Propósito**: Destilador de Sabiduría - Transmutar experiencias en aprendizaje

**4 Ejes**:
| Eje | Color | PS | Pregunta |
|-----|-------|-----|----------|
| OBSERVACIÓN | Púrpura | +8 | ¿Qué observaste? |
| CRISIS | Rojo | +8 | ¿Cuál fue el conflicto? |
| LECCIÓN | Azul | +8 | ¿Qué aprendiste? |
| MAESTRÍA | Violeta | +8 | ¿Cómo aplicarás esto? |

**Funciones**:
- `addAlquimiaEntry()` - Guardar entrada
- `subscribeToAlquimiaEntries()` - Entradas propias
- `subscribeToPublicAlquimia()` - Galería pública
- Exportar como imagen (html2canvas)
- Compartir en redes (Share2)
- Botón ManualTriggerButton

---

### 5.6 DEPÓSITO / ESPERANZA (`/esperanza` → `esperanza.tsx`)
**Propósito**: Batería de Certeza - Almacenar evidencia de capacidad

**4 Ejes Progresivos**:
| Paso | Eje | PS | Pregunta Estructurada |
|------|-----|-----|----------------------|
| 1 | CAPTURA | +10 | ¿Qué aprendizaje quieres cristalizar? |
| 2 | CONTEXTO | +20 | ¿En qué escenarios lo aplicarías? |
| 3 | ACCIÓN | +30 | ¿Cómo lo traduces en acciones concretas? |
| 4 | TRANSMUTACIÓN | +40 | ¿Qué capacidad nueva tienes ahora? |

**Funciones**:
- `addAcervoEntry()` - Guardar entrada
- `subscribeToAcervo()` - Listar entradas
- `deleteAcervoEntry()` - Eliminar
- SeductionMessage component
- ManualTriggerButton

---

### 5.7 UMBRAL (`/umbral` → `umbral.tsx`)
**Propósito**: Expansión de Límites - Sistema de Cápsulas de Transformación

**Fase 1: SOMBRA (4 ejes × 8 PS = 32 PS)**
| Eje | Pregunta |
|-----|----------|
| IDENTIDAD | ¿Quién eres cuando este límite te domina? |
| LENGUAJE | ¿Qué frase te repite constantemente? |
| ACCIÓN | ¿Qué te impide hacer o qué te obliga a repetir? |
| TIEMPO | ¿A qué momento del pasado te ancla? |

**Fase 2: EXPANSIÓN (4 ejes × 10 PS = 40 PS)**
| Eje | Preguntas (2 por eje) |
|-----|----------------------|
| DESPIERTO | ¿Ahora quién eres? / ¿Qué ves? |
| LUGAR | ¿Con quién estás? / ¿Qué dicen de ti? |
| ACCIÓN | ¿Qué te impide hacer? / ¿Qué patrones? |
| HORIZONTE | ¿Qué te ancla al tiempo? |

**Funciones**:
- `addAliadoEntry()` - Guardar cápsula
- `updateAliadoEntry()` - Actualizar
- `subscribeToAliados()` - Listar
- Sonido activable/desactivable
- ManualTriggerButton

---

### 5.8 PLANIFICACIÓN (`/planeacion` → `planeacion.tsx`)
**Propósito**: Motor de 4 Ejes - Sistema dual de vehículos (Express + Profundo)

**Vehículos Express** (3 tipos):
| Tipo | Descripción | PS Completado | PS Fallido | Color Badge |
|------|-------------|---------------|------------|-------------|
| HORA | Misión por tiempo | 10 | 5 | Rojo |
| SITUACIÓN | Misión por situación | 5 | 2 | Púrpura |
| OMITIR | Misión de abstención | 1 | 0 | Gris |

**Vehículos Profundo** (4 ejes):
| Eje | PS Base | Con DESAFÍO (×1.5) | Con RETO (×2) |
|-----|---------|-------------------|--------------|
| ENFOQUE | 5 | 7.5 | 10 |
| CONFLICTO | 10 | 15 | 20 |
| PASOS | 15 | 22.5 | 30 |
| ALCANCE | 20 | 30 | 40 |
| **Máximo** | | | **50 PS** |

**Botones Principales**:
| Botón | Acción |
|-------|--------|
| + Nuevo Vehículo | Abre modal de creación |
| Express / Profundo | Toggle tipo de vehículo |
| HORA / SITUACIÓN / OMITIR | Subtipo Express |
| Guardar Vehículo | `addVehicle()` |
| Completar Misión | `completeMission()` → PS |
| Archivar | `archiveMission()` → PS parcial si RETO |
| Badge tipo (HORA/SITUACIÓN/OMITIR) | Indicador visual en lista |

---

### 5.9 RADAR (`/radar` → `radar.tsx`)
**Propósito**: Sistema de Chispazos + Análisis IA

**Funcionalidades**:
- Registrar "Chispazos" (insights rápidos)
- Toggle "Deseo Loco" por chispazo
- Eliminar chispazos
- Panel de Logros (AchievementPanel):
  - RETO GUERRERO: 3 misiones difíciles consecutivas
  - EJE ESPERANZA: ≥85% promedio
  - DISCIPLINA: 21 días de registro

**Análisis IA**:
- `analyzeChispazos()` - Analizar patrones en chispazos
- `analyzeUnified()` - Análisis unificado
- `generateSeductionMessage()` - Mensajes motivacionales
- `saveSubconsciousAnalysis()` - Guardar análisis

**Suscripciones**:
- `subscribeToChispazos()`
- `subscribeToSubconsciousAnalysis()`
- `subscribeToProgression()`
- `subscribeToEnergyLogs()`
- `subscribeToVehicles()`

---

### 5.10 PROYECTOR (`/proyector` → `proyector.tsx`)
**Propósito**: Arquitectura de Realidad Futura - Cápsulas en tiempo futuro

**4 Ejes × 5 Niveles**:

**EJE VISIÓN** (Azul eléctrico):
| Nivel | Nombre | PS | Pregunta |
|-------|--------|-----|----------|
| 1 | Destello | 5 | Tráiler de tu película de éxito |
| 2 | Calor | 8 | ¿Qué parte del cuerpo se calienta? |
| 3 | Asombro | 12 | Rostro de asombro frente a ti |
| 4 | Perspectiva | 15 | ¿Qué tan pequeñas se ven tus dudas? |
| 5 | Intuición | 20 | ¿Qué susurra tu intuición? |

**EJE TENSIÓN** (Rojo):
| Nivel | Nombre | PS |
|-------|--------|-----|
| 1 | Orgullo | 5 |
| 2 | Aire | 8 |
| 3 | Ritmo | 12 |
| 4 | Disolución | 15 |
| 5 | Imán | 20 |

**EJE ACCIÓN** (Esmeralda):
| Nivel | Nombre | PS |
|-------|--------|-----|
| 1 | Impacto | 5 |
| 2 | Símbolo | 8 |
| 3 | Manos | 12 |
| 4 | Sabor | 15 |
| 5 | Natural | 20 |

**EJE COLAPSO** (Oro):
| Nivel | Nombre | PS |
|-------|--------|-----|
| 1 | Liberación | 5 |
| 2-5 | ... | 8-20 |

**Funciones**:
- `addProyeccion()` - Crear proyección
- `updateProyeccion()` - Actualizar
- `subscribeToProyecciones()` - Listar

---

### 5.11 ANALYTICS (`/analytics` → `analytics.tsx`)
**Propósito**: Panel analítico completo

**5 Tabs**:
| Tab | Contenido |
|-----|-----------|
| Soberanía | Puntos totales, ranking |
| Tendencias | Gráficos de línea temporal |
| Circadiano | Patrones por hora del día |
| Logros | Sistema de achievements |
| Coach | Análisis IA unificado |

**Logros Disponibles** (por CP acumulados):
| Logro | Requisito |
|-------|-----------|
| Centurión | 100 CP |
| Guerrero | 300 CP |
| Leyenda | 750 CP |
| Titán | 1,500 CP |
| Arconte | 2,500 CP |
| Soberano | 5,000 CP |
| Inmortal | 10,000 CP |
| Transcendente | 25,000 CP |

**Logros por Actividad**:
| Logro | Requisito |
|-------|-----------|
| Enfocado | 15 registros ENFOQUE |
| Cazador de Jefes | 5 Pasos Jefe |
| Alquimista | 5 CONFLICTOS |
| Secuencial | 10 PASOS |
| Expansor | 8 ALCANCE |

**Charts**: LineChart, PieChart, BarChart, RadarChart (Recharts)

---

### 5.12 ESCÁNER DE CREENCIAS (`/escaner` → `escaner.tsx`)
**Propósito**: Diagnóstico del estado mental/emocional actual

**Flujo**:
1. Pregunta: "¿Cómo te sientes en este momento?"
2. IA analiza el texto
3. Muestra dimensiones con barras de progreso
4. Niveles: bajo (rojo), medio (ámbar), alto (dorado)
5. Historial de escaneos

**Dimensiones evaluadas**: Mental, Emocional, Físico, Situacional

---

### 5.13 CÁMARA DE INMUNIDAD (`/inmunidad` → `camara-inmunidad.tsx`)
**Propósito**: Transmutación de límites en autoridad

**4 Fases**:
| Fase | Nombre | Acción |
|------|--------|--------|
| 1 | PLOMO | Identificar jurisdicción limitante (mín. 5 chars) |
| 2 | VACÍO | Animación de transición (2.5 seg) |
| 3 | ORO | Declarar acción soberana (mín. 5 chars) |
| 4 | SELLADO | Libertad registrada y archivada |

**Persistencia**: localStorage (`sistemicar_archivo_libertades`)
- Máximo 50 libertades archivadas
- Formato: `{ id, limite, accionSoberana, fecha }`

---

### 5.14 REWARDS / NIVELES (`/rewards` → `rewards.tsx`)
**Propósito**: Mostrar los 3 niveles de acceso

| Nivel | Precio | Incluye | Ruta CTA |
|-------|--------|---------|----------|
| INICIADO | Gratis | 1 Vehículo, Espejo, Manómetro | `/console` |
| OPERADOR TÁCTICO | $9.99/mes | Paso Jefe, Esperanza, Vehículos ilimitados | `/pagos` |
| ARQUITECTO DE RED | $24.99/mes | Radar IA, Análisis, 30% Comisión | `/pagos` |

---

### 5.15 PAGOS (`/pagos` → `pagos.tsx`)
**Propósito**: Página de planes y procesamiento de pagos

**3 Planes**:
| Plan | USD | PEN | Características |
|------|-----|-----|----------------|
| Soberanía Mental | $9.99 | S/ 37 | Console, Espejo, 4 ejes, Puntos |
| Arquitecto | $24.99 | S/ 92 | + Umbral, Planificación, Radar IA, Alquimia, Cierre IA |
| Soberano | $49.99 | S/ 185 | + Proyector, Manuales, Alianzas, Escáner, Soporte |

**Métodos de Pago**:
- MercadoPago (API: `/api/mercadopago/create-preference`)
- PayPal (link: paypal.me/ElimanAte)
- Yape (WhatsApp: +51918260514)

---

### 5.16 SOCIOS / ALIANZA (`/socios` → `socios.tsx`)
**Propósito**: Panel de afiliados con comisiones

**Acceso**: Login con credenciales demo (`socio@demo.com` / `demo123`)

**Dashboard**:
- Código de referido
- Usuarios referidos (plan, status)
- Pagos y comisiones (30% por referido)
- Balance de comisiones
- Botón copiar código

---

### 5.17 ADMIN GILSON (`/admin-gilson` → `admin-gilson.tsx`)
**Propósito**: Panel de administración del propietario

**3 Tabs**:
| Tab | Funciones |
|-----|-----------|
| Users | Ver usuarios, activar planes, cambiar status |
| Payments | Ver pagos, marcar comisiones como pagadas |
| Recovery | Buscar cuentas con datos, migrar datos entre UIDs |

**Funciones**:
- `activateUser(userId, plan)` - Activar plan
- `settleCommission(paymentId)` - Liquidar comisión
- `findAccountsWithData()` - Buscar cuentas
- `migrateDataToNewUid(oldUid, newUid)` - Migrar datos

---

### 5.18 EMBUDO SISTEMICAR (`/embudo` → `embudo-sistemicar.tsx`)
**Propósito**: Embudo de ventas inteligente con clasificación IA

**3 Pasos**:
1. **Clasificación IA**: Detecta perfil del prospecto
2. **Presentación de Planes**: Ajustados por multiplicador según perfil
3. **Cierre**: Google Sign-In + selección de plan

**Planes dinámicos**: Precios multiplicados según categoría IA
- INICIADO: $9.99 × multiplicador
- ARQUITECTO: $24.99 × multiplicador
- SOBERANO: $49.99 × multiplicador

---

### 5.19 UMBRAL LEADS (`/umbral-leads` → `umbral-leads.tsx`)
**Propósito**: Landing de captura de leads obligatoria

**Campos**:
- Nombre
- WhatsApp (validación: 9-15 dígitos)
- Correo electrónico (validación regex)

**Flujo**: Captura → `addProspecto()` → Redirect a `/ventas-espejo`

**Beneficios mostrados**:
- Ordena tu mente en 5 minutos diarios
- Sistema de Arquitectura Mental probado
- Acceso al Espejo de Conciencia
- Puntos de Soberanía y gamificación
- Comunidad de Guerreros Mentales

---

### 5.20 VENTAS ESPEJO (`/ventas-espejo` → `ventas-espejo.tsx`)
**Propósito**: Página de venta del módulo Espejo

**Precio**: S/ 58.08 (~$17 USD)
**Incluye**: Acceso al Espejo de Conciencia 30 días

**Elementos**:
- 4 Beneficios con iconos
- 3 Testimonios (María G., Carlos R., Ana L.)
- CTA de compra
- Opción "Reto Guerrero" (prueba 7 días)
- `getProspectoByEmail()`, `updateProspecto()`, `activarRetoGuerrero()`

---

### 5.21 GRACIAS COMPRA (`/gracias-compra` → `gracias-compra.tsx`)
**Propósito**: Página post-compra con tracking

**Tracking**: Facebook Pixel `Purchase` event ($17 USD)
**Contenido**: Bienvenida al "PROTOCOLO DE SOBERANÍA ESPEJO™"
**CTA**: Comenzar → navega a la app

---

### 5.22 ESPEJO PÚBLICO (`/espejo` → `espejo.tsx`)
**Propósito**: Landing page dual - Conversión + Herramienta operativa

**Dos Modos**:
- **Captura Libre (Gratis)**: Fragmentos emocionales
- **Modo Arquitecto (Premium $17)**: 4 ejes completos

---

### 5.23 HISTORIAL (`/historial` → `historial.tsx`)
**Propósito**: Historial completo de registros

**Características**:
- Error Boundary para evitar pantalla negra
- Filtros por tipo/fecha
- Expansión de detalles

---

### 5.24 CÓDICE (`/codice` → `codice.tsx`)
**Propósito**: Documento filosófico del sistema - Secciones colapsables

**Secciones**: Numeradas con iconos, explicando principios del sistema

---

### 5.25 ¿CÓMO FUNCIONA? (`/como-funciona` → `como-funciona.tsx`)
**Propósito**: Guía explicativa de las 3 áreas principales

| Área | PS | Descripción |
|------|-----|-------------|
| ESPEJO | +5 CP | Consola de Auto-conocimiento |
| ESPERANZA | +10 CP | Bóveda de Motivación |
| ALQUIMIA | +15 CP | Destilador de Sabiduría |

---

### 5.26 DOCUMENTOS (`/documentos` → `documentos.tsx`)
**Propósito**: Especificaciones técnicas descargables

**Documentos**:
- ESPEJO - Inteligencia Emocional (v2.5)
- PROYECTOR - Arquitectura de Realidad (v2.5)

---

## 6. COMPONENTES GLOBALES

### 6.1 Layout (`layout.tsx`)
- Wrapper principal con navegación inferior

### 6.2 Cierre de Jornada Modal (`cierre-jornada-modal.tsx`)
- Modal global montado en `App.tsx`
- Se abre manualmente (botón Moon en navegación)
- Muestra PS del día en tiempo real (Lima UTC-5)
- Suscripciones: energyLogs, aliados, alquimias, vehicles, progression, dailyPoints
- Datos del cierre: reconocimiento, diagnóstico, prescripción, eje débil

### 6.3 Sovereignty Toast (`sovereignty-toast.tsx`)
- Listener global de PS otorgados
- Muestra toast animado con cantidad de PS

### 6.4 Confetti Celebration (`confetti-celebration.tsx`)
- `ConfettiCelebration`: Explosión de confetti
- `PointsPulse`: Animación de PS sumados

### 6.5 Funnel Components (`funnel-components.tsx`)
- `RankBadge`: Badge del nivel actual
- `WarriorChallengeIndicator`: Progreso del Reto Guerrero
- `AllianceProposalModal`: Propuesta de Alianza
- `CooldownOverlay`: Overlay de inactividad

### 6.6 Hero Dopamine (`hero-dopamine.tsx`)
- Display motivacional con CP total
- Días activos (streak)
- Barra de momentum
- Frase motivacional

### 6.7 Best Moment Recall (`best-moment-recall.tsx`)
- Muestra el mejor día histórico del usuario

### 6.8 Extreme Force Dashboard (`extreme-force-dashboard.tsx`)
- Dashboard de máxima urgencia
- Activado por inactividad o sentimiento negativo

### 6.9 Seduction Message (`seduction-message.tsx`)
- Mensajes motivacionales generados por IA

### 6.10 Master Manual Drawer (`master-manual-drawer.tsx`)
- `ManualTriggerButton`: Botón para abrir manual
- `MasterManualDrawer`: Drawer con contenido del manual
- 5 manuales: Espejo, Depósito, Alquimia, Umbral, Planificación

### 6.11 Data Status Panel (`data-status.tsx`)
- Panel de diagnóstico de estado de datos

### 6.12 Status Alianza (`status-alianza.tsx`)
- Indicador del estado de alianza del usuario

### 6.13 Resumen Diario (`resumen-diario.tsx`)
- Resumen del día con PS, actividades

### 6.14 Tooltip Orientación (`tooltip-orientacion.tsx`)
- Tooltips contextuales de ayuda

### 6.15 Onboarding (`onboarding.tsx`)
- Flujo de primera vez para nuevos usuarios

### 6.16 Page Header (`page-header.tsx`)
- Header reutilizable para páginas

### 6.17 Share Modal (`share-modal.tsx`)
- Modal para compartir contenido

### 6.18 Affiliate Proposal Modal (`affiliate-proposal-modal.tsx`)
- Modal de propuesta de afiliación

### 6.19 Sovereign Indicator (`sovereign-indicator.tsx`)
- Indicador de nivel de soberanía

---

## 7. SISTEMA DE MONETIZACIÓN

### Funnel de Conversión

```
TRÁFICO
  │
  ├── /bienvenida (Landing principal)
  │     └── Google Sign-In → /menu
  │
  ├── /umbral-leads (Captura de leads)
  │     └── Nombre + WhatsApp + Email
  │           └── /ventas-espejo
  │                 ├── Comprar S/ 58.08 → /gracias-compra
  │                 └── Reto Guerrero (7 días gratis)
  │
  └── /embudo (Embudo IA)
        └── Clasificación → Planes dinámicos → Google Sign-In
```

### Modelo de Precios

| Plan | USD/mes | PEN/mes | Módulos Incluidos |
|------|---------|---------|-------------------|
| Gratis | $0 | S/ 0 | Espejo básico, 1 Vehículo |
| Soberanía Mental | $9.99 | S/ 37 | Console, Espejo, 4 ejes, Puntos |
| Arquitecto | $24.99 | S/ 92 | Todo Soberanía + Umbral, Planificación, Radar IA, Alquimia, Cierre IA |
| Soberano | $49.99 | S/ 185 | Todo Arquitecto + Proyector, Manuales, Alianzas, Escáner |
| Espejo (pago único) | $17 | S/ 58.08 | Espejo de Conciencia 30 días |

### Procesadores de Pago
- **MercadoPago**: API de preferencias (`/api/mercadopago/create-preference`)
- **PayPal**: Link directo (`paypal.me/ElimanAte`)
- **Yape**: WhatsApp (+51918260514)

### Sistema de Afiliados
- Comisión: 30% sobre suscripciones referidas
- Panel: `/socios` (requiere nivel Arquitecto)
- Tracking: Código de referido único
- Liquidación: Manual desde admin

---

## 8. PERSISTENCIA Y FIREBASE

### Colecciones Firestore Principales
| Colección | Uso |
|-----------|-----|
| `energyLogs` | Registros del Espejo |
| `vehicles` | Vehículos de Planificación |
| `misiones` | Misiones completadas/archivadas |
| `acervo` | Entradas del Depósito |
| `aliados` | Cápsulas del Umbral |
| `alquimia` | Entradas de Alquimia |
| `chispazos` | Chispazos del Radar |
| `proyecciones` | Proyecciones del Proyector |
| `progression` | Progresión del usuario (rank, CP, streak) |
| `manualProgress` | Progreso en Manuales de Maestría |
| `codices` | Códices guardados |
| `prospectos` | Leads capturados |
| `subconsciousAnalysis` | Análisis IA guardados |
| `sovereigntyPoints` | Log de PS otorgados (audit trail) |

### Funciones Clave (`persistence.ts`)
| Función | Descripción |
|---------|-------------|
| `awardSovereigntyPoints(uid, amount, source, description)` | Otorga PS con audit trail |
| `subscribeToDailyPoints(uid, callback)` | PS del día (Lima UTC-5) |
| `getDailyPoints(uid)` | PS acumulados hoy |
| `subscribeToProgression(uid, callback)` | Progresión del usuario |
| `updateProgression(uid, data)` | Actualizar progresión |
| `calculateTotalCP(uid)` | Calcular CP total |
| `recordActivity(uid)` | Registrar actividad para streak |
| `migrateDataToNewUid(oldUid, newUid)` | Migrar datos entre cuentas |
| `findAccountsWithData()` | Buscar cuentas con datos |
| `verificarAccesoProspecto(email)` | Verificar acceso de prospecto |
| `registrarActividadProspecto(email)` | Registrar actividad prospecto |

### Timezone
- Todas las operaciones diarias usan **Lima UTC-5**
- `getLimaDayStart()` calcula el inicio del día en Lima usando matemática de milisegundos

---

## 9. INTEGRACIÓN CON IA (GEMINI)

### Modelo: Gemini 2.0 Flash Lite

### Funciones IA (`gemini.ts`)
| Función | Uso | Módulo |
|---------|-----|--------|
| `analyzeChispazos()` | Analizar patrones en chispazos | Radar |
| `analyzeUnified()` | Análisis unificado de datos | Analytics, Radar |
| `generateSeductionMessage()` | Mensaje motivacional personalizado | Depósito, Radar |
| Análisis de sentimiento | Detectar estado emocional | Protocolo de Fuerza Extrema |
| Clasificación IA de prospecto | Categorizar lead | Embudo |

---

## 10. FLUJOS DE USUARIO

### Flujo 1: Nuevo Usuario (Orgánico)
```
/bienvenida → Google Sign-In → /menu → Onboarding → /console (Espejo)
```

### Flujo 2: Lead Capturado
```
/umbral-leads → Captura datos → /ventas-espejo → Compra S/ 58.08 → /gracias-compra → /acceso
```

### Flujo 3: Reto Guerrero (Prueba)
```
/ventas-espejo → "Reto Guerrero 7 días" → Acceso temporal → Conversión
```

### Flujo 4: Sesión Diaria Típica
```
/menu → /console (Espejo) → Registrar estado → PS
       → /alquimia → Destilar experiencia → PS
       → /planeacion → Completar vehículo → PS
       → Cierre de Jornada (Modal) → Resumen del día
```

### Flujo 5: Ascenso de Nivel
```
Acumular PS → 180 PS → Alianza desbloqueada
Rank: iniciado → operador → arquitecto
       (Gratis)   ($9.99)   ($24.99)
```

### Flujo 6: Propietario
```
/menu → Tap logo ×5 → Código GILSON2025 → Arquitecto activado
  o
/admin-gilson → Contraseña sistemicar2025 → Panel admin completo
```

---

## APÉNDICE: MAPA VISUAL DE CONEXIONES

```
                    ┌─────────────────┐
                    │   /bienvenida   │
                    │  Landing Page   │
                    └────────┬────────┘
                             │
                    Google Sign-In
                             │
                    ┌────────▼────────┐
                    │     /menu       │
                    │ Centro Comando  │
                    └────────┬────────┘
                             │
        ┌────────────────────┼────────────────────┐
        │                    │                    │
   BASE (Todos)        ARQUITECTO ($24.99)    SECUNDARIOS
        │                    │                    │
   ┌────┤               ┌───┤               ┌───┤
   │ /console           │ /planeacion       │ /historial
   │ (Espejo)           │ (Planificación)   │ /codice
   │                    │                   │ /como-funciona
   │ /alquimia          │ /radar            │ /analytics
   │ (Alquimia)         │ (Radar IA)        │ /rewards
   │                    │                   │ /escaner
   │ /umbral            │ /socios           │ /inmunidad
   │ (Umbral)           │ (Alianza)         │
   │                    │                   │
   │ /esperanza         │ /proyector        │
   │ (Depósito)         │ (Proyector)       │
   └────────────────────┴───────────────────┘

   MONETIZACIÓN:
   /umbral-leads → /ventas-espejo → /gracias-compra
   /embudo → Planes IA → Sign-In
   /pagos → MercadoPago/PayPal/Yape

   ADMIN:
   /admin-gilson → Usuarios, Pagos, Recovery
```

---

*Documento generado para SISTEMICAR v2.5 - Febrero 2026*
*Propietario: Gilson Arevalo Pezo*
