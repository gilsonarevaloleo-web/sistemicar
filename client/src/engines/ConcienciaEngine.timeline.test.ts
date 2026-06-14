import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  calcularBalanceConquistaJornada,
  clockMinutesToDeg,
  computeAnilloEstado,
  computeTimelineClockArcs,
  computeTimelineDayStats,
  getUmbralConcienciaMin,
  limaNowToClockDeg,
  listRetroactiveCentinelaGapsToPersist,
  resolveConsciousSessionStart,
  UMBRAL_CONTINGENCIA_MIN,
} from "./ConcienciaEngine.ts";
import { getJournalDayStartMs } from "../lib/segmentTime.ts";
import { filterVehiclesForAnilloCoverage } from "../lib/ghostVehicleEngine.ts";

/** Hora civil en Lima (UTC-5) como timestamp UTC. */
function limaAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return Date.UTC(y, mo, d, h + 5, min);
}

/** Sesión centinela sellada (autoVerdad) para tests de puntero y persistencia. */
function sesionCentinela(
  apertura: number,
  opts?: { cierreAt?: number; status?: "activo" | "archivado" }
) {
  return {
    autoVerdad: true,
    status: opts?.status ?? (opts?.cierreAt != null ? "archivado" : "activo"),
    aperturaAt: apertura,
    ...(opts?.cierreAt != null ? { cierreAt: opts.cierreAt } : {}),
  };
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

  it("sin segmentos tras 06:00 genera entropía en ventana vivida", () => {
    const now = limaAt(2026, 4, 18, 8, 0);
    const arcs = computeTimelineClockArcs({ vehiculos: [], segmentos: [], now });
    assert.ok(arcs.some(a => a.kind === "entropia"));
    const stats = computeTimelineDayStats({ vehiculos: [], segmentos: [], now });
    assert.ok(stats.entropiaMin > 0);
  });

  it("sin segmentos descanso activo cubre ventana sin entropía", () => {
    const apertura = limaAt(2026, 4, 18, 6, 0);
    const now = limaAt(2026, 4, 18, 8, 0);
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "descanso",
      status: "activo",
      aperturaAt: apertura,
    }];
    const arcs = computeTimelineClockArcs({ vehiculos, segmentos: [], now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    const st = computeAnilloEstado({ segmentos: [], vehiculos, now });
    assert.equal(st.mode, "conquista");
    assert.equal(st.centerGuide, "Recarga consciente activa");
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

  it("descanso activo cubre hueco sin entropía y puntero morado", () => {
    const apertura = limaAt(2026, 4, 18, 8, 0);
    const now = limaAt(2026, 4, 18, 8, 30);
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "descanso",
      status: "activo",
      aperturaAt: apertura,
    }];
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const arcs = computeTimelineClockArcs({ segmentos, vehiculos, now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    assert.ok(arcs.some(a => a.kind === "conquista"));
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    assert.equal(st.mode, "conquista");
    assert.equal(st.centerGuide, "Recarga consciente activa");
  });

  it("a las 09:00 trabajo desde 05:00 cubre segmento sin entropía roja", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const journalStart = getJournalDayStartMs(now);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo",
      aperturaAt: journalStart,
    }];
    const arcs = computeTimelineClockArcs({ segmentos, vehiculos, now });
    assert.equal(arcs.filter(a => a.kind === "entropia").length, 0);
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    assert.equal(st.mode, "conquista");
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

  it("a las 5:40 segmento 5-10 sin vehículo en jornada: rojo, sin morado", () => {
    const now = limaAt(2026, 4, 18, 5, 40);
    const arcs = computeTimelineClockArcs({
      vehiculos: [],
      segmentos: [{ horaInicio: "05:00", horaFin: "10:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "entropia"));
    assert.equal(arcs.filter(a => a.kind === "conquista").length, 0);
  });

  it("apertura tardía (6:00) muestra ~60 min entropía antes de conquista", () => {
    const now = limaAt(2026, 4, 18, 7, 0);
    const apertura = limaAt(2026, 4, 18, 6, 0);
    const segmentos = [{ horaInicio: "05:00", horaFin: "10:00" }];
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo",
      aperturaAt: apertura,
    }];
    const stats = computeTimelineDayStats({ segmentos, vehiculos, now });
    assert.ok(stats.entropiaMin >= 55 && stats.entropiaMin <= 65, "~60 min entropía");
    assert.ok(stats.conquistaMin >= 55 && stats.conquistaMin <= 65, "~60 min conquista");
    const arcs = computeTimelineClockArcs({ segmentos, vehiculos, now });
    assert.ok(arcs.some(a => a.kind === "entropia"));
    assert.ok(arcs.some(a => a.kind === "conquista"));
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    assert.equal(st.mode, "conquista");
  });

  it("aperturaAt retroactivo se corrige con createdAt posterior", () => {
    const now = limaAt(2026, 4, 18, 7, 0);
    const journalStart = getJournalDayStartMs(now);
    const realOpen = limaAt(2026, 4, 18, 6, 0);
    const segmentos = [{ horaInicio: "05:00", horaFin: "10:00" }];
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo",
      aperturaAt: journalStart,
      createdAt: realOpen,
    }];
    assert.equal(resolveConsciousSessionStart(vehiculos[0], now), realOpen);
    const stats = computeTimelineDayStats({ segmentos, vehiculos, now });
    assert.ok(stats.entropiaMin >= 55 && stats.entropiaMin <= 65);
  });

  it("activo arrastrado desde 04:00 no pinta morado tras filtro de anillo", () => {
    const now = limaAt(2026, 4, 18, 5, 40);
    const journalStart = getJournalDayStartMs(now);
    const stale = {
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo",
      aperturaAt: journalStart - 3600_000,
    };
    const centinela = sesionCentinela(limaAt(2026, 4, 18, 5, 2));
    const vehiculos = filterVehiclesForAnilloCoverage([stale as any, centinela as any], now);
    assert.equal(vehiculos.length, 1);
    assert.equal(vehiculos[0].autoVerdad, true);
    const arcs = computeTimelineClockArcs({
      vehiculos,
      segmentos: [{ horaInicio: "05:00", horaFin: "10:00" }],
      now,
    });
    assert.ok(arcs.some(a => a.kind === "entropia"));
    assert.equal(arcs.filter(a => a.kind === "conquista").length, 0);
    const st = computeAnilloEstado({
      segmentos: [{ horaInicio: "05:00", horaFin: "10:00" }],
      vehiculos,
      now,
    });
    assert.equal(st.mode, "entropia");
  });

  it("conquista solo dentro del segmento planificado, no antes del umbral", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const journalStart = getJournalDayStartMs(now);
    const vehiculos = [{
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo",
      aperturaAt: journalStart,
    }];
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const arcs = computeTimelineClockArcs({ segmentos, vehiculos, now });
    const conquista = arcs.filter(a => a.kind === "conquista");
    assert.ok(conquista.length > 0);
    const minDeg = Math.min(...conquista.map(a => a.startDeg));
    assert.ok(minDeg >= clockMinutesToDeg(8 * 60) - 1, "morado no antes de 08:00");
  });
});

