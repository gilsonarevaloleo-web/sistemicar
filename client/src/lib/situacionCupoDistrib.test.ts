import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea } from "./persistence.ts";
import {
  aplicarTiempoGanadoAlCumplir,
  applyCupoManualYRedistribuir,
  computeSituacionCronometroHorarios,
  redistribuirMinutosSituacionCronometro,
  situacionRelojDebeMostrarse,
  situacionTargetMsReloj,
  sumMinutosCronometroPendientes,
} from "./situacionCupoDistrib.ts";

function st(id: string, minutosCupo: number, cupoFijo?: boolean): SubTarea {
  return {
    id,
    texto: id,
    completada: false,
    creadaAt: 0,
    enDesgloseCronometro: true,
    resultadoSituacion: "pendiente",
    minutosCupo,
    ...(cupoFijo ? { cupoFijo: true } : {}),
  };
}

describe("redistribuirMinutosSituacionCronometro", () => {
  it("reparte entre todas las filas si ninguna est� fija", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const out = redistribuirMinutosSituacionCronometro(subs, 30);
    assert.equal(sumMinutosCronometroPendientes(out), 30);
  });

  it("conserva cupos fijos y reparte el sobrante entre flexibles", () => {
    const subs = [st("a", 15, true), st("b", 10), st("c", 10), st("d", 10)];
    const out = redistribuirMinutosSituacionCronometro(subs, 60);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.minutosCupo, 15);
    assert.equal(a.cupoFijo, true);
    const flexSum = out.filter(s => s.id !== "a").reduce((acc, s) => acc + (s.minutosCupo ?? 0), 0);
    assert.equal(15 + flexSum, 60);
    assert.ok((out.find(s => s.id === "b")!.minutosCupo ?? 0) >= 1);
  });

  it("applyCupoManual marca fijo y redistribuye", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const out = applyCupoManualYRedistribuir(subs, "a", 20, 60);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.minutosCupo, 20);
    assert.equal(a.cupoFijo, true);
    assert.equal(sumMinutosCronometroPendientes(out), 60);
  });

  it("quitar cupo manual libera la fila para redistribuci�n", () => {
    const subs = [st("a", 20, true), st("b", 10), st("c", 10)];
    const out = applyCupoManualYRedistribuir(subs, "a", undefined, 30);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.cupoFijo, undefined);
    assert.equal(sumMinutosCronometroPendientes(out), 30);
    assert.ok((a.minutosCupo ?? 0) >= 1);
  });
});

describe("computeSituacionCronometroHorarios", () => {
  const base = 1_700_000_000_000;

  it("proyecta fin acumulativo para 3 filas pendientes", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const horarios = computeSituacionCronometroHorarios(subs, {
      bloqueInicioAt: base,
      anchor: { subTareaId: "a", startedAt: base },
      now: base,
    });
    assert.equal(horarios.length, 3);
    assert.equal(horarios[0]!.finMs, base + 10 * 60000);
    assert.equal(horarios[1]!.finMs, base + 20 * 60000);
    assert.equal(horarios[2]!.finMs, base + 30 * 60000);
    assert.equal(horarios[0]!.enFoco, true);
  });

  it("preview adelanta cursor cuando la fila foco va ganando tiempo", () => {
    const subs = [st("a", 15), st("b", 10), st("c", 10)];
    const anchorAt = base;
    const now = base + 5 * 60000;
    const sinPreview = computeSituacionCronometroHorarios(subs, {
      bloqueInicioAt: base,
      anchor: { subTareaId: "a", startedAt: anchorAt },
      now,
      previewTiempoGanado: false,
    });
    const conPreview = computeSituacionCronometroHorarios(subs, {
      bloqueInicioAt: base,
      anchor: { subTareaId: "a", startedAt: anchorAt },
      now,
      previewTiempoGanado: true,
    });
    assert.ok(conPreview[1]!.finMs <= sinPreview[1]!.finMs);
    assert.ok(conPreview[2]!.finMs <= sinPreview[2]!.finMs);
  });
});

describe("situacionRelojDebeMostrarse", () => {
  it("muestra reloj con cron�metro activo aunque el ancla a�n no sincroniz�", () => {
    const subs = [st("a", 10)];
    const ok = situacionRelojDebeMostrarse({
      tipoFlota: "situacion",
      status: "activo",
      subTareas: subs,
      situacionCronometro: { activo: true, bloqueInicioAt: 1000, horaFinMs: 1000 + 10 * 60000 },
      situacionCupoAnchor: null,
    });
    assert.equal(ok, true);
  });

  it("calcula target desde primera fila pendiente sin ancla", () => {
    const base = 1_700_000_000_000;
    const tMs = situacionTargetMsReloj(
      {
        tipoFlota: "situacion",
        subTareas: [st("a", 12), st("b", 8)],
        situacionCronometro: { activo: true, bloqueInicioAt: base },
        situacionCupoAnchor: null,
        aperturaAt: base,
      },
      base
    );
    assert.equal(tMs, base + 12 * 60000);
  });
});

describe("aplicarTiempoGanadoAlCumplir", () => {
  const base = 1_700_000_000_000;

  it("reparte minutos ganados proporcionalmente entre flexibles", () => {
    const subs = [st("a", 15), st("b", 10), st("c", 10, true)];
    const now = base + 10 * 60000;
    const { subTareas: out, minutosGanados } = aplicarTiempoGanadoAlCumplir(
      subs,
      "a",
      { subTareaId: "a", startedAt: base },
      now
    );
    assert.equal(minutosGanados, 5);
    const a = out.find(s => s.id === "a")!;
    assert.equal(a.resultadoSituacion, "cumplido");
    assert.equal(a.duracionRealSec, 600);
    const c = out.find(s => s.id === "c")!;
    assert.equal(c.minutosCupo, 10);
    assert.equal(c.cupoFijo, true);
    const b = out.find(s => s.id === "b")!;
    assert.equal(b.minutosCupo, 15);
  });

  it("sin flexibles pendientes no modifica cupos pero registra ganancia", () => {
    const subs = [st("a", 15), st("b", 10, true)];
    const now = base + 5 * 60000;
    const { subTareas: out, minutosGanados } = aplicarTiempoGanadoAlCumplir(
      subs,
      "a",
      { subTareaId: "a", startedAt: base },
      now
    );
    assert.equal(minutosGanados, 10);
    assert.equal(out.find(s => s.id === "b")!.minutosCupo, 10);
    assert.equal(sumMinutosCronometroPendientes(out), 10);
  });
});
