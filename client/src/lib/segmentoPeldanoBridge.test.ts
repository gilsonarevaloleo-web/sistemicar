import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDefaultRutasMentales,
  countSegmentosListosParaSellar,
  refreshRutasTituloBase,
} from "./segmentoPeldanoBridge.ts";
import type { SegmentoV5 } from "./persistence.ts";

describe("segmentoPeldanoBridge", () => {
  it("buildDefaultRutasMentales crea A/B/C con 3 pasos", () => {
    const r = buildDefaultRutasMentales("Costura AM");
    assert.equal(r.rutaActiva, "a");
    assert.equal(r.rutas.a.pasos.length, 3);
    assert.match(r.rutas.a.pasos[0].titulo, /Costura AM/);
    assert.equal(r.rutas.b.perfil, "fluido_concentrado");
    assert.equal(r.rutas.c.perfil, "secuencia_completa");
  });

  it("refreshRutasTituloBase actualiza paso 1", () => {
    const base = buildDefaultRutasMentales("A");
    const next = refreshRutasTituloBase(base, "Bloque PM");
    assert.match(next.rutas.a.pasos[0].titulo, /Bloque PM/);
    assert.equal(next.rutas.a.pasos[1].titulo, base.rutas.a.pasos[1].titulo);
  });

  it("countSegmentosListosParaSellar cuenta cerrados manual con peldaño", () => {
    const segs: SegmentoV5[] = [
      {
        id: "s1",
        nombre: "AM",
        horaInicio: "08:00",
        horaFin: "12:00",
        color: "#fff",
        icono: "sun",
        estado: "cerrado_manual",
        eventos: [],
        psGanados: 0,
        proyectoVinculadoId: "p1",
        proyectoPeldanoId: "pel1",
      },
      {
        id: "s2",
        nombre: "PM",
        horaInicio: "14:00",
        horaFin: "18:00",
        color: "#fff",
        icono: "moon",
        estado: "entropia",
        eventos: [],
        psGanados: 0,
        proyectoVinculadoId: "p1",
        proyectoPeldanoId: "pel2",
      },
    ];
    assert.equal(countSegmentosListosParaSellar(segs), 1);
  });
});
