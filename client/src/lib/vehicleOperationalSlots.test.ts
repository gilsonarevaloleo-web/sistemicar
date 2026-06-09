import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "./persistence";
import {
  assertCanOpenVehicle,
  getOperationalActives,
  isDesglosadorEnFoco,
  isDesglosadorCrossSegmentExempt,
} from "./vehicleOperationalSlots";

function v(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    titulo: partial.titulo ?? "Misión",
    criterioFin: "circunstancia",
    criterioDetalle: "",
    tiempoInicio: new Date(),
    ejes: {
      enfoque: { text: "", trifecta: "omitir" },
      conflicto: { text: "", trifecta: "omitir" },
      pasos: { text: "", trifecta: "omitir" },
      limite: { text: "", trifecta: "omitir" },
    },
    status: "activo",
    userId: "u1",
    createdAt: new Date(),
    ...partial,
  };
}

describe("vehicleOperationalSlots", () => {
  it("isDesglosadorEnFoco con sub activa o pausa", () => {
    const desg = v({
      id: "d1",
      tipoReloj: "desglosador",
      tipoFlota: "tiempo",
      subVehiculos: [{ id: "s1", titulo: "A", status: "activo" }],
    });
    assert.equal(isDesglosadorEnFoco(desg), true);
    assert.equal(isDesglosadorCrossSegmentExempt(desg), true);

    const paused = v({ ...desg, id: "d2", interrupcionActiva: true, subVehiculos: [] });
    assert.equal(isDesglosadorEnFoco(paused), true);

    const done = v({
      id: "d3",
      tipoReloj: "desglosador",
      subVehiculos: [{ id: "s1", titulo: "A", status: "cumplido" }],
    });
    assert.equal(isDesglosadorEnFoco(done), false);
  });

  it("bloquea tercer vehículo general", () => {
    const list = [v({ id: "a", titulo: "A" }), v({ id: "b", titulo: "B", tipoFlota: "situacion" })];
    assert.equal(getOperationalActives(list).length, 2);
    const check = assertCanOpenVehicle(list, "flota_general");
    assert.equal(check.allowed, false);
  });

  it("permite descanso junto a desglosador en foco", () => {
    const desg = v({
      id: "d1",
      titulo: "Costura",
      tipoReloj: "desglosador",
      tipoFlota: "tiempo",
      subVehiculos: [{ id: "s1", titulo: "Turno", status: "activo" }],
    });
    const check = assertCanOpenVehicle([desg], "descanso");
    assert.equal(check.allowed, true);
  });

  it("rechaza descanso si el único activo no es desglosador en foco", () => {
    const sit = v({ id: "s1", titulo: "Situación", tipoFlota: "situacion" });
    const check = assertCanOpenVehicle([sit], "descanso");
    assert.equal(check.allowed, false);
  });

  it("permite interrupción con solo el padre activo", () => {
    const parent = v({
      id: "p1",
      tipoReloj: "desglosador",
      subVehiculos: [{ id: "s1", titulo: "Sub", status: "activo" }],
    });
    const check = assertCanOpenVehicle([parent], "interrupcion", { parentDesglosadorId: "p1" });
    assert.equal(check.allowed, true);
  });
});