describe("computeAnilloEstado", () => {
  it("modo entropía sin segmentos después de 06:00 sin flota activa", () => {
    const now = limaAt(2026, 4, 18, 7, 0);
    const st = computeAnilloEstado({
      segmentos: [],
      vehiculos: [sesionCentinela(limaAt(2026, 4, 18, 6, 2))],
      now,
    });
    assert.equal(st.mode, "entropia");
    assert.equal(st.sinSegmentos, true);
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
      vehiculos: [sesionCentinela(limaAt(2026, 4, 18, 8, 2))],
      now,
    });
    assert.equal(st.mode, "entropia");
  });

  it("varios segmentos acumulan entropía en todos los huecos planificados", () => {
    const now = limaAt(2026, 4, 18, 15, 0);
    const segmentos = [
      { horaInicio: "08:00", horaFin: "10:00" },
      { horaInicio: "11:00", horaFin: "12:00" },
      { horaInicio: "14:00", horaFin: "16:00" },
    ];
    const stats = computeTimelineDayStats({ vehiculos: [], segmentos, now });
    assert.equal(stats.entropiaMin, 240, "2h + 1h + 1h de huecos planificados");
    const st = computeAnilloEstado({
      segmentos,
      vehiculos: [sesionCentinela(limaAt(2026, 4, 18, 8, 2))],
      now,
    });
    assert.equal(st.mode, "entropia");
  });

  it("desglosador pausado no bloquea entropía ni puntero rojo", () => {
    const now = limaAt(2026, 4, 18, 9, 30);
    const journalStart = getJournalDayStartMs(now);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const paused = {
      autoVerdad: false,
      tipoFlota: "tiempo",
      tipoReloj: "desglosador",
      status: "activo",
      aperturaAt: journalStart,
      interrupcionActiva: true,
      desglosadorPausa: { motivo: "test" },
    };
    const centinela = sesionCentinela(limaAt(2026, 4, 18, 8, 2));
    const stats = computeTimelineDayStats({ segmentos, vehiculos: [paused, centinela], now });
    assert.ok(stats.entropiaMin >= 88, "casi todo el segmento vivido cuenta como entropía");
    const st = computeAnilloEstado({ segmentos, vehiculos: [paused, centinela], now });
    assert.equal(st.mode, "entropia");
  });

  it("sin centinela activo aún, puntero libre durante los primeros 2 min de hueco", () => {
    const now = limaAt(2026, 4, 18, 8, 1);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const stats = computeTimelineDayStats({ segmentos, vehiculos: [], now });
    assert.ok(stats.entropiaMin >= 0.5, "el hueco ya cuenta en arcos/stats");
    const st = computeAnilloEstado({ segmentos, vehiculos: [], now });
    assert.equal(st.mode, "libre", "puntero no rojo antes de que el centinela materialice la sesión");
  });

  it("centinela activo enciende puntero rojo tras el delay de 2 min", () => {
    const now = limaAt(2026, 4, 18, 9, 4);
    const journalStart = getJournalDayStartMs(now);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const vehiculos = [
      {
        autoVerdad: false,
        tipoFlota: "tiempo",
        status: "cumplido",
        aperturaAt: journalStart,
        cierreAt: limaAt(2026, 4, 18, 9, 0),
        duracionFinal: 240,
      },
      sesionCentinela(limaAt(2026, 4, 18, 9, 2)),
    ];
    const stats = computeTimelineDayStats({ segmentos, vehiculos, now });
    assert.ok(stats.entropiaMin >= 3.5, "hueco 9:00–9:04 más sesión centinela sellada");
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    assert.equal(st.mode, "entropia", "centinela activo mantiene puntero rojo");
  });

  it("entropía sellada persiste al abrir vehículo consciente", () => {
    const now = limaAt(2026, 4, 18, 10, 0);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const entropiaSellada = sesionCentinela(limaAt(2026, 4, 18, 8, 0), {
      cierreAt: limaAt(2026, 4, 18, 9, 0),
      status: "archivado",
    });
    const consciente = {
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo" as const,
      aperturaAt: limaAt(2026, 4, 18, 9, 5),
    };
    const vehiculos = [entropiaSellada, consciente];
    const stats = computeTimelineDayStats({ segmentos, vehiculos, now });
    assert.ok(stats.entropiaMin >= 58, "60 min sellados menos solape mínimo con conquista");
    assert.ok(stats.conquistaMin >= 50 && stats.conquistaMin <= 60, "conquista solo desde 9:05");
    const arcs = computeTimelineClockArcs({ segmentos, vehiculos, now });
    const entropiaArcs = arcs.filter(a => a.kind === "entropia");
    const conquistaArcs = arcs.filter(a => a.kind === "conquista");
    assert.ok(entropiaArcs.length > 0, "arcos rojos históricos permanecen");
    assert.ok(conquistaArcs.length > 0, "arco morado desde apertura consciente");
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    assert.equal(st.mode, "conquista", "vehículo consciente activo domina el puntero");
  });

  it("aperturaAt retroactivo no borra entropía sellada previa", () => {
    const now = limaAt(2026, 4, 18, 10, 0);
    const journalStart = getJournalDayStartMs(now);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const entropiaSellada = sesionCentinela(limaAt(2026, 4, 18, 8, 0), {
      cierreAt: limaAt(2026, 4, 18, 9, 0),
      status: "archivado",
    });
    const conscienteRetro = {
      autoVerdad: false,
      tipoFlota: "tiempo",
      status: "activo" as const,
      aperturaAt: journalStart,
      createdAt: limaAt(2026, 4, 18, 9, 0),
    };
    const stats = computeTimelineDayStats({
      segmentos,
      vehiculos: [entropiaSellada, conscienteRetro],
      now,
    });
    assert.ok(stats.entropiaMin >= 55, "entropía 8:00–9:00 no se borra por cobertura retroactiva");
  });

  it("modo entropía implica minutos inconscientes > 0", () => {
    const now = limaAt(2026, 4, 18, 9, 0);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00" }];
    const vehiculos = [sesionCentinela(limaAt(2026, 4, 18, 8, 2))];
    const st = computeAnilloEstado({ segmentos, vehiculos, now });
    const stats = computeTimelineDayStats({ segmentos, vehiculos, now });
    assert.equal(st.mode, "entropia");
    assert.ok(stats.entropiaMin > 0);
  });

  it("activo cruzando 05:00 sin filtro de anillo aún muestra conquista en motor", () => {
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

describe("calcularBalanceConquistaJornada", () => {
  it("entrada tarde: entropía en cierre resta 2 min de gracia por hueco (≠ puntero en vivo)", () => {
    const now = limaAt(2026, 4, 18, 10, 0);
    const segmentos = [{ horaInicio: "08:00", horaFin: "12:00", nombre: "Mañana" }];
    const balance = calcularBalanceConquistaJornada({ segmentos, vehiculos: [], now });
    assert.ok(balance.entropiaMin >= 117 && balance.entropiaMin <= 119, "~118 min (120 − 2 de gracia)");
    assert.equal(balance.conquistaMin, 0);
    assert.equal(
      Math.round((balance.conquistaMin + balance.entropiaMin + balance.vacioMin) * 10) / 10,
      balance.jornadaMin,
      "conquista + entropía + vacío = jornada planificada"
    );
    const st = computeAnilloEstado({ segmentos, vehiculos: [], now });
    assert.equal(st.mode, "entropia", "puntero usa centinela retroactivo sellado");
  });

  it("listRetroactiveCentinelaGapsToPersist propone huecos post-gracia en segmentos", () => {
    const now = limaAt(2026, 4, 18, 10, 0);
    const gaps = listRetroactiveCentinelaGapsToPersist({
      segmentos: [{ horaInicio: "08:00", horaFin: "12:00" }],
      vehiculos: [],
      now,
    });
    assert.equal(gaps.length, 1);
    assert.equal(gaps[0].aperturaAt, limaAt(2026, 4, 18, 8, 2));
    assert.equal(gaps[0].cierreAt, now);
  });
});
