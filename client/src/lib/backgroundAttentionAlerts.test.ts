import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  clearMissedPuertaVoiceQueue,
  enqueueMissedPuertaVoice,
  peekMissedPuertaVoiceQueue,
} from "./backgroundAttentionAlerts.ts";

describe("backgroundAttentionAlerts", () => {
  beforeEach(() => {
    clearMissedPuertaVoiceQueue();
  });

  afterEach(() => {
    clearMissedPuertaVoiceQueue();
  });

  it("encola frases pendientes", () => {
    enqueueMissedPuertaVoice("Primer segmento del día", "puerta");
    enqueueMissedPuertaVoice("Entropía en mañana", "puerta");
    assert.equal(peekMissedPuertaVoiceQueue().length, 2);
  });

  it("no duplica la misma frase en cola", () => {
    enqueueMissedPuertaVoice("Mismo mensaje", "puerta");
    enqueueMissedPuertaVoice("Mismo mensaje", "puerta");
    assert.equal(peekMissedPuertaVoiceQueue().length, 1);
  });
});
