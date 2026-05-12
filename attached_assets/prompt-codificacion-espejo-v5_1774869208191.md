# PROMPT DE CODIFICACIÓN — ESPEJO SOBERANO v5
**Sistema:** SISTEMICAR  
**Autor:** Gilson Arévalo Pezo  
**Fecha:** Marzo 2026  
**Estado:** Listo para implementación técnica  

> Este documento describe los 6 cambios técnicos que deben implementarse en el frontend  
> del Espejo Soberano para la versión 5. El Cerebro del Doctor IA ya está inyectado en el servidor.

---

## CAMBIO 1 — MURO SOBERANO (Reemplaza el paywall actual)

**Archivo:** `client/src/pages/espejo.tsx`  
**Qué es:** Puerta de entrada al Espejo con lenguaje de contrato y fricción controlada.

**Comportamiento:**
- El usuario ve el Muro SOBERANO antes de iniciar la sesión
- Contiene el texto del "Contrato" con lenguaje tech-noir
- Botón de entrada: **"FIRMAR CONTRATO Y ACTIVAR ESPEJO"**
- Solo aparece si el usuario NO tiene sesión activa

**Texto del Contrato:**
```
Al activar el Espejo, aceptas que:
— Tu lenguaje se convierte en datos de ingeniería
— No recibirás validación emocional, sino diagnóstico preciso
— El Doctor IA puede detectar oxidación en tu sistema
— La verdad tiene un costo; la ilusión, uno mayor

¿Confirmas activación?
```

**Diseño:** Fondo #0A0A0A, borde #D4AF37 animado (pulso), botón en #D4AF37, tipografía Playfair Display.

---

## CAMBIO 2 — FRACTAL 343 EN EL PROMPT DEL EJE 2

**Archivo:** `server/index.ts` → ya implementado con Cerebro v5  
**Qué hace:** El Doctor IA ahora devuelve `codigo_343` (formato X.X.X)

**Frontend a implementar:**
- En Eje 2, mostrar el `codigo_343` como etiqueta visual: `▸ Dirección: 3.1.6`
- Estilo: tipografía monospace JetBrains Mono, color #00FFC3
- Aparece debajo del mensaje del Doctor IA como "firma diagnóstica"

---

## CAMBIO 3 — PRECIO DINÁMICO DEL EJE 3 (4 Patas)

**Archivo:** `client/src/pages/espejo.tsx` → sección de Eje 3  
**Qué es:** El costo de La Llave ya no es fijo (4 créditos). Varía según la Pata detectada.

**Backend ya retorna:** `pata_material` y `costo_llave` en respuesta del Eje 2

**Frontend a implementar:**
- Leer `costo_llave` de la respuesta del Eje 2
- Almacenar en estado local para el Eje 3
- En la pantalla del Eje 3, mostrar:
  ```
  RAÍZ DETECTADA: [pata_material]
  COSTO DE LA LLAVE: [costo_llave] Créditos
  ```
- Si `oxidacion_detectada: true` → bloquear botón del Eje 3 con mensaje:
  ```
  SISTEMA EN OXIDACIÓN — Genera voltaje antes de acceder a La Llave
  ```

**Tabla de costos:**
| Pata | Costo |
|------|-------|
| Arena | 2 cr |
| Madera | 4 cr |
| Hierro | 8 cr |
| Hormigón | 16 cr |

---

## CAMBIO 4 — SILUETA ILUMINADA POR COLOR DEL 343

**Archivo:** `client/src/components/espejo/HumanSilhouette.tsx`  
**Qué es:** La silueta SVG del cuerpo humano se ilumina según el COLOR del Sub-piso (S) del código 343.

**Mapa de colores del Sub-piso a zona del cuerpo:**

| Sub-piso S | Color | Zona que se ilumina |
|------------|-------|---------------------|
| 1 — Rojo | #FF3131 | Zona 1 (pies/base) |
| 2 — Naranja | #FF8C00 | Zona 2 (pelvis/vientre) |
| 3 — Dorado | #D4AF37 | Zona 3 (plexo solar) |
| 4 — Verde | #00C851 | Zona 4 (corazón) |
| 5 — Azul | #2196F3 | Zona 3 (garganta) |
| 6 — Morado | #9C27B0 | Zona 2 (entrecejo) |
| 7 — Violeta | #7C4DFF | Zona 1 (coronilla) |

