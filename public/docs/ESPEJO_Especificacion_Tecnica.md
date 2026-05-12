# ESPEJO - Módulo de Inteligencia Emocional
## SISTEMICAR v2.5

---

## DESCRIPCIÓN GENERAL

**ESPEJO** es el módulo de inteligencia emocional de SISTEMICAR. Permite a los usuarios reflexionar sobre cómo se sienten frente a diferentes áreas de su vida, siguiendo un proceso estructurado de sanación emocional.

**Pregunta central:** ¿Cómo te sientes frente a X?

---

## DOS MODOS DE TRABAJO

### 1. CAPTURA LIBRE
- **Propósito:** Para mentes en proceso, fragmentos sin orden
- **Filosofía:** Todo es válido. Perfecto cuando necesitas desahogarte o procesar
- **Puntos:** +3 puntos por cada fragmento capturado
- **Uso:** Selecciona un eje y escribe libremente. Sin estructura obligatoria

### 2. ESTRUCTURADO
- **Propósito:** Proceso de sanación emocional guiado paso a paso
- **Filosofía:** Te lleva de la identificación del conflicto a terminar empoderado
- **Flujo:** Wizard secuencial donde debes completar cada paso antes de avanzar
- **Bonus:** +20 puntos extra al completar los 4 pasos

---

## CONTEXTOS DE REFLEXIÓN

El usuario selecciona un área de su vida para reflexionar:

| Contexto | Icono | Color |
|----------|-------|-------|
| Familia | ❤️ Corazón | Rojo #EF4444 |
| Trabajo | 💼 Maletín | Azul #3b82f6 |
| Relaciones | 👥 Usuarios | Violeta #7C3AED |
| Finanzas | 💵 Dinero | Esmeralda #10B981 |
| Salud | 💓 Actividad | Coral #F97316 |
| Proyecto | 🎯 Target | Dorado #D4AF37 |

---

## LOS 4 EJES DE INTELIGENCIA EMOCIONAL

