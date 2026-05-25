# Kit de Vendedores — Planificación SISTEMICAR

**Versión:** 1.0 · **Contacto:** Gilson · WhatsApp 918 260 514 · info@sistemicar.app

---

## 1. Qué vendes (en una frase)

**SISTEMICAR Planificación** no es un calendario ni una app de listas. Es un **motor del día** con módulos opcionales: uno para **cerrar bloques en tiempo libre** (estudiantes) y otro para **unidades y ritmo en producción repetitiva**.

Tu trabajo: detectar cuál stack necesita la persona y enviarla a pagar con **tu código de vendedor**.

---

## 2. Catálogo y precios (solo estos tienen checkout hoy)

| Producto | Precio | Comisión 30% (1er pago) |
|----------|--------|-------------------------|
| **Espejo** — El Corazón Sabio™ | $17 pago único | **$5.10** |
| **Planificación Base** | $19.99/mes | **$6.00** |
| **Soberanía del día** (situacional + Proyectos) | $29.99/mes | **$9.00** |
| **Operativo** (desglosador tiempo / unidades) | $39.99/mes | **$12.00** |

**Stacks orientativos:**

- **Estudiante / tiempo libre:** Base + Soberanía del día ? **$50/mes**
- **Producción:** Base + Operativo ? **$60/mes**

Los módulos Alquimia, Radar, Proyector, etc. están **en camino** — no prometas fechas ni precios.

---

## 3. ¿A quién recomendar qué?

### Stack Estudiante (Soberanía del día)

- Procrastina en tiempo libre (noche, mañana, “cuando nadie obliga”)
- Tiene ideas sueltas y no cierra bloques
- Estudia o aprende sin horario fijo
- **Frase clave:** *“3 ideas, cierras bloque — sin calendario rígido.”*

### Stack Producción (Operativo)

- Trabajo repetitivo por **unidades** (piezas, páginas, lotes, entregables)
- Pierde días porque el ritmo “a ojo” falla
- Necesita desglosar tiempo por unidad y récord
- **Frase clave:** *“Un día mal contabilizado al mes cuesta más que la suscripción.”*

### Planificación Base (siempre primero para mensual)

- Motor del día: La Flota, segmentos, vehículos
- **Obligatorio** antes de Soberanía del día u Operativo
- Vende Base sola si la persona solo quiere organizar el día sin premium

### Espejo ($17)

- Entrada de bajo riesgo: diagnóstico IA, 10 créditos
- Buen primer paso antes de suscripción mensual

---

## 4. Guion de venta (3 preguntas)

1. **“¿Tu problema es cerrar bloques cuando nadie te obliga, o contar unidades en trabajo repetitivo?”**  
   ? Estudiante vs Producción

2. **“¿Has perdido días enteros creyendo que produjiste y al cerrar faltó mucho?”**  
   ? Operativo (si dice sí)

3. **“¿Comparas esto con Notion o Todoist?”**  
   ? *“Aquí pagas por unidades, ritmo y cierre de bloque — no por listas.”*

---

## 5. Objeciones frecuentes

| Objeción | Respuesta |
|----------|-----------|
| “Es caro” | Para producción: un solo día mal medido al mes supera $40. Para estudiante: un bloque cerrado evita horas perdidas en culpa. |
| “Ya uso Notion” | Notion guarda notas. SISTEMICAR ejecuta el día con relojes y desglosadores. |
| “¿Incluye todo?” | No hay “todo incluido”. Cada módulo se paga aparte — solo lo que necesitas. |
| “¿Y Alquimia / Radar?” | En camino de implementación. Hoy vendemos Planificación + Espejo. |

---

## 6. Tu link de vendedor

Gilson te asigna un código, por ejemplo: `MARIA-PROD`

**Link de venta:**

```
https://sistemicar.app/pagos?ref=TU-CODIGO
```

El cliente debe pagar **desde ese link** (MercadoPago) para que se registre tu comisión automáticamente.

También funciona: `https://sistemicar.app/?ref=TU-CODIGO` (luego va a Pagos).

---

## 7. Pagos manuales (Yape / PayPal)

Si el cliente paga por Yape o PayPal:

1. Que te envíe **comprobante + correo** del cliente  
2. Tú reenvías a Gilson por WhatsApp con: **código vendedor, plan, monto, correo**  
3. Gilson activa el módulo manualmente y registra tu comisión

---

## 8. Comisiones y pagos a vendedores

- **30% del primer pago** del módulo vendido (tabla arriba)
- Solo cuenta venta **confirmada** (MercadoPago aprobado o Yape/PayPal verificado por Gilson)
- Gilson paga comisiones **mensualmente** (fecha acordada por WhatsApp)
- Renovaciones mensuales: consultar con Gilson (Fase 2 — comisión recurrente)

---

## 9. Después de la venta

1. Cliente paga ? inicia sesión en sistemicar.app con **el mismo correo del pago**  
2. Módulo se activa (automático o en minutos)  
3. Cliente entra a **Planificación** (`/planeacion`) o **Espejo** (`/espejo`)  
4. Soporte técnico: Gilson — tú no das soporte de producto salvo onboarding básico

---

## 10. Qué NO hacer

- No prometer módulos “en camino” con fecha  
- No vender bundles “todo incluido” (no existen)  
- No inventar precios distintos a la tabla  
- No compartir tu código con otro vendedor (pierdes atribución)

---

## 11. Para Gilson (admin)

- Crear código: POST `/api/admin/sellers` con `seller_code`, `seller_name`  
- Ver ventas: Admin Gilson ? pestaña **Vendedores** o GET `/api/admin/seller-sales`  
- Marcar comisión pagada: botón en admin o POST `/api/admin/seller-sales/:id/paid`  
- Log local: `data/seller-sales.json` en servidor

---

*SISTEMICAR © 2026 · Lima, Perú*
