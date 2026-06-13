import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "./persistence.ts";
import {
  findLocalClosedOverride,
  notifyVehicleClosed,
  resolveLocalVehicleMatch,
  wasVehicleRecentlyClosed,
} from "./persistence.ts";
import { mergeActiveVehicleSessionState } from "./situacionSessionMerge.ts";

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

describe("vehicle close guard", () => {
  it("findLocalClosedOverride empareja por clientRequestId tras remap de id", () => {
    const closed = veh({
      id: "vehicle_old",
      clientRequestId: "crq_abc",
      status: "cumplido",
      cierreAt: Date.now(),
    });
    const remote = veh({
      id: "firebase_new_id",
      clientRequestId: "crq_abc",
      status: "activo",
    });
    const found = findLocalClosedOverride(remote, [closed]);
    assert.equal(found?.id, "vehicle_old");
    assert.equal(found?.status, "cumplido");
  });

  it("mergeActiveVehicleSessionState mantiene cierre local sobre activo remoto", () => {
    const local = veh({
      id: "fb1",
      status: "cumplido",
      cierreAt: 1000,
      duracionFinal: 12,
    });
    const remote = veh({ id: "fb1", status: "activo" });
    const merged = mergeActiveVehicleSessionState(remote, local);
    assert.equal(merged.status, "cumplido");
    assert.equal(merged.duracionFinal, 12);
  });

  it("wasVehicleRecentlyClosed recuerda clientRequestId", () => {
    notifyVehicleClosed(undefined, "crq_xyz");
    assert.equal(wasVehicleRecentlyClosed("otro_id", "crq_xyz"), true);
  });

  it("resolveLocalVehicleMatch encuentra local por clientRequestId", () => {
    const local = veh({ id: "old", clientRequestId: "crq_match", status: "cumplido" });
    const remote = veh({ id: "new", clientRequestId: "crq_match", status: "activo" });
    const match = resolveLocalVehicleMatch(remote, [local]);
    assert.equal(match?.id, "old");
  });
});
