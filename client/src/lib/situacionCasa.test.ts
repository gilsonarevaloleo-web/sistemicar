import { describe, expect, it } from "vitest";
import { groupCasaByTexto, countCasaHechas } from "./situacionCasa";
import type { DetalleSubTarea } from "./persistence";

function item(texto: string, entregado: boolean, id = texto): DetalleSubTarea {
  return { id, texto, entregado, creadaAt: 1, casa: true };
}

describe("groupCasaByTexto", () => {
  it("agrupa por texto y cuenta hechas", () => {
    const items = [
      item("Una idea más", true, "a"),
      item("Una idea más", true, "b"),
      item("Otra", false, "c"),
      item("Escribir mensaje", true, "d"),
    ];
    expect(groupCasaByTexto(items)).toEqual([
      { texto: "Una idea más", total: 2, hechas: 2 },
      { texto: "Escribir mensaje", total: 1, hechas: 1 },
      { texto: "Otra", total: 1, hechas: 0 },
    ]);
  });

  it("countCasaHechas cuenta solo entregados", () => {
    expect(countCasaHechas([item("x", true), item("y", false)])).toBe(1);
  });
});
