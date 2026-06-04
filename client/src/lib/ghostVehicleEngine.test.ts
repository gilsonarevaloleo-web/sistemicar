import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "./persistence";
import {
  filterVehiclesForEntropy,
  GHOST_MAX_SESSION_MS,
  hasRealActiveConsciousVehicle,
  isGhostActiveVehicle,
  shouldPreserveLocalActivo,
} from "./ghostVehicleEngine.ts";

const DAY_START = new Date("2026-05-31T05:00:00").getTime();
const NOW = DAY_START + 3 * 3600_000;

function v(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    id: partial.id,
    userId: "u1",
    titulo: partial.titulo ?? "Test",
    status: partial.status ?? "activo",
    tipoFlota: partial.tipoFlota ?? "conquista",
    createdAt: partial.createdAt ?? new Date(NOW - 60000),
    aperturaAt: partial.aperturaAt ?? NOW - 30 * 60000,
    ...partial,
  } as Vehicle;
}

describe("ghostVehicleEngine", () => {
  it("activo que cruzó el rollover 05:00 no es fantasma", () => {
    const cross = v({ id: "g1", aperturaAt: DAY_START - 3600_000 });
    assert.equal(isGhostActiveVehicle(cross, NOW, DAY_START), false);
  });

  it("sesión obsoleta (>12h) sí es fantasma", () => {
    const stale = v({ id: "s1", aperturaAt: NOW - GHOST_MAX_SESSION_MS - 1000 });
    assert.equal(isGhostActiveVehicle(stale, NOW, DAY_START), true);
  });

  it("activo real del día no es fantasma", () => {
    const real = v({ id: "r1", aperturaAt: NOW - 60 * 60000 });
    assert.equal(isGhostActiveVehicle(real, NOW, DAY_START), false);
  });

  it("interrupción con padre cerrado = fantasma", () => {
    const parent = v({ id: "p1", status: "archivado", aperturaAt: NOW - 120 * 60000 });
    const child = v({
      id: "c1",
      vehiculoPadreDesglosadorId: "p1",
      aperturaAt: NOW - 10 * 60000,
    });
    const byId = new Map([
      [parent.id, parent],
      [child.id, child],
    ]);
    assert.equal(isGhostActiveVehicle(child, NOW, DAY_START, byId), true);
  });

  it("no preserva activo local obsoleto ausente de Firebase", () => {
    const stale = v({ id: "s1", aperturaAt: NOW - 2 * 3600_000 });
    assert.equal(shouldPreserveLocalActivo(stale, NOW, DAY_START), false);
  });

  it("preserva activo reciente en ventana de sync", () => {
    const fresh = v({ id: "f1", aperturaAt: NOW - 5 * 60000, clientRequestId: "crq_x" });
    assert.equal(shouldPreserveLocalActivo(fresh, NOW, DAY_START), true);
  });

  it("filterVehiclesForEntropy deja pasar activo que cruzó 05:00", () => {
    const cross = v({ id: "c1", aperturaAt: DAY_START - 3600_000 });
    const filtered = filterVehiclesForEntropy([cross], NOW);
    assert.equal(filtered.length, 1);
    assert.equal(hasRealActiveConsciousVehicle([cross], NOW), true);
  });
});
