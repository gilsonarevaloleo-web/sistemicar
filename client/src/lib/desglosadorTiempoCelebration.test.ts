import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubVehiculo, Vehicle } from "./persistence";
import {
  computeDesglosadorTiempoCloseSummary,
  fmtDesgloseSec,
} from "./desglosadorTiempoCelebration.ts";
import { DESGLOSADOR_CYCLE_CLOSE_BASE_PS } from "./sovereigntyPointsConfig";

function v(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    id: partial.id,
    userId: "u1",
    titulo: partial.titulo ?? "Desglose test",
    status: partial.status ?? "activo",
    tipoReloj: "desglosador",
    createdAt: partial.createdAt ?? new Date(),
    aperturaAt: partial.aperturaAt ?? Date.now() - 30 * 60_000,
    ...partial,
  } as Vehicle;
}

describe("desglosadorTiempoCelebration", () => {
  it("fmtDesgloseSec formatea mm:ss", () => {
    assert.equal(fmtDesgloseSec(125), "02:05");
  });

  it("computeDesglosadorTiempoCloseSummary agrega métricas y mensaje", () => {
    const subs: SubVehiculo[] = [
      {
        id: "s1",
        titulo: "Tarea A",
        status: "cumplido",
        duracionFinal: 300,
        tiempoSugeridoSeg: 360,
        cantidadLograda: 2,
        cantidadObjetivo: 2,
      },
      {
        id: "s2",
        titulo: "Tarea B",
        status: "fallado",
        duracionFinal: 120,
      },
    ];
    const summary = computeDesglosadorTiempoCloseSummary(v({ id: "d1" }), subs, {
      duracionMin: 12,
      psSubs: 8,
      psCierre: DESGLOSADOR_CYCLE_CLOSE_BASE_PS,
      psProfundidad: 4,
      psRuta: 0,
      psTotal: 8 + DESGLOSADOR_CYCLE_CLOSE_BASE_PS + 4,
      psAwardedNow: 6,
    });
    assert.equal(summary.cumplidos, 1);
    assert.equal(summary.fallados, 1);
    assert.equal(summary.deltaPerdiendo, true);
    assert.ok(summary.mensaje.length > 10);
    assert.ok(summary.combustibleMensaje.includes("decisión"));
    assert.equal(summary.subs.length, 2);
  });
});
