import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "./persistence.ts";
import { mergeActiveVehicleSessionState } from "./situacionSessionMerge.ts";
import {
  applyVehicleSessionSeal,
  isVehicleSessionSealed,
  resetVehicleSessionSealsForTests,
  sealVehicleSessionClose,
} from "./vehicleSessionSeal.ts";
import { filterVehiclesForAnilloCoverage } from "./ghostVehicleEngine.ts";

function veh(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    titulo: "Test",
    criterioFin: "tiempo",
    criterioDetalle: "10 min",
    userId: "u1",
    status: "activo",
    createdAt: new Date(),
    tiempoInicio: new Date(),
    ...partial,
  } as Vehicle;
}

function limaAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return Date.UTC(y, mo, d, h + 5, min);
}

describe("vehicleSessionSeal", () => {
  it("applyVehicleSessionSeal fuerza cierre sobre activo remoto", () => {
    resetVehicleSessionSealsForTests();
    const cierreAt = Date.now();
    sealVehicleSessionClose("v1", { cierreAt, status: "cumplido", clientRequestId: "crq1" });
    const remote = veh({ id: "v1", clientRequestId: "crq1", status: "activo" });
    const sealed = applyVehicleSessionSeal(remote);
    assert.equal(sealed.status, "cumplido");
    assert.equal(sealed.cierreAt, cierreAt);
    assert.equal(sealed.interrupcionActiva, false);
  });

  it("mergeActiveVehicleSessionState respeta sellado sobre activo Firebase", () => {
    resetVehicleSessionSealsForTests();
    const cierreAt = Date.now();
    sealVehicleSessionClose("dg1", { cierreAt, status: "cumplido" });
    const remote = veh({
      id: "dg1",
      status: "activo",
      tipoReloj: "desglosador",
      subVehiculos: [{ id: "s1", titulo: "A", status: "cumplido" }],
    });
    const local = veh({
      id: "dg1",
      status: "cumplido",
      cierreAt,
      tipoReloj: "desglosador",
    });
    const merged = mergeActiveVehicleSessionState(remote, local);
    assert.equal(merged.status, "cumplido");
    assert.ok(isVehicleSessionSealed("dg1"));
  });

  it("zombie desglosador no cubre anillo", () => {
    resetVehicleSessionSealsForTests();
    const now = Date.now();
    const zombie = veh({
      id: "zombie",
      status: "activo",
      tipoReloj: "desglosador",
      aperturaAt: now - 600_000,
      subVehiculos: [
        { id: "s1", titulo: "A", status: "cumplido" },
        { id: "s2", titulo: "B", status: "fallado" },
      ],
    });
    const filtered = filterVehiclesForAnilloCoverage([zombie], now);
    assert.equal(filtered.some(v => v.id === "zombie" && v.status === "activo"), false);
  });
});
