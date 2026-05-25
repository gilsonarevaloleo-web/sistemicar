import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDailyPsBarModel } from "./dailyPsBar.ts";

describe("computeDailyPsBarModel", () => {
  it("usa ayer como 100% y escala hasta 120%", () => {
    const m = computeDailyPsBarModel(60, 100);
    assert.equal(m.referencePs, 100);
    assert.equal(m.target120Ps, 120);
    assert.equal(m.remainingTo100, 40);
    assert.equal(m.fillWidthPct, 50);
    assert.equal(m.marker100WidthPct, (100 / 120) * 100);
    assert.match(m.statusText, /Faltan 40 PS/);
  });

  it("marca 100% al alcanzar referencia de ayer", () => {
    const m = computeDailyPsBarModel(100, 100);
    assert.equal(m.atOrAbove100, true);
    assert.equal(m.remainingTo100, 0);
    assert.equal(m.pctOfReference, 100);
  });

  it("llena barra completa al 120%", () => {
    const m = computeDailyPsBarModel(120, 100);
    assert.equal(m.atOrAbove120, true);
    assert.equal(m.fillWidthPct, 100);
  });

  it("fallback cuando ayer fue 0", () => {
    const m = computeDailyPsBarModel(25, 0, 120, 50);
    assert.equal(m.referencePs, 50);
    assert.equal(m.usingFallbackReference, true);
    assert.equal(m.remainingTo100, 25);
  });
});
