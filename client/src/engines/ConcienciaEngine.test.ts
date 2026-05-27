import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calcularMetricasAnilloConciencia,
  calcularBalanceConquistaJornada,
} from "./ConcienciaEngine";
import { getJournalDayStartMs, getLimaDayStartMs } from "../lib/segmentTime";

const now = new Date("2026-05-18T14:00:00").getTime();
const journalStart = getJournalDayStartMs(now);
const limaDayStart = getLimaDayStartMs(now);

const segmentos = [{ horaInicio: "9:00", horaFin: "11:00" }]; // 120 min jornada

describe("calcularMetricasAnilloConciencia", () => {
  it("sin vehculos: arcos en cero", () => {
    const m = calcularMetricasAnilloConciencia({ segmentos, vehiculos: [], now });
    assert.equal(m.conquistaMin, 0);
    assert.equal(m.entropiaMin, 0);
    assert.equal(m.conquistaArcPct, 0);
    assert.equal(m.entropiaArcPct, 0);
    assert.equal(m.jornadaMin, 120);
  });

  it("cierre de vehculo suma conquista", () => {
    const m = calcularMetricasAnilloConciencia({
      segmentos,
      vehiculos: [
        {
          autoVerdad: false,
          status: "cumplido",
          aperturaAt: journalStart + 3600000,
          cierreAt: journalStart + 7200000,
          duracionFinal: 60,
        },
      ],
      now,
    });
    assert.equal(m.conquistaMin, 60);
    assert.equal(m.entropiaMin, 0);
    assert.ok(m.conquistaArcPct > 0);
    assert.equal(m.entropiaArcPct, 0);
    assert.ok(m.fillPct <= 100);
  });

  it("centinela activo crece entropa en vivo", () => {
    const aperturaAt = now - 30 * 60 * 1000;
    const m = calcularMetricasAnilloConciencia({
      segmentos,
      vehiculos: [{ autoVerdad: true, status: "activo", aperturaAt }],
      now,
    });
    assert.ok(m.entropiaMin >= 29);
    assert.equal(m.conquistaMin, 0);
    assert.equal(m.entropiaArcPct, m.fillPct);
  });

  it("conquista y entropa compiten sin superar 100% fill", () => {
    const m = calcularMetricasAnilloConciencia({
      segmentos,
      vehiculos: [
        {
          autoVerdad: false,
          status: "cumplido",
          aperturaAt: journalStart + 3600000,
          cierreAt: journalStart + 7200000,
          duracionFinal: 60,
        },
        {
          autoVerdad: true,
          status: "activo",
          aperturaAt: now - 20 * 60 * 1000,
        },
      ],
      now,
    });
    assert.ok(m.conquistaMin > 0);
    assert.ok(m.entropiaMin > 0);
    assert.ok(Math.abs(m.conquistaArcPct + m.entropiaArcPct - m.fillPct) < 0.01);
    assert.ok(m.fillPct <= 100);
  });

  it("centinela solapado con conquista no cuenta entropia doble", () => {
    const apertura = now - 60 * 60000;
    const m = calcularMetricasAnilloConciencia({
      segmentos,
      vehiculos: [
        { autoVerdad: false, status: "activo", aperturaAt: apertura },
        { autoVerdad: true, status: "activo", aperturaAt: apertura },
      ],
      now,
    });
    assert.ok(m.conquistaMin >= 59);
    assert.equal(m.entropiaMin, 0);
    assert.equal(m.entropiaArcPct, 0);
  });
});

describe("calcularBalanceConquistaJornada", () => {
  it("segmento sin actividad: todo vaco", () => {
    const b = calcularBalanceConquistaJornada({
      segmentos: [{ nombre: "Maana", horaInicio: "9:00", horaFin: "11:00" }],
      vehiculos: [],
      now,
      dayStartMs: limaDayStart,
    });
    assert.equal(b.jornadaMin, 120);
    assert.equal(b.conquistaMin, 0);
    assert.equal(b.entropiaMin, 0);
    assert.equal(b.vacioMin, 120);
    assert.equal(b.segmentos[0].vacioMin, 120);
  });

  it("atribuye conquista y centinela al segmento correcto", () => {
    const segStart = limaDayStart + 9 * 3600000;
    const b = calcularBalanceConquistaJornada({
      segmentos: [{ nombre: "Bloque", horaInicio: "9:00", horaFin: "11:00" }],
      vehiculos: [
        {
          autoVerdad: false,
          status: "cumplido",
          aperturaAt: segStart,
          cierreAt: segStart + 45 * 60000,
          duracionFinal: 45,
        },
        {
          autoVerdad: true,
          status: "cumplido",
          aperturaAt: segStart + 50 * 60000,
          cierreAt: segStart + 70 * 60000,
          duracionFinal: 20,
        },
      ],
      now: segStart + 120 * 60000,
      dayStartMs: limaDayStart,
    });
    assert.ok(b.conquistaMin >= 45);
    assert.ok(b.entropiaMin >= 20);
    assert.ok(b.vacioMin >= 0);
    assert.equal(b.segmentos[0].nombre, "Bloque");
    assert.ok(b.segmentos[0].conquistaMin >= 45);
    assert.ok(b.segmentos[0].entropiaMin >= 20);
  });
});
