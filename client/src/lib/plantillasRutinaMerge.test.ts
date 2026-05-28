import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergePlantillasRutina } from "./plantillasRutinaMerge.ts";

type Rutina = { id: string; nombre: string; creadaAt: string };

describe("mergePlantillasRutina", () => {
  it("conserva rutina local cuando Firebase est� vac�o", () => {
    const local: Rutina[] = [
      { id: "rutina_1", nombre: "Semana", creadaAt: "2026-05-18T10:00:00.000Z" },
    ];
    const merged = mergePlantillasRutina(local, []);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].id, "rutina_1");
    assert.equal(merged[0].nombre, "Semana");
  });

  it("prefiere local si es m�s reciente que remote con mismo id", () => {
    const local: Rutina[] = [
      { id: "rutina_1", nombre: "Actualizada", creadaAt: "2026-05-18T12:00:00.000Z" },
    ];
    const remote: Rutina[] = [
      { id: "rutina_1", nombre: "Vieja", creadaAt: "2026-05-18T08:00:00.000Z" },
    ];
    const merged = mergePlantillasRutina(local, remote);
    assert.equal(merged[0].nombre, "Actualizada");
  });

  it("combina ids distintos de local y remote", () => {
    const merged = mergePlantillasRutina(
      [{ id: "a", nombre: "Local", creadaAt: "2026-05-18T10:00:00.000Z" }],
      [{ id: "b", nombre: "Remote", creadaAt: "2026-05-18T09:00:00.000Z" }]
    );
    assert.equal(merged.length, 2);
    assert.ok(merged.some(r => r.id === "a"));
    assert.ok(merged.some(r => r.id === "b"));
  });
});
