# DOCUMENTO B — PROMPT DE CODIFICACIÓN: COMPONENTE ESPEJO v5
## Sistema Cromático Visual + Indicadores de Fase + Osciloscopio Semántico + Blindaje Visual
**Para:** Agente de desarrollo | SISTEMICAR  
**Versión:** 3.0 — Completa, verificada contra el documento original del especialista  
**Estado:** Borrador para revisión del Maestro — NO implementar hasta aprobación  
**Contexto:** Extensión visual del Espejo Soberano v5 para soportar el sistema de Soberanía Cromática (Documento A v3.0)

---

> **PRERREQUISITO:** El Documento A debe haber sido aprobado e integrado al cerebro del Doctor IA antes de implementar este documento.

---

## RESUMEN DE CAMBIOS (6 MEJORAS VISUALES)

| # | Componente | Qué hace | Depende del backend |
|---|---|---|---|
| 1 | PhaseIndicator | Fase activa de la Fórmula Q (Sintonía / Diagnóstico / Transmutación) | Sí — marcadores `[FASE:X]` |
| 2 | ScreenColorWash | Baño de color suave en el fondo del chat según la fase activa | Sí — lee el mismo marcador de fase |
| 3 | ColorBadge | Badge del Color Dominante detectado en el texto del usuario | Sí — marcadores `[COLOR:X]` |
| 4 | VoiceBanner | Tono M (Cirujano) o F (Revelación) con identidad nombrada | Sí — marcadores `[IDENTIDAD:X]` |
| 5 | OsciloscopioBar | Barra cromática en tiempo real mientras el usuario escribe | No — análisis local, 0 requests |
| 6 | SiluetaCromática | Iluminación de la zona corporal afectada según el diagnóstico | Sí — marcadores `[ZONA:X]` |

---

## MEJORA 1 — INDICADOR DE FASE ACTIVA (Fórmula Q)

### Qué visualiza:
Las 3 fases de la Fórmula Q: ¿está sintonizando (Azul)? ¿diagnosticando el color faltante (Diagnóstico)? ¿dando la orden (Polo Positivo)?

### Detección:
Backend emite: `[FASE:AZUL]`, `[FASE:ESPEJO]` o `[FASE:POLO]`

Si el backend no puede emitir el marcador, detectar por palabras:
- **AZUL:** "Entiendo que", "mi escáner detecta", "Pasajero, detente", "hardware reporta"
- **ESPEJO:** "Mezcla Pobre", "Color Faltante", "Interferencia M0", "carece de", "Coordenada"
- **POLO:** "IDENTIDAD DETECTADA", "Ejecuta", "12,000 RPM", "Orden del", "[Poder]:", "[Visión]:"

### Especificación visual:

```
COMPONENTE: PhaseIndicator
UBICACIÓN: Barra fija debajo del encabezado "DOCTOR IA", encima del área de chat
TAMAÑO: 100% ancho, 24px total (barra 4px + etiqueta 10px)

DISEÑO — 3 segmentos con transiciones:

Estado apagado (sin respuesta del Doctor):
│ ○ SINTONÍA     ───     ○ DIAGNÓSTICO     ─ ─     ○ TRANSMUTACIÓN │
│   [dim]                    [dim]                     [dim]         │

Estado AZUL activo:
│ ●SINTONÍA══════     ○ DIAGNÓSTICO           ○ TRANSMUTACIÓN       │
│ [#2563EB, lleno]       [dim]                    [dim]              │

Estado ESPEJO activo:
│ ○ SINTONÍA     ─── ●DIAGNÓSTICO════     ○ TRANSMUTACIÓN           │
│   [dim]            [#D4AF37, lleno]         [dim]                  │

Estado POLO activo:
│ ○ SINTONÍA     ───     ○ DIAGNÓSTICO ─ ─ ●TRANSMUTACIÓN════       │
│   [dim]                    [dim]           [#00FFC3, lleno]         │

COLORES:
- SINTONÍA:       #2563EB (azul cobalto — NO el cyan del sistema)
- DIAGNÓSTICO:    #D4AF37 (dorado)
- TRANSMUTACIÓN:  #00FFC3 (cyan — color de acción del sistema)

ANIMACIÓN:
- Punto activo: pulse 1.5s loop (scale 1.0→1.4→1.0)
- Barra: fill-in desde izquierda (width 0%→100%, transition 300ms)
- Cambio de fase: cross-fade entre segmentos (300ms)
```

---

