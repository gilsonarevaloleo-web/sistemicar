# Termodinámica atencional v2 — Dominio fluido y resistencia

**Estado:** Aprobado para implementación (fase 2 en código)  
**Alcance:** Desglosador de **tiempo** con ruta de enfoque. Panorámica (segmentos/puertas) y PS por ruta sin cambios en esta versión.

---

## 1. Filosofía (experiencia en vida real)

La planificación se apoya en cuatro tipos de vehículo; aquí el foco es **tiempo–objetivo** y su **desglosador**:

1. Se nombra el vehículo (objetivo del bloque).
2. Se desglosa en **subtareas medidas en unidades** (cantidad).
3. Un contador desciende con **pitido por unidad**; cada sub recorre **tres estampas de enfoque** en secuencia obligatoria:
   - **Fluido (~50% de unidades):** ritmo sin esfuerzo consciente continuo (piloto automático).
   - **Concentrado (~25%):** esfuerzo consciente de sostener foco (ancla corporal: columna).
   - **Al límite (~25%):** último tramo; base de fuerza y respiración profunda.

En el código, el reparto por unidades coincide con `ceil(N/2)` y `ceil(N/4)` en `rutaEnfoque.ts` (~50% / 25% / 25% para N≥4).

### Voces del sistema (ritmo, ubicación, biología)

Guiones en `client/src/lib/rutaEnfoqueVoz.ts` — cadencia en dos pulsos por tramo (TTS en cola):

| Tramo | % tiempo | Frases (resumen) | Ancla corporal |
|-------|----------|------------------|----------------|
| 1 Fluido | 0–50% | «[Sub]: Iniciando tramo uno.» → «Active piloto automático. Fluya sin esfuerzo.» | Soltar control consciente |
| 2 Concentrado | 50–75% | «Tramo dos: Enfoque consciente.» → «Enderece la columna vertebral. Alineación ahora.» | Columna / caja torácica |
| 3 Al límite | 75–100% | «Tramo final: Al límite.» → «Ancle su base de fuerza. Respire profundo.» | Base de fuerza + oxígeno |

La voz **no sustituye** la declaración del usuario al cierre; solo marca el curso del contador.

### Lo que la experiencia enseña (no lo que el v1 medía)

| Fase del operador | Vivencia | Lectura termodinámica |
|-------------------|----------|------------------------|
| Días 1–2 | Cansancio; cuesta entrar en concentrado y límite | **Entrenamiento** — se paga la fricción de la secuencia |
| Semanas siguientes | El fluido **gana terreno**; conc/límite son márgenes mentales | **Integración** — la secuencia sigue, pero pesa menos |
| Estabilizado | Cierres casi siempre con **ganancia de tiempo**; poca necesidad de bajar bandas | **Dominio fluido** — resistencia alta |

**Maestría ≠ “llegar al límite”.** Maestría = **habitar fluido** con cierres adelantados, usando concentrado/límite como andamiaje que cada vez pesa menos.

---

## 2. Glosario

| Término (v1) | Problema | Término (v2) |
|--------------|----------|--------------|
| Profundidad máxima (`limite` > `concentrado` > `fluido`) | Premia fricción | **Estado atencional** (`entrenamiento` \| `integracion` \| `dominio_fluido`) |
| Bloques al límite / concentrados ↑ | Más fricción = “mejor día” | **Bloques en dominio fluido** ↑ y **fricción** ↓ |
| Espectro: sumar todas las bandas cruzadas | Confunde recorrido con logro | **Dominio fluido** vs **fricción** (mutuamente excluyentes por sub) |
| Resistencia (profundidad de sesión PS) | Horas de desglosador | **Índice de resistencia** (0–100): dominio + ganancia − fricción |
| 1 sub = 1 bloque | Confunde contenedor con decisión interna | **Regla A:** 1 bloque = desglosador **cerrado**; subs = métrica aparte |

---

## 3. Mapa de código

| Archivo | Rol v1 | Cambio v2 |
|---------|--------|-----------|
| `client/src/lib/termodinamicaAtencional.ts` | Espectro + profundidad + compare | `computeResistenciaDia`, `inferFaseAtencional`, `computeTermodinamicaCompareV2`, snapshot `schemaVersion: 2` |
| `client/src/lib/focusBandLedger.ts` | Eventos `ruta_cruce` | Sin cambio; se usan para detectar fricción |
| `client/src/lib/desglosadorClock.ts` | `computeSubCloseVerdict` | Sin cambio; `gain` alimenta `subsConGanancia` |
| `client/src/lib/rutaEnfoque.ts` | Umbrales 50/25/25 | Sin cambio |
| `client/src/pages/planeacion.tsx` | Tarjeta “Profundidad” | Muestra **estado atencional** + filas v2 |
| `client/src/lib/termodinamicaAtencional.test.ts` | Celebra más límite | Celebra más dominio fluido / resistencia |

---

## 4. Métricas y fórmulas

### 4.1 Población

Solo **subs cumplidos** del desglosador de **tiempo** con `rutaEnfoque.activa` dentro de la jornada (`dayStartMs`).

### 4.2 Por sub

