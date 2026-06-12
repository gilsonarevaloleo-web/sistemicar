import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePlanillaSegmentosWithLocal } from "./persistence";
import type { SegmentoV5 } from "./persistence";

function seg(partial: Partial<SegmentoV5> & Pick<SegmentoV5, "id">): SegmentoV5 {
  return {
    nombre: "Seg",
    horaInicio: "08:00",
    horaFin: "10:00",
    color: "#fff",
    icono: "zap",
    estado: "pendiente",
    eventos: [],
    psGanados: 0,
    ...partial,
  };
}

describe("mergePlanillaSegmentosWithLocal", () => {
  it("conserva activo local reciente frente a pendiente en Firebase", () => {
    const now = Date.now();
    const fb = [seg({ id: "a", estado: "pendiente" })];
    const local = [seg({ id: "a", estado: "activo", activadoAt: now - 30_000 })];
    const merged = mergePlanillaSegmentosWithLocal(fb, local, now);
    assert.equal(merged[0].estado, "activo");
  });

  it("conserva cerrado_manual local reciente frente a activo en Firebase", () => {
    const now = Date.now();
    const fb = [seg({ id: "a", estado: "activo", activadoAt: now - 600_000 })];
    const local = [seg({ id: "a", estado: "cerrado_manual", cerradoAt: now - 15_000, psGanados: 4 })];
    const merged = mergePlanillaSegmentosWithLocal(fb, local, now);
    assert.equal(merged[0].estado, "cerrado_manual");
    assert.equal(merged[0].psGanados, 4);
  });
});