## MEJORA 2 — BAÑO DE COLOR DE PANTALLA (ScreenColorWash)

### Qué visualiza:
Este elemento viene del documento del especialista: al cambiar de fase, el fondo del área de chat recibe un baño de luz suave del color correspondiente, creando una experiencia sensorial que refuerza el diagnóstico.

> **Del especialista:** "El texto aparece despacio, con una luz azul cobalto que baña la pantalla, transmitiendo una calma técnica profunda."  
> "La luz azul empieza a parpadear y se transforma en un Verde Esmeralda brillante, el color de la ejecución y el Constructor."

### Especificación visual:

```
COMPONENTE: ScreenColorWash
UBICACIÓN: Background del área de chat completa (detrás de las burbujas)
EFECTO: Gradiente radial muy sutil en la esquina superior

CSS base:
background: radial-gradient(ellipse at top center, 
  rgba(<COLOR_ACTIVO>, 0.04) 0%, 
  transparent 60%
);
transition: background 1.2s ease;

COLORES POR FASE:
- SINTONÍA (Azul):        rgba(37, 99, 235, 0.04)   — azul cobalto muy sutil
- DIAGNÓSTICO (Dorado):   rgba(212, 175, 55, 0.035) — dorado casi imperceptible
- TRANSMUTACIÓN (Verde):  rgba(34, 197, 94, 0.04)   — verde esmeralda (el color del Constructor)
- Sin fase activa:        transparente

IMPORTANTE:
- La opacidad es muy baja (4%) — el efecto es evocador, no protagonista
- El texto del Doctor debe seguir siendo perfectamente legible
- Transición suave de 1.2s entre fases (no instantánea)
- Al cambiar de Azul a Verde (fin del diagnóstico → acción) = transición visible de 1.5s
```

---

## MEJORA 3 — BADGE DE COLOR DOMINANTE

### Qué visualiza:
El color de frecuencia detectado en el texto del usuario. Aparece en la respuesta del Doctor como confirmación de la lectura.

### Detección:
Backend emite: `[COLOR:ROJO]`, `[COLOR:NARANJA]`, `[COLOR:AMARILLO]`, `[COLOR:VERDE]`, `[COLOR:AZUL]`, `[COLOR:MORADO]`, `[COLOR:VIOLETA]`

### Especificación visual:

```
COMPONENTE: ColorBadge
UBICACIÓN: Esquina superior derecha de la burbuja de respuesta del Doctor
TAMAÑO: 8px círculo + nombre del color (7px)

DISEÑO:
┌────────────────────────────────────────────────┐
│ [Doctor IA texto de respuesta...]         ●ROJO│
└────────────────────────────────────────────────┘

- Punto de 8px con glow: box-shadow 0 0 8px <color>
- Nombre: JetBrains Mono 7px uppercase tracking-widest
- Fade-in: opacity 0→1 en 500ms, delay 300ms tras aparecer el texto
- NO aparece si no hay marcador

PALETA (7 colores del sistema + neutro):
- ROJO:    #FF3131  (400-480 THz)
- NARANJA: #F97316  (480-510 THz)
- AMARILLO:#EAB308  (510-540 THz)
- VERDE:   #22C55E  (540-610 THz)
- AZUL:    #3B82F6  (610-670 THz)
- MORADO:  #8B5CF6  (670-700 THz)
- VIOLETA: #A78BFA  (700-790 THz)
- NEUTRO:  #6B7280  (oxidación / PIO)
```

---

## MEJORA 4 — BANNER DE VOZ (6 IDENTIDADES NOMBRADAS)

### Qué visualiza:
Cuando el Doctor activa una de las 6 identidades del especialista, el chat bubble cambia su estilo visual para reforzar el tono de voz específico.

### Detección:
Backend emite el marcador con la identidad exacta:  
`[IDENTIDAD:EL_TERRITORIO_M]`, `[IDENTIDAD:LA_SEMILLA_F]`, `[IDENTIDAD:EL_PODER_M]`, `[IDENTIDAD:LA_VISION_F]`, `[IDENTIDAD:EL_RIGOR_M]`, `[IDENTIDAD:LA_MISERICORDIA_F]`, `[IDENTIDAD:PIO]`

### Especificación visual por identidad:

