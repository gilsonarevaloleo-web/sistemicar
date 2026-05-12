# ESPECIFICACIÓN TÉCNICA COMPLETA DEL PROYECTO
## SISTEMICAR v2.5 — Plataforma de Productividad y Alquimia Mental

**Dominio**: sistemicar.app  
**Propietario**: Gilson Arevalo Pezo (gilsonarevalo.leo@gmail.com)  
**Stack**: React 18 + TypeScript + Vite (Frontend) | Express.js (Backend) | Firebase Firestore (Base de Datos)  
**Código fuente total**: ~15,000+ líneas  

---

## TABLA DE CONTENIDOS

1. [LÓGICA DE FUNCIONAMIENTO](#1-lógica-de-funcionamiento)
   - 1.1 Visión General
   - 1.2 Mapa de Rutas (32 páginas)
   - 1.3 Sistema de Acceso y Protección
   - 1.4 Módulos Principales
   - 1.5 Sistema de Puntos de Soberanía (PS)
   - 1.6 Sistema de Progresión y Rangos
   - 1.7 Embudo de Monetización
   - 1.8 Zona Horaria (Lima UTC-5)

2. [FUNCIONES PRINCIPALES DEL CÓDIGO](#2-funciones-principales-del-código)
   - 2.1 Archivo de Persistencia (3,486 líneas)
   - 2.2 Servidor Express (830 líneas)
   - 2.3 Configuración Firebase
   - 2.4 Librería de Sesión
   - 2.5 Modo Soberano (Resiliencia)
   - 2.6 Funciones de IA (Gemini)

3. [CONEXIÓN CON FIREBASE](#3-conexión-con-firebase)
   - 3.1 Configuración e Inicialización
   - 3.2 Estructura Firestore Completa
   - 3.3 Autenticación
   - 3.4 Patrón de Resiliencia (Modo Soberano)
   - 3.5 Migración de Datos
   - 3.6 Todas las Suscripciones en Tiempo Real

4. [INTERFAZ DE USUARIO](#4-interfaz-de-usuario)
   - 4.1 Tema Visual "Alta Alquimia"
   - 4.2 Paleta de Colores Completa
   - 4.3 Tipografía
   - 4.4 Componentes de Navegación
   - 4.5 Layout y Estructura
   - 4.6 Componentes Compartidos
   - 4.7 Diseño de Cada Página
   - 4.8 Botones y Acciones Principales

---

## 1. LÓGICA DE FUNCIONAMIENTO

### 1.1 Visión General

SISTEMICAR es una plataforma de productividad personal basada en el concepto de **"ingeniería de conciencia"**. Su filosofía central: **la conciencia es darse cuenta, y el coraje (RETO) tiene valor intrínsico** — incluso si una misión difícil no se completa, el intento merece reconocimiento.

La plataforma gamifica el desarrollo personal a través de:
- **Puntos de Soberanía (PS)**: Moneda principal, se ganan en cada interacción
- **4 Ejes de Conciencia**: ENFOQUE, CONFLICTO, PASOS, ALCANCE
- **Sistema Trifecta**: 4 niveles de profundidad (OMITIR, BLANDO, INTERMEDIO, RETO)
- **Progresión por Rangos**: Iniciado → Guerrero → Operador → Arquitecto
- **IA Coaching**: Gemini 2.0 Flash Lite para análisis y retroalimentación personalizada

### 1.2 Mapa de Rutas (32 Páginas)

#### Páginas Públicas (Sin autenticación)
| Ruta | Página | Archivo | Propósito |
|------|--------|---------|-----------|
| `/bienvenida` | Bienvenida | `bienvenida.tsx` | Landing page principal, primer contacto |
| `/acceso` | Acceso | `acceso.tsx` | Login con Google / acceso anónimo |
| `/como-funciona` | Cómo Funciona | `como-funciona.tsx` | Explicación de la plataforma |
| `/terminos-condiciones` | Términos | `terminos-condiciones.tsx` | Términos legales |
| `/libro-reclamaciones` | Libro de Reclamaciones | `libro-reclamaciones.tsx` | Formulario de quejas (regulación peruana) |
| `/embudo` | Embudo | `embudo-sistemicar.tsx` | Funnel de captación de leads |
| `/umbral-leads` | Umbral Leads | `umbral-leads.tsx` | Captura de prospectos |
| `/ventas-espejo` | Ventas Espejo | `ventas-espejo.tsx` | Página de venta del plan Espejo (S/ 58.08) |
| `/documentos` | Documentos | `documentos.tsx` | Documentación pública |
| `/gracias-compra` | Gracias Compra | `gracias-compra.tsx` | Post-pago, confirmación |

#### Páginas Protegidas (Requieren autenticación)
| Ruta | Página | Archivo | Propósito |
|------|--------|---------|-----------|
| `/menu` | Menú Principal | `menu-principal.tsx` | Hub central, dashboard del usuario |
| `/console` | Espejo (Consola) | `console.tsx` | Registro de estado emocional con 4 ejes |
| `/espejo` | Espejo Directo | `espejo.tsx` | Acceso rápido al Espejo |
| `/esperanza` | Depósito | `esperanza.tsx` | Batería de certeza, registro de esperanza |
| `/rewards` | Beneficios | `rewards.tsx` | Sistema de recompensas y manuales |
| `/historial` | Historial | `historial.tsx` | Historial de actividad completo |
| `/historia` | Historia | `historia.tsx` | Narrativa del viaje del usuario |
| `/codice` | Códice | `codice.tsx` | Códices de sabiduría guardados |
| `/escaner` | Escáner | `escaner.tsx` | Radar del subconsciente (Chispazos) |
| `/inmunidad` | Cámara de Inmunidad | `camara-inmunidad.tsx` | Protocolo de fuerza extrema |
| `/umbral` | Umbral | `umbral.tsx` | Gateway de iniciación |
| `/tutorial` | Tutorial | `tutorial.tsx` | Guía de uso |
| `/pagos` | Pagos | `pagos.tsx` | Planes de suscripción |
| `/acerca` | Acerca | `acerca.tsx` | Información del proyecto |

#### Páginas de Arquitecto (Requieren rango "arquitecto" o ser Owner)
| Ruta | Página | Archivo | Propósito |
|------|--------|---------|-----------|
| `/planeacion` | Planificación | `planeacion.tsx` | Motor de Vehículos (Express/Profundo) |
| `/analytics` | Analytics | `analytics.tsx` | Patrones de energía y estadísticas |
| `/socios` | Socios | `socios.tsx` | Sistema de afiliados |
| `/alquimia` | Alquimia | `alquimia.tsx` | Transmutación: Plomo → Oro |
| `/radar` | Radar | `radar.tsx` | Radar IA de tensiones |
| `/proyector` | Proyector | `proyector.tsx` | Proyección del futuro con IA |

#### Páginas Administrativas
| Ruta | Página | Archivo | Propósito |
|------|--------|---------|-----------|
| `/admin-gilson` | Admin Gilson | `admin-gilson.tsx` | Panel admin (password: sistemicar2025) |

#### Página 404
| Ruta | Página | Archivo |
|------|--------|---------|
| `*` (catch-all) | Not Found | `not-found.tsx` |

### 1.3 Sistema de Acceso y Protección

```
Nivel 1: PÚBLICO
  → Cualquiera puede acceder
  → Rutas: /bienvenida, /acceso, /como-funciona, /embudo, etc.

Nivel 2: PROTEGIDO (ProtectedRoute)
  → Requiere autenticación (Google o anónimo)
  → Si no autenticado → redirige a /bienvenida
  → Rutas: /menu, /console, /esperanza, /rewards, etc.

Nivel 3: ARQUITECTO (ArquitectoRoute)
  → Requiere rango "arquitecto" EN LA PROGRESIÓN
  → O ser el Owner (gilsonarevalo.leo@gmail.com)
  → Si no cumple → redirige a /menu
  → Rutas: /planeacion, /analytics, /socios, /alquimia, /radar, /proyector

Nivel 4: ADMIN
  → Protegido por contraseña interna "sistemicar2025"
  → Ruta: /admin-gilson
```

**Función `isOwnerEmail(email)`**: Verifica si el email es `gilsonarevalo.leo@gmail.com`. El owner tiene bypass total de restricciones de rango.

**Código secreto GILSON2025**: Activa nivel Arquitecto para el propietario sin necesidad de cumplir los requisitos normales.

### 1.4 Módulos Principales

#### ESPEJO (Consola) — `/console`
- Registro de estado emocional en 4 ejes: PERCIBO, RECONOZCO, CUENTO CON, TRANSFORMO
- Cada registro otorga 2 PS por campo (máximo 8 PS por sesión Espejo)
- Los logs alimentan al Cierre de Jornada y al Radar IA

#### DEPÓSITO (Esperanza) — `/esperanza`
- Registro de esperanzas y certezas
- 5 tipos de entrada: gratitud, esperanza, certeza, deseo, logro
- Cada entrada otorga 1 PS
- Promedio de esperanza se trackea para desbloqueo de Alianza (85%+ por 7 días)

#### PLANIFICACIÓN — `/planeacion`
- **Vehículo Express**: Misión rápida sin ejes (1-10 PS)
- **Vehículo Profundo**: Misión con 4 ejes, wizard de 7 pasos (10-50 PS)
- Sistema Trifecta automático (OMITIR/BLANDO/INTERMEDIO/RETO)
- Archivado con reflexión (+bonus PS por coraje)
- *(Ver ESPECIFICACION_planificacion.md para documentación detallada)*

#### ALQUIMIA — `/alquimia`
- Proceso de transmutación: PLOMO → CRISIS → LECCIÓN → MAESTRÍA → ORO
- 5 campos que el usuario completa
- Validación por IA (Gemini) con puntuación de calidad
- Entradas pueden ser públicas o privadas
- PS otorgados según calidad de la transmutación

#### RADAR IA — `/radar`
- Análisis automático de tensiones entre ejes
- Detecta imbalances en el registro de energía
- Sugiere misiones ALCANCE para corregir desbalances
- Usa Gemini para interpretación contextual

#### PROYECTOR — `/proyector`
- Sistema de proyección futura con 4 cápsulas: VISIÓN, ARQUITECTURA, RECURSO, COLAPSO
- Hitos con frecuencia (diario/semanal/mensual/único)
- Narrativa generada por IA (primera persona, presente)
- Guía interactiva con preguntas sensoriales por IA

#### ESCÁNER (Chispazos) — `/escaner`
- Captura de pensamientos espontáneos
- Toggle "Deseo Loco" para ideas extraordinarias
- Análisis del subconsciente con patrones detectados por IA
- +2 PS por cada chispazo capturado

#### CÁMARA DE INMUNIDAD — `/inmunidad`
- Protocolo de Fuerza Extrema para momentos de baja motivación
- Foto personal motivacional
- Metas financieras y mensajes personalizados
- Disparado por inactividad o sentimiento negativo

#### MANUALES DE MAESTRÍA — via `master-manual-drawer.tsx`
- 6 manuales contextuales: ESPEJO, DEPÓSITO, ALQUIMIA, UMBRAL, PLANIFICACIÓN, PROYECTOR
- Checklist items dentro de cada manual
- Niveles de certificación: Observador → Aprendiz → Practicante → Maestro → Arquitecto → Gran Maestro
- +3 PS por primera lectura de manual, +1 PS por cada checklist item

#### MEDITACIÓN — integrado en varias páginas
- Sesiones con duración variable
- +3 PS por sesión completada
- Cálculo de racha (días consecutivos)
- Tracking de minutos totales

#### GALERÍA DE ALIADOS — `/umbral`
- Creación de aliados internos con dos facetas: SOMBRA y PODER
- 4 dimensiones: identidad, lenguaje, acción, tiempo
- Expansión con preguntas profundas
- Personificación por niveles

#### CIERRE DE JORNADA — modal `cierre-jornada-modal.tsx`
- Resumen diario personalizado por IA
- Suma todos los PS del día (usando timezone Lima UTC-5)
- Diagnóstico y prescripción por Gemini
- Datos enviados: energyLogs, vehicles, alquimias, aliados

#### SOCIOS (Afiliados) — `/socios`
- Sistema de referidos con comisión del 30%
- Código de referido único por usuario
- Panel de seguimiento de conversiones

### 1.5 Sistema de Puntos de Soberanía (PS)

Los PS son la moneda central del sistema. Se otorgan por CADA acción valiosa:

| Fuente | PS Otorgados | Detalle |
|--------|-------------|---------|
| **Espejo** (EnergyLog) | 2 PS/campo | Máx 8 PS por sesión (4 campos × 2) |
| **Depósito** (HopeLog) | 1 PS/entrada | Sin límite diario |
| **Vehículo Express** | 1-10 PS | Según tipo: hora=10, situación=5, omitir=1 |
| **Vehículo Profundo (cumplido)** | 10-50 PS | Base × multiplicador trifecta por eje |
| **Vehículo Profundo (archivado)** | 0-25 PS | Máx 50% + 4 PS/justificación |
| **Alquimia** | Variable | Según calidad validada por IA |
| **Chispazo** | 2 PS | Por cada captura |
| **Meditación** | 3 PS | Por sesión completada |
| **Manual leído** | 3 PS | Primera vez por manual |
| **Checklist item** | 1 PS | Por item completado |
| **Beneficios leídos** | 3 PS | Primera vez |

**Desglose de PS para Vehículo Profundo**:
```
Base por eje:   ENFOQUE=5  CONFLICTO=10  PASOS=15  ALCANCE=20  (Total=50)
Multiplicador:  OMITIR=×0.25  BLANDO=×0.50  INTERMEDIO=×0.75  RETO=×1.0

Ejemplo "todo RETO": 5×1 + 10×1 + 15×1 + 20×1 = 50 PS
Ejemplo "todo BLANDO": 5×0.5 + 10×0.5 + 15×0.5 + 20×0.5 = 25 PS
Panorama (todo OMITIR): 1 PS fijo
```

**Audit Trail**: Cada otorgamiento de PS crea un `SovereigntyPointsLog` con `{id, amount, source, timestamp}`, almacenado en Firebase y consultable por día usando `getLimaDayStart()`.

### 1.6 Sistema de Progresión y Rangos

| Rango | Requisito | Acceso |
|-------|-----------|--------|
| **Iniciado** | Registro inicial | Espejo, Depósito, Escáner |
| **Guerrero** | Completar Reto Guerrero (3 misiones RETO consecutivas) | + Inmunidad, Tutorial avanzado |
| **Operador** | 50+ CP acumulados | + Historial detallado |
| **Arquitecto** | 500+ CP acumulados o Plan Arquitecto ($24.99/mes) | + Planificación, Analytics, Radar, Alquimia, Proyector, Socios |

**Reto de Guerrero**: Desbloqueo automático al acumular actividad. Requiere completar 3 misiones con al menos 1 eje en RETO de forma consecutiva. Un fallo resetea la racha a 0.

**Modos de Cliente (para IA)**:
- `gratuito`: Usuario nuevo → objetivo retención
- `pago`: Suscriptor activo → objetivo prepararlo para guerrero
- `reto`: Completó reto guerrero → ofrecerle negocio (afiliados)

### 1.7 Embudo de Monetización

```
[Visitante] → /bienvenida (landing page)
    │
    ├── /embudo → Captura de lead (nombre, WhatsApp, correo, profesión)
    │     │
    │     ├── /umbral-leads → Lead registration
    │     │
    │     └── IA clasifica profesión:
    │           ├── "alto_capital" → multiplicador mayor
    │           └── "base" → precio estándar
    │
    ├── /ventas-espejo → Venta del Plan Espejo (S/ 58.08 único)
    │
    └── /pagos → Planes de Suscripción Mensual:
          ├── Soberanía Mental: $9.99/mes
          ├── Arquitecto: $24.99/mes (acceso completo)
          └── Soberano: $49.99/mes (premium)

[Pago via Mercado Pago] → /api/mercadopago/create-preference
    │
    └── Webhook → /api/mercadopago/webhook
          │
          ├── Status "approved" → Email confirmación + activación
          └── Otros → Log para seguimiento

[Post-pago] → /gracias-compra (confirmación)
```

### 1.8 Zona Horaria (Lima UTC-5)

Todas las operaciones de fecha diaria usan `getLimaDayStart()`:

```
1. Obtener hora UTC actual
2. Aplicar offset -5 horas (Lima no tiene horario de verano)
3. Calcular medianoche Lima del día actual
4. Filtrar logs con timestamp >= medianoche Lima
```

Esto garantiza que el Cierre de Jornada y los conteos diarios reflejen el día real del usuario en Perú.

---

## 2. FUNCIONES PRINCIPALES DEL CÓDIGO

### 2.1 Archivo de Persistencia — `client/src/lib/persistence.ts` (3,486 líneas)

Este es el archivo más grande y crítico del proyecto. Contiene TODOS los modelos de datos, operaciones CRUD, suscripciones en tiempo real, y lógica de negocio del lado del cliente.

#### Modelos de Datos (Interfaces)

| Interface | Línea | Campos Principales |
|-----------|-------|-------------------|
| `AcervoEntry` | 21 | id, text, axis, points, userId, createdAt |
| `EnergyLog` | 303 | id, text, type (8 tipos), points, userId, timestamp |
| `VehicleAxis` | 414 | text, trifecta |
| `Vehicle` | 419 | id, titulo, criterioFin, criterioDetalle, ejes (4), status, tipoTerminoRapido |
| `BossStep` | 603 | id, text, userId, status (active/defeated/archived) |
| `Chispazo` | 797 | id, text, userId, isDeseoLoco, createdAt |
| `SubconsciousAnalysis` | 922 | id, patterns[], chispazoCount, userId |
| `MisionScores` | 1016 | enfoque, conflicto, pasos, limite (0-100 cada uno) |
| `Mision` | 1023 | id, titulo, estado, scores, soberaniaMomento, comentario |
| `UserProgression` | 1141 | id, rank, points, streak, missions, registrationDays, cooldown, warrior*, alliance*, hopeAverages, totalCP, momentum, bestDayCP, sovereigntyPoints |
| `SovereigntyPointsLog` | 1464 | id, amount, source, timestamp |
| `SavedCodice` | 1871 | id, titulo, contenido, ejes (4 numéricos), nivel, categoria |
| `HopeLog` | 1997 | id, userId, text, type, referenceDate |
| `MeditationSession` | 2109 | id, userId, durationMinutes, completedAt |
| `AlquimiaEntry` | 2244 | id, observacion, crisis, leccion, maestria, oro, alquimiaScore, isPublic |
| `AliadoEntry` | 2373 | id, shadow{}, power{}, expansion{}, personification{}, totalPoints |
| `ManualProgress` | 2516 | manualType, readAt, checkedItems, completionPercent |
| `UserCertification` | 2523 | manualsRead[], totalChecklistCompleted, certificationLevel |
| `ProyectorHito` | 2828 | id, tarea, eje, estado, frecuencia |
| `ProyeccionEntry` | 3036 | id, capsulas{}, projectionNarrative |
| `Prospecto` | 3179 | id, nombre, whatsapp, correo, pagoConfirmado, retoGuerreroActivo |
| `HistorialSistemicoEntry` | 3390 | id, modulo, texto, contexto, puntos |

#### Types

```typescript
type TrifectaState = "omitir" | "blando" | "intermedio" | "reto";
type CriterioFin = "tiempo" | "circunstancia";
type VehicleStatus = "activo" | "cumplido" | "archivado";
type TipoTerminoRapido = "hora" | "situacion" | "omitido";
type UserRank = "iniciado" | "guerrero" | "operador" | "arquitecto";
type ClientMode = "gratuito" | "pago" | "reto";
type ManualType = "espejo" | "deposito" | "alquimia" | "umbral" | "planificacion" | "proyector";
type ProyectorEje = "vision" | "arquitectura" | "recurso" | "fecha_colapso";
```

#### Funciones de Suscripción (Tiempo Real)

Cada función retorna un `() => void` para desuscribirse al desmontar el componente.

| Función | Línea | Colección Firebase |
|---------|-------|-------------------|
| `subscribeToAcervo()` | 229 | `acervo` |
| `subscribeToEnergyLogs()` | 332 | `energyLogs` |
| `subscribeToVehicles()` | 460 | `vehicles` |
| `subscribeToBossStep()` | 637 | `bossStep` |
| `subscribeToChispazos()` | 825 | `chispazos` |
| `subscribeToSubconsciousAnalysis()` | 951 | `subconsciousAnalysis` |
| `subscribeToMisiones()` | 1054 | `misiones` |
| `subscribeToProgression()` | 1217 | `progression` |
| `subscribeToDailyPoints()` | 1772 | `sovereigntyPointsLog` |
| `subscribeToCodices()` | 1907 | `codices` |
| `subscribeToHopeLogs()` | 2027 | `hopeLogs` |
| `subscribeToMeditationSessions()` | 2136 | `meditationSessions` |
| `subscribeToAlquimiaEntries()` | 2312 | `alquimia` |
| `subscribeToPublicAlquimia()` | 2343 | `alquimia` (pública) |
| `subscribeToAliados()` | 2483 | `galeria_aliados` |
| `subscribeToManualProgress()` | 2766 | `manual_progress` |
| `subscribeToProyectorHitos()` | 2990 | `proyector_hitos` |
| `subscribeToProyecciones()` | 3134 | `proyecciones` |
| `subscribeToHistorialSistemico()` | 3450 | `historialSistemico` |

#### Funciones CRUD Principales

| Función | Línea | Operación |
|---------|-------|-----------|
| `addAcervoEntry()` | 262 | Crear entrada de acervo |
| `addEnergyLog()` | 368 | Crear log de energía |
| `calculateTotalCP()` | 405 | Sumar CP de todos los logs |
| `addVehicle()` | 497 | Crear vehículo (Express/Profundo) |
| `updateVehicleStatus()` | 538 | Cambiar status de vehículo |
| `updateVehicle()` | 583 | Actualizar campos de vehículo |
| `deleteVehicle()` | 572 | Eliminar vehículo |
| `addBossStep()` | 694 | Crear Paso Jefe |
| `defeatBossStep()` | 728 | Derrotar Paso Jefe |
| `archiveBossStep()` | 764 | Archivar Paso Jefe |
| `addChispazo()` | 860 | Capturar chispazo |
| `toggleDeseoLoco()` | 890 | Marcar/desmarcar deseo loco |
| `deleteChispazo()` | 909 | Eliminar chispazo |
| `saveMision()` | 1083 | Guardar resultado de misión |
| `recordMissionResult()` | 1347 | Registrar resultado en progresión |
| `recordHopeAverage()` | 1393 | Registrar promedio de esperanza |
| `checkCooldown()` | 1424 | Verificar inactividad |
| `awardSovereigntyPoints()` | 1490 | Otorgar PS con audit trail |
| `getDailyPoints()` | ~1570 | Obtener todos los PS del día |
| `calculateVehiclePoints()` | 1826 | Calcular PS de vehículo profundo |
| `calculateArchivePoints()` | 1851 | Calcular PS de archivado |
| `addCodice()` | ~1940 | Guardar códice de sabiduría |
| `addHopeLog()` | ~2060 | Crear registro de esperanza |
| `addMeditationSession()` | ~2170 | Registrar sesión de meditación |
| `calculateMeditationStreak()` | 2197 | Calcular racha de meditación |
| `getTotalMeditationMinutes()` | 2240 | Minutos totales meditados |
| `addAlquimiaEntry()` | 2280 | Crear entrada de alquimia |
| `addAliadoEntry()` | 2427 | Crear aliado |
| `markManualAsRead()` | 2579 | Registrar lectura de manual |
| `markChecklistItem()` | ~2610 | Completar item de checklist |
| `addProyectorHito()` | 2866 | Crear hito en proyector |
| `addProyeccion()` | 3069 | Crear proyección futura |
| `addProspecto()` | 3212 | Registrar prospecto/lead |
| `addHistorialSistemico()` | 3419 | Agregar entrada al historial |

#### Funciones de Lógica de Negocio

| Función | Línea | Propósito |
|---------|-------|-----------|
| `clearAllLocalData()` | 50 | Limpia todo el localStorage |
| `syncLocalToFirebase()` | ~80 | Sincroniza datos locales a la nube |
| `migrateDataToNewUid()` | 131 | Migra datos de un UID anónimo a Google |
| `saveMigrationPending()` | 169 | Marca migración pendiente |
| `getMigrationPending()` | 176 | Lee migración pendiente |
| `findAccountsWithData()` | 190 | Busca cuentas con datos existentes |
| `getClientMode()` | 1121 | Determina modo de cliente para IA |
| `getDefaultProgression()` | 1168 | Progresión inicial del usuario |
| `checkNewDay()` | ~1290 | Detecta nuevo día y actualiza streak |
| `getSovereigntyPointsBreakdown()` | 1807 | Configuración del sistema de PS |
| `getLimaDayStart()` | 1541 | Inicio del día en zona Lima UTC-5 |

### 2.2 Servidor Express — `server/index.ts` (830 líneas)

#### Endpoints de IA (Gemini 2.0 Flash Lite)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/alquimia/validate` | POST | Valida transmutación alquímica con IA |
| `/api/cierre-jornada` | POST | Genera resumen diario personalizado |
| `/api/embudo/clasificar` | POST | Clasifica profesión para pricing |
| `/api/proyector/generate-narrative` | POST | Genera narrativa de proyección futura |
| `/api/proyector/guided-prompt` | POST | Preguntas guiadas sensoriales |
| `/api/proyector/guided-synthesis` | POST | Sintetiza respuestas en declaración |

#### Endpoints de Email (Resend)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/send-welcome-email` | POST | Envía email de bienvenida |

#### Endpoints de Pagos (Mercado Pago)

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/mercadopago/create-preference` | POST | Crea preferencia de pago |
| `/api/mercadopago/webhook` | POST | Recibe notificaciones de pago |
| `/api/mercadopago/test-link/:planId` | GET | Genera link de prueba |

#### Endpoints de Leads

| Endpoint | Método | Propósito |
|----------|--------|-----------|
| `/api/embudo/lead` | POST | Registra nuevo lead |

#### Planes de Suscripción

```typescript
const SUBSCRIPTION_PLANS = {
  "soberania-mental": { id: "soberania-mental", name: "Soberanía Mental", price: 9.99 },
  "arquitecto":       { id: "arquitecto",       name: "Arquitecto",       price: 24.99 },
  "soberano":         { id: "soberano",          name: "Soberano",         price: 49.99 }
};
```

#### Función Helper de IA

```typescript
async function callGemini(prompt: string, maxTokens: number = 500): Promise<string> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-lite" });
  const result = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    generationConfig: { maxOutputTokens: maxTokens }
  });
  return result.response.text();
}
```

### 2.3 Configuración Firebase — `client/src/lib/firebase.ts`

```typescript
const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        "sistemicar-8375c.firebaseapp.com",
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID || "sistemicar-8375c",
  storageBucket:     "sistemicar-8375c.firebasestorage.app",
  messagingSenderId: "1013442567610",
  appId:             import.meta.env.VITE_FIREBASE_APP_ID
};
```

**Funciones exportadas**:
| Función | Propósito |
|---------|-----------|
| `isFirebaseConfigured()` | Verifica si Firebase está configurado |
| `signInWithGoogle()` | Login con Google vía popup |
| `signInAnonymousUser()` | Login anónimo |
| `linkAnonymousWithGoogle()` | Vincular cuenta anónima con Google |
| `logOut()` | Cerrar sesión |
| `onAuthChange(callback)` | Listener de cambios de autenticación |

### 2.4 Archivos de Librería

| Archivo | Propósito |
|---------|-----------|
| `client/src/lib/firebase.ts` | Configuración e inicialización Firebase |
| `client/src/lib/persistence.ts` | Toda la capa de datos (3,486 líneas) |
| `client/src/lib/session.ts` | Gestión de sesión de usuario |
| `client/src/lib/sovereign-mode.ts` | Patrón de resiliencia offline |
| `client/src/lib/owner.ts` | Verificación del propietario |
| `client/src/lib/gemini.ts` | Integración con Gemini en frontend |
| `client/src/lib/master-manuals.ts` | Contenido de los manuales de maestría |
| `client/src/lib/api.ts` | Llamadas HTTP al servidor |
| `client/src/lib/emailApi.ts` | Llamadas al servicio de email |
| `client/src/lib/queryClient.ts` | Configuración TanStack React Query |
| `client/src/lib/utils.ts` | Utilidades generales (cn, etc.) |

### 2.5 Modo Soberano (Resiliencia) — `client/src/lib/sovereign-mode.ts`

El Modo Soberano es el patrón de resiliencia que mantiene la app funcional sin conexión a Firebase:

```
OPERACIÓN NORMAL:
  Firebase disponible → Leer/Escribir en Firestore
  + Backup automático a localStorage

