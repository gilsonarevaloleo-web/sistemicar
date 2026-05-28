import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeTimelineClockArcs,
  computeTimelineDayStats,
  msToClockDeg,
  vehicleSessionRange,
} from "./ConcienciaEngine.ts";
import { getLimaDayStartMs } from "../lib/segmentTime.ts";

describe("msToClockDeg", () => {
  it("12:00 Lima queda arriba (0 grados)", () => {
    const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 17, 0, 0)); // noon Lima May 18
    const noon = dayStart + 12 * 3600000;
    assert.ok(Math.abs(msToClockDeg(noon, dayStart)) < 0.01);
  });
});

describe("computeTimelineClockArcs", () => {
  const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 17, 0, 0));
  const now = dayStart + 15 * 3600000; // 15:00

  it("incluye arco fondo 24h", () => {
    const arcs = computeTimelineClockArcs({ vehiculos: [], now });
    assert.ok(arcs.some(a => a.kind === "fondo" && a.endDeg - a.startDeg >= 359));
  });

  it("sesion consciente genera arco morado en franja horaria", () => {
    const apertura = dayStart + 10 * 3600000;
    const cierre = dayStart + 10.5 * 3600000;
    const arcs = computeTimelineClockArcs({
      vehiculos: [{
        autoVerdad: false,
        status: "cumplido",
        aperturaAt: apertura,
        cierreAt: cierre,
        duracionFinal: 30,
      }],
      now,
    });
    const conquista = arcs.filter(a => a.kind === "conquista");
    assert.ok(conquista.length >= 1);
  });

  it("vac�o del dia vivido genera arco rojo", () => {
    const arcs = computeTimelineClockArcs({ vehiculos: [], now });
    const rojo = arcs.filter(a => a.kind === "entropia");
    assert.ok(rojo.length >= 1);
    const stats = computeTimelineDayStats({ vehiculos: [], now });
    assert.ok(stats.vacioMin > 0);
    assert.equal(stats.conquistaMin, 0);
  });

  it("centinela solapado con consciente no duplica rojo", () => {
    const apertura = dayStart + 10 * 3600000;
    const stats = computeTimelineDayStats({
      vehiculos: [
        { autoVerdad: false, status: "activo", aperturaAt: apertura },
        { autoVerdad: true, status: "activo", aperturaAt: apertura },
      ],
      now: apertura + 3600000,
    });
    assert.ok(stats.conquistaMin >= 59);
    assert.equal(stats.centinelaMin, 0);
  });
});

describe("vehicleSessionRange fallback", () => {
  it("usa duracionFinal si falta cierreAt", () => {
    const start = Date.UTC(2026, 4, 18, 15, 0, 0);
    const range = vehicleSessionRange(
      { autoVerdad: false, status: "cumplido", aperturaAt: start, duracionFinal: 45 },
      start + 3600000
    );
    assert.ok(range);
    assert.equal(range!.end - range!.start, 45 * 60000);
  });
});