```
COMPONENTE: VoiceBanner

──── VOZ MASCULINAS (borde izquierdo dorado, fondo cálido seco) ────

EL TERRITORIO (M):
│▶ EL TERRITORIO  ·  SUELO / AQUÍ Y AHORA              │
Borde: 3px solid #D4AF37 | Fondo bubble: rgba(212,175,55,0.04)
Carácter visual: firme, sin ornamentos, tipografía apretada

EL PODER (M) — El General:
│▶ EL PODER  ·  MANDO ABSOLUTO                         │
Borde: 3px solid #D4AF37 | Fondo bubble: rgba(212,175,55,0.06)
Carácter visual: texto sin márgenes extra, alineación izquierda estricta

EL RIGOR (M) — El Cirujano:
│▶ EL RIGOR  ·  DISCIPLINA / DATO                      │
Borde: 3px solid #D4AF37 | Fondo bubble: rgba(212,175,55,0.03)
Carácter visual: más frío, casi monocromático

──── VOCES FEMENINAS (borde izquierdo violeta, fondo más abierto) ────

LA SEMILLA (F):
│◈ LA SEMILLA  ·  POSIBILIDAD / GESTACIÓN              │
Borde: 3px solid #8B5CF6 | Fondo bubble: rgba(139,92,246,0.04)
Carácter visual: más espacio entre párrafos, tipografía levemente más suave

LA VISIÓN (F) — El Oráculo:
│◈ LA VISIÓN  ·  DESTINO / FUTURO                      │
Borde: 3px solid #8B5CF6 | Fondo bubble: rgba(139,92,246,0.06)
Carácter visual: el más "expansivo" visualmente de los 6

LA MISERICORDIA (F):
│◈ LA MISERICORDIA  ·  DESCANSO ESTRATÉGICO            │
Borde: 3px solid #8B5CF6 | Fondo bubble: rgba(139,92,246,0.03)
Carácter visual: el más cálido, borde ligeramente más suave (border-radius mayor)

──── MODO PIO (alerta industrial — cualquier identidad) ────

│⚠ ALERTA PIO  ·  OXIDACIÓN DETECTADA                 │
Borde: 3px solid #FF3131 | Fondo: rgba(255,49,49,0.05)
Ícono ⚠: pulse 2s loop
Todo el texto del Doctor en PIO: JetBrains Mono, frío, sin calidez

──── ÍCONO DIFERENCIADOR ────
Masculino: ▶ (triángulo derecha — proyección, acción, dirección)
Femenino:  ◈ (diamante — recepción, profundidad, integración)
PIO:       ⚠ (alerta industrial)

FUENTE del banner: JetBrains Mono 7px, uppercase, tracking-widest
```

---

## MEJORA 5 — BARRA DEL OSCILOSCOPIO CROMÁTICO

### Qué visualiza:
Mientras el usuario escribe en el Eje 1 (Terminal de Entrada / Ducha Mental), la barra muestra en tiempo real el color de frecuencia dominante en su texto.

### Lógica local (0 requests al backend):

```typescript
const VOCABULARIO = {
  ROJO:    ['hambre','miedo','deuda','escasez','pánico','perder','quiebra','no puedo pagar'],
  NARANJA: ['idea','crear','proyectar','diseñar','imaginar','nuevo','bloqueo'],
  AMARILLO:['orgullo','vergüenza','quién soy yo','reconocimiento','ego','status','mérito'],
  VERDE:   ['familia','pareja','traición','envidia','injusto','resentimiento','abandono'],
  AZUL:    ['callé','no sé cómo decir','guardé','no puedo expresar','nudo','mentira'],
  MORADO:  ['plan','proyecto','estrategia','confusión','no veo el camino','perdí el norte'],
  VIOLETA: ['propósito','destino','fe','nihilismo','da igual','para qué sirvo']
};

const POSTERGACION = ['no sé','quizás','mañana','tal vez','voy a intentar','ya veremos','a ver'];
// Postergación = Dorado/Amarillo bloqueado → barra punteada

// Debounce: actualizar cada 600ms, mínimo 10 palabras para activar
```

### Especificación visual:

