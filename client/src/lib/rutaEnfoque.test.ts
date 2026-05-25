import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyRutaThresholdCrossing,
  createRutaEnfoqueState,
  repairRutaCruzadoAheadOfRestantes,
} from "./rutaEnfoque.ts";

describe("applyRutaThresholdCrossing", () => {
  it("no alerta sin lectura previa (baseline)", () => {
    const ruta = createRutaEnfoqueState(10);
    const { alerts, ruta: out } = applyRutaThresholdCrossing(ruta, 1, null);
    assert.deepEqual(alerts, []);
    assert.equal(out.cruzado.concentrado, false);
    assert.equal(out.cruzado.limite, false);
  });

  it("no alerta cuando restantes suben (cambio de sub / reset)", () => {
    const ruta = createRutaEnfoqueState(10);
    const { alerts } = applyRutaThresholdCrossing(ruta, 10, 1);
    assert.deepEqual(alerts, []);
  });

  it("alerta concentrado al cruzar umbral fluido", () => {
    const ruta = createRutaEnfoqueState(10);
    const { alerts, ruta: out } = applyRutaThresholdCrossing(ruta, 5, 6);
    assert.deepEqual(alerts, ["concentrado"]);
    assert.equal(out.cruzado.concentrado, true);
    assert.equal(out.cruzado.limite, false);
  });

  it("alerta limite al cruzar umbral concentrado", () => {
    const ruta = createRutaEnfoqueState(10);
    const crossed = applyRutaThresholdCrossing(ruta, 5, 6).ruta;
    const { alerts, ruta: out } = applyRutaThresholdCrossing(crossed, 3, 4);
    assert.deepEqual(alerts, ["limite"]);
    assert.equal(out.cruzado.limite, true);
  });

  it("alerta ambos umbrales en un salto grande", () => {
    const ruta = createRutaEnfoqueState(10);
    const { alerts, ruta: out } = applyRutaThresholdCrossing(ruta, 2, 10);
    assert.deepEqual(alerts, ["concentrado", "limite"]);
    assert.equal(out.cruzado.concentrado, true);
    assert.equal(out.cruzado.limite, true);
  });

  it("no repite alerta si cruzado ya estaba marcado", () => {
    const ruta = createRutaEnfoqueState(10);
    const once = applyRutaThresholdCrossing(ruta, 5, 6).ruta;
    const { alerts } = applyRutaThresholdCrossing(once, 4, 5);
    assert.deepEqual(alerts, []);
  });
});

describe("repairRutaCruzadoAheadOfRestantes", () => {
  it("resetea cruzado adelantado tras valor stale de sub anterior", () => {
    const ruta = createRutaEnfoqueState(10);
    const stale = {
      ...ruta,
      cruzado: { fluido: true, concentrado: true, limite: true },
    };
    const { ruta: fixed, changed } = repairRutaCruzadoAheadOfRestantes(stale, 10);
    assert.equal(changed, true);
    assert.equal(fixed.cruzado.concentrado, false);
    assert.equal(fixed.cruzado.limite, false);
  });

  it("no modifica cruzado coherente con restantes altos", () => {
    const ruta = createRutaEnfoqueState(10);
    const { changed } = repairRutaCruzadoAheadOfRestantes(ruta, 10);
    assert.equal(changed, false);
  });
});
