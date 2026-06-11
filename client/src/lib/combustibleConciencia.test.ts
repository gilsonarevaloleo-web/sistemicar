import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  computeCombustibleDia,
  formatCombustibleCelebracionBloque,
  subTareaDecisionEnJornada,
  countSubsSituacionCumplidosHoy,
} from "./combustibleConciencia.ts";
import type { SubTarea, SubVehiculo, Vehicle } from "./persistence.ts";

function makeDesglosador(subs: SubVehiculo[], overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "d1",
    titulo: "Costura",
    criterioFin: "cantidad",
    criterioDetalle: "",
    tiempoInicio: new Date(),
    ejes: {
      enfoque: { texto: "", trifecta: "blando" },
      conflicto: { texto: "", trifecta: "blando" },
      pasos: { texto: "", trifecta: "blando" },
      alcance: { texto: "", trifecta: "blando" },
    },
    status: "cumplido",
    tipoReloj: "desglosador",
    cierreAt: Date.now(),
    subVehiculos: subs,
    ...overrides,
  } as Vehicle;
}

function makeSituacion(subTareas: SubTarea[], overrides: Partial<Vehicle> = {}): Vehicle {
  return {
    id: "s1",
    titulo: "Situación",
    criterioFin: "situacion",
    criterioDetalle: "",
    tiempoInicio: new Date(),
    ejes: {
      enfoque: { texto: "", trifecta: "blando" },
      conflicto: { texto: "", trifecta: "blando" },
      pasos: { texto: "", trifecta: "blando" },
      alcance: { texto: "", trifecta: "blando" },
    },
    status: "activo",
    tipoFlota: "situacion",
    aperturaAt: Date.now() - 3600_000,
    subTareas,
    ...overrides,
  } as Vehicle;
}

describe("combustibleConciencia", () => {
  const dayStart = Date.now() - 3600_000;
  const now = Date.now();

  it("decisiones = subs tiempo + subs situación + misiones directas", () => {
    const vehicles: Vehicle[] = [
      makeDesglosador(
        [
          { id: "sv1", titulo: "A", status: "cumplido", cierreAt: now },
          { id: "sv2", titulo: "B", status: "cumplido", cierreAt: now },
        ],
        { status: "activo", aperturaAt: dayStart + 1000 }
      ),
      makeSituacion([
        { id: "st1", texto: "Llamar", completada: true, creadaAt: dayStart, cerradaAt: now },
        { id: "st2", texto: "Cron", completada: true, creadaAt: dayStart, enDesgloseCronometro: true, resultadoSituacion: "cumplido", cerradaAt: now },
      ]),
      {
        id: "m1",
        titulo: "Proyectivo",
        criterioFin: "hora",
        criterioDetalle: "",
        tiempoInicio: new Date(),
        ejes: {
          enfoque: { texto: "", trifecta: "blando" },
          conflicto: { texto: "", trifecta: "blando" },
          pasos: { texto: "", trifecta: "blando" },
          alcance: { texto: "", trifecta: "blando" },
        },
        status: "cumplido",
        tipoFlota: "tiempo",
        tipoReloj: "proyectivo",
        cierreAt: now,
        aperturaAt: dayStart + 2000,
      } as Vehicle,
    ];

    const c = computeCombustibleDia(vehicles, dayStart);
    assert.equal(c.subsTiempo, 2);
    assert.equal(c.subsSituacion, 2);
    assert.equal(c.misionesDirectas, 1);
    assert.equal(c.decisiones, 5);
    assert.equal(c.bloques, 1);
    assert.equal(c.desglosadoresCerrados, 0);
  });

  it("sub situacional de jornada anterior no cuenta", () => {
    const ayer = dayStart - 86400_000;
    const st: SubTarea = {
      id: "st-old",
      texto: "Ayer",
      completada: true,
      creadaAt: ayer,
      cerradaAt: ayer,
    };
    const v = makeSituacion([st]);
    assert.equal(subTareaDecisionEnJornada(st, v, dayStart), false);
    assert.equal(countSubsSituacionCumplidosHoy([v], dayStart), 0);
  });

  it("sub cron cumplido cuenta aunque sync pierda cerradaAt", () => {
    const st: SubTarea = {
      id: "st-cron",
      texto: "Cron",
      completada: true,
      creadaAt: dayStart + 1000,
      enDesgloseCronometro: true,
      resultadoSituacion: "cumplido",
    };
    const v = makeSituacion([st]);
    assert.equal(subTareaDecisionEnJornada(st, v, dayStart), true);
    assert.equal(countSubsSituacionCumplidosHoy([v], dayStart), 1);
  });

  it("formatCombustibleCelebracionBloque con decisiones", () => {
    const msg = formatCombustibleCelebracionBloque({ minutos: 18, decisiones: 3, psTotal: 16 });
    assert.match(msg, /18 min/);
    assert.match(msg, /3 decisiones/);
    assert.match(msg, /combustible de conciencia/);
    assert.match(msg, /\+16 PS/);
  });

  it("formatCombustibleCelebracionBloque sin decisiones", () => {
    const msg = formatCombustibleCelebracionBloque({ minutos: 5, decisiones: 0, psTotal: 4 });
    assert.match(msg, /combustible de conciencia/);
    assert.doesNotMatch(msg, /resolviste/);
  });

  it("desglosador cerrado cuenta bloque pero subs aparte", () => {
    const vehicles = [
      makeDesglosador(
        Array.from({ length: 5 }, (_, i) => ({
          id: `s${i}`,
          titulo: `Sub ${i}`,
          status: "cumplido" as const,
          cierreAt: now,
        }))
      ),
    ];
    const c = computeCombustibleDia(vehicles, dayStart);
    assert.equal(c.bloques, 1);
    assert.equal(c.decisiones, 5);
  });
});
