import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { Vehicle } from "./persistence";
import {
  buildCentinelaArchiveFields,
  isCentinelaBlockedByVehicles,
  listActiveCentinelas,
} from "./centinelaEngine.ts";

const centinela = (id: string): Vehicle =>
  ({
    id,
    titulo: "Modo Centinela",
    status: "activo",
    autoVerdad: true,
    aperturaAt: Date.now() - 600_000,
    userId: "u1",
  }) as Vehicle;

const consciente = (id: string, extra: Partial<Vehicle> = {}): Vehicle =>
  ({
    id,
    titulo: "Domingo noche",
    status: "activo",
    autoVerdad: false,
    tipoReloj: "desglosador",
    aperturaAt: Date.now() - 120_000,
    userId: "u1",
    ...extra,
  }) as Vehicle;

describe("centinelaEngine exclusión mutua", () => {
  it("isCentinelaBlockedByVehicles con desglosador activo (sin filtro fantasma)", () => {
    assert.equal(
      isCentinelaBlockedByVehicles([centinela("c1"), consciente("v1")]),
      true
    );
  });

  it("isCentinelaBlockedByVehicles solo con centinela", () => {
    assert.equal(isCentinelaBlockedByVehicles([centinela("c1")]), false);
  });

  it("listActiveCentinelas ignora conscientes", () => {
    const list = listActiveCentinelas([centinela("c1"), consciente("v1")]);
    assert.equal(list.length, 1);
    assert.equal(list[0].id, "c1");
  });

  it("buildCentinelaArchiveFields calcula duración", () => {
    const cierreAt = 1_700_000_000_000;
    const fields = buildCentinelaArchiveFields(
      { ...centinela("c1"), aperturaAt: cierreAt - 30 * 60_000 } as Vehicle,
      cierreAt
    );
    assert.equal(fields.status, "archivado");
    assert.equal(fields.duracionFinal, 30);
  });
});
