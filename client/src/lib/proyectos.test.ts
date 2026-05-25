import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeProyectoStats } from "./proyectos.ts";
import type { ProyectoPeldano } from "./proyectos.ts";

describe("proyectos", () => {
  it("computeProyectoStats suma conquistados y minutos", () => {
    const peldanos: ProyectoPeldano[] = [
      {
        id: "p1",
        proyectoId: "x",
        orden: 0,
        titulo: "Bloque A",
        estado: "conquistado",
        cerradoAt: 100,
        resumen: { duracionMin: 30, profundidadMaxima: "concentrado" },
        createdAt: 1,
        updatedAt: 1,
      },
      {
        id: "p2",
        proyectoId: "x",
        orden: 1,
        titulo: "Idea B",
        estado: "idea",
        createdAt: 1,
        updatedAt: 1,
      },
    ];
    const s = computeProyectoStats(peldanos);
    assert.equal(s.conquistados, 1);
    assert.equal(s.ideas, 1);
    assert.equal(s.minutosTotales, 30);
    assert.equal(s.profundidadMaxima, "concentrado");
  });
});
