import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  applyMonotonicLiveEntropy,
  recordConsciousVehicleLaunch,
  resetEntropyMonotonicState,
} from "./entropyMonotonicStore.ts";
import { getJournalDayStartMs } from "./segmentTime.ts";

function limaAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return Date.UTC(y, mo, d, h + 5, min);
}

describe("entropyMonotonicStore", () => {
  it("en hueco el piso solo sube aunque el motor crudo baje", () => {
    resetEntropyMonotonicState();
    const now = limaAt(2026, 4, 18, 8, 10);
    const a = applyMonotonicLiveEntropy({
      rawMin: 8,
      nowMs: now,
      consciousNow: false,
      persist: false,
    });
    const b = applyMonotonicLiveEntropy({
      rawMin: 2,
      nowMs: now + 1000,
      consciousNow: false,
      persist: false,
    });
    assert.equal(a, 8);
    assert.equal(b, 8);
  });

  it("sin lanzamiento registrado, cobertura consciente no reduce el piso", () => {
    resetEntropyMonotonicState();
    const now = limaAt(2026, 4, 18, 8, 10);
    applyMonotonicLiveEntropy({ rawMin: 10, nowMs: now, consciousNow: false, persist: false });
    const blocked = applyMonotonicLiveEntropy({
      rawMin: 0,
      nowMs: now + 2000,
      consciousNow: true,
      persist: false,
    });
    assert.equal(blocked, 10);
  });

  it("tras recordConsciousVehicleLaunch permite recalcular hacia abajo", () => {
    resetEntropyMonotonicState();
    const now = limaAt(2026, 4, 18, 8, 10);
    applyMonotonicLiveEntropy({ rawMin: 10, nowMs: now, consciousNow: false, persist: false });
    recordConsciousVehicleLaunch(now + 1000);
    const afterLaunch = applyMonotonicLiveEntropy({
      rawMin: 4,
      nowMs: now + 2000,
      consciousNow: true,
      persist: false,
    });
    assert.equal(afterLaunch, 4);
  });

  it("reinicia al cambiar día-jornada", () => {
    resetEntropyMonotonicState();
    const day1 = limaAt(2026, 4, 18, 8, 0);
    applyMonotonicLiveEntropy({ rawMin: 15, nowMs: day1, consciousNow: false, persist: false });
    const day2 = getJournalDayStartMs(day1) + 86400000 + 3600_000;
    const fresh = applyMonotonicLiveEntropy({
      rawMin: 1,
      nowMs: day2,
      consciousNow: false,
      persist: false,
    });
    assert.equal(fresh, 1);
  });
});
