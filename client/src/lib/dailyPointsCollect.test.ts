import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { mergeSovereigntyPointsLogs, type SpLogEntry } from "./dailyPointsCollect.ts";

function log(id: string, amount: number, ms: number): SpLogEntry {
  return { id, amount, source: "test", timestamp: new Date(ms) };
}

describe("mergeSovereigntyPointsLogs", () => {
  it("deduplica local + Firebase del mismo award", () => {
    const ms = Date.UTC(2026, 4, 18, 12, 0, 0);
    const merged = mergeSovereigntyPointsLogs([
      log("sp_1716123456789_abcd", 10, ms),
      log("firebaseDocId123", 10, ms + 500),
    ]);
    assert.equal(merged.length, 1);
    assert.equal(merged[0].amount, 10);
  });

  it("conserva awards distintos con mismo monto en momentos diferentes", () => {
    const merged = mergeSovereigntyPointsLogs([
      log("a", 4, Date.UTC(2026, 4, 18, 10, 0, 0)),
      log("b", 4, Date.UTC(2026, 4, 18, 14, 0, 0)),
    ]);
    assert.equal(merged.length, 2);
  });

  it("conserva ids únicos sin colisión de ventana", () => {
    const merged = mergeSovereigntyPointsLogs([
      log("a", 10, 1000),
      log("b", 5, 2000),
    ]);
    assert.equal(merged.length, 2);
    assert.equal(merged.reduce((s, l) => s + l.amount, 0), 15);
  });
});
