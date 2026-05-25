import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCentinelaSegmentGate } from "./centinelaEngine.ts";
import type { Planilla } from "./persistence.ts";
import {
  getJournalDateString,
  getJournalDayStartMs,
  getLimaDayStartMs,
  isPastJournalDayStart,
  segmentClockMs,
  JOURNAL_DAY_START,
} from "./segmentTime.ts";

describe("journal day (05:00 Lima)", () => {
  it("uses previous calendar date before 05:00", () => {
    const calStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 8, 0, 0)); // 03:00 Lima May 18
    const threeAm = segmentClockMs("03:00", calStart);
    assert.equal(getJournalDateString(threeAm), "2026-05-17");
  });

  it("uses current calendar date from 05:00 onward", () => {
    const calStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 12, 0, 0)); // 07:00 Lima May 18
    const sevenAm = segmentClockMs("07:00", calStart);
    assert.equal(getJournalDateString(sevenAm), "2026-05-18");
    assert.equal(isPastJournalDayStart(sevenAm), true);
  });
});

describe("getCentinelaSegmentGate", () => {
  const planilla = (segmentos: Planilla["segmentos"]): Planilla => ({
    id: "p1",
    fecha: "2026-05-18",
    segmentos,
    createdAt: "",
    updatedAt: "",
  });

  it("blocks before 05:00", () => {
    const calStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 8, 0, 0));
    const threeAm = segmentClockMs("03:00", calStart);
    const gate = getCentinelaSegmentGate(planilla([]), threeAm);
    assert.equal(gate.allowed, false);
    if (!gate.allowed) assert.match(gate.reason, /05:00/);
  });

  it("allows after 05:00 with no active segment and no vehicles context", () => {
    const journalStart = getJournalDayStartMs(Date.UTC(2026, 4, 18, 12, 0, 0));
    const sixAm = journalStart + 60 * 60000;
    const gate = getCentinelaSegmentGate(
      planilla([
        {
          id: "s1",
          nombre: "Mañana",
          horaInicio: "07:00",
          horaFin: "12:00",
          color: "#fff",
          icono: "sun",
          estado: "pendiente",
          eventos: [],
          psGanados: 0,
        },
      ]),
      sixAm
    );
    assert.equal(gate.allowed, true);
  });

  it("respects centinelaEnabled on active segment", () => {
    const journalStart = getJournalDayStartMs(Date.UTC(2026, 4, 18, 12, 0, 0));
    const gate = getCentinelaSegmentGate(
      planilla([
        {
          id: "s1",
          nombre: "Mañana",
          horaInicio: "05:00",
          horaFin: "12:00",
          color: "#fff",
          icono: "sun",
          estado: "activo",
          eventos: [],
          psGanados: 0,
          centinelaEnabled: false,
        },
      ]),
      journalStart + 60000
    );
    assert.equal(gate.allowed, false);
  });
});
