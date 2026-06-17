import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import {
  clearSituacionSessionRegistry,
  registerSituacionSessionCleanup,
  resetSituacionSessionTeardownGate,
  runSituacionSessionCleanups,
} from "./situacionSessionRegistry.ts";

describe("situacionSessionRegistry", () => {
  afterEach(() => {
    clearSituacionSessionRegistry();
  });

  it("ejecuta cleanups registrados e es idempotente", () => {
    const vehicleId = "v-situacion-1";
    let runs = 0;
    resetSituacionSessionTeardownGate(vehicleId);
    registerSituacionSessionCleanup(vehicleId, () => {
      runs += 1;
    });
    assert.equal(runSituacionSessionCleanups(vehicleId), true);
    assert.equal(runSituacionSessionCleanups(vehicleId), false);
    assert.equal(runs, 1);
  });

  it("unregister evita cleanup huérfano", () => {
    const vehicleId = "v-situacion-2";
    let runs = 0;
    const unreg = registerSituacionSessionCleanup(vehicleId, () => {
      runs += 1;
    });
    unreg();
    registerSituacionSessionCleanup(vehicleId, () => {
      runs += 1;
    });
    runSituacionSessionCleanups(vehicleId);
    assert.equal(runs, 1);
  });
});
