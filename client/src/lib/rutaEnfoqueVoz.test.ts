import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  rutaVozConcentradoParts,
  rutaVozFluidoParts,
  rutaVozLimiteParts,
  rutaVozPartsForBanda,
} from "./rutaEnfoqueVoz.ts";

describe("rutaEnfoqueVoz", () => {
  it("tramo fluido incluye nombre y piloto automático", () => {
    const parts = rutaVozFluidoParts("Costura bloque A");
    assert.match(parts[0], /Costura bloque A/);
    assert.match(parts[0], /tramo uno/i);
    assert.match(parts[1], /piloto automático/i);
    assert.match(parts[1], /Fluya sin esfuerzo/i);
  });

  it("tramo concentrado ancla columna vertebral", () => {
    const parts = rutaVozConcentradoParts();
    assert.match(parts.join(" "), /columna vertebral/i);
    assert.match(parts.join(" "), /Alineación ahora/i);
  });

  it("tramo límite ancla base y respiración", () => {
    const parts = rutaVozLimiteParts();
    assert.match(parts.join(" "), /base de fuerza/i);
    assert.match(parts.join(" "), /Respire profundo/i);
  });

  it("rutaVozPartsForBanda delega por banda", () => {
    assert.equal(rutaVozPartsForBanda("concentrado").length, 2);
    assert.equal(rutaVozPartsForBanda("limite").length, 2);
  });
});
