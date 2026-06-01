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
import { getLocalDayStartMs } from "../lib/segmentTime.ts";

function localAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return new Date(y, mo, d, h, min).getTime();
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

  it("nowToClockDeg usa hora local del sistema", () => {
    const now = localAt(2026, 4, 18, 9, 30);
    assert.equal(nowToClockDeg(now), clockMinutesToDeg(9 * 60 + 30));
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
  const dayStart = getLocalDayStartMs(localAt(2026, 4, 18, 12, 0));

  it("incluye fondo para 2 vueltas (AM/PM)", () => {
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [],
      now: localAt(2026, 4, 18, 10, 0),
    });
    assert.ok(arcs.filter(a => a.kind === "fondo").length >= 2);
    void dayStart;
  });

  it("antes del umbral sin entropía roja", () => {
    const now = localAt(2026, 4, 18, 5, 0);
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      now,
    });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
  });

  it("sin segmentos tras 06:00 no genera rojo", () => {
    const now = localAt(2026, 4, 18, 8, 0);
    const arcs = computeTimelineClockArcs({ vehiculos: [], segmentos: [], now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    const stats = computeTimelineDayStats({ vehiculos: [], segmentos: [], now });
    assert.equal(stats.entropiaMin, 0);
  });

  it("hueco planificado sin vehículo genera entropía roja", () => {
    const now = localAt(2026, 4, 18, 9, 0);
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "entropia"));
  });

  it("1 min sin actividad no pinta bloque entero si hubo cobertura previa", () => {
    const apertura = localAt(2026, 4, 18, 8, 15);
    const cierre = localAt(2026, 4, 18, 9, 0);
    const now = localAt(2026, 4, 18, 9, 1);
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
    const apertura = localAt(2026, 4, 18, 8, 15);
    const cierre = localAt(2026, 4, 18, 9, 0);
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
      now: localAt(2026, 4, 18, 10, 0),
    });
    assert.ok(arcs.some(a => a.kind === "conquista"));
  });

  it("descanso activo cubre hueco sin entropía", () => {
    const apertura = localAt(2026, 4, 18, 8, 0);
    const now = localAt(2026, 4, 18, 8, 30);
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
});

describe("computeAnilloEstado", () => {
  it("modo libre sin segmentos después de 06:00", () => {
    const now = localAt(2026, 4, 18, 7, 0);
    const st = computeAnilloEstado({ segmentos: [], vehiculos: [], now });
    assert.equal(st.mode, "libre");
  });

  it("modo libre antes del primer segmento", () => {
    const now = localAt(2026, 4, 18, 6, 0);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "10:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(st.mode, "libre");
  });

  it("modo entropía en segmento planificado sin cobertura", () => {
    const now = localAt(2026, 4, 18, 9, 0);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(st.mode, "entropia");
  });
});
