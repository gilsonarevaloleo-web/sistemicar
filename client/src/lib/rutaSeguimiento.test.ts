import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bandasToPatron,
  computeRutaPrivilegioPS,
  detectConquistaFluidezAbsoluta,
  getRutaTiempoSegmento,
  subFriccionPorDeclaracion,
} from "./rutaSeguimiento.ts";
import type { SubVehiculo } from "./persistence.ts";
import { createRutaEnfoqueState } from "./rutaEnfoque.ts";

describe("rutaSeguimiento", () => {
  it("getRutaTiempoSegmento divide A/B/C en 50/75/100%", () => {
    assert.equal(getRutaTiempoSegmento(100, 400), "A");
    assert.equal(getRutaTiempoSegmento(250, 400), "B");
    assert.equal(getRutaTiempoSegmento(350, 400), "C");
  });

  it("computeRutaPrivilegioPS premia solo fluido con conquista, no secuencia completa", () => {
    const ruta = createRutaEnfoqueState(8);
    ruta.activa = true;

    const conquista: SubVehiculo = {
      id: "s1",
      titulo: "A",
      status: "cumplido",
      rutaEnfoque: ruta,
      rutaDeclarada: ["fluido"],
      cantidadObjetivo: 10,
      tiempoRecordMinPerUnit: 1,
      duracionFinal: 200,
    };
    assert.equal(detectConquistaFluidezAbsoluta(conquista), true);
    assert.equal(computeRutaPrivilegioPS(conquista), 8);

    const friccion: SubVehiculo = {
      ...conquista,
      rutaDeclarada: ["fluido", "concentrado", "limite"],
      duracionFinal: 380,
    };
    assert.equal(subFriccionPorDeclaracion(friccion), true);
    assert.equal(computeRutaPrivilegioPS(friccion), 0);
    assert.equal(bandasToPatron(friccion.rutaDeclarada!), "secuencia_completa");
  });
});
