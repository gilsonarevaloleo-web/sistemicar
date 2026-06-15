import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  clampLiveEntropyDisplay,
  resetLiveEntropyFreeze,
} from "./entropyLiveFreeze.ts";
import { getJournalDayStartMs } from "./segmentTime.ts";

function limaAt(y: number, mo: number, d: number, h: number, min = 0): number {
  return Date.UTC(y, mo, d, h + 5, min);
}

describe("entropyLiveFreeze", () => {
  it("en hueco no permite caídas espurias del valor visible", () => {
    resetLiveEntropyFreeze();
    const now = limaAt(2026, 4, 18, 8, 10);
    const peak = clampLiveEntropyDisplay(12, now, false);
    const drop = clampLiveEntropyDisplay(0.5, now + 1000, false);
    assert.equal(peak, 12);
    assert.equal(drop, 12);
  });

  it("en consciente permite bajar tras launch gate (monotonic upstream)", () => {
    resetLiveEntropyFreeze();
    const now = limaAt(2026, 4, 18, 8, 10);
    clampLiveEntropyDisplay(15, now, false);
    const lowered = clampLiveEntropyDisplay(4, now + 2000, true);
    assert.equal(lowered, 4);
  });

  it("reinicia al cambiar día-jornada", () => {
    resetLiveEntropyFreeze();
    const day1 = limaAt(2026, 4, 18, 8, 0);
    clampLiveEntropyDisplay(20, day1, false);
    const day2 = getJournalDayStartMs(day1) + 86400000 + 3600_000;
    const fresh = clampLiveEntropyDisplay(1, day2, false);
    assert.equal(fresh, 1);
  });
});
