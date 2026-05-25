import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { getJournalDayStartMs, getNextJournalDayStartMs } from "./segmentTime.ts";

describe("daily points day boundaries", () => {
  it("journal day starts at 05:00 Lima, not midnight", () => {
    // 03:00 Lima May 18 = still previous journal day
    const beforeFive = Date.UTC(2026, 4, 18, 8, 0, 0);
    const afterFive = Date.UTC(2026, 4, 18, 12, 0, 0);
    assert.ok(getJournalDayStartMs(beforeFive) < getJournalDayStartMs(afterFive));
    assert.equal(
      getJournalDayStartMs(afterFive) - getJournalDayStartMs(beforeFive),
      86400000
    );
  });

  it("next journal boundary is 24h after current journal start", () => {
    const now = Date.UTC(2026, 4, 18, 12, 0, 0);
    assert.equal(
      getNextJournalDayStartMs(now),
      getJournalDayStartMs(now) + 86400000
    );
  });
});