ERROR EN FIREBASE:
  1. activateSovereignModeGlobal("Mensaje de contexto")
  2. Fallback a localStorage
  3. UI muestra indicador "Modo Soberano"
  4. Todas las operaciones funcionan localmente

RECONEXIÓN:
  1. deactivateSovereignModeGlobal()
  2. UI oculta indicador
  3. Datos se sincronizan con Firebase

FUNCIONES HELPER:
  - backupToLocal(key, data) → Guarda copia local de datos Firebase
  - restoreFromLocal(key) → Restaura datos locales como fallback
```

### 2.6 Funciones de IA (Gemini)

#### Cierre de Jornada (Endpoint más complejo: `/api/cierre-jornada`)

Recibe:
- `energyLogs`: Registros del Espejo del día
- `vehicles`: Vehículos completados/archivados del día
- `alquimias`: Transmutaciones del día
- `aliados`: Aliados activos
- `userName`: Nombre del usuario
- `dailySovereigntyPoints`: PS total del día
- `dailyPointsLogs`: Detalle del audit trail de PS

Genera:
- Resumen personalizado del día
- Diagnóstico de patrones
- Prescripción para mañana
- PS calculados con precisión (usa datos del audit trail)

#### Validación de Alquimia (`/api/alquimia/validate`)

Evalúa los 5 campos de la transmutación con criterios estrictos:
1. Si la CRISIS no describe conflicto real → -30 puntos
2. Si la LECCIÓN es genérica → -20 puntos
3. Si el ORO no conecta con la crisis → -25 puntos
4. Mínimo 10 palabras por campo

Retorna: `{ score, weakAxes, feedback, deductions }`

#### Proyector Guiado (`/api/proyector/guided-prompt` + `/api/proyector/guided-synthesis`)

Proceso en 2 pasos:
1. **Prompt**: Genera preguntas sensoriales e imaginativas por eje (VISIÓN, TENSIÓN, ACCIÓN, COLAPSO)
2. **Síntesis**: Combina respuestas en declaración de manifestación en primera persona, presente

---

## 3. CONEXIÓN CON FIREBASE

### 3.1 Configuración e Inicialización

**Proyecto Firebase**: `sistemicar-8375c`

**Servicios utilizados**:
- Firebase Authentication (Google + Anónimo)
- Cloud Firestore (Base de datos NoSQL)

**Inicialización**:
```typescript
if (isFirebaseConfigured()) {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} else {
  // Modo desarrollo con localStorage
}
```

**Variables de entorno requeridas**:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_APP_ID`
- `GEMINI_API_KEY` (servidor)
- `MP_ACCESS_TOKEN` (Mercado Pago, servidor)
- `RESEND_API_KEY` (Email, servidor)

