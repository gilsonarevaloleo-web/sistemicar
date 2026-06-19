import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "@/lib/persistence";
import {
  areVehicleCardPropsEqual,
  vehicleCardNeedsLiveTick,
} from "./vehicleCardMemo";

function baseVehicle(overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "v1",
    titulo: "Test",
    status: "activo",
    tipoFlota: "operativa",
    subTareas: [],
    ...overrides,
  } as Vehicle;
}

describe("vehicleCardNeedsLiveTick", () => {
  it("no tick si no está activo", () => {
    assert.equal(
      vehicleCardNeedsLiveTick(baseVehicle({ status: "cumplido" }), false),
      false
    );
  });

  it("tick si está expandido", () => {
    assert.equal(vehicleCardNeedsLiveTick(baseVehicle(), true), true);
  });

  it("tick colapsado desglosador (panel compacto en header)", () => {
    assert.equal(
      vehicleCardNeedsLiveTick(
        baseVehicle({ tipoReloj: "desglosador", aperturaAt: Date.now() - 60_000 }),
        false
      ),
      true
    );
  });

  it("sin tick colapsado operativa sin reloj visible", () => {
    assert.equal(vehicleCardNeedsLiveTick(baseVehicle(), false), false);
  });
});

describe("areVehicleCardPropsEqual", () => {
  it("ignora callbacks y compara datos visibles", () => {
    const vehicle = baseVehicle();
    assert.equal(
      areVehicleCardPropsEqual(
        { vehicle, expanded: false, onToggleVehicle: () => {} },
        { vehicle, expanded: false, onToggleVehicle: () => {} }
      ),
      true
    );
  });

  it("detecta cambio de expanded", () => {
    const vehicle = baseVehicle();
    assert.equal(
      areVehicleCardPropsEqual(
        { vehicle, expanded: false },
        { vehicle, expanded: true }
      ),
      false
    );
  });
});
