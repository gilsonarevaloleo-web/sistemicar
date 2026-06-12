import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  countDecisionesFromLedger,
  decisionKeySubDesglosador,
  getDecisionLedger,
  recordDecision,
} from "./decisionesLedger.ts";
import {
  computeCombustibleDia,
  mergeCombustibleWithLedger,
} from "./termodinamicaAtencional.ts";
import type { Vehicle } from "./persistence.ts";

describe("decisionesLedger", () => {
  const userId = "test-user-decisiones";
  const storage = new Map<string, string>();

  beforeEach(() => {
    storage.clear();
    (globalThis as typeof globalThis & { localStorage?: Storage }).localStorage = {
      getItem: (k: string) => storage.get(k) ?? null,
      setItem: (k: string, v: string) => { storage.set(k, v); },
      removeItem: (k: string) => { storage.delete(k); },
      clear: () => { storage.clear(); },
      key: () => null,
      length: 0,
    };
  });

  it("registra subs idempotentes", () => {
    recordDecision(userId, {
      key: decisionKeySubDesglosador("v1", "s1"),
      kind: "sub_desglosador",
      vehicleId: "v1",
    });
    recordDecision(userId, {
      key: decisionKeySubDesglosador("v1", "s1"),
      kind: "sub_desglosador",
      vehicleId: "v1",
    });
    const ledger = getDecisionLedger(userId);
    assert.equal(ledger.length, 1);
    assert.equal(countDecisionesFromLedger(ledger).subsTiempo, 1);
  });
});

describe("mergeCombustibleWithLedger", () => {
  it("nunca baja decisiones respecto al ledger", () => {
    const live = {
      bloques: 1,
      desglosadoresCerrados: 1,
      bloquesOtros: 0,
      subsTiempo: 2,
      subsSituacion: 0,
      misionesDirectas: 0,
      decisiones: 2,
    };
    const merged = mergeCombustibleWithLedger(live, [
      { key: "a", kind: "sub_desglosador", vehicleId: "v1", ts: Date.now() },
      { key: "b", kind: "sub_desglosador", vehicleId: "v1", ts: Date.now() },
      { key: "c", kind: "sub_desglosador", vehicleId: "v1", ts: Date.now() },
      { key: "d", kind: "sub_desglosador", vehicleId: "v1", ts: Date.now() },
      { key: "e", kind: "sub_desglosador", vehicleId: "v1", ts: Date.now() },
    ]);
    assert.equal(merged.subsTiempo, 5);
    assert.equal(merged.decisiones, 5);
  });

  it("usa snapshot cuando Firebase pierde subs del desglosador", () => {
    const dayStart = Date.now() - 3600_000;
    const vehicles = [
      {
        id: "d1",
        titulo: "Costura",
        status: "cumplido",
        tipoReloj: "desglosador",
        cierreAt: Date.now(),
        aperturaAt: dayStart + 1000,
        subVehiculos: [],
        termoDecisionSnapshot: {
          journalDayStartMs: dayStart,
          subsDesglosadorCumplidos: 8,
          subsSituacionCumplidos: 0,
          misionesDirectas: 0,
          recordedAt: Date.now(),
        },
      } as Vehicle,
    ];
    const c = computeCombustibleDia(vehicles, dayStart);
    assert.equal(c.subsTiempo, 8);
    assert.equal(c.decisiones, 8);
  });
});
