import assert from "node:assert/strict";
import { describe, it, beforeEach } from "node:test";
import {
  puertaVoiceKeyFromPhrase,
  resetPuertaVoiceDedup,
  shouldDeliverPuertaVoiceOnce,
  PUERTA_VOICE_DEDUP_MS,
} from "./puertaVoiceDedup.ts";

describe("puertaVoiceDedup", () => {
  beforeEach(() => {
    resetPuertaVoiceDedup();
  });

  it("permite la primera entrega por clave", () => {
    assert.equal(shouldDeliverPuertaVoiceOnce("seg-voz-abc"), true);
  });

  it("bloquea repeticiones de la misma clave en ventana corta", () => {
    assert.equal(shouldDeliverPuertaVoiceOnce("seg-voz-abc", 1000), true);
    assert.equal(shouldDeliverPuertaVoiceOnce("seg-voz-abc", 2000), false);
    assert.equal(shouldDeliverPuertaVoiceOnce("seg-voz-abc", 1000 + PUERTA_VOICE_DEDUP_MS + 1), true);
  });

  it("genera clave estable desde frase", () => {
    const a = puertaVoiceKeyFromPhrase("Tercera puerta de 8 del día");
    const b = puertaVoiceKeyFromPhrase("Tercera puerta de 8 del día");
    assert.equal(a, b);
    assert.match(a, /^puerta-phrase-/);
  });
});
