import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea } from "./persistence.ts";
import {
  applyCupoManualYRedistribuir,
  redistribuirMinutosSituacionCronometro,
  sumMinutosCronometroPendientes,
} from "./situacionCupoDistrib.ts";

function st(id: string, minutosCupo: number, cupoFijo?: boolean): SubTarea {
  return {
    id,
    texto: id,
    completada: false,
    creadaAt: 0,
    enDesgloseCronometro: true,
    resultadoSituacion: "pendiente",
    minutosCupo,
    ...(cupoFijo ? { cupoFijo: true } : {}),
  };
}

describe("redistribuirMinutosSituacionCronometro", () => {
  it("reparte entre todas las filas si ninguna est fija", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const out = redistribuirMinutosSituacionCronometro(subs, 30);
    assert.equal(sumMinutosCronometroPendientes(out), 30);
  });

  it("conserva cupos fijos y reparte el sobrante entre flexibles", () => {
    const subs = [st("a", 15, true), st("b", 10), st("c", 10), st("d", 10)];
    const out = redistribuirMinutosSituacionCronometro(subs, 60);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.minutosCupo, 15);
    assert.equal(a.cupoFijo, true);
    const flexSum = out.filter(s => s.id !== "a").reduce((acc, s) => acc + (s.minutosCupo ?? 0), 0);
    assert.equal(15 + flexSum, 60);
    assert.ok((out.find(s => s.id === "b")!.minutosCupo ?? 0) >= 1);
  });

  it("applyCupoManual marca fijo y redistribuye", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const out = applyCupoManualYRedistribuir(subs, "a", 20, 60);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.minutosCupo, 20);
    assert.equal(a.cupoFijo, true);
    assert.equal(sumMinutosCronometroPendientes(out), 60);
  });

  it("quitar cupo manual libera la fila para redistribución", () => {
    const subs = [st("a", 20, true), st("b", 10), st("c", 10)];
    const out = applyCupoManualYRedistribuir(subs, "a", undefined, 30);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.cupoFijo, undefined);
    assert.equal(sumMinutosCronometroPendientes(out), 30);
    assert.ok((a.minutosCupo ?? 0) >= 1);
  });
});
