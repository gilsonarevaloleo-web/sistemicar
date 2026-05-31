import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea, Vehicle } from "./persistence.ts";
import {
  mergeActiveVehicleSessionState,
  mergeSubTareasById,
} from "./situacionSessionMerge.ts";

function st(
  id: string,
  extra: Partial<SubTarea> = {}
): SubTarea {
  return { id, texto: id, completada: false, creadaAt: 1, ...extra };
}

describe("mergeSubTareasById", () => {
  it("keeps local detalles when firebase row lacks them", () => {
    const fb = [st("a", { enDesgloseCronometro: true, minutosCupo: 10 })];
    const local = [
      st("a", {
        enDesgloseCronometro: true,
        minutosCupo: 10,
        detalles: [{ id: "d1", texto: "paso 1", entregado: false, creadaAt: 1 }],
      }),
    ];
    const merged = mergeSubTareasById(fb, local);
    assert.equal(merged[0].detalles?.length, 1);
    assert.equal(merged[0].detalles![0].texto, "paso 1");
  });

  it("preserves firebase order and merges ids from both sides", () => {
    const fb = [st("a"), st("b")];
    const local = [st("a", { detalles: [{ id: "d1", texto: "x", entregado: false, creadaAt: 1 }] }), st("c")];
    const merged = mergeSubTareasById(fb, local);
    assert.deepEqual(merged.map(s => s.id), ["a", "b", "c"]);
    assert.equal(merged[0].detalles?.length, 1);
  });
});

describe("mergeActiveVehicleSessionState situacion", () => {
  const baseVehicle = (): Vehicle =>
    ({
      id: "v1",
      titulo: "Test",
      status: "activo",
      tipoFlota: "situacion",
      criterioFin: "tiempo",
      criterioDetalle: "x",
      ejes: {},
      tiempoInicio: new Date(),
      createdAt: new Date(),
    }) as Vehicle;

  it("merges detalles when both sides have active cron desglose", () => {
    const fb: Vehicle = {
      ...baseVehicle(),
      subTareas: [st("c1", { enDesgloseCronometro: true, resultadoSituacion: "pendiente", minutosCupo: 10 })],
      situacionCronometro: { activo: true, bloqueInicioAt: 1000, horaFinMs: 2000, depthBlockPsGranted: 0 },
    };
    const local: Vehicle = {
      ...baseVehicle(),
      subTareas: [
        st("c1", {
          enDesgloseCronometro: true,
          resultadoSituacion: "pendiente",
          minutosCupo: 10,
          detalles: [{ id: "d1", texto: "detalle", entregado: false, creadaAt: 1 }],
        }),
      ],
      situacionCronometro: { activo: true, bloqueInicioAt: 1000, horaFinMs: 2000, depthBlockPsGranted: 0 },
      situacionCupoAnchor: { subTareaId: "c1", startedAt: 5000 },
    };
    const merged = mergeActiveVehicleSessionState(fb, local);
    assert.equal(merged.subTareas?.[0].detalles?.length, 1);
    assert.equal(merged.situacionCupoAnchor?.subTareaId, "c1");
    assert.equal(merged.situacionCronometro?.activo, true);
  });

  it("clears desglosador pause when local resumed but firebase still paused", () => {
    const fb: Vehicle = {
      ...(baseVehicle() as Vehicle),
      id: "d1",
      tipoReloj: "desglosador",
      interrupcionActiva: true,
      desglosadorPausa: {
        pausadoAt: 1000,
        subActivoId: "sub1",
        elapsedSecSnapshot: 120,
      },
    };
    const local: Vehicle = {
      ...fb,
      interrupcionActiva: false,
      desglosadorPausa: undefined,
    };
    const merged = mergeActiveVehicleSessionState(fb, local);
    assert.equal(merged.interrupcionActiva, false);
    assert.equal(merged.desglosadorPausa, undefined);
  });

  it("merges free-list subtasks when firebase snapshot lacks them", () => {
    const fb: Vehicle = {
      ...baseVehicle(),
      subTareas: undefined,
    };
    const local: Vehicle = {
      ...baseVehicle(),
      subTareas: [
        st("a", { texto: "Comprar leche" }),
        st("b", { texto: "Llamar al banco", completada: true }),
      ],
    };
    const merged = mergeActiveVehicleSessionState(fb, local);
    assert.equal(merged.subTareas?.length, 2);
    assert.equal(merged.subTareas![0].texto, "Comprar leche");
    assert.equal(merged.subTareas![1].completada, true);
  });
});
