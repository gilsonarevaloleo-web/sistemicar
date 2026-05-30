import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clockMinutesToDeg,
  computeAnilloEstado,
  computeTimelineClockArcs,
  computeTimelineDayStats,
  getUmbralConcienciaMin,
  nowToClockDeg,
  UMBRAL_CONTINGENCIA_MIN,
} from "./ConcienciaEngine.ts";
import { getLimaDayStartMs } from "../lib/segmentTime.ts";

describe("clockMinutesToDeg / puntero 24h", () => {
  it("00:00 arriba (0°)", () => {
    assert.equal(clockMinutesToDeg(0), 0);
  });

  it("07:00 = 105° (7×15 + 0×0.25)", () => {
    assert.equal(clockMinutesToDeg(7 * 60), 105);
  });

  it("12:00 = 180° (medio día abajo)", () => {
    assert.equal(clockMinutesToDeg(12 * 60), 180);
  });
});

describe("Umbral de Conciencia", () => {
  it("sin segmentos usa 06:00", () => {
    assert.equal(getUmbralConcienciaMin([]), UMBRAL_CONTINGENCIA_MIN);
  });

  it("toma la hora de inicio más temprana", () => {
    assert.equal(
      getUmbralConcienciaMin([
        { horaInicio: "09:00", horaFin: "12:00" },
        { horaInicio: "07:30", horaFin: "09:00" },
      ]),
      7 * 60 + 30
    );
  });
});

describe("computeTimelineClockArcs bio-adaptativo", () => {
  const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 17, 0, 0));

  it("incluye arco fondo 24h", () => {
    const arcs = computeTimelineClockArcs({ vehiculos: [], segmentos: [], now: dayStart + 10 * 3600000 });
    assert.ok(arcs.some(a => a.kind === "fondo" && a.endDeg - a.startDeg >= 359));
  });

  it("antes del umbral solo reposo, sin entropía roja", () => {
    const now = dayStart + 5 * 3600000;
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "reposo"));
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
  });

  it("sin segmentos tras 06:00 no genera rojo (modo calibración)", () => {
    const now = dayStart + 8 * 3600000;
    const arcs = computeTimelineClockArcs({ vehiculos: [], segmentos: [], now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    const stats = computeTimelineDayStats({ vehiculos: [], segmentos: [], now });
    assert.equal(stats.entropiaMin, 0);
  });

  it("bloque planificado sin vehículo genera entropía roja", () => {
    const now = dayStart + 9 * 3600000;
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "entropia"));
  });

  it("vehículo voluntario genera arco morado", () => {
    const apertura = dayStart + 8 * 3600000 + 15 * 60000;
    const cierre = dayStart + 9 * 3600000;
    const arcs = computeTimelineClockArcs({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        status: "cumplido",
        aperturaAt: apertura,
        cierreAt: cierre,
        duracionFinal: 45,
      }],
      now: dayStart + 10 * 3600000,
    });
    assert.ok(arcs.some(a => a.kind === "conquista"));
  });
});

describe("computeAnilloEstado", () => {
  const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 17, 0, 0));

  it("modo calibración sin segmentos después de 06:00", () => {
    const now = dayStart + 7 * 3600000;
    const st = computeAnilloEstado({ segmentos: [], vehiculos: [], now });
    assert.equal(st.mode, "calibracion");
    assert.ok(st.centerGuide);
  });

  it("modo reposo antes del primer segmento", () => {
    const now = dayStart + 6 * 3600000;
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(st.mode, "reposo");
  });
});