### 3.2 Estructura Firestore Completa

```
Firestore Database
│
├── artifacts/
│   └── sistemicar-v2-5/
│       └── users/
│           └── {uid}/                          ← Documentos privados por usuario
│               ├── acervo/                     ← Entries del acervo
│               │   └── {docId}: AcervoEntry
│               ├── energyLogs/                 ← Registros del Espejo
│               │   └── {docId}: EnergyLog
│               ├── vehicles/                   ← Vehículos (misiones)
│               │   └── {docId}: Vehicle
│               ├── bossStep/                   ← Paso Jefe activo
│               │   └── {docId}: BossStep
│               ├── chispazos/                  ← Capturas del Escáner
│               │   └── {docId}: Chispazo
│               ├── subconsciousAnalysis/       ← Análisis del subconsciente
│               │   └── {docId}: SubconsciousAnalysis
│               ├── misiones/                   ← Historial de misiones resueltas
│               │   └── {docId}: Mision
│               ├── progression/                ← Progresión del usuario
│               │   └── {docId}: UserProgression
│               ├── sovereigntyPointsLog/       ← Audit trail de PS
│               │   └── {docId}: SovereigntyPointsLog
│               ├── codices/                    ← Códices de sabiduría
│               │   └── {docId}: SavedCodice
│               ├── hopeLogs/                   ← Registros de esperanza
│               │   └── {docId}: HopeLog
│               ├── meditationSessions/         ← Sesiones de meditación
│               │   └── {docId}: MeditationSession
│               ├── alquimia/                   ← Transmutaciones
│               │   └── {docId}: AlquimiaEntry
│               ├── galeria_aliados/            ← Aliados internos
│               │   └── {docId}: AliadoEntry
│               ├── manual_progress/            ← Progreso en manuales
│               │   └── {manualType}: ManualProgress
│               ├── proyector_hitos/            ← Hitos del proyector
│               │   └── {docId}: ProyectorHito
│               ├── proyecciones/               ← Proyecciones futuras
│               │   └── {docId}: ProyeccionEntry
│               └── historialSistemico/         ← Historial completo
│                   └── {docId}: HistorialSistemicoEntry
│
└── prospectos/                                 ← Colección global de leads
    └── {docId}: Prospecto
```

