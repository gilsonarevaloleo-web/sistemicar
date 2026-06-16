import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatLimaTimeHM,
  getClockDayStartMs,
  getJournalDayStartMs,
  getLimaDayStartMs,
  getNextLimaMidnightMs,
  getSegmentCalendarDayStartMs,
  isPastSegmentEnd,
  isWithinSegmentTimeMargin,
  segmentDurationMinutes,
  segmentWindowMs,
  validateSegmentTimes,
} from "./segmentTime.ts";

describe("getClockDayStartMs", () => {
  it("usa medianoche Lima, no hora local del navegador", () => {
    const now = Date.UTC(2026, 4, 18, 15, 0, 0);
    assert.equal(getClockDayStartMs(now), getLimaDayStartMs(now));
  });
});

describe("getSegmentCalendarDayStartMs", () => {
  it("entre 00:00 y 05:00 Lima ancla al calendario de la jornada anterior", () => {
    const twoAmLima = Date.UTC(2026, 4, 18, 7, 0, 0);
    const journalStart = getJournalDayStartMs(twoAmLima);
    assert.equal(getSegmentCalendarDayStartMs(twoAmLima), getLimaDayStartMs(journalStart));
  });

  it("después de las 05:00 coincide con medianoche Lima del día", () => {
    const tenAmLima = Date.UTC(2026, 4, 18, 15, 0, 0);
    assert.equal(getSegmentCalendarDayStartMs(tenAmLima), getLimaDayStartMs(tenAmLima));
  });
});

describe("formatLimaTimeHM", () => {
  it("formatea hora Lima", () => {
    const nineThirty = Date.UTC(2026, 4, 18, 14, 30, 0);
    assert.equal(formatLimaTimeHM(nineThirty), "09:30");
  });
});

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
