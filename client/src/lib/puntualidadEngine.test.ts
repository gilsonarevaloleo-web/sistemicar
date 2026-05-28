import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SegmentoV5, Vehicle } from "./persistence.ts";
import {
  computePuntualidadDia,
  isCumplimientoVehicle,
  vehicleActiveAt,
} from "./puntualidadEngine.ts";
import { getLimaDayStartMs, segmentWindowMs } from "./segmentTime.ts";

function seg(
  id: string,
  nombre: string,
  horaInicio: string,
  horaFin: string
): SegmentoV5 {
  return {
    id,
    nombre,
    horaInicio,
    horaFin,
    color: "#fff",
    icono: "o",
    estado: "pendiente",
    eventos: [],
    psGanados: 0,
  };
}

function veh(partial: Partial<Vehicle> & Pick<Vehicle, "id">): Vehicle {
  return {
    titulo: "Test",
    criterioFin: "circunstancia",
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

describe("isCumplimientoVehicle", () => {
  it("excluye centinela y descanso", () => {
    assert.equal(isCumplimientoVehicle(veh({ id: "a", autoVerdad: true })), false);
    assert.equal(isCumplimientoVehicle(veh({ id: "b", tipoFlota: "descanso" })), false);
    assert.equal(isCumplimientoVehicle(veh({ id: "c", tipoFlota: "situacion" })), true);
  });
});

describe("computePuntualidadDia", () => {
  const limaDayStart = getLimaDayStartMs(Date.UTC(2026, 4, 18, 15, 0, 0));

  it("no vacio cuando hay vehiculo con segmentoOrigen en ventana", () => {
    const segmentos = [seg("s1", "Costura", "08:00", "10:00")];
    const { start, end } = segmentWindowMs("08:00", "10:00", limaDayStart);
    const apertura = start + 60 * 60000;
    const nowMs = end + 30 * 60000;
    const vehicles = [
      veh({
        id: "v1",
        tipoFlota: "situacion",
        segmentoOrigen: "Costura",
        aperturaAt: apertura,
        status: "archivado",
        cierreAt: start + 105 * 60000,
      }),
    ];
    const r = computePuntualidadDia({ segmentos, vehicles, dayStartMs: limaDayStart, nowMs });
    assert.equal(r.segmentos[0]?.vacio, false);
    assert.equal(r.segmentos[0]?.estado, "puntual");
  });

  it("vacio cuando no hay vehiculos en ventana cerrada", () => {
    const segmentos = [seg("s1", "Costura", "08:00", "10:00")];
    const { end } = segmentWindowMs("08:00", "10:00", limaDayStart);
    const nowMs = end + 30 * 60000;
    const r = computePuntualidadDia({ segmentos, vehicles: [], dayStartMs: limaDayStart, nowMs });
    assert.equal(r.segmentos[0]?.vacio, true);
    assert.equal(r.segmentos[0]?.estado, "vacio");
    assert.equal(r.vacios, 1);
  });

  it("montaje cuando situacional de otro segmento sigue activo al inicio", () => {
    const segmentos = [
      seg("s1", "Manana", "08:00", "10:00"),
      seg("s2", "Costura", "10:00", "12:00"),
    ];
    const costuraStart = segmentWindowMs("10:00", "12:00", limaDayStart).start;
    const nowMs = costuraStart + 5 * 60000;
    const vehicles = [
      veh({
        id: "v1",
        tipoFlota: "situacion",
        segmentoOrigen: "Manana",
        aperturaAt: costuraStart - 30 * 60000,
        status: "activo",
      }),
    ];
    const r = computePuntualidadDia({ segmentos, vehicles, dayStartMs: limaDayStart, nowMs });
    const costura = r.segmentos.find(s => s.nombre === "Costura");
    assert.equal(costura?.montaje, true);
    assert.equal(costura?.estado, "montaje");
    assert.equal(r.montajes, 1);
  });

  it("montaje por segmentosCruzados y segmentoMontadoNombre", () => {
    const segmentos = [seg("s2", "Costura", "10:00", "12:00")];
    const { start, end } = segmentWindowMs("10:00", "12:00", limaDayStart);
    const nowMs = end + 30 * 60000;
    const vehicles = [
      veh({
        id: "v1",
        tipoFlota: "situacion",
        segmentoOrigen: "Manana",
        aperturaAt: start - 60 * 60000,
        status: "archivado",
        cierreAt: start + 20 * 60000,
        segmentosCruzados: 1,
        segmentoMontadoNombre: "Costura",
        segmentoMontadoId: "s2",
      }),
    ];
    const r = computePuntualidadDia({ segmentos, vehicles, dayStartMs: limaDayStart, nowMs });
    assert.equal(r.segmentos[0]?.montaje, true);
  });

  it("centinela no cuenta como cumplimiento", () => {
    const segmentos = [seg("s1", "Costura", "08:00", "10:00")];
    const { start, end } = segmentWindowMs("08:00", "10:00", limaDayStart);
    const nowMs = end + 30 * 60000;
    const vehicles = [
      veh({
        id: "v1",
        autoVerdad: true,
        segmentoOrigen: "Costura",
        aperturaAt: start + 60 * 60000,
      }),
    ];
    const r = computePuntualidadDia({ segmentos, vehicles, dayStartMs: limaDayStart, nowMs });
    assert.equal(r.segmentos[0]?.vacio, true);
  });
});

describe("vehicleActiveAt", () => {
  it("detecta activo y cerrado despues del instante", () => {
    const v = veh({
      id: "v1",
      aperturaAt: 1000,
      status: "archivado",
      cierreAt: 5000,
    });
    assert.equal(vehicleActiveAt(v, 3000), true);
    assert.equal(vehicleActiveAt(v, 6000), false);
  });
});
