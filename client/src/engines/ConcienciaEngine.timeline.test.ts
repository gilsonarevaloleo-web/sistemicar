import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clockMinutesToDeg,
  computeAnilloEstado,
  computeTimelineClockArcs,
  computeTimelineDayStats,
  getUmbralConcienciaMin,
  limaNowToClockDeg,
  UMBRAL_CONTINGENCIA_MIN,
} from "./ConcienciaEngine.ts";
import { getJournalDayStartMs } from "../lib/segmentTime.ts";

/** Hora civil en Lima (UTC-5) como timestamp UTC. */
function limaAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return Date.UTC(y, mo, d, h + 5, min);
}

describe("clockMinutesToDeg / puntero 12h", () => {
  it("00:00 arriba (0°)", () => {
    assert.equal(clockMinutesToDeg(0), 0);
  });

  it("07:00 = 210° (7×30)", () => {
    assert.equal(clockMinutesToDeg(7 * 60), 210);
  });

  it("12:00 vuelve arriba (0°)", () => {
    assert.equal(clockMinutesToDeg(12 * 60), 0);
  });

  it("limaNowToClockDeg usa hora Lima", () => {
    const now = limaAt(2026, 4, 18, 9, 30);
    assert.equal(limaNowToClockDeg(now), clockMinutesToDeg(9 * 60 + 30));
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

describe("computeTimelineClockArcs", () => {
  it("incluye fondo para 2 vueltas (AM/PM)", () => {
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [],
      now: limaAt(2026, 4, 18, 10, 0),
    });
    assert.ok(arcs.filter(a => a.kind === "fondo").length >= 2);
  });

  it("antes del umbral sin entropía roja", () => {
    const now = limaAt(2026, 4, 18, 5, 0);
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      now,
    });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
  });

  it("sin segmentos tras 06:00 no genera rojo", () => {
    const now = limaAt(2026, 4, 18, 8, 0);
    const arcs = computeTimelineClockArcs({ vehiculos: [], segmentos: [], now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    const stats = computeTimelineDayStats({ vehiculos: [], segmentos: [], now });
    assert.equal(stats.entropiaMin, 0);
  });

  it("hueco planificado sin vehículo genera entropía roja", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "entropia"));
  });

  it("vehículo activo cubre hueco sin entropía ni puntero rojo", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const journalStart = getJournalDayStartMs(now);
    const arcs = computeTimelineClockArcs({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "activo",
        aperturaAt: journalStart,
      }],
      now,
    });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    assert.ok(arcs.some(a => a.kind === "conquista"));
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "activo",
        aperturaAt: journalStart,
      }],
      now,
    });
    assert.equal(st.mode, "conquista");
  });

  it("1 min sin actividad no pinta bloque entero si hubo cobertura previa", () => {
    const apertura = limaAt(2026, 4, 18, 8, 15);
    const cierre = limaAt(2026, 4, 18, 9, 0);
    const now = limaAt(2026, 4, 18, 9, 1);
    const arcs = computeTimelineClockArcs({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "cumplido",
        aperturaAt: apertura,
        cierreAt: cierre,
        duracionFinal: 45,
      }],
      now,
    });
    const entropiaArcs = arcs.filter(a => a.kind === "entropia");
    assert.ok(entropiaArcs.length > 0);
    const entropiaDeg = entropiaArcs.reduce((acc, a) => acc + (a.endDeg - a.startDeg), 0);
    assert.ok(entropiaDeg < 15, "solo el hueco reciente, no 3h enteras");
  });

  it("vehículo voluntario genera arco morado", () => {
    const apertura = limaAt(2026, 4, 18, 8, 15);
    const cierre = limaAt(2026, 4, 18, 9, 0);
    const arcs = computeTimelineClockArcs({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "cumplido",
        aperturaAt: apertura,
        cierreAt: cierre,
        duracionFinal: 45,
      }],
      now: limaAt(2026, 4, 18, 10, 0),
    });
    assert.ok(arcs.some(a => a.kind === "conquista"));
  });

  it("descanso activo cubre hueco sin entropía", () => {
    const apertura = limaAt(2026, 4, 18, 8, 0);
    const now = limaAt(2026, 4, 18, 8, 30);
    const arcs = computeTimelineClockArcs({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "descanso",
        status: "activo",
        aperturaAt: apertura,
      }],
      now,
    });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    assert.equal(arcs.filter(a => a.kind === "conquista").length, 0);
  });

  it("activo desde antes de 05:00 no infla entropía de horas previas al umbral", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const journalStart = getJournalDayStartMs(now);
    const stats = computeTimelineDayStats({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "activo",
        aperturaAt: journalStart - 3600_000,
      }],
      now,
    });
    assert.equal(stats.entropiaMin, 0);
  });
});

describe("computeAnilloEstado", () => {
  it("modo libre sin segmentos después de 06:00", () => {
    const now = limaAt(2026, 4, 18, 7, 0);
    const st = computeAnilloEstado({ segmentos: [], vehiculos: [], now });
    assert.equal(st.mode, "libre");
  });

  it("modo libre antes del primer segmento", () => {
    const now = limaAt(2026, 4, 18, 6, 0);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(st.mode, "libre");
  });

  it("modo entropía en segmento planificado sin cobertura", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(st.mode, "entropia");
  });

  it("modo conquista inmediato con vehículo activo (incluso cruzando 05:00)", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const journalStart = getJournalDayStartMs(now);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [{
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "activo",
        aperturaAt: journalStart - 3600_000,
      }],
      now,
    });
    assert.equal(st.mode, "conquista");
  });
});
