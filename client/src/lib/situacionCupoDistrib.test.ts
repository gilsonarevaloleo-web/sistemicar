import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { SubTarea } from "./persistence.ts";
import {
  aplicarTiempoGanadoAlCumplir,
  applyCupoManualYRedistribuir,
  cerrarCronometroDeGolpe,
  computeSituacionCronometroHorarios,
  computeSituacionProyeccionFinMs,
  situacionGananciaVsContratoMin,
  descontarMinutosDeFlexiblesPosteriores,
  extraerSubTareaAReserva,
  quitarMinutosHaciaFoco,
  redistribuirMinutosSituacionCronometro,
  situacionRelojDebeMostrarse,
  situacionTargetMsReloj,
  remainingCronometroBudgetMin,
  sumBonusPreviewEnColaPendiente,
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
  it("reparte en partes iguales si ninguna está fija", () => {
    const subs = [st("a", 10), st("b", 10), st("c", 10)];
    const out = redistribuirMinutosSituacionCronometro(subs, 30);
    assert.equal(sumMinutosCronometroPendientes(out), 30);
    assert.equal(out.find(s => s.id === "a")!.minutosCupo, 10);
    assert.equal(out.find(s => s.id === "b")!.minutosCupo, 10);
    assert.equal(out.find(s => s.id === "c")!.minutosCupo, 10);
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
});

describe("remainingCronometroBudgetMin", () => {
  it("no achica presupuesto por debajo del cupo pendiente acumulado", () => {
    const now = 1_000_000;
    const sc = {
      activo: true,
      horaFinContratoMs: now + 25 * 60000,
      saldoAdelantoMin: 4,
    };
    const subs = [st("a", 10), st("b", 20), st("c", 10)];
    assert.equal(remainingCronometroBudgetMin(sc, subs, now), 40);
    assert.equal(remainingCronometroBudgetMin(sc, undefined, now), 25);
  });
});

describe("descontarMinutosDeFlexiblesPosteriores", () => {
  it("descuenta de filas flexibles posteriores en orden", () => {
    const subs = [st("a", 10, true), st("b", 15), st("c", 10)];
    const r = descontarMinutosDeFlexiblesPosteriores(subs, "a", 8);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.descontado, 8);
    assert.equal(r.subTareas.find(s => s.id === "b")!.minutosCupo, 7);
    assert.equal(sumMinutosCronometroPendientes(r.subTareas), 27);
  });

  it("no toca filas con cupo fijo", () => {
    const subs = [st("a", 10), st("b", 20, true), st("c", 10)];
    const r = descontarMinutosDeFlexiblesPosteriores(subs, "a", 5);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.subTareas.find(s => s.id === "b")!.minutosCupo, 20);
    assert.equal(r.subTareas.find(s => s.id === "c")!.minutosCupo, 5);
  });
});

describe("quitarMinutosHaciaFoco", () => {
  it("transfiere minutos a foco sin cambiar suma total", () => {
    const subs = [st("a", 10), st("b", 15), st("c", 10)];
    const sumBefore = sumMinutosCronometroPendientes(subs);
    const r = quitarMinutosHaciaFoco(subs, "a", "a", 8);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.focoGanado, 8);
    assert.equal(r.subTareas.find(s => s.id === "a")!.minutosCupo, 18);
    assert.equal(r.subTareas.find(s => s.id === "b")!.minutosCupo, 7);
    assert.equal(sumMinutosCronometroPendientes(r.subTareas), sumBefore);
  });

  it("foco distinto del origen recibe minutos", () => {
    const subs = [st("a", 10), st("b", 15), st("c", 10)];
    const r = quitarMinutosHaciaFoco(subs, "a", "b", 5);
    assert.equal(r.ok, true);
    if (!r.ok) return;
    assert.equal(r.subTareas.find(s => s.id === "b")!.minutosCupo, 15);
    assert.equal(r.subTareas.find(s => s.id === "c")!.minutosCupo, 10);
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
    assert.equal(horarios[0]!.enFoco, true);
  });

  it("preview suma minutosCupo en filas posteriores mientras el foco va ganando", () => {
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
    const durSinB = sinPreview[1]!.finMs - sinPreview[1]!.inicioMs;
    const durConB = conPreview[1]!.finMs - conPreview[1]!.inicioMs;
    assert.equal(durSinB, 10 * 60000);
    assert.equal(durConB, 15 * 60000);
  });

  it("sumBonusPreviewEnColaPendiente cuenta minutos virtuales repartidos", () => {
    const subs = [st("a", 15), st("b", 10), st("c", 10)];
    const now = base + 5 * 60000;
    const bonus = sumBonusPreviewEnColaPendiente(subs, { subTareaId: "a", startedAt: base }, now);
    assert.equal(bonus, 10);
  });
});