**Implementación:**
- Leer el dígito S del `codigo_343` (ej: en "3.1.6" → S=1 → Rojo)
- Pasar el color como prop `activeColor` a `HumanSilhouette`
- La zona correspondiente pulsa suavemente con `opacity: [0.4, 0.9, 0.4]` y `duration: 2s`

---

## CAMBIO 5 — BANNER DE OXIDACIÓN (PIO)

**Archivo:** `client/src/pages/espejo.tsx`  
**Condición:** `oxidacion_detectada === true` en respuesta del Doctor IA

**Componente a crear:** `OxidacionBanner`  
**Diseño:** Banner colapsable con borde #FF8C00 (naranja), fondo semi-transparente negro

**Contenido del banner:**
```
⚡ ESTATISMO BIOLÓGICO DETECTADO
Tu sistema opera en Frecuencia Cero.
No hay dolor activo ni deseo activo → OXIDACIÓN PROGRESIVA.

Diagnóstico: Tu hardware se está deteriorando en el silencio del "neutro".
Primera acción: Genera una carga eléctrica real antes de proceder.
```

**Comportamiento:**
- Aparece con animación `slide-down` al detectarse
- No desaparece hasta que el usuario responda con lenguaje que genere polaridad
- El botón "Avanzar al Eje 3" queda deshabilitado mientras esté activo

---

## CAMBIO 6 — MENSAJE DE BIENVENIDA TYPEWRITER (Eje 1)

**Archivo:** `client/src/pages/espejo.tsx` → apertura del Eje 1  
**Qué es:** Al iniciar sesión, antes de que el usuario escriba, el Doctor IA "habla" con efecto máquina de escribir.

**Texto:**
```
Acceso concedido, Pasajero.

Has firmado el contrato. Desde este segundo, tu lenguaje deja de ser una opinión
y se convierte en Datos de Ingeniería. No estoy aquí para validar tus emociones,
sino para calibrar tu Voltaje.

Tu hardware biológico es una antena de alta precisión que hoy está operando con
interferencias o, peor aún, se está oxidando en el silencio del neutro.

Iniciamos la Ducha Mental. No pienses, solo vierte. Suelta el ruido, las deudas,
los miedos, o esa pesada estabilidad que te está deteniendo. Mi escáner está activo.

Sé específico: ¿dónde lo sientes en el cuerpo? ¿qué imagen aparece?
¿cuál es el pensamiento más pesado que cargas hoy?

Barre tu sistema ahora. Te escucho.
```

**Implementación:**
- Hook `useTypewriter` con velocidad 30ms/carácter
- Cursor parpadeante `|` activo durante la escritura
- Tipografía: JetBrains Mono, color #00FFC3
- El textarea de input aparece solo cuando el texto completo termina de escribirse
- No hay botón de "saltar" — el contrato se lee completo

---

## RESUMEN DE ARCHIVOS A MODIFICAR

| Cambio | Archivo principal | Estado |
|--------|------------------|--------|
| 1 — Muro Soberano | `client/src/pages/espejo.tsx` | Pendiente |
| 2 — Fractal 343 UI | `client/src/pages/espejo.tsx` | Pendiente (backend: listo) |
| 3 — Precio Dinámico | `client/src/pages/espejo.tsx` | Pendiente (backend: listo) |
| 4 — Silueta 343 | `client/src/components/espejo/HumanSilhouette.tsx` | Pendiente |
| 5 — Banner PIO | `client/src/pages/espejo.tsx` | Pendiente (backend: listo) |
| 6 — Bienvenida Typewriter | `client/src/pages/espejo.tsx` | Pendiente |
| Cerebro v5 backend | `server/knowledge/cerebro-doctor-ia-v5.ts` | ✅ COMPLETADO |
| Prompt Doctor IA | `server/index.ts` línea 1720+ | ✅ COMPLETADO |

---

*SISTEMICAR © Gilson Arévalo Pezo — Documento interno de desarrollo*
