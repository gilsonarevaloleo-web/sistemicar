import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDesglosadorSessionDepthPS,
  depthAwardForHour,
  nextDepthAwardAfterHours,
} from "./desglosadorDepth.ts";

describe("depthAwardForHour", () => {
  it("returns progressive awards per hour", () => {
    assert.equal(depthAwardForHour(1), 5);
    assert.equal(depthAwardForHour(2), 6);
    assert.equal(depthAwardForHour(3), 8);
    assert.equal(depthAwardForHour(4), 12);
    assert.equal(depthAwardForHour(5), 20);
    assert.equal(depthAwardForHour(6), 36);
  });

  it("returns 0 for invalid hour", () => {
    assert.equal(depthAwardForHour(0), 0);
    assert.equal(depthAwardForHour(-1), 0);
  });
});

describe("computeDesglosadorSessionDepthPS", () => {
  it("returns 0 before first hour", () => {
    assert.equal(computeDesglosadorSessionDepthPS(0), 0);
    assert.equal(computeDesglosadorSessionDepthPS(3599), 0);
  });

  it("accumulates at hour boundaries", () => {
    assert.equal(computeDesglosadorSessionDepthPS(3600), 5);
    assert.equal(computeDesglosadorSessionDepthPS(7200), 11);
    assert.equal(computeDesglosadorSessionDepthPS(14400), 31);
  });

  it("has no 6h cap � 10h cumulative matches closed formula 4N + 2^N - 1", () => {
    const tenHours = 10 * 3600;
    const expected = 4 * 10 + (1 << 10) - 1; // 355
    assert.equal(computeDesglosadorSessionDepthPS(tenHours), expected);
  });
});

describe("nextDepthAwardAfterHours", () => {
  it("returns award for the next hour to cross", () => {
    assert.equal(nextDepthAwardAfterHours(0), 5);
    assert.equal(nextDepthAwardAfterHours(1), 6);
    assert.equal(nextDepthAwardAfterHours(3), 12);
  });
});