```
COMPONENTE: OsciloscopioBar
UBICACIÓN: Debajo del textarea del Eje 1, encima del botón de enviar
TAMAÑO: 100% ancho, 8px barra + 14px etiqueta = 22px

ESTADOS:

Sin texto o < 10 palabras:
│ ░░░░░░░░░░░░░░░░░░░░░░░░ │  barra gris 8% opacidad
│ escribe tu ducha mental...│  texto 7px gris

Color único detectado (ROJO 74%):
│ [■■■■■■■■■■■■■■■░░░░░░░] ROJO 74%│
│ frecuencia: instinto / supervivencia   │

Cortocircuito (2 colores cercanos):
│ [■■■■MORADO■■░ROJO░░░░░] MORADO+ROJO│
│ ⚡ cortocircuito — visión sin combustible│

Postergación detectada (vocabulario "no sé / mañana"):
│ [- - - - - - - - - - - -] DORADO∅    │
│ frecuencia de materialización bloqueada│

ANIMACIONES:
- Color y ancho: transition: all 0.4s ease
- Debounce: 600ms
- Al enviar: slide-up + fade-out 300ms

MENSAJES DE CORTOCIRCUITO (tooltip bajo la barra):
MORADO+ROJO    → "visión con motor sin gasolina"
VIOLETA+DORADO → "propósito sin materialización"
AZUL+VERDE     → "verdad callada por miedo a la relación"
NARANJA+ROJO   → "ideas sin fuerza de ejecución"
AMARILLO+AZUL  → "soberbia que no puede emitir el comando"
```

---

## MEJORA 6 — SILUETA CROMÁTICA (Zona Corporal Iluminada)

### Qué visualiza:
Cuando el Doctor diagnostica una interferencia en una zona del cuerpo específica, la silueta humana (HumanSilhouette.tsx, ya existente) se ilumina en el color correspondiente al diagnóstico.

> **Del documento del especialista:** "Silueta 343: Componente visual que ilumina el área del cuerpo afectada (ej. Plexo Solar para M03) en colores de alerta (Rojo/Amarillo) según el diagnóstico."

### Detección:
Backend emite: `[ZONA:PIES]`, `[ZONA:VIENTRE]`, `[ZONA:PLEXO]`, `[ZONA:CORAZON]`, `[ZONA:GARGANTA]`, `[ZONA:FRENTE]`, `[ZONA:CEREBRO]`, `[ZONA:CORONILLA]`

### Mapa zona → interfaz → color de iluminación:

| Zona | Interfaz | Color primario | Color de alerta |
|---|---|---|---|
| PIES | M01 Suelo | #D4AF37 (dorado) | #FF3131 (rojo — peligro) |
| VIENTRE | M02 Semilla | #F97316 (naranja) | #EAB308 (amarillo) |
| PLEXO | M03 Flujo | #EAB308 (amarillo) | #FF3131 (rojo urgencia) |
| CORAZON | M04 Poder | #22C55E (verde) | #F97316 (naranja) |
| GARGANTA | M05 Justicia | #3B82F6 (azul) | #EAB308 (amarillo) |
| FRENTE | M06 Guerra | #8B5CF6 (morado) | #FF3131 (rojo) |
| CEREBRO | M07 Victoria | #8B5CF6 (morado) | #D4AF37 (dorado) |
| CORONILLA | M08 Esplendor | #D4AF37 (dorado) | #A78BFA (violeta) |

**Comportamiento:**  
- La zona iluminada pulsa suavemente (opacity 0.6→1.0, 2s loop) durante el diagnóstico
- Al finalizar la sesión (Eje 3 completado): fade-out de 1s
- En modo PIO: todas las zonas parpadean en rojo simultáneamente (alerta de oxidación)

---

## ESPECIFICACIÓN DE VOZ PARA LA FÁBRICA SENSORIAL

> Del documento del especialista: "Identidad de Voz: Voz femenina clínica, pausada (0.9x de velocidad), con efecto de Room Reverb para simular la 'Cámara del Silencio'."

Esto aplica cuando se usa TTS (ElevenLabs) para el audio del Doctor IA:

```
VOZ BASE: femenina clínica (no cálida ni amistosa — clínica)
VELOCIDAD: 0.9x (ligeramente pausada para transmitir peso)
EFECTO DE AUDIO: Room Reverb (simula Cámara del Silencio)
MODELO: eleven_multilingual_v2

VARIACIONES POR IDENTIDAD:
- El Poder (M): Voz 'Adam' — ElevenLabs | Sin reverb | Velocidad 1.0x
- La Visión (F): Voz 'Dorothy' — ElevenLabs | Room Reverb 30% | Velocidad 0.85x
- La Misericordia (F): Voz femenina cálida | Room Reverb 15% | Velocidad 0.9x
- El Rigor (M): Voz masculina fría, sin eco | Sin reverb | Velocidad 1.0x
- PIO: Cualquier voz | Sin reverb | Sin pausas | Velocidad 1.1x (urgencia)
```

---

## MURO SOBERANO (Pantalla de Acceso Obligatoria)