**Ruta helper**: `getPrivatePath(userId, collection)` genera `artifacts/sistemicar-v2-5/users/{uid}/{collection}`

### 3.3 Autenticación

```
FLUJO DE AUTENTICACIÓN:

1. Usuario llega a /bienvenida
   │
   ├── Opción A: "Entrar con Google"
   │   └── signInWithGoogle() → signInWithPopup(auth, googleProvider)
   │       └── Usuario autenticado con UID permanente
   │
   └── Opción B: "Explorar sin cuenta"
       └── signInAnonymousUser() → signInAnonymously(auth)
           └── Usuario anónimo con UID temporal
               │
               └── Luego puede vincular: linkAnonymousWithGoogle()
                   └── linkWithPopup(auth.currentUser, googleProvider)
                       └── Datos migrados de UID anónimo a UID Google

MIGRACIÓN DE DATOS:
  migrateDataToNewUid(oldUid, newUid)
  → Copia documentos de 7 colecciones del UID viejo al nuevo
  → Colecciones: energyLogs, vehicles, progression, acervo, codices, hopeLog, bossSteps

LISTENER DE ESTADO:
  onAuthChange(callback) → onAuthStateChanged(auth, callback)
  → Dispara en login, logout, o cambio de usuario
```

### 3.4 Patrón de Resiliencia (Modo Soberano)

