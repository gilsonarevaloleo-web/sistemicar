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
import { reconcileVehicleList } from "./vehicleSessionAuthority.ts";

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

  it("reconcileVehicleList no reabre activo remoto tras cierre local", () => {
    notifyVehicleClosed("fb1", "crq_close");
    const localClosed = veh({
      id: "fb1",
      clientRequestId: "crq_close",
      status: "cumplido",
      cierreAt: Date.now(),
      duracionFinal: 15,
    });
    const remoteActive = veh({ id: "fb1", clientRequestId: "crq_close", status: "activo" });
    const merged = reconcileVehicleList({
      incoming: [remoteActive],
      localSources: [localClosed],
    });
    assert.equal(merged.length, 1);
    assert.equal(merged[0]?.status, "cumplido");
    assert.equal(merged[0]?.duracionFinal, 15);
  });

  it("reconcileVehicleList no rescata activo cerrado desde ref UI", () => {
    notifyVehicleClosed("v99", "crq_99");
    const closedInUi = veh({
      id: "v99",
      clientRequestId: "crq_99",
      status: "archivado",
      cierreAt: Date.now(),
    });
    const merged = reconcileVehicleList({
      incoming: [],
      localSources: [closedInUi],
    });
    assert.equal(merged.filter(v => v.status === "activo").length, 0);
  });
});