describe("contrato vs proyección", () => {
  it("situacionGananciaVsContratoMin positivo cuando proyección termina antes", () => {
    const contrato = 1_000_000;
    const proy = contrato - 8 * 60000;
    assert.equal(situacionGananciaVsContratoMin(contrato, proy), 8);
  });

  it("computeSituacionProyeccionFinMs incluye cupo extra en preview en vivo", () => {
    const base = 1_700_000_000_000;
    const subs = [st("a", 15), st("b", 10)];
    const now = base + 8 * 60000;
    const proy = computeSituacionProyeccionFinMs(subs, {
      bloqueInicioAt: base,
      anchor: { subTareaId: "a", startedAt: base },
      now,
      saldoAdelantoMin: 0,
    });
    assert.ok(proy != null);
    assert.ok(proy! > base + 15 * 60000);
  });
});

describe("situacionRelojDebeMostrarse", () => {
  it("muestra reloj con cronómetro activo", () => {
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
});

describe("aplicarTiempoGanadoAlCumplir", () => {
  const base = 1_700_000_000_000;

  it("reparte minutos ganados en cola proporcional al cupo objetivo", () => {
    const subs = [st("a", 15), st("b", 10), st("c", 30, true)];
    const now = base + 10 * 60000;
    const { subTareas: out, minutosGanados } = aplicarTiempoGanadoAlCumplir(
      subs,
      "a",
      { subTareaId: "a", startedAt: base },
      now,
      base
    );
    assert.equal(minutosGanados, 5);
    const b = out.find(s => s.id === "b")!;
    assert.equal(b.minutosCupo, 15);
    assert.equal(out.find(s => s.id === "c")!.minutosCupo, 30);
  });

  it("tarea no foco transfiere minutos ganados al foco", () => {
    const subs = [st("a", 10), st("b", 15), st("c", 10)];
    const now = base + 12 * 60000;
    const { subTareas: out, minutosGanados } = aplicarTiempoGanadoAlCumplir(
      subs,
      "c",
      { subTareaId: "a", startedAt: base },
      now,
      base
    );
    assert.equal(minutosGanados, 10);
    assert.equal(out.find(s => s.id === "a")!.minutosCupo, 20);
    assert.equal(out.find(s => s.id === "c")!.resultadoSituacion, "cumplido");
  });

  it("sin cola flexible transfiere ganancia al foco activo", () => {
    const subs = [st("a", 15), st("b", 10, true)];
    const now = base + 5 * 60000;
    const { subTareas: out, minutosGanados, saldoAdelantoMin } = aplicarTiempoGanadoAlCumplir(
      subs,
      "a",
      { subTareaId: "a", startedAt: base },
      now,
      base
    );
    assert.equal(minutosGanados, 10);
    assert.equal(saldoAdelantoMin, 0);
    assert.equal(out.find(s => s.id === "b")!.minutosCupo, 20);
    assert.equal(sumMinutosCronometroPendientes(out), 20);
  });
});

describe("cerrarCronometroDeGolpe", () => {
  const base = 1_700_000_000_000;

  it("marca todas las pendientes como falladas", () => {
    const subs = [st("a", 10), st("b", 15)];
    const out = cerrarCronometroDeGolpe(
      subs,
      { subTareaId: "a", startedAt: base },
      base + 5 * 60000,
      base
    );
    assert.equal(out.filter(s => s.resultadoSituacion === "fallado").length, 2);
    assert.equal(out.find(s => s.id === "a")!.duracionRealSec, 300);
  });
});

describe("extraerSubTareaAReserva", () => {
  it("saca fila pendiente del cronómetro y reduce Σ cupos", () => {
    const subs = [st("a", 10), st("b", 15), st("c", 5)];
    const { subTareas: out, extraido } = extraerSubTareaAReserva(subs, "b");
    assert.ok(extraido);
    assert.equal(extraido!.texto, "b");
    assert.equal(extraido!.minutosCupo, 15);
    assert.equal(out.length, 2);
    assert.equal(sumMinutosCronometroPendientes(out), 15);
    assert.equal(out.find(s => s.id === "b"), undefined);
  });

  it("ignora filas ya cerradas", () => {
    const subs = [{ ...st("a", 10), resultadoSituacion: "cumplido" as const }];
    const { subTareas: out, extraido } = extraerSubTareaAReserva(subs, "a");
    assert.equal(extraido, null);
    assert.equal(out.length, 1);
  });
});