Todas las 19+ funciones de suscripción implementan el mismo patrón:

```typescript
export function subscribeToXxx(userId, onData, onError) {
  if (isFirebaseConfigured() && db) {
    // 1. FIREBASE: Suscripción en tiempo real
    return onSnapshot(query(collection(db, path)),
      (snapshot) => {
        const data = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        deactivateSovereignModeGlobal();        // 2. ÉXITO: Desactivar modo soberano
        backupToLocal("xxx", data);              // 3. BACKUP: Guardar copia local
        saveLocalXxx(data);                      // 4. LOCAL: Actualizar localStorage
        onData(data);                            // 5. UI: Actualizar interfaz
      },
      (error) => {
        console.error("Firebase Error:", error);
        activateSovereignModeGlobal("Mensaje");  // 6. ERROR: Activar modo soberano
        const localData = restoreFromLocal("xxx") || getLocalXxx();
        onData(localData);                       // 7. FALLBACK: Usar datos locales
        onError(error);
      }
    );
  } else {
    // 8. SIN FIREBASE: Modo 100% local
    onData(getLocalXxx());
    window.addEventListener("xxx-updated", handler);
    return () => window.removeEventListener("xxx-updated", handler);
  }
}
```

**Operaciones de escritura** siguen el mismo patrón:
```typescript
async function addXxx(userId, data) {
  if (isFirebaseConfigured() && db) {
    try {
      return await addDoc(collection(db, path), { ...data, createdAt: serverTimestamp() });
    } catch (error) {
      activateSovereignModeGlobal("Guardando localmente");
      return saveLocally();  // Fallback
    }
  } else {
    return saveLocally();    // Modo local
  }
}
```

