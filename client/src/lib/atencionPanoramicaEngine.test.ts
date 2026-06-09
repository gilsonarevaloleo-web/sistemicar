import { describe, expect, it } from "vitest";
import type { SegmentoV5 } from "./persistence";
import { segmentWindowMs } from "./segmentTime";
import {
  atencionBadgeLabel,
  computeAtencionPanoramicaDia,
} from "./atencionPanoramicaEngine";

function seg(partial: Partial<SegmentoV5> & Pick<SegmentoV5, "id" | "estado">): SegmentoV5 {
  return {
    nombre: partial.nombre ?? "Test",
    horaInicio: partial.horaInicio ?? "09:00",
    horaFin: partial.horaFin ?? "10:00",
    color: "#fff",
    icono: "sun",
    eventos: [],
    psGanados: 0,
    ...partial,
  };
}

describe("computeAtencionPanoramicaDia", () => {
  const dayStart = new Date("2026-05-18T05:00:00-05:00").getTime();

  it("ratioAntesVoz con mezcla AV/DV", () => {
    const { start } = segmentWindowMs("09:00", "10:00", dayStart);
    const r = computeAtencionPanoramicaDia({
      segmentos: [
        seg({
          id: "1",
          estado: "activo",
          activadoAt: start + 2 * 60000,
          puertaTiming: "antes_voz",
        }),
        seg({
          id: "2",
          estado: "activo",
          activadoAt: start + 4.5 * 60000,
          puertaTiming: "despues_voz",
        }),
      ],
      nowMs: start + 30 * 60000,
      dayStartMs: dayStart,
    });
    expect(r.puertasAbiertas).toBe(2);
    expect(r.ratioAntesVoz).toBe(50);
  });

  it("puerta sistema activa cuenta como puerta perdida", () => {
    const { start } = segmentWindowMs("09:00", "09:30", dayStart);
    const r = computeAtencionPanoramicaDia({
      segmentos: [
        seg({
          id: "y",
          estado: "activo",
          activadoAt: start + 6 * 60000,
          puertaSistema: true,
          puertaTiming: "despues_voz",
          horaFin: "09:30",
        }),
      ],
      nowMs: start + 30 * 60000,
      dayStartMs: dayStart,
    });
    expect(r.puertasPerdidas).toBe(1);
    expect(r.puertasAbiertas).toBe(1);
    expect(atencionBadgeLabel(r.segmentos[0]!)).toBe("—");
  });

  it("puerta perdida en entropía sin activadoAt", () => {
    const { end } = segmentWindowMs("09:00", "09:30", dayStart);
    const r = computeAtencionPanoramicaDia({
      segmentos: [seg({ id: "x", estado: "entropia", horaFin: "09:30" })],
      nowMs: end + 10 * 60000,
      dayStartMs: dayStart,
    });
    expect(r.puertasPerdidas).toBe(1);
    expect(atencionBadgeLabel(r.segmentos[0]!)).toBe("—");
  });
});