- **Verdad operativa:** lo que el usuario declara en «¿Qué ruta pudiste seguir?» (`rutaDeclarada` / `rutaSeguimientoPatron`). El cruce automático del contador/voz es solo **referencia**, no pre-marca la respuesta.
- **Fricción:** `rutaDeclarada` incluye `concentrado` o `limite`. Si no hay declaración, respaldo: `cruzado` o ledger `ruta_cruce`.
- **Dominio fluido:** cumplido con ruta activa, declaró `fluido` y **sin** fricción declarada.
- **Conquista de fluidez absoluta:** segmento temporal A (0–50% del tiempo sugerido) + patrón `solo_fluido` + veredicto `gain` → máximo privilegio PS (`rutaSeguimiento.ts`).
- **Ganancia de tiempo:** `computeSubCloseVerdict(sub).verdict === "gain"` (real &lt; sugerido − 5s).

### 4.3 Agregados del día (`ResistenciaDia`)

| Campo | Definición |
|-------|------------|
| `subsConRuta` | Subs evaluables |
| `bloquesDominioFluido` | Subs en dominio fluido |
| `friccionBloques` | Subs con fricción |
| `subsConGanancia` | Subs con veredicto `gain` |
| `gananciaTiempoSeg` | Suma de `max(0, refSec - realSec)` en subs con referencia |
| `indiceResistencia` | Ver §4.4 |
| `fase` | `inferFaseAtencional(resistencia)` |

### 4.4 Índice de resistencia (0–100)

Si `subsConRuta === 0` → `indiceResistencia = 0`, `fase = entrenamiento`.

```
dominioPct = 100 * bloquesDominioFluido / subsConRuta
gananciaPct = 100 * subsConGanancia / subsConRuta
friccionPct = 100 * friccionBloques / subsConRuta

indiceResistencia = round(clamp(
  0.50 * dominioPct + 0.40 * gananciaPct + 0.10 * (100 - friccionPct),
  0, 100))
```

### 4.5 Fase atencional

| Condición | `fase` |
|-----------|--------|
| `subsConRuta === 0` | `entrenamiento` |
| `dominioPct ≥ 60` y `friccionPct ≤ 35` | `dominio_fluido` |
| `dominioPct ≥ 35` o `gananciaPct ≥ 45` o `indiceResistencia ≥ 55` | `integracion` |
| resto | `entrenamiento` |

### 4.6 Comparativa frente a ayer (`computeTermodinamicaCompareV2`)

Filas (orden UI):

| key | label | betterWhenHigher |
|-----|-------|------------------|
| `dominio_fluido` | Bloques dominio fluido | true |
| `ganancia` | Subs con ganancia de tiempo | true |
| `bloques` | Bloques completados | true |
| `friccion` | Fricción (conc/límite) | **false** |

Headline prioriza: Δ índice resistencia → Δ dominio fluido → Δ ganancias.

`espectroBloques` y `profundidadMaxima` se mantienen en snapshot por compatibilidad histórica; la UI principal usa `estadoAtencional` + `resistencia`.

---

## 5. Ejemplos narrados

### Día 1 — entrenamiento (Ana, 4 subs con ruta, N=8 u cada una)

| Sub | Cruces | Cierre vs sugerido |
|-----|--------|-------------------|
| A | fluido + conc + límite | +3 min (loss) |
| B | fluido + conc + límite | +1 min (neutral) |
| C | fluido + conc | −30 s (gain) |
| D | fluido + conc + límite | +2 min (loss) |

- `bloquesDominioFluido = 0`, `friccionBloques = 4`, `subsConGanancia = 1`  
- `indiceResistencia ≈ 14` → **entrenamiento**  
- Mensaje: “Estás pagando la fricción de la secuencia — normal al inicio.”

### Día 14 — dominio fluido (misma estructura de trabajo)

| Sub | Cruces | Cierre vs sugerido |
|-----|--------|-------------------|
| A | solo fluido | −4 min (gain) |
| B | solo fluido | −6 min (gain) |
| C | fluido + conc (margen) | −2 min (gain) |
| D | solo fluido | −5 min (gain) |

- `bloquesDominioFluido = 3`, `friccionBloques = 1`, `subsConGanancia = 4`  
- `indiceResistencia ≈ 78` → **dominio_fluido**  
- Compare vs día 1: dominio +3, fricción −3, índice +64 → headline tipo “Más resistencia que ayer”.

---

## 6. Esquema `PlanillaDailySnapshot` (v2)

```ts
schemaVersion?: 1 | 2;  // ausente = 1
resistencia?: ResistenciaDia;
estadoAtencional?: FaseAtencional;
// legacy sin tocar:
profundidadMaxima: FocusBandId;
espectroBloques: EspectroBloques;
```

---

## 7. Plan de implementación (fase 2 — hecho en repo)

1. Funciones puras + tests en `termodinamicaAtencional.ts` / `.test.ts`
2. `buildDailySnapshot` rellena `resistencia` y `estadoAtencional`
3. `planeacion.tsx` — tarjeta usa `computeTermodinamicaCompareV2` y etiquetas de fase
4. Analytics: lectura opcional de `resistencia` en snapshots futuros

**Fuera de alcance v2:** PS por ruta (0/2/5/8), desglosador situación, copy corporal en UI de bandas.

---

## 8. Criterios de aceptación

- Un día con 0 subs en dominio fluido y 4 con fricción → fase `entrenamiento`, índice bajo.
- Un día con ≥60% dominio fluido y ≤35% fricción → fase `dominio_fluido`.
- Compare v2 muestra mejora cuando baja fricción y sube dominio fluido (no cuando sube “bloques al límite”).
- Snapshots antiguos sin `schemaVersion` siguen cargando; compare usa resistencia si existe, si no deriva de vehículos del día live.