### 3.5 Migración de Datos

| Función | Propósito |
|---------|-----------|
| `syncLocalToFirebase(userId)` | Sube datos locales a Firebase (primera sincronización) |
| `migrateDataToNewUid(oldUid, newUid)` | Copia datos entre UIDs (anónimo → Google) |
| `saveMigrationPending(oldUid)` | Marca migración como pendiente |
| `getMigrationPending()` | Lee migración pendiente |
| `clearMigrationPending()` | Limpia flag de migración |
| `findAccountsWithData()` | Busca cuentas existentes con datos |

### 3.6 Todas las Colecciones y sus Operaciones

| Colección | Subscribe | Add | Update | Delete | Extra |
|-----------|-----------|-----|--------|--------|-------|
| `acervo` | ✅ | ✅ | — | — | — |
| `energyLogs` | ✅ | ✅ | — | — | `calculateTotalCP()` |
| `vehicles` | ✅ | ✅ | ✅ | ✅ | `updateVehicleStatus()` |
| `bossStep` | ✅ | ✅ | — | — | `defeatBossStep()`, `archiveBossStep()` |
| `chispazos` | ✅ | ✅ | ✅ | ✅ | `toggleDeseoLoco()` |
| `subconsciousAnalysis` | ✅ | ✅ | — | — | — |
| `misiones` | ✅ | ✅ | — | — | — |
| `progression` | ✅ | — | ✅ | — | `recordMissionResult()`, `checkNewDay()`, `checkCooldown()` |
| `sovereigntyPointsLog` | ✅ | ✅ | — | — | `getDailyPoints()` |
| `codices` | ✅ | ✅ | — | ✅ | — |
| `hopeLogs` | ✅ | ✅ | — | — | `recordHopeAverage()` |
| `meditationSessions` | ✅ | ✅ | — | — | `calculateMeditationStreak()` |
| `alquimia` | ✅ | ✅ | — | — | `subscribeToPublicAlquimia()` |
| `galeria_aliados` | ✅ | ✅ | ✅ | — | `updateAliadoEntry()` |
| `manual_progress` | ✅ | — | ✅ | — | `markManualAsRead()`, `markChecklistItem()` |
| `proyector_hitos` | ✅ | ✅ | ✅ | ✅ | `collapseHito()` |
| `proyecciones` | ✅ | ✅ | ✅ | — | — |
| `prospectos` (global) | — | ✅ | ✅ | — | `getProspectoByEmail()` |
| `historialSistemico` | ✅ | ✅ | — | — | — |

---

## 4. INTERFAZ DE USUARIO

### 4.1 Tema Visual "Alta Alquimia"

El diseño sigue una estética oscura y elegante inspirada en la alquimia:

