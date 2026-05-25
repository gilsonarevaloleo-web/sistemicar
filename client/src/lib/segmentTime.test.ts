import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  getLimaDayStartMs,
  getNextLimaMidnightMs,
  isPastSegmentEnd,
  isWithinSegmentTimeMargin,
  segmentDurationMinutes,
  segmentWindowMs,
  validateSegmentTimes,
} from "./segmentTime.ts";

describe("segmentDurationMinutes", () => {
  it("misma jornada", () => {
    assert.equal(segmentDurationMinutes("09:00", "17:00"), 8 * 60);
  });

  it("cruza medianoche", () => {
    assert.equal(segmentDurationMinutes("22:00", "02:00"), 4 * 60);
  });

  it("m�ximo 24 h cuando inicio equals fin", () => {
    assert.equal(segmentDurationMinutes("10:00", "10:00"), 24 * 60);
  });
});

describe("validateSegmentTimes", () => {
  it("acepta duracion maxima 24 h (inicio = fin)", () => {
    const r = validateSegmentTimes("10:00", "10:00");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.durationMin, 24 * 60);
  });

  it("acepta segmento valido", () => {
    const r = validateSegmentTimes("08:00", "12:00");
    assert.equal(r.ok, true);
    if (r.ok) assert.equal(r.durationMin, 4 * 60);
  });
});

describe("isPastSegmentEnd", () => {
  const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 12, 0, 0)); // noon UTC ? Lima morning

  it("detecta fin despu�s de medianoche para segmento nocturno", () => {
    const { end } = segmentWindowMs("22:00", "02:00", dayStart);
    assert.equal(isPastSegmentEnd(end + 6 * 60000, "22:00", "02:00", 5, dayStart), true);
    assert.equal(isPastSegmentEnd(end - 30 * 60000, "22:00", "02:00", 5, dayStart), false);
  });

  it("detecta fin al d�a siguiente para segmento diurno", () => {
    const { end } = segmentWindowMs("09:00", "17:00", dayStart);
    assert.equal(isPastSegmentEnd(end + 10 * 60000, "09:00", "17:00", 5, dayStart), true);
    assert.equal(isPastSegmentEnd(end - 60 * 60000, "09:00", "17:00", 5, dayStart), false);
  });
});

describe("getNextLimaMidnightMs", () => {
  it("is 24h after lima day start", () => {
    const now = Date.UTC(2026, 4, 18, 12, 0, 0);
    const dayStart = getLimaDayStartMs(now);
    assert.equal(getNextLimaMidnightMs(now), dayStart + 86400000);
  });
});

describe("isWithinSegmentTimeMargin", () => {
  const dayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 12, 0, 0));

  it("ventana de cierre �5 min en fin nocturno", () => {
    const { end } = segmentWindowMs("22:00", "02:00", dayStart);
    assert.equal(isWithinSegmentTimeMargin(end, "22:00", "02:00", "fin", 5, dayStart), true);
    assert.equal(isWithinSegmentTimeMargin(end + 10 * 60000, "22:00", "02:00", "fin", 5, dayStart), false);
  });
});
