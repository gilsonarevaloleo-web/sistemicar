import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SegmentAttentionEvent } from "./segmentAttentionEngine.ts";
import {
  attentionEventKey,
  clearAttentionToastDedupForTests,
  filterNewAttentionEvents,
} from "./segmentAttentionToastDedup.ts";

describe("segmentAttentionToastDedup", () => {
  it("filtra eventos repetidos en la misma jornada", () => {
    clearAttentionToastDedupForTests();
    const fecha = "2026-06-14";
    const ev: SegmentAttentionEvent = {
      type: "entropia",
      segId: "s1",
      nombre: "Mañana",
      reason: "missed_window",
    };
    const key = attentionEventKey(fecha, ev);
    assert.ok(key.includes("s1"));
    const first = filterNewAttentionEvents(fecha, [ev]);
    assert.equal(first.length, 1);
    const second = filterNewAttentionEvents(fecha, [ev]);
    assert.equal(second.length, 0);
  });
});