- **Fondo**: Negro profundo (#020202 páginas, #0a0a0a tarjetas)
- **Efecto de ruido**: Overlay con `opacity-10` para textura sutil
- **Bordes**: Luminosos y semi-transparentes (`border: 1px solid {color}30`)
- **Blur**: `backdrop-blur-2xl` en elementos flotantes
- **Sombras**: `box-shadow: 0 0 40px rgba(color, 0.15)`
- **Esquinas**: Redondeadas agresivamente (`rounded-2xl`, `rounded-full`)

### 4.2 Paleta de Colores Completa

#### Colores Principales del Sistema
| Nombre | Hex | Uso Principal |
|--------|-----|--------------|
| **ORO (GOLD)** | `#D4AF37` | Color primario, RETO, acciones principales, Vehículo Profundo |
| **AZUL (AZURE)** | `#1E90FF` | Color secundario, INTERMEDIO, Vehículo Express, links |
| **ESMERALDA (EMERALD)** | `#50C878` | Éxito, CUMPLIDO, progreso positivo |
| **VIOLETA (VIOLET)** | `#9B59B6` | Reflexión, archivado profundo, meditación |
| **ÁMBAR** | `#f59e0b` | Advertencia, archivado con puntos, momentum |

#### Colores de Fondo
| Nombre | Hex | Uso |
|--------|-----|-----|
| Fondo página | `#020202` | Background principal |
| Fondo tarjeta | `#0a0a0a` | Cards, paneles, inputs |
| Fondo hover | `rgba(255,255,255,0.05)` | Hover states |
| Fondo seleccionado | `{color}10` | Items seleccionados (10% opacidad) |

#### Colores de Texto
| Nombre | Clase Tailwind | Uso |
|--------|----------------|-----|
| Título | `text-white` | Títulos y texto principal |
| Secundario | `text-slate-400` | Texto de soporte |
| Terciario | `text-slate-500` | Labels, subtítulos |
| Muted | `text-slate-600` | Texto menos relevante |
| Placeholder | `text-slate-600` | Inputs vacíos |

#### Colores de Estado
| Estado | Color | Background |
|--------|-------|------------|
| Activo | `#D4AF37` (Oro) | `rgba(212,175,55,0.1)` |
| Cumplido | `#50C878` (Esmeralda) | `rgba(80,200,120,0.1)` |
| Archivado | `#6b7280` (Gris) | `rgba(107,114,128,0.1)` |
| Error | `#ef4444` (Rojo) | `rgba(239,68,68,0.1)` |
| Info | `#3b82f6` (Azul) | `rgba(59,130,246,0.1)` |

#### Colores de Trifecta
| Nivel | Color | Background |
|-------|-------|------------|
| OMITIR | `#374151` | `rgba(55,65,81,0.2)` |
| BLANDO | `#6b7280` | `rgba(107,114,128,0.2)` |
| INTERMEDIO | `#1E90FF` | `rgba(30,144,255,0.2)` |
| RETO | `#D4AF37` | `rgba(212,175,55,0.2)` |

#### Colores de Ejes
| Eje | Color |
|-----|-------|
| ENFOQUE | `#1E90FF` (Azul) |
| CONFLICTO | `#50C878` (Esmeralda) |
| PASOS | `#9B59B6` (Violeta) |
| ALCANCE/LÍMITE | `#D4AF37` (Oro) |

#### Colores de Badges Express
| Tipo | Texto | Background | Color |
|------|-------|------------|-------|
| HORA | Rojo | `rgba(239,68,68,0.2)` | `#ef4444` |
| SITUACIÓN | Púrpura | `rgba(168,85,247,0.2)` | `#a855f7` |
| OMITIR | Gris | `rgba(107,114,128,0.2)` | `#6b7280` |

#### Gradientes
| Uso | Gradiente |
|-----|-----------|
| Barra de PS | `linear-gradient(90deg, #1E90FF 0%, #9B59B6 50%, #D4AF37 100%)` |
| Barra wizard | `linear-gradient(90deg, #1E90FF 0%, #D4AF37 100%)` |
| Hero/Header | `linear-gradient(135deg, #D4AF37 0%, #1E90FF 100%)` |

### 4.3 Tipografía

| Fuente | Uso | Variable CSS |
|--------|-----|-------------|
| **Inter** | Texto general, UI | Font principal |
| **Georgia, serif** | Citas filosóficas, texto de ejes | Italic, reflexivo |
| **JetBrains Mono** | Código, datos técnicos | Monoespaciado |
| **Space Grotesk** | Títulos especiales | Headers destacados |

| Estilo | Clase | Uso |
|--------|-------|-----|
| Título principal | `text-2xl font-black` | H1 de páginas |
| Subtítulo | `text-sm text-slate-500` | Bajo títulos |
| Label | `text-xs uppercase tracking-widest text-slate-500` | Secciones |
| Micro-label | `text-[10px] font-black uppercase tracking-wide` | Badges, trifecta |
| Nano-label | `text-[9px]` | Info complementaria |
| Número grande | `text-lg font-black` | PS, contadores |
| Cita | `text-sm italic text-slate-500` + Georgia | Frases motivacionales |

### 4.4 Componentes de Navegación

#### Sidebar — `client/src/components/sidebar.tsx`

**Desktop**: Barra lateral izquierda con iconos + texto

| Item | Ícono | Ruta |
|------|-------|------|
| Menú | Home | `/menu` |
| Consola | Terminal | `/console` |
| Radar | Radio | `/radar` |
| Sabiduría | Flame | `/alquimia` |
| Planificación | Compass | `/planeacion` |
| Depósito | Sparkles | `/esperanza` |
| Escáner | Camera | `/escaner` |
| Beneficios | Trophy | `/rewards` |
| Analytics | TrendingUp | `/analytics` |
| Tutorial | BookOpen | `/tutorial` |
| Historial | History | `/historial` |
| Códice | Scroll | `/codice` |
| Pagos | CreditCard | `/pagos` |
| Socios | Users | `/socios` |
| Admin | Shield | `/admin-gilson` |

**Mobile**: Bottom navigation bar con iconos principales

#### PageHeader — `client/src/components/page-header.tsx`

Header sticky con información de la página actual:

| Ruta | Título | Subtítulo | Ícono |
|------|--------|-----------|-------|
| `/console` | Espejo | Tu estado emocional ahora | Terminal |
| `/planeacion` | Planificación | Motor de vehículos / 4 Ejes | Compass |
| `/esperanza` | Depósito | Batería de Certeza | Sparkles |
| `/analytics` | Analytics | Tus patrones de energía | TrendingUp |
| `/rewards` | Beneficios | Desbloquea recompensas | Trophy |
| `/tutorial` | Tutorial | Aprende el sistema | BookOpen |
| `/historial` | Historial | Tu recorrido completo | History |

Incluye: botón de logout, avatar del usuario (si tiene), navegación "breadcrumb"

#### Layout — `client/src/components/layout.tsx`

Wrapper que incluye Sidebar + PageHeader + contenido principal. El header solo aparece en: `/console`, `/planeacion`, `/esperanza`, `/analytics`, `/rewards`, `/tutorial`, `/historial`.

### 4.5 Componentes Compartidos

| Componente | Archivo | Propósito |
|------------|---------|-----------|
| **SeductionMessage** | `seduction-message.tsx` | Mensaje IA motivacional contextual |
| **HeroDopamine** | `hero-dopamine.tsx` | Display motivacional: CP total, racha, momentum |
| **BestMomentRecall** | `best-moment-recall.tsx` | Muestra el mejor día histórico |
| **ConfettiCelebration** | `confetti-celebration.tsx` | Animación de confetti para logros |
| **SovereignIndicator** | `sovereign-indicator.tsx` | Indicador de Modo Soberano (offline) |
| **SovereigntyToast** | `sovereignty-toast.tsx` | Toast customizado para PS |
| **CierreJornadaModal** | `cierre-jornada-modal.tsx` | Modal de cierre diario |
| **MasterManualDrawer** | `master-manual-drawer.tsx` | Drawer para manuales de maestría |
| **ShareModal** | `share-modal.tsx` | Modal para compartir contenido |
| **ExtremeForeDashboard** | `extreme-force-dashboard.tsx` | Dashboard de fuerza extrema |
| **AffiliateProposalModal** | `affiliate-proposal-modal.tsx` | Modal de propuesta de afiliación |
| **FunnelComponents** | `funnel-components.tsx` | AllianceProposalModal + CooldownOverlay |
| **DataStatus** | `data-status.tsx` | Panel de estado de datos locales |
| **Onboarding** | `onboarding.tsx` | Flujo de onboarding |
| **TooltipOrientacion** | `tooltip-orientacion.tsx` | Tooltips orientativos |
| **StatusAlianza** | `status-alianza.tsx` | Estado de la alianza |
| **ResumenDiario** | `resumen-diario.tsx` | Resumen diario compacto |
| **PayPalButton** | `PayPalButton.tsx` | Botón de pago PayPal |

#### Componentes Base (shadcn/ui)

Todos ubicados en `client/src/components/ui/`:

`Accordion`, `AlertDialog`, `Avatar`, `Badge`, `Breadcrumb`, `Button`, `Card`, `Carousel`, `Checkbox`, `Command`, `Dialog`, `Input`, `InputOTP`, `Label`, `Menubar`, `NavigationMenu`, `Pagination`, `Popover`, `Progress`, `RadioGroup`, `Resizable`, `ScrollArea`, `Select`, `Separator`, `Sheet`, `Switch`, `Tabs`, `Textarea`, `Tooltip`

### 4.6 Animaciones (Framer Motion)

Patrones de animación consistentes en toda la app:

| Patrón | Configuración | Uso |
|--------|--------------|-----|
| Fade-in | `opacity: 0→1` | Contenido que aparece |
| Slide-up | `opacity: 0→1, y: 20→0` | Cards, secciones |
| Slide-down | `opacity: 0→1, y: -20→0` | Headers |
| Slide-right | `opacity: 0→1, x: 50→0` | Wizard steps (entrada) |
| Slide-left | `opacity: 0→1, x: -50→0` | Wizard steps (salida) |
| Scale | `scale: 1.02` | Hover en botones |
| Bar fill | `width: 0→N%` | Barras de progreso |
| Layout | `layout` | Reordenamiento de listas |
| Expand | `height: 0→auto` | Expandir acordeones |

### 4.7 Estructura Visual General de Páginas

Todas las páginas siguen este patrón:

```
┌──────────────────────────────────────────┐
│  [Sidebar] ← Solo en desktop             │
│  ┌────────────────────────────────────┐  │
│  │  [PageHeader] ← Sticky             │  │
│  │  Título | Subtítulo | Logout       │  │
│  ├────────────────────────────────────┤  │
│  │                                    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │  [Badge/Icono] Módulo      │    │  │  ← Header del módulo
│  │  │  TÍTULO EN MAYÚSCULAS      │    │  │
│  │  │  Subtítulo descriptivo     │    │  │
│  │  └────────────────────────────┘    │  │
│  │                                    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │  Barra de PS      XXX PS  │    │  │  ← Barra de progreso
│  │  │  ██████████░░░░ XX%       │    │  │
│  │  └────────────────────────────┘    │  │
│  │                                    │  │
│  │  [SeductionMessage / IA]           │  │  ← Mensaje motivacional
│  │                                    │  │
│  │  ┌────────────────────────────┐    │  │
│  │  │  [Contenido principal]     │    │  │  ← Formularios, listas, etc.
│  │  │  ...                       │    │  │
│  │  └────────────────────────────┘    │  │
│  │                                    │  │
│  └────────────────────────────────────┘  │
│  [Bottom Nav] ← Solo en mobile           │
└──────────────────────────────────────────┘

Padding: p-4 pb-24 (espacio para bottom nav en mobile)
Max width: max-w-lg mx-auto (contenido centrado)
Background: #020202
```

### 4.8 Botones y Acciones Principales

#### Estilos de Botón por Tipo

| Tipo | Estilo | Ejemplo de Uso |
|------|--------|---------------|
| **Primario** | `bg-[#D4AF37] text-black font-bold rounded-full py-4` | Lanzar Vehículo, Confirmar |
| **Secundario** | `border border-[#1E90FF] text-[#1E90FF] rounded-full` | Detallar 4 Ejes |
| **Éxito** | `bg-[#50C878]/20 text-[#50C878] border border-[#50C878]/40 rounded-full` | CUMPLIDO |
| **Peligro** | `bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/40 rounded-full` | INCUMPLIDO |
| **Fantasma** | `text-slate-400 bg-white/5 rounded-full` | Archivar Simple, Cancelar |
| **Texto** | `text-xs text-slate-500 hover:text-slate-400` | Cancelar (texto) |
| **Icono** | `p-2 rounded-full hover:bg-white/5` | Cerrar (X), Editar (lápiz) |
| **Badge** | `text-[10px] px-2 py-0.5 rounded-full font-bold uppercase` | Trifecta labels, rangos |
| **Selector** | `p-4 rounded-2xl border-2 flex flex-col items-center gap-2` | Express/Profundo selector |

#### Botones de Acción Global

| Botón | Ubicación | Ícono | Color |
|-------|-----------|-------|-------|
| Entrar con Google | /acceso | — | Blanco |
| Explorar sin cuenta | /acceso | — | Gris |
| Cerrar sesión | PageHeader/Sidebar | LogOut | Rojo |
| Lanzar Vehículo | Planificación | Rocket | Oro |
| CUMPLIDO | VehicleCard | Check | Esmeralda |
| INCUMPLIDO | VehicleCard Express | X | Ámbar |
| Archivar | VehicleCard Profundo | Archive | Gris |
| Guardar Registro | Espejo | Check | Oro |
| Capturar Chispazo | Escáner | Plus | Azul |
| Transmutación | Alquimia | Flame | Oro |
| Cierre de Jornada | Menú/Modal | Moon | Violeta |
| Ver Manual | ManualTrigger | BookOpen | Azul |
| Compartir | ShareModal | Share | Azul |
| Pagar | Pagos | CreditCard | Oro |

### 4.9 Iconos (Lucide React)

Iconos principales usados en la aplicación:

| Ícono | Uso |
|-------|-----|
| `Home` | Menú principal |
| `Terminal` | Espejo/Consola |
| `Compass` | Planificación |
| `Target` | Vehículo Profundo |
| `Zap` | Vehículo Express, energía |
| `Sparkles` | Depósito, esperanza |
| `Flame` | Alquimia |
| `Radio` | Radar |
| `Camera` | Escáner |
| `Trophy` | Beneficios, logros |
| `TrendingUp` | Analytics |
| `BookOpen` | Tutorial, manuales |
| `History` | Historial |
| `Scroll` | Códice |
| `CreditCard` | Pagos |
| `Users` | Socios |
| `Shield` | Admin, protección |
| `Rocket` | Lanzar vehículo |
| `Check` | Completar, confirmar |
| `X` | Cerrar, cancelar, incumplido |
| `ChevronRight/Left` | Navegación wizard |
| `ChevronUp/Down` | Expandir/colapsar |
| `Pencil` | Editar |
| `Archive` | Archivar |
| `Flag` | Circunstancia |
| `Clock` | Tiempo, hora |
| `LogOut` | Cerrar sesión |
| `Menu` | Menú hamburguesa (mobile) |
| `Moon` | Cierre de jornada |
| `Star` | Favorito, destacado |
| `Eye` | Ver, observar |

### 4.10 Toasts y Notificaciones (Sonner)

El sistema usa `sonner` para notificaciones con estilo personalizado:

```typescript
toast.success("Mensaje", {
  style: {
    border: `1px solid ${COLOR}`,
    backgroundColor: "#0a0a0a",
    color: "#fff"
  }
});
```

| Tipo | Color Borde | Uso |
|------|-------------|-----|
| Success (Oro) | `#D4AF37` | Victoria, creación exitosa |
| Success (Verde) | `#50C878` | Misión cumplida |
| Success (Azul) | `#1E90FF` | Express creado |
| Success (Violeta) | `#9B59B6` | Reflexión profunda |
| Warning (Ámbar) | `#f59e0b` | Archivado con puntos |
| Error (Rojo) | `#ef4444` | Error de operación |
| Info (Gris) | `#6b7280` | Archivado sin puntos |

### 4.11 Responsividad

| Breakpoint | Comportamiento |
|------------|---------------|
| Mobile (<768px) | Bottom nav, sin sidebar, layout vertical, padding reducido |
| Desktop (≥768px) | Sidebar lateral, layout con margen izquierdo |

La aplicación está diseñada **mobile-first** ya que el público objetivo accede principalmente desde celular.

---

*Especificación Técnica Completa del Proyecto SISTEMICAR v2.5*  
*Generada: Febrero 2026*  
*Líneas de código documentadas: ~15,000+*  
*Archivo fuente principal: persistence.ts (3,486 líneas)*  
*Total páginas: 32 | Total colecciones Firebase: 18 | Total endpoints API: 10*
