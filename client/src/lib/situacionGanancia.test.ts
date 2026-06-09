import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea } from "./persistence.ts";
import {
  bolsaDisponibleSegundoReto,
  buildSituacionCronometroCierre,
  computeEficienciaSituacionPct,
  computeSituacionBolsaGanancia,
  nextRetoNumero,
  retoSituacionLabel,
  situacionContratoFinMs,
  situacionMinutosHastaObjetivoHora,
  situacionObjetivoHoraToContratoMs,
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
    assert.equal(bolsa.minutosEnCola, 0);
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

  it("situacionContratoFinMs prefiere horaFinContratoMs", () => {
    assert.equal(
      situacionContratoFinMs({ activo: true, horaFinMs: 5000, horaFinContratoMs: 9000 }),
      9000
    );
    assert.equal(situacionContratoFinMs({ activo: true, horaFinMs: 5000 }), 5000);
  });

  it("bolsaDisponibleSegundoReto solo tras cierre", () => {
    assert.equal(bolsaDisponibleSegundoReto({ activo: true, bolsaSegundoRetoMin: 10 }), 0);
    assert.equal(bolsaDisponibleSegundoReto({ activo: false, bolsaSegundoRetoMin: 14 }), 14);
  });

  it("situacionObjetivoHoraToContratoMs usa hoy o mañana", () => {
    const now = new Date(2026, 5, 6, 8, 0, 0).getTime();
    const hoy = situacionObjetivoHoraToContratoMs("09:30", now);
    assert.equal(hoy, new Date(2026, 5, 6, 9, 30, 0).getTime());
    const manana = situacionObjetivoHoraToContratoMs("07:30", now);
    assert.equal(manana, new Date(2026, 5, 7, 7, 30, 0).getTime());
    assert.equal(situacionMinutosHastaObjetivoHora("09:30", now), 90);
  });

  it("buildSituacionCronometroCierre suma ganancia y tiempo restante en meta", () => {
    const now = 1_000_000;
    const cierre = buildSituacionCronometroCierre(
      {
        activo: true,
        bloqueInicioAt: now - 20 * 60000,
        horaFinContratoMs: now + 25 * 60000,
        minutosGanadosReto: 5,
        saldoAdelantoMin: 3,
        retosCompletados: 0,
        retoNumero: 1,
      },
      now
    );
    assert.equal(cierre.activo, false);
    assert.equal(cierre.retosCompletados, 1);
    assert.equal(cierre.bolsaSegundoRetoMin, 33);
  });

  it("sumMinutosEnColaGanancia ya no usa chips — reparto va a minutosCupo", () => {
    const subs = [
      st({ id: "a", texto: "A", enDesgloseCronometro: true, minutosGanadosAcum: 4 }),
    ];
    assert.equal(sumMinutosEnColaGanancia(subs), 0);
  });
});
