import { describe, expect, it } from "vitest";
import type { SegmentoV5 } from "./persistence";
import { segmentWindowMs } from "./segmentTime";
import {
  applyDayRolloverEntropia,
  applySegmentAttentionTick,
  classifyPuertaTiming,
  collectVozPuertaEvents,
  getVozDisparoMs,
  isPastPuertaWindow,
} from "./segmentAttentionEngine";

function seg(partial: Partial<SegmentoV5> & Pick<SegmentoV5, "id" | "estado">): SegmentoV5 {
  return {
    nombre: partial.nombre ?? "Test",
    horaInicio: partial.horaInicio ?? "09:00",
    horaFin: partial.horaFin ?? "17:00",
    color: "#fff",
    icono: "sun",
    eventos: [],
    psGanados: 0,
    ...partial,
  };
}

describe("applySegmentAttentionTick", () => {
  const dayStart = new Date("2026-05-18T05:00:00-05:00").getTime();

  it("entropía si pendiente pierde ventana de puerta (+5 min)", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    const nowMs = start + 6 * 60000;
    const { segmentos, events, changed } = applySegmentAttentionTick(
      [seg({ id: "a", estado: "pendiente" })],
      nowMs,
      dayStart
    );
    expect(changed).toBe(true);
    expect(segmentos[0].estado).toBe("entropia");
    expect(events[0]).toMatchObject({ type: "entropia", reason: "missed_puerta" });
  });

  it("no auto-inicia pendiente tras +6 min", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    const nowMs = start + 4 * 60000;
    const { segmentos, changed } = applySegmentAttentionTick(
      [seg({ id: "a2", estado: "pendiente" })],
      nowMs,
      dayStart
    );
    expect(changed).toBe(false);
    expect(segmentos[0].estado).toBe("pendiente");
  });

  it("entropía en activo que no cerró a tiempo", () => {
    const { end } = segmentWindowMs("09:00", "09:30", dayStart);
    const nowMs = end + 6 * 60000;
    const { segmentos, events } = applySegmentAttentionTick(
      [seg({ id: "b", estado: "activo", horaFin: "09:30", activadoAt: end - 20 * 60000 })],
      nowMs,
      dayStart
    );
    expect(segmentos[0].estado).toBe("entropia");
    expect(segmentos[0].psGanados).toBe(0);
    expect(events[0]).toMatchObject({ type: "entropia", reason: "past_end" });
  });

  it("entropía directa si pendiente pasó fin completo sin activar", () => {
    const { end } = segmentWindowMs("09:00", "09:05", dayStart);
    const nowMs = end + 6 * 60000;
    const { segmentos, events } = applySegmentAttentionTick(
      [seg({ id: "c", estado: "pendiente", horaFin: "09:05" })],
      nowMs,
      dayStart
    );
    expect(segmentos[0].estado).toBe("entropia");
    expect(events[0]?.type).toBe("entropia");
  });

  it("no modifica segmentos ya cerrados manualmente", () => {
    const closed = seg({ id: "d", estado: "cerrado_manual", psGanados: 4, cerradoAt: dayStart });
    const { segmentos, changed } = applySegmentAttentionTick([closed], dayStart + 86400000, dayStart);
    expect(changed).toBe(false);
    expect(segmentos[0]).toEqual(closed);
  });
});

describe("classifyPuertaTiming", () => {
  const dayStart = new Date("2026-05-18T05:00:00-05:00").getTime();

  it("antes_voz si activa +2 min", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    expect(classifyPuertaTiming(start + 2 * 60000, "09:00", dayStart)).toBe("antes_voz");
  });

  it("despues_voz si activa +4:30", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    expect(classifyPuertaTiming(start + 4.5 * 60000, "09:00", dayStart)).toBe("despues_voz");
  });
});

describe("collectVozPuertaEvents", () => {
  const dayStart = new Date("2026-05-18T05:00:00-05:00").getTime();

  it("dispara voz al minuto 4 para pendiente sin voz previa", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    const nowMs = getVozDisparoMs("09:00", dayStart) + 1000;
    const events = collectVozPuertaEvents(
      [seg({ id: "v1", estado: "pendiente", nombre: "Dormir" })],
      nowMs,
      dayStart
    );
    expect(events.length).toBe(1);
    expect(events[0]?.ordinal).toBe(1);
  });

  it("isPastPuertaWindow después de +5 min", () => {
    const { start } = segmentWindowMs("09:00", "17:00", dayStart);
    expect(isPastPuertaWindow(start + 6 * 60000, "09:00", dayStart)).toBe(true);
    expect(isPastPuertaWindow(start + 4 * 60000, "09:00", dayStart)).toBe(false);
  });
});

describe("applyDayRolloverEntropia", () => {
  it("activos pasan a entropía al cambiar día-jornada", () => {
    const nowMs = Date.now();
    const { segmentos, events, changed } = applyDayRolloverEntropia(
      [seg({ id: "e", estado: "activo", psGanados: 2 })],
      nowMs
    );
    expect(changed).toBe(true);
    expect(segmentos[0].estado).toBe("entropia");
    expect(segmentos[0].psGanados).toBe(0);
    expect(events[0]?.type).toBe("day_rollover_entropia");
  });
});
