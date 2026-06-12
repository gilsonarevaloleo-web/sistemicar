import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  colorInmersionVoz,
  PUNTO_CERO_ETAPAS,
  PUNTO_CERO_ETAPAS_LIST,
} from "./puntoCeroGuides.ts";

describe("puntoCeroGuides", () => {
  it("expone las cuatro etapas con guía hablada más extensa que la UI", () => {
    assert.equal(PUNTO_CERO_ETAPAS_LIST.length, 4);
    for (const { key, instruccion, voz } of PUNTO_CERO_ETAPAS_LIST) {
      assert.ok(voz.length >= 5, `${key} debe tener guía hablada completa`);
      assert.ok(instruccion.length > 10);
    }
  });

  it("etapa1 cubre la secuencia corporal cabeza → manos", () => {
    const joined = PUNTO_CERO_ETAPAS.etapa1.voz.join(" ").toLowerCase();
    assert.match(joined, /cabeza/);
    assert.match(joined, /pies/);
    assert.match(joined, /manos/);
    assert.match(joined, /quietud/);
  });

  it("colorInmersionVoz incluye zona e índice", () => {
    const frases = colorInmersionVoz("Corazón", 3);
    assert.equal(frases.length, 4);
    assert.match(frases[0]!, /Color 4 de 7/);
    assert.match(frases[0]!, /Corazón/);
  });
});
