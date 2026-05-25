import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeDesglosadorSessionDepthPS,
  depthAwardForHour,
  nextDepthAwardAfterHours,
} from "./desglosadorDepth.ts";

describe("depthAwardForHour", () => {
  it("returns gentle progressive awards per hour", () => {
    assert.equal(depthAwardForHour(1), 4);
    assert.equal(depthAwardForHour(2), 6);
    assert.equal(depthAwardForHour(3), 8);
    assert.equal(depthAwardForHour(4), 9);
    assert.equal(depthAwardForHour(5), 10);
    assert.equal(depthAwardForHour(6), 11);
    assert.equal(depthAwardForHour(7), 12);
    assert.equal(depthAwardForHour(8), 13);
    assert.equal(depthAwardForHour(10), 15);
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
    assert.equal(computeDesglosadorSessionDepthPS(3600), 4);
    assert.equal(computeDesglosadorSessionDepthPS(7200), 10);
    assert.equal(computeDesglosadorSessionDepthPS(10800), 18);
    assert.equal(computeDesglosadorSessionDepthPS(14400), 27);
  });

  it("grows much slower than the old exponential curve at 10h", () => {
    const tenHours = 10 * 3600;
    const total = computeDesglosadorSessionDepthPS(tenHours);
    assert.equal(total, 4 + 6 + 8 + 9 + 10 + 11 + 12 + 13 + 14 + 15);
    assert.ok(total < 120);
  });
});

describe("nextDepthAwardAfterHours", () => {
  it("returns award for the next hour to cross", () => {
    assert.equal(nextDepthAwardAfterHours(0), 4);
    assert.equal(nextDepthAwardAfterHours(1), 6);
    assert.equal(nextDepthAwardAfterHours(2), 8);
    assert.equal(nextDepthAwardAfterHours(3), 9);
  });
});