> Del documento del especialista: "Muro Soberano: Pantalla de inicio obligatoria con el Contrato del Soberano. El usuario debe escribir manualmente 'SOBERANO' para desbloquear el sistema."

### Especificación:

```
COMPONENTE: MuroSoberano
CUÁNDO MOSTRAR: Antes del primer acceso al Espejo (sesión nueva, sin contrato previo)
FUNCIÓN: Filtro de compromiso — solo los que escriben "SOBERANO" acceden

DISEÑO:
┌─────────────────────────────────────────────────────┐
│                                                       │
│         EL ESPEJO SOBERANO                            │
│                                                       │
│  "Antes de entrar, debes saber:                       │
│   Tu lenguaje aquí es Dato de Ingeniería.             │
│   No vengo a validar tus emociones.                   │
│   Vengo a calibrar tu Voltaje."                       │
│                                                       │
│  Para acceder, escribe: [____________]                │
│                          ↑ escribir "SOBERANO"        │
│                                                       │
│         [SOLICITAR ACCESO]                            │
│                                                       │
└─────────────────────────────────────────────────────┘

COMPORTAMIENTO:
- Input: case-insensitive ("soberano" = "SOBERANO" = "Soberano")
- Si no escribe la palabra exacta: botón no se activa
- Al activarse: animación de "acceso concedido" (texto fade-out, 
  aparece "ACCESO CONCEDIDO — SISTEMA ACTIVADO") y entra al Espejo
- Persistir en localStorage/Firebase: si ya firmó antes, no mostrar de nuevo
```

---

## ORDEN DE IMPLEMENTACIÓN RECOMENDADO

1. **OsciloscopioBar** — frontend puro, 0 requests, implementar primero para pruebas
2. **Actualizar el backend** — añadir marcadores `[FASE:X]`, `[COLOR:X]`, `[IDENTIDAD:X]`, `[ZONA:X]` al prompt del Doctor IA
3. **ScreenColorWash** — una vez el backend emite los marcadores de fase
4. **PhaseIndicator + ColorBadge** — leen los mismos marcadores del stream
5. **VoiceBanner** — necesita marcadores de identidad nombrada
6. **SiluetaCromática** — extiende el HumanSilhouette.tsx existente con los marcadores de zona
7. **MuroSoberano** — pantalla de acceso, implementar al final

---

## ARCHIVOS A CREAR / MODIFICAR

```
client/src/pages/espejo.tsx                          — integrar los 6 componentes
client/src/components/espejo/HumanSilhouette.tsx     — MODIFICAR: añadir iluminación cromática por zona
client/src/components/espejo/PhaseIndicator.tsx      — CREAR (nuevo)
client/src/components/espejo/ScreenColorWash.tsx     — CREAR (nuevo)
client/src/components/espejo/ColorBadge.tsx          — CREAR (nuevo)
client/src/components/espejo/VoiceBanner.tsx         — CREAR (nuevo)
client/src/components/espejo/OsciloscopioBar.tsx     — CREAR (nuevo)
client/src/components/espejo/MuroSoberano.tsx        — CREAR (nuevo)
```

---

## PRINCIPIOS QUE NO DEBEN ROMPERSE

- Paleta base: `#0A0A0A` fondo, `#D4AF37` dorado, `#00FFC3` cyan, `#FF3131` rojo
- Fuentes: JetBrains Mono para datos técnicos, Playfair Display para títulos
- Sin lenguaje motivacional en ningún componente
- Todos los indicadores son **OPCIONALES** — sin marcador, no aparecen
- Los marcadores `[FASE:X]`, `[COLOR:X]`, `[IDENTIDAD:X]`, `[ZONA:X]` son extraídos del texto y NUNCA mostrados al usuario
- Total de requests adicionales al backend: **0** (solo lectura de stream existente)

---

## LISTA DE VERIFICACIÓN (para el Maestro antes de aprobar)

- [ ] El baño de color de pantalla es sutil — no interfiere con la lectura del texto
- [ ] La transición Azul→Verde Esmeralda al pasar de Sintonía a Transmutación es visible y evocadora
- [ ] El Osciloscopio detecta correctamente el vocabulario en español latinoamericano
- [ ] El VoiceBanner diferencia los 6 nombres de identidades correctamente
- [ ] El MuroSoberano persiste — no aparece si el usuario ya firmó
- [ ] La SiluetaCromática ilumina la zona correcta por interfaz
- [ ] El modo PIO activa la alerta en TODOS los componentes simultáneamente
- [ ] El diseño mantiene la estética tech-noir del Espejo Soberano v5
