import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PUNTO_CERO_AUDIO_TUNING, PUNTO_CERO_BINAURAL, masterOutputGain } from "./puntoCeroAudio.ts";

describe("puntoCeroAudio", () => {
  it("presets binaurales dentro de rangos esperados", () => {
    assert.ok(PUNTO_CERO_BINAURAL.alpha.beat >= 8 && PUNTO_CERO_BINAURAL.alpha.beat <= 10);
    assert.ok(PUNTO_CERO_BINAURAL.theta.beat >= 4 && PUNTO_CERO_BINAURAL.theta.beat <= 7);
    assert.ok(PUNTO_CERO_BINAURAL.delta.beat >= 0.5 && PUNTO_CERO_BINAURAL.delta.beat <= 4);
  });

  it("volúmenes binaurales suaves y fades definidos", () => {
    assert.ok(PUNTO_CERO_BINAURAL.alpha.volume <= 0.05);
    assert.ok(PUNTO_CERO_BINAURAL.delta.volume <= 0.05);
    assert.ok(PUNTO_CERO_AUDIO_TUNING.binauralFadeInSec >= 1.5);
    assert.ok(PUNTO_CERO_AUDIO_TUNING.nocheFadeOutSec >= 10);
    assert.ok(PUNTO_CERO_AUDIO_TUNING.masterGain <= 0.8);
  });

  it("masterOutputGain escala linealmente con volumen", () => {
    assert.equal(masterOutputGain(0), 0);
    assert.equal(masterOutputGain(100), PUNTO_CERO_AUDIO_TUNING.masterGain);
    assert.ok(masterOutputGain(50) < masterOutputGain(100));
  });
});
