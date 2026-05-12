# ESPECIFICACIÓN TÉCNICA: MÓDULO DE PLANIFICACIÓN
## SISTEMICAR v2.5 - Motor de Vehículos

**Archivo fuente**: `client/src/pages/planeacion.tsx` (1,597 líneas)  
**Persistencia**: `client/src/lib/persistence.ts`  
**Ruta**: `/planeacion` (ArquitectoRoute - requiere rank "arquitecto" o ser Owner)  
**Acceso**: Solo usuarios con plan Arquitecto ($24.99/mes) o el propietario (gilsonarevalo.leo@gmail.com)

---

## TABLA DE CONTENIDOS

1. [Lógica de Funcionamiento](#1-lógica-de-funcionamiento)
2. [Funciones Principales del Código](#2-funciones-principales-del-código)
3. [Conexión con Firebase](#3-conexión-con-firebase)
4. [Interfaz de Usuario](#4-interfaz-de-usuario)

---

## 1. LÓGICA DE FUNCIONAMIENTO

### 1.1 Concepto General

El módulo de Planificación es un **sistema dual de vehículos** (misiones) que permite al usuario definir, ejecutar y resolver tareas con diferentes niveles de profundidad. Cada vehículo es una misión que se puede completar ("cumplido") o archivar ("archivado"), y el sistema otorga **Puntos de Soberanía (PS)** según la dificultad elegida y el resultado.

**Filosofía core**: El coraje de INTENTAR un RETO tiene valor intrínseco. Incluso si una misión difícil se archiva (no se completa), el usuario recibe PS por haberse atrevido.

### 1.2 Dos Tipos de Vehículos

#### VEHÍCULO EXPRESS
- Creación rápida, sin ejes de conciencia
- Solo requiere: nombre + tipo de término
- Ideal para tareas del día a día
- Rango de PS: **1-10 PS**

#### VEHÍCULO PROFUNDO
- Creación guiada en 7 pasos (wizard)
- Requiere: nombre + criterio de fin + 4 ejes de conciencia
- Ideal para misiones de transformación personal
- Rango de PS: **10-50+ PS**

### 1.3 Sistema Trifecta (4 Niveles de Conciencia)

Cada eje de un Vehículo Profundo tiene un nivel de "trifecta" que se asigna **automáticamente** según la cantidad de detalles que el usuario escribe:

| Nivel | Detalles requeridos | Color | Significado |
|-------|-------------------|-------|-------------|
| **OMITIR** | 0 | Gris (#374151) | Eje no completado |
| **BLANDO** | 1 detalle (>5 chars) | Gris (#6b7280) | Conciencia mínima |
| **INTERMEDIO** | 2 detalles | Azul (#1E90FF) | Conciencia media |
| **RETO** | 3+ detalles | Oro (#D4AF37) | Máxima conciencia |

**Detección automática**: La función `countDetails()` cuenta líneas separadas por punto, coma, punto y coma, o salto de línea, filtrando las que tienen más de 5 caracteres. La función `getAutoTrifecta()` mapea ese conteo al nivel correspondiente.

```
0 detalles → OMITIR
1 detalle  → BLANDO
2 detalles → INTERMEDIO
3+ detalles → RETO
```

### 1.4 Sistema de Puntos de Soberanía (PS)

#### Express: Puntos por Tipo de Término
| Tipo | PS al Completar | PS al Archivar (Incumplido) |
|------|----------------|---------------------------|
| **HORA** | +10 PS | +5 PS |
| **SITUACIÓN** | +5 PS | +2 PS |
| **OMITIR** | +1 PS | +0 PS |

#### Profundo: Puntos por Ejes (calculateVehiclePoints)
Los PS se calculan multiplicando la **base del eje** × el **multiplicador del nivel trifecta**:

| Eje | Base PS |
|-----|---------|
| ENFOQUE | 5 |
| CONFLICTO | 10 |
| PASOS | 15 |
| ALCANCE | 20 |
| **Total base** | **50** |

| Nivel Trifecta | Multiplicador |
|----------------|--------------|
| OMITIR | ×0.25 |
| BLANDO | ×0.50 |
| INTERMEDIO | ×0.75 |
| RETO | ×1.0 |

**Ejemplo**: Un vehículo con ENFOQUE=RETO, CONFLICTO=INTERMEDIO, PASOS=BLANDO, ALCANCE=RETO:
- ENFOQUE: 5 × 1.0 = 5 PS
- CONFLICTO: 10 × 0.75 = 7.5 PS
- PASOS: 15 × 0.50 = 7.5 PS
- ALCANCE: 20 × 1.0 = 20 PS
- **Total: 40 PS**

**Vehículo Panorama** (todos los ejes en OMITIR): otorga exactamente **1 PS**.

#### Profundo: CP (Command Points) por Dificultad de Misión
Además de los PS, el sistema también otorga CP basados en la dificultad global:

**CUMPLIDO (Misión completada):**
| Condición | CP Base | Fórmula |
|-----------|---------|---------|
| Misión DIFÍCIL (≥1 RETO) | 35 CP | `35 + (retoCount - 1) × 10 + intermedioCount × 5` |
| Misión MEDIA (≥1 INTERMEDIO o ≥2 BLANDOS) | 20 CP | `20 + intermedioCount × 3` |
| Misión FÁCIL | 10 CP | Fijo |

**ARCHIVADO (Misión no completada):**
| Condición | CP Base | Fórmula |
|-----------|---------|---------|
| Misión DIFÍCIL (≥1 RETO) | 15 CP | `15 + (retoCount - 1) × 5 + intermedioCount × 3` |
| Misión MEDIA | 5 CP | `5 + intermedioCount × 2` |
| Misión FÁCIL | 0 CP | Sin puntos |

### 1.5 Archivado con Reflexión

Los Vehículos Profundos pueden archivarse con reflexión adicional por cada eje:

- Cada reflexión con texto significativo (>5 chars) otorga **+2 CP bonus**
- Los PS de archivado se calculan con `calculateArchivePoints()`:
  - Techo máximo: 50% de los PS potenciales del vehículo
  - Bonus por justificación: +4 PS por cada eje justificado
  - El resultado final es `min(bonus total, techo)`

### 1.6 Clasificación de Dificultad

La función `calculateVehicleScore()` clasifica cada vehículo:

| Dificultad | Condición | Label | Color |
|------------|-----------|-------|-------|
| FÁCIL | Sin RETO ni múltiples BLANDOS/INTERMEDIOS | "FÁCIL" | Gris (#6b7280) |
| MEDIA | ≥1 INTERMEDIO o ≥2 BLANDOS (sin RETO) | "MEDIA" | Azul (#1E90FF) |
| DIFÍCIL | ≥1 RETO en cualquier eje | "DIFÍCIL" | Oro (#D4AF37) |

### 1.7 Progresión y Rachas

Al completar misiones difíciles (con RETO) consecutivamente:
- **3 misiones difíciles seguidas** = "RETO DE GUERRERO COMPLETADO"
- El sistema trackea `consecutiveMissionStreak`
- Completar una misión no-RETO resetea la racha a 0
- Ascensos automáticos según CP acumulados:
  - 50+ CP: Rango Operador
  - 500+ CP: Rango Arquitecto

### 1.8 Flujo del Vehículo Express

```
[Pantalla Selector]
    │
    ├── Clic "Vehículo Express"
    │       │
    │       ├── Input: Nombre de la Misión (mín. 3 chars)
    │       │
    │       ├── Seleccionar tipo de término:
    │       │     ├── "Hora de Término" (+10/+5 PS)
    │       │     │     └── Input: ¿A qué hora? (tipo time)
    │       │     │           └── Botón "Lanzar Vehículo" → addVehicle()
    │       │     │
    │       │     ├── "Situación de Término" (+5/+2 PS)
    │       │     │     └── Input: ¿Qué circunstancia? (texto)
    │       │     │           └── Botón "Lanzar Vehículo" → addVehicle()
    │       │     │
    │       │     └── "Omitir" (+1/+0 PS)
    │       │           └── Guarda inmediatamente → addVehicle()
    │       │
    │       └── [Vehículo creado como "activo"]
    │
    └── [Lista de Vehículos Express activos]
          ├── Clic tarjeta → Expandir detalles
          ├── Botón "CUMPLIDO" → handleStatusChange("cumplido")
          └── Botón "INCUMPLIDO" → handleStatusChange("archivado")
```

### 1.9 Flujo del Vehículo Profundo (7 Pasos)

```
[Pantalla Selector]
    │
    ├── Clic "Vehículo Profundo"
    │       │
    │       Paso 1: TÍTULO
    │       │  └── Input: Nombre de la misión (mín. 3 chars)
    │       │
    │       Paso 2: CRITERIO DE FIN
    │       │  ├── Toggle: Tiempo / Circunstancia
    │       │  └── Input: Detalle del criterio (mín. 3 chars)
    │       │
    │       Paso 3: ENFOQUE
    │       │  └── Textarea → auto-detecta nivel trifecta
    │       │
    │       Paso 4: CONFLICTO
    │       │  └── Textarea → auto-detecta nivel trifecta
    │       │
    │       Paso 5: PASOS
    │       │  └── Textarea → auto-detecta nivel trifecta
    │       │
    │       Paso 6: ALCANCE
    │       │  └── Textarea → auto-detecta nivel trifecta
    │       │
    │       Paso 7: CONFIRMAR
    │       │  └── Resumen visual + Botón "Lanzar Vehículo"
    │       │       └── handleSave() → addVehicle()
    │       │
    │       [Vehículo creado como "activo"]
    │
    └── [Lista de Vehículos Profundos activos]
          ├── Clic tarjeta → Expandir detalles con ejes
          ├── Botón lápiz por eje → Edición inline
          ├── Botón "DETALLAR 4 EJES" → Re-abrir wizard
          ├── Botón "CUMPLIDO" → handleStatusChange("cumplido")
          ├── Botón "Archivar Simple" → handleStatusChange("archivado")
          └── Botón "Archivar + Reflexión" → handleArchiveWithReflection()
```

### 1.10 Estados de un Vehículo

| Estado | Significado | Color |
|--------|-------------|-------|
| `activo` | Misión en curso | Oro (#D4AF37) |
| `cumplido` | Misión completada exitosamente | Esmeralda (#50C878) |
| `archivado` | Misión no completada / abandonada | Gris (#6b7280) |

---

## 2. FUNCIONES PRINCIPALES DEL CÓDIGO

### 2.1 Funciones en `planeacion.tsx`

#### `Planeacion()` — Componente Principal
- Estado: `vehicles`, `isCreating`, `editingVehicle`, `currentStep`, `vehicleMode`
- Suscripciones: vehicles, progression, energyLogs
- Renderizado condicional: selector → express → profundo

#### `handleSave()`
- Guarda o actualiza un Vehículo Profundo
- Si `editingVehicle` existe: usa `updateVehicle()`
- Si es nuevo: usa `addVehicle()`
- Muestra toast de éxito y resetea formulario

#### `handleQuickSaveAndNew(tipoTermino, detalle?)`
- Guarda un Vehículo Express con todos los ejes en OMITIR
- Parámetros: tipo de término (`hora` | `situacion` | `omitido`) + detalle opcional
- Usa `addVehicle()` con ejes vacíos
- Mantiene el campo de título para crear otro rápidamente

#### `handleStatusChange(vehicleId, status)`
- Cambia el estado de un vehículo a "cumplido" o "archivado"
- Calcula scores por eje (`trifectaToScore`)
- Guarda misión con `saveMision()`
- Calcula CP según dificultad y resultado
- Registra resultado con `recordMissionResult()`
- Actualiza status con `updateVehicleStatus()`
- Para Express: calcula PS adicionales por tipo de término
- Para Profundo cumplido: calcula PS con `calculateVehiclePoints()`
- Otorga PS con `awardSovereigntyPoints()`
- Muestra toasts según resultado (victoria épica, ascenso, racha, archivado)

#### `handleArchiveWithReflection(vehicleId, reflections)`
- Archiva un Vehículo Profundo con reflexiones por eje
- Bonus: +2 CP por cada reflexión con texto >5 chars
- Calcula `archivePoints` con `calculateArchivePoints()` (máx 50% de PS potenciales)
- Guarda misión, registra resultado, actualiza status, otorga PS

#### `handleQuickEditEje(vehicleId, ejeKey, newText, newTrifecta)`
- Edita un eje específico de un vehículo activo en línea
- Usa `updateVehicle()` con ejes actualizados

#### `handleEdit(vehicle)`
- Carga datos de un vehículo existente en el formulario de edición
- Detecta automáticamente si es Express o Profundo
- Re-abre el wizard en el paso 0

#### `resetForm()`
- Limpia todos los campos del formulario
- Resetea: título, criterio, ejes (todos a BLANDO), currentStep, vehicleMode

#### `canProceed()`
- Valida si el paso actual está completo para avanzar al siguiente
- Título: mín. 3 chars
- Criterio: mín. 3 chars
- Ejes: texto requerido si trifecta no es OMITIR

#### `countDetails(text)`
- Cuenta detalles separados por `.` `,` `;` o `\n`
- Filtra líneas con menos de 5 caracteres
- Retorna máximo 3

#### `getAutoTrifecta(text)`
- Mapea conteo de detalles a nivel trifecta
- 0 → omitir, 1 → blando, 2 → intermedio, 3+ → reto

#### `calculateVehicleScore(vehicle)` — Función auxiliar
- Calcula: dificultad, PS potenciales (cumplido y archivado), porcentaje de score
- Para Express: usa tabla de puntos por tipo de término
- Para Profundo: usa lógica de CP por dificultad

#### `VehicleCard` — Componente de Tarjeta
- Props: vehicle, expanded, callbacks (onToggle, onComplete, onArchive, onArchiveWithReflection, onQuickEditEje, onDetail)
- Estado interno: showReflectionMode, reflections, editingEje
- Muestra: título, badge tipo (Express), barra de dificultad, PS potenciales, ejes expandibles
- Modo edición inline de ejes con selector de trifecta

### 2.2 Funciones en `persistence.ts`

#### `subscribeToVehicles(userId, onData, onError)`
- **Línea**: 460
- Suscripción en tiempo real a la colección de vehículos
- Firebase: `onSnapshot` sobre `users/{uid}/vehicles`
- Ordena por `createdAt` descendente
- Fallback a localStorage si Firebase falla (Modo Soberano)

#### `addVehicle(userId, vehicle)`
- **Línea**: 497
- Crea un nuevo vehículo con status "activo"
- Firebase: `addDoc` a la colección `vehicles`
- Campos automáticos: `id`, `userId`, `status: "activo"`, `createdAt: serverTimestamp()`
- Retorna el ID del documento creado

#### `updateVehicleStatus(userId, vehicleId, status)`
- **Línea**: 538
- Actualiza el estado de un vehículo
- Si status = "cumplido": agrega `completedAt: serverTimestamp()`
- Firebase: `updateDoc`

#### `updateVehicle(userId, vehicleId, updates)`
- **Línea**: 583
- Actualización parcial de campos (título, criterioFin, criterioDetalle, ejes)
- Firebase: `updateDoc`

#### `deleteVehicle(userId, vehicleId)`
- **Línea**: 572
- Elimina un vehículo permanentemente
- Firebase: `deleteDoc`

#### `saveMision(userId, mision)`
- **Línea**: 1083
- Guarda el resultado de una misión (completada o archivada)
- Datos: título, estado, scores por eje, soberaniaMomento, comentario
- Firebase: `addDoc` a colección `misiones`

#### `recordMissionResult(userId, isHardMissionSuccess, missionCompleted, points)`
- **Línea**: 1347
- Registra el resultado de una misión en la progresión del usuario
- Actualiza: streak de misiones, total de misiones, puntos
- Detecta: reto guerrero completado (3 consecutivas difíciles)
- Detecta: ascensos de rango (50+ → operador, 500+ → arquitecto)
- Retorna: `{ streak, challengeCompleted, newRank }`

#### `calculateVehiclePoints(axes, isPanorama)`
- **Línea**: 1826
- Calcula PS totales de un vehículo profundo
- Panorama (todo OMITIR) = 1 PS
- Normal: suma de (base × multiplicador) por cada eje

#### `calculateArchivePoints(potentialPoints, justifications)`
- **Línea**: 1851
- Calcula PS recuperables al archivar con justificaciones
- Techo: 50% de los PS potenciales
- Bonus: +4 PS por cada eje con justificación
- Resultado: `min(bonus total, techo)`

#### `getSovereigntyPointsBreakdown()`
- **Línea**: 1807
- Retorna la configuración completa del sistema de puntos:
  ```
  planning: {
    basesByAxis: { enfoque: 5, conflicto: 10, pasos: 15, alcance: 20 },
    multipliers: { omitir: 0.25, blando: 0.50, intermedio: 0.75, reto: 1.0 },
    panoramaPoints: 1
  },
  archiving: {
    maxRecoveryPercent: 0.50,
    justificationBonus: 4
  }
  ```

#### `awardSovereigntyPoints(userId, amount, source)`
- Otorga PS con audit trail completo
- Registra en `sovereigntyPointsLog`: source, amount, timestamp
- Actualiza `sovereigntyPoints` en progression

---

## 3. CONEXIÓN CON FIREBASE

### 3.1 Colecciones Firestore Utilizadas

| Colección | Ruta | Uso |
|-----------|------|-----|
| `vehicles` | `users/{uid}/vehicles` | Vehículos activos y archivados |
| `misiones` | `users/{uid}/misiones` | Historial de misiones resueltas |
| `progression` | `users/{uid}/progression` | Progresión del usuario (rank, CP, streak) |
| `energyLogs` | `users/{uid}/energyLogs` | Registros del Espejo (lectura para SeductionMessage) |
| `sovereigntyPointsLog` | `users/{uid}/sovereigntyPointsLog` | Audit trail de PS otorgados |

### 3.2 Esquema de Documento: Vehicle

```typescript
interface Vehicle {
  id: string;                    // ID auto-generado por Firestore
  userId: string;                // UID del usuario
  titulo: string;                // Nombre de la misión
  criterioFin: "tiempo" | "circunstancia";  // Tipo de criterio de fin
  criterioDetalle: string;       // Detalle del criterio
  tiempoInicio: Date;            // Fecha de creación
  ejes: {
    enfoque:   { text: string; trifecta: TrifectaState };
    conflicto: { text: string; trifecta: TrifectaState };
    pasos:     { text: string; trifecta: TrifectaState };
    limite:    { text: string; trifecta: TrifectaState };
  };
  status: "activo" | "cumplido" | "archivado";
  createdAt: Date;               // Timestamp del servidor
  completedAt?: Date;            // Solo si status = "cumplido"
  tipoTerminoRapido?: "hora" | "situacion" | "omitido";  // Solo Express
}
```

### 3.3 Esquema de Documento: Mision

```typescript
interface Mision {
  id: string;
  userId: string;
  titulo: string;
  estado: "cumplido" | "archivado";
  scores: {
    enfoque: number;    // 0, 50, 75, o 100
    conflicto: number;
    pasos: number;
    limite: number;
  };
  soberaniaMomento: number;  // Promedio de scores (0-100)
  comentario: string | null;
  createdAt: Date;
}
```

### 3.4 Patrón de Resiliencia: Modo Soberano

Todas las operaciones implementan un patrón dual Firebase/localStorage:

1. **Intenta Firebase primero**: `addDoc()`, `updateDoc()`, `onSnapshot()`
2. **Si falla**: Activa "Modo Soberano" y usa localStorage como fallback
3. **Eventos locales**: `window.dispatchEvent(new CustomEvent("vehicles-updated"))` para notificar cambios
4. **Backup automático**: `backupToLocal()` guarda copia local de datos de Firebase exitosos

```
Firebase disponible:
  addDoc(collection(db, "users/{uid}/vehicles"), data)
  → Éxito: datos en Firestore
  → onSnapshot detecta cambio → actualiza UI

Firebase no disponible:
  localStorage.setItem("sistemicar_vehicles", JSON.stringify(data))
  → window.dispatchEvent("vehicles-updated")
  → Listener local actualiza UI
  → Mensaje: "Usando datos locales de vehículos"
```

### 3.5 Suscripciones en Tiempo Real

El componente se suscribe a 3 colecciones al montarse:

```typescript
useEffect(() => {
  if (!user) return;
  const unsubscribe = subscribeToVehicles(user.uid, setVehicles, console.error);
  return unsubscribe;  // Cleanup al desmontar
}, [user]);

useEffect(() => {
  if (!user) return;
  const unsubscribe = subscribeToProgression(user.uid, setProgression, console.error);
  return unsubscribe;
}, [user]);

useEffect(() => {
  if (!user) return;
  const unsubscribe = subscribeToEnergyLogs(user.uid, setEnergyLogs, console.error);
  return unsubscribe;
}, [user]);
```

### 3.6 Operaciones de Escritura

| Acción | Función Firebase | Colección |
|--------|-----------------|-----------|
| Crear vehículo | `addDoc()` | `vehicles` |
| Actualizar campos | `updateDoc()` | `vehicles` |
| Cambiar status | `updateDoc()` | `vehicles` |
| Eliminar vehículo | `deleteDoc()` | `vehicles` |
| Guardar misión | `addDoc()` | `misiones` |
| Actualizar progresión | `updateDoc()` | `progression` |
| Registrar PS | `addDoc()` | `sovereigntyPointsLog` |

---

## 4. INTERFAZ DE USUARIO

### 4.1 Paleta de Colores

| Variable | Hex | Uso |
|----------|-----|-----|
| `GOLD` | #D4AF37 | Color principal, RETO, Vehículo Profundo, botón Lanzar |
| `AZURE` | #1E90FF | Vehículo Express, INTERMEDIO, eje ENFOQUE |
| `EMERALD` | #50C878 | Botón CUMPLIDO, eje CONFLICTO, éxito |
| `VIOLET` | #9B59B6 | Eje PASOS, archivado con reflexión |
| Fondo principal | #020202 | Background de la página |
| Fondo tarjetas | #0a0a0a | Background de cards y paneles |
| Gris slate | #6b7280 | OMITIR, BLANDO, elementos secundarios |
| Ámbar | #f59e0b | Archivado con puntos |

### 4.2 Estructura Visual de la Página

```
┌─────────────────────────────────────┐
│         🚀 Motor de Vehículos       │  ← Header con icono Rocket
│           PLANIFICACIÓN              │  ← Título + ManualTriggerButton
│  Define y lanza tus misiones...     │  ← Subtítulo
├─────────────────────────────────────┤
│  Puntos de Soberanía     XXX PS     │  ← Barra de PS (gradient AZUL→VIOLETA→ORO)
│  ████████████░░░░░░  XX% hacia 1000 │  ← Progress bar animada
├─────────────────────────────────────┤
│  [SeductionMessage IA]              │  ← Mensaje motivacional contextual
├─────────────────────────────────────┤
│                                     │
│  ┌────────────┐  ┌────────────┐     │
│  │ ⚡ Express  │  │ 🎯 Profundo│     │  ← Grid 2 columnas
│  │  Rápido    │  │  Con 4 ejes │     │
│  │  2-10 PS   │  │  10-50+ PS  │     │
│  └────────────┘  └────────────┘     │
│                                     │
│  ⚡ VEHÍCULOS EXPRESS               │  ← Sección Express (si hay)
│  ┌─ Pendientes ──────────────────┐  │
│  │ ● Nombre [HORA]   10 PS      │  │  ← VehicleCard
│  │ ● Nombre [SITUACIÓN] 5 PS    │  │
│  └───────────────────────────────┘  │
│                                     │
│  🎯 VEHÍCULOS PROFUNDOS             │  ← Sección Profundos (si hay)
│  ┌─ Pendientes ──────────────────┐  │
│  │ ● Nombre  [DIFÍCIL]  35 PS   │  │  ← VehicleCard
│  │   ███████████░░░  75%         │  │  ← Barra de score
│  └───────────────────────────────┘  │
│                                     │
└─────────────────────────────────────┘
```

### 4.3 Pantalla de Creación Express

```
┌─────────────────────────────────────┐
│  ⚡ VEHÍCULO EXPRESS           [✕]  │
├─────────────────────────────────────┤
│  Nombre de la Misión                │
│  ┌─────────────────────────────────┐│
│  │ Ej: Llamar a 3 clientes        ││  ← Input con borde AZURE al escribir
│  └─────────────────────────────────┘│
│                                     │
│  ¿Cómo medirás el término?          │
│                                     │
│  ┌─────────────────────────────────┐│
│  │ 🕐 Hora de Término      +10 PS ││  ← Botón ORO
│  │    Define cuándo termina (5 si  ││
│  │    no cumple)                   ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ 🚩 Situación de Término  +5 PS ││  ← Botón AZUL
│  │    Define qué circunstancia (2  ││
│  │    si no cumple)                ││
│  └─────────────────────────────────┘│
│  ┌─────────────────────────────────┐│
│  │ ✕ Omitir                 +1 PS ││  ← Botón GRIS (guarda inmediato)
│  │    Sin criterio (0 si no cumple)││
│  └─────────────────────────────────┘│
│                                     │
│            Cancelar                 │
└─────────────────────────────────────┘
```

**Si selecciona "Hora" o "Situación"**, aparece un sub-panel:
```
┌─────────────────────────────────────┐
│  🕐 ¿A qué hora termina?           │  (o 🚩 ¿Qué circunstancia?)
│  ┌─────────────────────────────────┐│
│  │ [Input tipo time / texto]       ││
│  └─────────────────────────────────┘│
│  ┌──────────┐  ┌──────────────────┐ │
│  │  Atrás   │  │ Lanzar Vehículo  │ │  ← Botón ORO/AZUL
│  └──────────┘  └──────────────────┘ │
└─────────────────────────────────────┘
```

### 4.4 Pantalla de Creación Profunda (Wizard)

**Barra de progreso superior**:
```
Paso X de 7 - [Descripción del paso]   [Ver N Activos]
████████████████░░░░░░░░░░  XX%
0%                                    100%
```

**Paso 1: TÍTULO**
```
  Nombra tu Misión
  "El nombre define la intención. Sé preciso."  ← Cursiva Georgia
  ┌─────────────────────────────────────┐
  │ Ej: Dominar React en 30 días        │  ← Borde ORO al escribir
  └─────────────────────────────────────┘
```

**Paso 2: CRITERIO DE FIN**
```
  Criterio de Fin
  "¿Cómo sabrás que has terminado?"
  ┌─────────────┐  ┌─────────────┐
  │ 🕐 Tiempo   │  │ 🚩 Circunst.│  ← Dos botones toggle
  └─────────────┘  └─────────────┘
  ┌─────────────────────────────────┐
  │ Ej: En 2 semanas                │
  └─────────────────────────────────┘
```

**Pasos 3-6: EJES (ENFOQUE, CONFLICTO, PASOS, ALCANCE)**
```
  ┌──┐
  │🎯│ ENFOQUE                     ← Icono + color del eje
  └──┘ ¿Qué quieres lograr?
  
  ┌─────────┬─────────┬───────────┬──────┐
  │ OMITIR  │ BLANDO  │INTERMEDIO │ RETO │  ← Barra de nivel auto
  └─────────┴─────────┴───────────┴──────┘
  
  "2 detalles = INTERMEDIO. Uno más para RETO."
  
  ┌──────────────────────────────────────┐
  │ Escribe tus detalles separados por   │  ← Textarea 4 filas, Georgia italic
  │ punto, coma o salto de línea...      │
  └──────────────────────────────────────┘
```

**Paso 7: CONFIRMAR**
```
  Confirmar Lanzamiento
  ┌──────────────────────────────────────┐
  │ Misión     │  Dominar React          │
  │ Criterio   │  En 2 semanas           │
  │────────────┼─────────────────────────│
  │ 🎯 ENFOQUE │  RETO                   │
  │ ⚡ CONFLICTO│ INTERMEDIO              │
  │ 👣 PASOS   │  BLANDO                 │
  │ 🛡 ALCANCE │  RETO                   │
  └──────────────────────────────────────┘
```

**Navegación del wizard**:
```
  ┌──────────────┐  ┌──────────────────────┐
  │  ◀ Atrás     │  │    Siguiente ▶       │  ← Botón ORO
  └──────────────┘  └──────────────────────┘
  
  (Último paso):
  ┌──────────────┐  ┌──────────────────────┐
  │  ◀ Atrás     │  │ 🚀 Lanzar Vehículo  │  ← Botón ORO
  └──────────────┘  └──────────────────────┘
  
  (Editando):
  ┌──────────────┐  ┌──────────────────────┐
  │  ◀ Atrás     │  │ ✏️ Actualizar        │  ← Botón ORO
  └──────────────┘  └──────────────────────┘
```

### 4.5 VehicleCard (Tarjeta de Vehículo)

**Vista colapsada**:
```
┌─────────────────────────────────────────┐
│ ● Nombre de la misión  [HORA]      ▼   │  ← Badge tipo Express
│   Detalle del criterio                  │
│                                         │
│ [DIFÍCIL]  2 RETOS         ⚡ 35 PS     │  ← Label dificultad
│ ████████████░░░░░░  75%                 │  ← Barra de score
└─────────────────────────────────────────┘
```

**Vista expandida (Profundo activo)**:
```
┌─────────────────────────────────────────┐
│ ● Nombre de la misión             ▲    │
│   Detalle del criterio                  │
│ [DIFÍCIL]  2 RETOS         ⚡ 35 PS     │
│ ████████████░░░░░░  75%                 │
│─────────────────────────────────────────│
│  ┌─────────────────────────────────────┐│
│  │ 🎯 ENFOQUE [RETO]             ✏️   ││  ← Botón editar eje
│  │ "Mi texto del enfoque..."           ││
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ⚡ CONFLICTO [INTERMEDIO]      ✏️   ││
│  │ "Mi texto del conflicto..."         ││
│  └─────────────────────────────────────┘│
│                                         │
│  ┌─────────────────────────────────────┐│
│  │ ✏️  DETALLAR 4 EJES                ││  ← Botón AZUL
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ✅  CUMPLIDO (+35 PS)              ││  ← Botón ESMERALDA
│  └─────────────────────────────────────┘│
│  ┌────────────────┐┌──────────────────┐ │
│  │ Archivar Simple││ Archivar+Reflex. │ │  ← Gris / Violeta
│  └────────────────┘└──────────────────┘ │
└─────────────────────────────────────────┘
```

**Vista expandida (Express activo)**:
```
┌─────────────────────────────────────────┐
│ ● Nombre de la misión  [HORA]      ▲   │
│   15:30                                 │
│ [FÁCIL]                    ⚡ 10 PS      │
│─────────────────────────────────────────│
│  ┌─────────────────────────────────────┐│
│  │ ✅  CUMPLIDO (+10 PS)              ││  ← Botón ESMERALDA
│  └─────────────────────────────────────┘│
│  ┌─────────────────────────────────────┐│
│  │ ✕  INCUMPLIDO (+5 PS por esfuerzo) ││  ← Botón ÁMBAR
│  └─────────────────────────────────────┘│
└─────────────────────────────────────────┘
```

### 4.6 Edición Inline de Eje

Al presionar el ícono de lápiz (✏️) en un eje expandido:

```
┌───────────────────────────────────────┐
│  🎯 Editando ENFOQUE                 │
│                                       │
│ ┌────────┬────────┬─────────┬──────┐  │
│ │OMITIR  │BLANDO  │INTERMEDIO│RETO  │  │  ← Selector de trifecta
│ └────────┴────────┴─────────┴──────┘  │
│                                       │
│ ┌─────────────────────────────────┐   │
│ │ Texto del eje...                │   │  ← Textarea 2 filas
│ └─────────────────────────────────┘   │
│                                       │
│ ┌──────────────┐  ┌─────┐             │
│ │ ✅ Guardar   │  │  ✕  │             │  ← Botones
│ └──────────────┘  └─────┘             │
└───────────────────────────────────────┘
```

### 4.7 Modo Reflexión al Archivar

Al presionar "Archivar + Reflexión" en un Vehículo Profundo:

```
┌───────────────────────────────────────┐
│  REFLEXIÓN DE CIERRE                  │
│                                       │
│  🎯 ENFOQUE - ¿Qué aprendiste?       │
│  ┌─────────────────────────────────┐  │
│  │ [textarea]                      │  │
│  └─────────────────────────────────┘  │
│                                       │
│  ⚡ CONFLICTO - ¿Qué resistencia?     │
│  ┌─────────────────────────────────┐  │
│  │ [textarea]                      │  │
│  └─────────────────────────────────┘  │
│                                       │
│  👣 PASOS - ¿Qué completaste?        │
│  ...                                  │
│                                       │
│  Reflexiones: X/4 (+X CP bonus)       │
│                                       │
│  ┌────────────┐  ┌────────────────┐   │
│  │  Cancelar  │  │ Archivar +X PS │   │
│  └────────────┘  └────────────────┘   │
└───────────────────────────────────────┘
```

### 4.8 Componentes Integrados

| Componente | Ubicación | Función |
|------------|-----------|---------|
| `SeductionMessage` | Debajo de barra PS | Mensaje IA motivacional basado en progresión y logs |
| `ManualTriggerButton` | Al lado del título | Abre el Manual de Maestría de Planificación |

### 4.9 Tipografía

| Elemento | Fuente | Estilo |
|----------|--------|--------|
| Títulos | Default (Inter) | `font-black`, tracking-tight |
| Subtítulos | Default | `text-xs`, `text-slate-500`, `uppercase tracking-widest` |
| Citas filosóficas | Georgia, serif | `italic`, `text-sm`, `text-slate-500` |
| Texto de ejes | Georgia, serif | `italic`, `text-xs`, `text-slate-300` |
| Labels trifecta | Default | `text-[10px]`, `font-black`, `uppercase tracking-wide` |
| PS y números | Default | `font-black`, color según contexto |

### 4.10 Animaciones (Framer Motion)

| Elemento | Animación |
|----------|-----------|
| Header | `opacity: 0→1`, `y: -20→0` |
| Barra PS | `width: 0→N%`, duración 0.8s, ease "easeOut" |
| Cards | `layout` para reordenamiento suave |
| Expansión card | `height: 0→auto`, `opacity: 0→1` |
| Pasos wizard | `opacity: 0→1`, `x: 50→0` (entrada), `x: 0→-50` (salida) |
| Barra progreso wizard | `width: 0→N%`, duración 0.3s |
| Modo Express/Profundo | `opacity: 0→1` |
| Sub-panel término | `opacity: 0→1`, `y: -10→0` |

### 4.11 Resumen de Todos los Botones

| Botón | Ubicación | Color | Acción |
|-------|-----------|-------|--------|
| Vehículo Express | Selector | Azul (#1E90FF) | Abrir modo Express |
| Vehículo Profundo | Selector | Oro (#D4AF37) | Abrir modo Profundo |
| Hora de Término | Express | Oro (#D4AF37) | Seleccionar tipo hora |
| Situación de Término | Express | Azul (#1E90FF) | Seleccionar tipo situación |
| Omitir | Express | Gris (#6b7280) | Guardar sin criterio |
| Lanzar Vehículo | Express (sub) | Oro/Azul | Guardar Express |
| Atrás | Express (sub) | Gris | Volver a tipos |
| Cancelar | Express | Gris texto | Cerrar modo Express |
| ✕ (cerrar) | Headers | Gris | Cerrar creación |
| Siguiente | Wizard | Oro (#D4AF37) | Avanzar paso |
| Atrás | Wizard | Borde gris | Retroceder paso |
| Lanzar Vehículo | Wizard (paso 7) | Oro (#D4AF37) | Guardar Profundo |
| Actualizar Vehículo | Wizard (editando) | Oro (#D4AF37) | Actualizar existente |
| Ver N Activos | Wizard | Azul borde | Volver a lista |
| DETALLAR 4 EJES | Card expandida | Azul (#1E90FF) | Re-abrir wizard |
| CUMPLIDO | Card expandida | Esmeralda (#50C878) | Completar misión |
| INCUMPLIDO | Card Express | Ámbar (#f59e0b) | Archivar Express |
| Archivar Simple | Card Profunda | Gris | Archivar sin reflexión |
| Archivar + Reflexión | Card Profunda | Violeta | Archivar con reflexión |
| ✏️ (editar eje) | Eje expandido | Color del eje | Editar inline |
| Guardar (eje) | Edición eje | Color del eje | Confirmar edición |
| ✕ (cancelar eje) | Edición eje | Gris | Cancelar edición |
| Cancelar (reflexión) | Modo reflexión | Gris | Cerrar reflexión |
| Archivar +X PS | Modo reflexión | Violeta | Confirmar archivo |

### 4.12 Badges de Tipo Express

| Tipo | Texto Badge | Color Fondo | Color Texto |
|------|-------------|-------------|-------------|
| hora | "HORA" | rgba(239, 68, 68, 0.2) | #ef4444 (rojo) |
| situacion | "SITUACIÓN" | rgba(168, 85, 247, 0.2) | #a855f7 (púrpura) |
| omitido | "OMITIR" | rgba(107, 114, 128, 0.2) | #6b7280 (gris) |

### 4.13 Toasts de Retroalimentación

| Situación | Tipo | Mensaje | Borde | Color |
|-----------|------|---------|-------|-------|
| Vehículo creado | Success | "Vehículo lanzado" | Oro | Oro |
| Vehículo actualizado | Success | "Vehículo actualizado" | Oro | Oro |
| Express creado | Success | `"Nombre" agregado (+X PS)` | Color tipo | Color tipo |
| Victoria épica (RETO cumplido) | Success | `+X PS` + descripción | Oro | Oro |
| Misión media cumplida | Success | `+X PS` + descripción | Esmeralda | Esmeralda |
| Reto Guerrero completado | Success | "¡RETO DE GUERRERO COMPLETADO!" | Oro | Oro |
| Ascenso de rango | Success | `¡Ascenso a Operador/Arquitecto!` | Oro | Oro |
| Archivado con PS | Success | `Archivado +X PS` | Ámbar | Ámbar |
| Archivado sin PS | Info | "Vehículo Archivado" | Gris | Gris |
| Reflexión profunda | Success | `+X PS (Reflexión profunda)` | Violeta | Violeta |
| Eje actualizado | Success | "Eje actualizado" | Color eje | Color eje |
| Error | Error | "Error al guardar vehículo" | Rojo | Rojo |

---

*Especificación técnica del Módulo de Planificación - SISTEMICAR v2.5*  
*Generada: Febrero 2026*
