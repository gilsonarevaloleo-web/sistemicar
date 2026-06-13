import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildPuertaEscalamientoLabel,
  buildPuertaVozPhrase,
  buildPuertaVozPreventionPhrase,
  missedPuertaVoiceMatchesSegment,
} from "./puertaAtencionVoice.ts";

describe("puertaAtencionVoice", () => {
  it("escalamiento: tercera puerta de 8 del día", () => {
    assert.equal(buildPuertaEscalamientoLabel(3, 8), "tercera puerta de 8 del día");
  });

  it("escalamiento: única puerta cuando hay un solo segmento", () => {
    assert.equal(buildPuertaEscalamientoLabel(1, 1), "Única puerta del día");
  });

  it("minuto 4 combina escalamiento con prevención de apertura", () => {
    const phrase = buildPuertaVozPhrase({ nombre: "Mañana profunda", ordinal: 3, total: 8 });
    assert.match(phrase, /tercera puerta de 8 del día/);
    assert.match(phrase, /Mañana profunda/);
    assert.match(phrase, /Abre la puerta de atención/);
  });

  it("puerta cierra incluye ubicación y prevención", () => {
    const phrase = buildPuertaVozPreventionPhrase({
      nombre: "Tarde operativa",
      ordinal: 5,
      total: 8,
      kind: "puerta_cierra",
    });
    assert.match(phrase, /quinta puerta de 8 del día/);
    assert.match(phrase, /ventana de apertura cierra/);
    assert.match(phrase, /entropía/);
  });

  it("cierre con intención incluye ubicación", () => {
    const phrase = buildPuertaVozPreventionPhrase({
      nombre: "Noche",
      ordinal: 8,
      total: 8,
      kind: "cierre_intencion",
    });
    assert.match(phrase, /octava puerta de 8 del día/);
    assert.match(phrase, /Cierra este segmento con intención/);
  });

  it("missedPuertaVoiceMatchesSegment reconoce frases nuevas", () => {
    const phrase = buildPuertaVozPhrase({ nombre: "Bloque A", ordinal: 2, total: 6 });
    assert.equal(missedPuertaVoiceMatchesSegment(phrase, "Bloque A"), true);
    assert.equal(missedPuertaVoiceMatchesSegment(phrase, "Bloque B"), false);
  });
});
