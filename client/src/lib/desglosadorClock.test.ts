import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubVehiculo } from "./persistence.ts";
import { computeSubCloseVerdict, suggestedSec } from "./desglosadorClock.ts";

function sub(partial: Partial<SubVehiculo> & Pick<SubVehiculo, "id">): SubVehiculo {
  return {
    titulo: "Test",
    status: "cumplido",
    ...partial,
  };
}

describe("computeSubCloseVerdict", () => {
  it("gain when faster than suggested", () => {
    const s = sub({
      id: "1",
      tiempoSugeridoSeg: 600,
      duracionFinal: 300,
    });
    const v = computeSubCloseVerdict(s);
    assert.equal(v.verdict, "gain");
    assert.equal(v.deltaSec, -300);
  });

  it("loss when slower than suggested", () => {
    const s = sub({
      id: "1",
      tiempoSugeridoSeg: 600,
      duracionFinal: 900,
    });
    const v = computeSubCloseVerdict(s);
    assert.equal(v.verdict, "loss");
    assert.equal(v.deltaSec, 300);
  });

  it("neutral within 5s threshold", () => {
    const s = sub({
      id: "1",
      tiempoSugeridoSeg: 600,
      duracionFinal: 603,
    });
    assert.equal(computeSubCloseVerdict(s).verdict, "neutral");
  });

  it("noRef without reference", () => {
    const s = sub({ id: "1", duracionFinal: 100 });
    assert.equal(computeSubCloseVerdict(s).verdict, "noRef");
  });

  it("suggestedSec from cantidad and record", () => {
    const s = sub({
      id: "1",
      cantidadObjetivo: 2,
      tiempoRecordMinPerUnit: 5,
    });
    assert.equal(suggestedSec(s), 600);
  });
});
