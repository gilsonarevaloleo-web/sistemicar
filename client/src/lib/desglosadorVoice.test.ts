import { describe, it } from "node:test";
import assert from "node:assert/strict";

describe("ubicacionVoiceReliable", () => {
  it("exporta helpers de conquista y situacion", async () => {
    const mod = await import("./ubicacionVoiceReliable.ts");
    assert.equal(typeof mod.speakUbicacionVoiceReliable, "function");
    assert.equal(typeof mod.speakDesglosadorVoiceReliable, "function");
    assert.equal(typeof mod.speakSituacionVoiceReliable, "function");
    assert.equal(typeof mod.cancelUbicacionVoice, "function");
  });
});

describe("desglosadorVoice re-export", () => {
  it("re-exporta speakDesglosadorVoiceReliable", async () => {
    const mod = await import("./desglosadorVoice.ts");
    assert.equal(typeof mod.speakDesglosadorVoiceReliable, "function");
  });
});
