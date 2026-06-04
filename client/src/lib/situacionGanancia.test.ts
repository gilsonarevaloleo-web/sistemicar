import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea } from "./persistence.ts";
import {
  computeEficienciaSituacionPct,
  computeSituacionBolsaGanancia,
  nextRetoNumero,
  retoSituacionLabel,
  sumMinutosEnColaGanancia,
} from "./situacionGanancia.ts";

function st(partial: Partial<SubTarea> & Pick<SubTarea, "id" | "texto">): SubTarea {
  return { completada: false, creadaAt: 1, ...partial };
}

describe("situacionGanancia", () => {
  it("retoSituacionLabel ordinales", () => {
    assert.match(retoSituacionLabel(1), /Primer reto/);
    assert.match(retoSituacionLabel(2), /Segundo reto/);
    assert.match(retoSituacionLabel(6), /Reto 6/);
  });

  it("computeSituacionBolsaGanancia suma cola y adelanto", () => {
    const subs = [
      st({
        id: "a",
        texto: "A",
        enDesgloseCronometro: true,
        minutosGanadosAcum: 5,
      }),
    ];
    const bolsa = computeSituacionBolsaGanancia(subs, {
      activo: true,
      retoNumero: 2,
      minutosGanadosReto: 12,
      minutosGanadosSesion: 20,
      saldoAdelantoMin: 3,
    });
    assert.equal(bolsa.minutosEnCola, 5);
    assert.equal(bolsa.minutosAdelanto, 3);
    assert.equal(bolsa.minutosGanadosReto, 12);
    assert.equal(bolsa.retoNumero, 2);
  });

  it("nextRetoNumero tras cierres previos", () => {
    assert.equal(nextRetoNumero(undefined), 1);
    assert.equal(nextRetoNumero({ activo: false, retosCompletados: 1 }), 2);
  });

  it("computeEficienciaSituacionPct", () => {
    assert.equal(computeEficienciaSituacionPct(10, 40), 20);
    assert.equal(computeEficienciaSituacionPct(0, 40), null);
  });

  it("sumMinutosEnColaGanancia ignora cumplidas", () => {
    const subs = [
      st({ id: "a", texto: "A", enDesgloseCronometro: true, minutosGanadosAcum: 4 }),
      st({
        id: "b",
        texto: "B",
        enDesgloseCronometro: true,
        resultadoSituacion: "cumplido",
        minutosGanadosAcum: 9,
      }),
    ];
    assert.equal(sumMinutosEnColaGanancia(subs), 4);
  });
});
