import { describe, expect, it } from "vitest";
import type { SegmentoV5, Vehicle } from "./persistence";
import { segmentWindowMs } from "./segmentTime";
import {
  EARLY_VEHICLE_MARGIN_MIN,
  resolveSegmentoForVehicleAt,
  resolveVehicleSegmentContext,
} from "./segmentVehicleAssign";
import { isVehicleFromPreviousSegment } from "./segmentCrossEntropyEngine";

function seg(partial: Partial<SegmentoV5> & Pick<SegmentoV5, "id">): SegmentoV5 {
  return {
    nombre: partial.nombre ?? "Test",
    horaInicio: partial.horaInicio ?? "09:00",
    horaFin: partial.horaFin ?? "10:00",
    color: "#fff",
    icono: "sun",
    eventos: [],
    estado: partial.estado ?? "pendiente",
    psGanados: 0,
    ...partial,
  };
}

function vehicle(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    titulo: partial.titulo ?? "Vehículo",
    criterioFin: "tiempo",
    criterioDetalle: "",
    tiempoInicio: new Date(),
    ejes: {
      enfoque: { text: "", trifecta: "omitir" },
      conflicto: { text: "", trifecta: "omitir" },
      pasos: { text: "", trifecta: "omitir" },
      limite: { text: "", trifecta: "omitir" },
    },
    status: "activo",
    userId: "u1",
    createdAt: new Date(),
    ...partial,
  };
}

describe("segmentVehicleAssign", () => {
  const dayStart = new Date("2026-06-05T05:00:00-05:00").getTime();

  it("asigna vehículo 4 min antes del inicio al segmento siguiente", () => {
    const { start: startB } = segmentWindowMs("10:00", "12:00", dayStart);
    const atMs = startB - 4 * 60000;
    const segmentos = [
      seg({ id: "a", nombre: "Mañana A", horaInicio: "08:00", horaFin: "10:00", estado: "activo" }),
      seg({ id: "b", nombre: "Mañana B", horaInicio: "10:00", horaFin: "12:00", estado: "pendiente" }),
    ];
    const resolved = resolveSegmentoForVehicleAt(segmentos, atMs, dayStart);
    expect(resolved?.id).toBe("b");
  });

  it("no trata como cruce un vehículo anticipado aunque segmentoId quede del anterior", () => {
    const { start: startB } = segmentWindowMs("10:00", "12:00", dayStart);
    const atMs = startB - 4 * 60000;
    const segmentos = [
      seg({ id: "a", nombre: "Mañana A", horaInicio: "08:00", horaFin: "10:00", estado: "activo" }),
      seg({ id: "b", nombre: "Mañana B", horaInicio: "10:00", horaFin: "12:00", estado: "activo" }),
    ];
    const v = vehicle({
      id: "v1",
      aperturaAt: atMs,
      segmentoId: "a",
      segmentoOrigen: "Mañana A",
    });
    const activeB = segmentos[1];
    expect(
      isVehicleFromPreviousSegment(v, activeB, dayStart, segmentos)
    ).toBe(false);
    expect(resolveVehicleSegmentContext(v, segmentos, dayStart).id).toBe("b");
  });

  it("sigue detectando cruce real del segmento anterior", () => {
    const { start: startB } = segmentWindowMs("10:00", "12:00", dayStart);
    const atMs = startB - (EARLY_VEHICLE_MARGIN_MIN + 2) * 60000;
    const segmentos = [
      seg({ id: "a", nombre: "Mañana A", horaInicio: "08:00", horaFin: "10:00", estado: "activo" }),
      seg({ id: "b", nombre: "Mañana B", horaInicio: "10:00", horaFin: "12:00", estado: "activo" }),
    ];
    const v = vehicle({
      id: "v1",
      aperturaAt: atMs,
      segmentoId: "a",
      segmentoOrigen: "Mañana A",
    });
    expect(
      isVehicleFromPreviousSegment(v, segmentos[1], dayStart, segmentos)
    ).toBe(true);
  });
});
