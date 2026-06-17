import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  flushDebouncedWrite,
  hasPendingDebouncedWrite,
  resetDebouncedWriteState,
  scheduleDebouncedWrite,
} from "./vehicleLocalStorageDebounce.ts";

describe("vehicleLocalStorageDebounce", () => {
  afterEach(() => {
    resetDebouncedWriteState();
  });

  it("flushDebouncedWrite ejecuta de inmediato sin esperar debounce", () => {
    let writes = 0;
    scheduleDebouncedWrite(() => {
      writes += 1;
      return true;
    });
    assert.equal(hasPendingDebouncedWrite(), true);
    flushDebouncedWrite();
    assert.equal(writes, 1);
    assert.equal(hasPendingDebouncedWrite(), false);
  });
});
