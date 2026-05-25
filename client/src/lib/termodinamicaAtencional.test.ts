import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDailySnapshot,
  classifyPsSource,
  computeEspectroBloques,
  computeTermodinamicaCompare,
  inferBandaBloque,
  maxBanda,
} from "./termodinamicaAtencional.ts";
import type { SubVehiculo, Vehicle } from "./persistence.ts";
import { createRutaEnfoqueState } from "./rutaEnfoque.ts";

describe("termodinamicaAtencional", () => {
  it("inferBandaBloque usa rutaDeclarada sobre cruzado", () => {
    const sub: SubVehiculo = {
      id: "s1",
      titulo: "Costura bloque A",
      status: "cumplido",
      rutaDeclarada: ["limite"],
      rutaEnfoque: createRutaEnfoqueState(10),
    };
    assert.equal(inferBandaBloque(sub), "limite");
  });

  it("computeEspectroBloques cuenta cada tramo de ruta por bloque cumplido", () => {
    const dayStart = Date.now() - 3600_000;
    const vehicles: Vehicle[] = [
      {
        id: "v1",
        titulo: "Costura",
        criterioFin: "cantidad",
        criterioDetalle: "",
        tiempoInicio: new Date(),
        ejes: { enfoque: { texto: "", trifecta: "blando" }, conflicto: { texto: "", trifecta: "blando" }, pasos: { texto: "", trifecta: "blando" }, alcance: { texto: "", trifecta: "blando" } },
        status: "cumplido",
        tipoReloj: "desglosador",
        cierreAt: Date.now(),
        subVehiculos: [
          { id: "s1", titulo: "Bloque pequeño", status: "cumplido", rutaDeclarada: ["fluido"] },
          { id: "s2", titulo: "Bloque grande", status: "cumplido", rutaDeclarada: ["concentrado", "limite"] },
        ],
      } as Vehicle,
    ];
    const espectro = computeEspectroBloques(vehicles, dayStart);
    assert.equal(espectro.fluido, 1);
    assert.equal(espectro.concentrado, 1);
    assert.equal(espectro.limite, 1);
  });

  it("computeEspectroBloques usa cruzado cuando no hay rutaDeclarada", () => {
    const dayStart = Date.now() - 3600_000;
    const ruta = createRutaEnfoqueState(8);
    ruta.cruzado = { fluido: true, concentrado: true, limite: true };
    const vehicles: Vehicle[] = [
      {
        id: "v1",
        titulo: "Pieza",
        criterioFin: "cantidad",
        criterioDetalle: "",
        tiempoInicio: new Date(),
        ejes: { enfoque: { texto: "", trifecta: "blando" }, conflicto: { texto: "", trifecta: "blando" }, pasos: { texto: "", trifecta: "blando" }, alcance: { texto: "", trifecta: "blando" } },
        status: "activo",
        tipoReloj: "desglosador",
        aperturaAt: dayStart + 1000,
        subVehiculos: [{ id: "s1", titulo: "Sub", status: "cumplido", cierreAt: Date.now(), rutaEnfoque: ruta }],
      } as Vehicle,
    ];
    const espectro = computeEspectroBloques(vehicles, dayStart);
    assert.equal(espectro.fluido, 1);
    assert.equal(espectro.concentrado, 1);
    assert.equal(espectro.limite, 1);
  });

  it("classifyPsSource separa panor�mico y veh�culos", () => {
    assert.equal(classifyPsSource("Cierre consciente: Ma�ana"), "panoramico");
    assert.equal(classifyPsSource("Ciclo Desglosador completado: Costura"), "vehiculos");
    assert.equal(classifyPsSource("Profundidad ruta enfoque"), "espectro");
  });

  it("buildDailySnapshot arma ratio y profundidad por bloques", () => {
    const snap = buildDailySnapshot({
      fecha: "2026-05-18",
      segmentos: [
        { id: "seg1", nombre: "AM", horaInicio: "08:00", horaFin: "12:00", color: "#fff", icono: "sun", estado: "cerrado_manual", eventos: [], psGanados: 2 },
        { id: "seg2", nombre: "PM", horaInicio: "14:00", horaFin: "18:00", color: "#fff", icono: "moon", estado: "entropia", eventos: [], psGanados: 0 },
      ],
      vehicles: [],
      dayStartMs: Date.now() - 86400_000,
      logs: [{ id: "l1", amount: 2, source: "Cierre consciente: AM", timestamp: new Date() }],
      conquistaMin: 120,
      entropiaMin: 30,
      vacioMin: 30,
    });
    assert.equal(snap.segmentosCerradosManual, 1);
    assert.equal(snap.segmentosEntropia, 1);
    assert.equal(snap.psDesglose.panoramico, 2);
    assert.equal(maxBanda("concentrado", "fluido"), "concentrado");
  });

  it("computeTermodinamicaCompare detecta mejora en bloques al l�mite", () => {
    const yesterday = buildDailySnapshot({
      fecha: "2026-05-17",
      segmentos: [],
      vehicles: [],
      dayStartMs: Date.now() - 86400_000,
      logs: [],
    });
    yesterday.espectroBloques.limite = 1;
    yesterday.bloquesCompletados = 3;
    yesterday.profundidadMaxima = "concentrado";

    const today = buildDailySnapshot({
      fecha: "2026-05-18",
      segmentos: [],
      vehicles: [],
      dayStartMs: Date.now(),
      logs: [],
    });
    today.espectroBloques.limite = 3;
    today.bloquesCompletados = 5;
    today.profundidadMaxima = "limite";

    const cmp = computeTermodinamicaCompare(yesterday, today);
    assert.equal(cmp.hasYesterday, true);
    assert.match(cmp.headline, /Profundidad superior|encima de ayer/);
    assert.equal(cmp.rows.find(r => r.key === "limite")?.delta, 2);
  });
});
