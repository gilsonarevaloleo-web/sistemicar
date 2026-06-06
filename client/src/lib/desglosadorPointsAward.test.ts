import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubVehiculo } from "./persistence";
import {
  awardDesglosadorSubPointsIfNeeded,
  settleDesglosadorCyclePoints,
} from "./desglosadorPointsAward";

function makeSub(id: string, status: SubVehiculo["status"]): SubVehiculo {
  return { id, titulo: `Sub ${id}`, status };
}

describe("desglosadorPointsAward", () => {
  it("otorga 2 PS por sub cumplido con fuente única", async () => {
    const logs: Array<{ amount: number; source: string }> = [];
    const { sub, awarded } = await awardDesglosadorSubPointsIfNeeded(
      "Proyecto",
      makeSub("a", "cumplido"),
      async (amount, source) => {
        logs.push({ amount, source });
        return true;
      }
    );
    assert.equal(awarded, 2);
    assert.equal(sub.psOtorgados, 2);
    assert.equal(logs.length, 1);
    assert.ok(logs[0].source.includes("[a]"));
  });

  it("no duplica si psOtorgados ya está", async () => {
    let calls = 0;
    const { awarded } = await awardDesglosadorSubPointsIfNeeded(
      "P",
      { ...makeSub("b", "cumplido"), psOtorgados: 2 },
      async () => {
        calls++;
        return true;
      }
    );
    assert.equal(awarded, 0);
    assert.equal(calls, 0);
  });

  it("settle otorga todos los subs + base de cierre", async () => {
    const amounts: number[] = [];
    const result = await settleDesglosadorCyclePoints(
      "veh_1",
      "Ciclo",
      [makeSub("1", "cumplido"), makeSub("2", "cumplido"), makeSub("3", "fallado")],
      async (amount, _source) => {
        amounts.push(amount);
        return true;
      }
    );
    assert.equal(result.subsPsAwarded, 4);
    assert.equal(result.cycleClosePs, 2);
    assert.deepEqual(amounts, [2, 2, 2]);
  });
});
