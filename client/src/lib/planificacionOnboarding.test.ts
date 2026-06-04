import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computePrimerDiaAutoComplete,
  getPrimerDiaItems,
  getTutorialSteps,
} from "./planificacionOnboarding.ts";

describe("planificacionOnboarding", () => {
  it("getTutorialSteps varía por perfil", () => {
    assert.equal(getTutorialSteps("base").length, 5);
    assert.ok(getTutorialSteps("estudiante").length > getTutorialSteps("base").length);
    assert.ok(getTutorialSteps("produccion").length > getTutorialSteps("base").length);
  });

  it("computePrimerDiaAutoComplete detecta vehículo y cierre", () => {
    const dayStart = Date.now() - 3600_000;
    const now = Date.now();
    const auto = computePrimerDiaAutoComplete({
      dayStartMs: dayStart,
      segmentos: [{ estado: "pendiente" }],
      vehicles: [
        { status: "cumplido", cierreAt: now, aperturaAt: now },
      ],
    });
    assert.equal(auto.segmento, true);
    assert.equal(auto.vehiculo, true);
    assert.equal(auto.cierre, true);
  });

  it("getPrimerDiaItems incluye desglosador en produccion", () => {
    const keys = getPrimerDiaItems("produccion").map(i => i.key);
    assert.ok(keys.includes("desglosador"));
    assert.ok(!keys.includes("proyecto"));
  });
});
