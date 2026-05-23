import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea, SubVehiculo } from "./persistence.ts";
import {
  reorderSubTareasCronometro,
  reorderSubVehiculos,
} from "./desglosadorReorder.ts";

function sv(id: string, status: SubVehiculo["status"], titulo = id): SubVehiculo {
  return { id, titulo, status };
}

describe("reorderSubVehiculos", () => {
  const subs: SubVehiculo[] = [
    sv("a", "cumplido"),
    sv("b", "activo"),
    sv("c", "pendiente", "third"),
    sv("d", "pendiente", "fourth"),
    sv("e", "pendiente", "last"),
  ];

  it("moves last pending up to second position among pendientes", () => {
    const result = reorderSubVehiculos(subs, "e", "up");
    assert.ok(result);
    const pending = result!.filter(s => s.status === "pendiente").map(s => s.id);
    assert.deepEqual(pending, ["c", "e", "d"]);
  });

  it("does not move first pending up", () => {
    assert.equal(reorderSubVehiculos(subs, "c", "up"), null);
  });

  it("ignores non-pending ids", () => {
    assert.equal(reorderSubVehiculos(subs, "b", "up"), null);
    assert.equal(reorderSubVehiculos(subs, "a", "down"), null);
  });

  it("preserves terminados and activo positions", () => {
    const result = reorderSubVehiculos(subs, "e", "up")!;
    assert.equal(result[0].id, "a");
    assert.equal(result[1].id, "b");
  });
});

describe("reorderSubTareasCronometro", () => {
  const subTareas: SubTarea[] = [
    { id: "libre", texto: "Libre", completada: false, creadaAt: 1 },
    { id: "c1", texto: "Cron 1", completada: false, creadaAt: 2, enDesgloseCronometro: true, resultadoSituacion: "cumplido" },
    { id: "c2", texto: "Cron 2", completada: false, creadaAt: 3, enDesgloseCronometro: true, resultadoSituacion: "pendiente" },
    { id: "c3", texto: "Cron 3", completada: false, creadaAt: 4, enDesgloseCronometro: true, resultadoSituacion: "pendiente" },
    { id: "c4", texto: "Cron 4", completada: false, creadaAt: 5, enDesgloseCronometro: true, resultadoSituacion: "pendiente" },
  ];

  it("reorders pending cron rows only", () => {
    const result = reorderSubTareasCronometro(subTareas, "c4", "up");
    assert.ok(result);
    const pendingTexts = result!
      .filter(st => st.enDesgloseCronometro && (st.resultadoSituacion ?? "pendiente") === "pendiente")
      .map(st => st.texto);
    assert.deepEqual(pendingTexts, ["Cron 2", "Cron 4", "Cron 3"]);
  });

  it("does not reorder done cron row", () => {
    assert.equal(reorderSubTareasCronometro(subTareas, "c1", "down"), null);
  });
});