### EJE 1: PERCIBO
- **Pregunta:** ¿Qué siento/percibo en esta situación?
- **Placeholder:** "La emoción que surge en mí..."
- **Icono:** 👁️ Ojo
- **Color:** Azul eléctrico (#3b82f6)
- **Puntos:** +5 puntos

### EJE 2: RECONOZCO
- **Pregunta:** ¿Qué patrones emocionales identifico?
- **Placeholder:** "El patrón que se repite..."
- **Icono:** 🧠 Cerebro
- **Color:** Violeta (#7C3AED)
- **Puntos:** +8 puntos

### EJE 3: CUENTO CON
- **Pregunta:** ¿Qué recursos emocionales tengo/necesito?
- **Placeholder:** "Lo que me sostiene o necesito desarrollar..."
- **Icono:** 🤲 Manos con corazón
- **Color:** Esmeralda (#10B981)
- **Puntos:** +10 puntos

### EJE 4: TRANSFORMO
- **Pregunta:** ¿Hacia dónde quiero que evolucione esto?
- **Placeholder:** "La transformación que deseo..."
- **Icono:** ✨ Varita
- **Color:** Dorado (#D4AF37)
- **Puntos:** +15 puntos

---

## FLUJO DEL MODO ESTRUCTURADO

```
Paso 1: PERCIBO (Identificar emoción actual)
    ↓
Paso 2: RECONOZCO (Explorar conflicto/patrón)
    ↓
Paso 3: CUENTO CON (Recordar recursos/fortalezas)
    ↓
Paso 4: TRANSFORMO (Cerrar empoderado)
    ↓
CELEBRACIÓN (+20 bonus)
```

**Importante:** 
- Cada paso debe completarse antes de avanzar (mínimo 3 caracteres)
- Se muestra resumen de pasos anteriores debajo del paso actual
- Barra de progreso visual con 4 segmentos de colores

---

## SISTEMA DE PUNTOS

| Acción | Puntos |
|--------|--------|
| Fragmento en Captura Libre | +3 |
| Paso 1: PERCIBO | +5 |
| Paso 2: RECONOZCO | +8 |
| Paso 3: CUENTO CON | +10 |
| Paso 4: TRANSFORMO | +15 |
| Bonus sesión completa | +20 |
| **TOTAL sesión completa** | **+58** |

---

## PERSISTENCIA DE SESIONES

### Sesión Incompleta
- Se guarda automáticamente después del primer paso
- El usuario puede continuar donde dejó
- Opción de "Continuar" o "Descartar" al regresar
- Se muestra el progreso (Paso X/4) y puntos acumulados

### Sesiones Completadas
- Se guardan las últimas 10 sesiones
- Vista colapsable con detalles expandibles
- Cada sesión muestra: contexto, fecha, puntos totales
- Al expandir: muestra las 4 respuestas con formato por eje
- Modo privacidad: cifra el contenido con puntos (••••)

---

## TUTORIAL INTERACTIVO

El tutorial aparece automáticamente en la primera visita. 6 pasos:

1. **Bienvenido al Espejo** - Introducción al espacio de inteligencia emocional
2. **Elige un Contexto** - Explicación de las áreas de vida
3. **PERCIBO** - ¿Qué sientes? La emoción en bruto
4. **RECONOZCO** - Identificar patrones te da poder
5. **CUENTO CON** - Reconocer tu fortaleza interior
6. **TRANSFORMO** - El poder de dirigir tu transformación

**Comportamiento:**
- Se puede saltar o cerrar
- Se puede reiniciar con botón de ayuda (❓)
- Estado guardado en localStorage

---

## COMPONENTES VISUALES

### Header
- Icono del Espejo (👁️)
- Título "ESPEJO"
- Subtítulo "Inteligencia emocional"
- Botón de manual técnico
- Botón de tutorial (❓)
- Contador de CP (Command Points)

### RankBadge
- Muestra el rango actual del usuario
- Basado en puntos de progresión

### Celebración al Completar
- Confetti animation
- Icono grande con animación de rebote
- "¡Sesión Completa!"
- Resumen de puntos ganados
- Las 4 respuestas en tarjetas coloreadas
- Botones: "Nueva Sesión" y "Volver a la Consola"

---

## ALMACENAMIENTO LOCAL

```javascript
// Sesión en progreso
localStorage.key = "sistemicar_espejo_sesion"

// Sesiones completadas (máximo 10)
localStorage.key = "sistemicar_espejo_sesiones"

// Estado del tutorial
localStorage.key = "sistemicar_espejo_tutorial_done"
```

---

## INTEGRACIÓN CON FIREBASE

- `addEnergyLog()` - Registra cada reflexión en Firebase
- `awardSovereigntyPoints()` - Otorga puntos de soberanía
- `subscribeToEnergyLogs()` - Sincroniza logs en tiempo real
- `subscribeToProgression()` - Progresión del usuario

---

## FILOSOFÍA DE DISEÑO

1. **Proceso de Sanación:** El modo estructurado sigue un flujo terapéutico real
2. **Flexibilidad:** Captura Libre para momentos de caos emocional
3. **Gamificación:** Puntos motivan la continuidad
4. **Privacidad:** Modo cifrado para proteger contenido sensible
5. **Persistencia:** Nunca pierdas tu progreso
6. **Accesibilidad:** Tutorial para nuevos usuarios

---

## COLORES DEL MÓDULO

| Elemento | Color | Hex |
|----------|-------|-----|
| PERCIBO | Azul eléctrico | #3b82f6 |
| RECONOZCO | Violeta | #7C3AED |
| CUENTO CON | Esmeralda | #10B981 |
| TRANSFORMO | Dorado | #D4AF37 |
| Fondo | Negro profundo | #050505 |
| Sesión pendiente | Coral | #F97316 |

---

**Documento generado para SISTEMICAR v2.5**
**Módulo: ESPEJO - Inteligencia Emocional**
