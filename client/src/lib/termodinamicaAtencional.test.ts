import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildDailySnapshot,
  classifyPsSource,
  computeEspectroBloques,
  countBloquesCompletados,
  countDesglosadoresCerradosHoy,
  computeResistenciaDia,
  subCumplidoEnJornada,
  vehicleEnTermoJornada,
  countSubsDesglosadorCumplidosHoy,
  desglosadorCerradoEnJornada,
  computeTermodinamicaCompare,
  computeTermodinamicaCompareV2,
  inferBandaBloque,
  inferFaseAtencional,
  maxBanda,
  subEnDominioFluido,
  subTuvoFriccion,
} from "./termodinamicaAtencional.ts";
import type { SubVehiculo, Vehicle } from "./persistence.ts";
import { createRutaEnfoqueState } from "./rutaEnfoque.ts";

function makeDesglosadorVehicle(
  subs: SubVehiculo[],
  overrides: Partial<Vehicle> = {}
): Vehicle {
  return {
    id: "v1",
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

  it("computeEspectroBloques cuenta profundidad por sub; bloque = desglosador cerrado", () => {
    const dayStart = Date.now() - 3600_000;
    const now = Date.now();
    const vehicles: Vehicle[] = [
      makeDesglosadorVehicle([
        { id: "s1", titulo: "Bloque pequeño", status: "cumplido", cierreAt: now, rutaDeclarada: ["fluido"] },
        {
          id: "s2",
          titulo: "Bloque grande",
          status: "cumplido",
          cierreAt: now,
          rutaDeclarada: ["concentrado", "limite"],
        },
      ]),
    ];
    const espectro = computeEspectroBloques(vehicles, dayStart);
    assert.equal(espectro.fluido, 1);
    assert.equal(espectro.concentrado, 0);
    assert.equal(espectro.limite, 1);
    assert.equal(countSubsDesglosadorCumplidosHoy(vehicles, dayStart), 2);
    assert.equal(countDesglosadoresCerradosHoy(vehicles, dayStart), 1);
    assert.equal(countBloquesCompletados(vehicles, dayStart), 1);
  });

  it("computeEspectroBloques usa cruzado cuando no hay rutaDeclarada", () => {
    const dayStart = Date.now() - 3600_000;
    const ruta = createRutaEnfoqueState(8);
    ruta.cruzado = { fluido: true, concentrado: true, limite: true };
    const vehicles: Vehicle[] = [
      makeDesglosadorVehicle(
        [{ id: "s1", titulo: "Sub", status: "cumplido", cierreAt: Date.now(), rutaEnfoque: ruta }],
        { status: "activo", aperturaAt: dayStart + 1000 }
      ),
    ];
    const espectro = computeEspectroBloques(vehicles, dayStart);
    assert.equal(espectro.fluido, 0);
    assert.equal(espectro.concentrado, 0);
    assert.equal(espectro.limite, 1);
  });

  it("dos desglosadores cerrados con varios subs: 2 bloques y 12 subs", () => {
    const dayStart = Date.now() - 3600_000;
    const now = Date.now();
    const mkSubs = (n: number, prefix: string): SubVehiculo[] =>
      Array.from({ length: n }, (_, i) => ({
        id: `${prefix}-s${i}`,
        titulo: `${prefix} ${i}`,
        status: "cumplido" as const,
        cierreAt: now,
        rutaDeclarada: ["fluido"],
      }));
    const vehicles: Vehicle[] = [
      makeDesglosadorVehicle(mkSubs(7, "a"), { id: "d1", titulo: "Costura A" }),
      makeDesglosadorVehicle(mkSubs(5, "b"), { id: "d2", titulo: "Costura B" }),
    ];
    assert.equal(countSubsDesglosadorCumplidosHoy(vehicles, dayStart), 12);
    assert.equal(countDesglosadoresCerradosHoy(vehicles, dayStart), 2);
    assert.equal(countBloquesCompletados(vehicles, dayStart), 2);
    const espectro = computeEspectroBloques(vehicles, dayStart);
    assert.equal(espectro.fluido, 12);
  });

  it("desglosador activo no arrastra subs cumplidos de jornadas anteriores", () => {
    const dayStart = Date.now() - 3600_000;
    const ayer = dayStart - 86400_000;
    const vehicles: Vehicle[] = [
      makeDesglosadorVehicle(
        [
          { id: "s-old", titulo: "Ayer", status: "cumplido", cierreAt: ayer, rutaDeclarada: ["fluido"] },
          { id: "s-new", titulo: "Hoy", status: "cumplido", cierreAt: Date.now(), rutaDeclarada: ["fluido"] },
          { id: "s-pend", titulo: "Pendiente", status: "pendiente" },
        ],
        { status: "activo", aperturaAt: ayer }
      ),
    ];
    assert.equal(countSubsDesglosadorCumplidosHoy(vehicles, dayStart), 1);
    assert.equal(countBloquesCompletados(vehicles, dayStart), 0);
    assert.equal(desglosadorCerradoEnJornada(vehicles[0], dayStart), false);
    assert.equal(subCumplidoEnJornada(vehicles[0].subVehiculos![0], vehicles[0], dayStart), false);
    assert.equal(subCumplidoEnJornada(vehicles[0].subVehiculos![1], vehicles[0], dayStart), true);
  });

  it("classifyPsSource separa panorámico y vehículos", () => {
    assert.equal(classifyPsSource("Cierre consciente: Mañana"), "panoramico");
    assert.equal(classifyPsSource("Ciclo Desglosador completado: Costura"), "vehiculos");
    assert.equal(classifyPsSource("Profundidad ruta enfoque"), "espectro");
  });

  it("buildDailySnapshot separa bloques (desglosadores cerrados) de subs", () => {
    const dayStart = Date.now() - 3600_000;
    const now = Date.now();
    const mkSubs = (n: number, prefix: string): SubVehiculo[] =>
      Array.from({ length: n }, (_, i) => ({
        id: `${prefix}-s${i}`,
        titulo: `${prefix} ${i}`,
        status: "cumplido" as const,
        cierreAt: now,
        rutaDeclarada: ["fluido"],
      }));
    const snap = buildDailySnapshot({
      fecha: "2026-06-04",
      segmentos: [],
      vehicles: [
        makeDesglosadorVehicle(mkSubs(7, "a"), { id: "d1" }),
        makeDesglosadorVehicle(mkSubs(5, "b"), { id: "d2" }),
      ],
      dayStartMs: dayStart,
      logs: [],
    });
    assert.equal(snap.bloquesCompletados, 2);
    assert.equal(snap.desglosadoresCerrados, 2);
    assert.equal(snap.subsDesglosadorCumplidos, 12);
    assert.equal(snap.decisionesDelDia, 12);
    assert.equal(snap.bloquesOtros, 0);
  });

  it("buildDailySnapshot incluye schemaVersion 2 y resistencia", () => {
    const snap = buildDailySnapshot({
      fecha: "2026-05-18",
      segmentos: [
        {
          id: "seg1",
          nombre: "AM",
          horaInicio: "08:00",
          horaFin: "12:00",
          color: "#fff",
          icono: "sun",
          estado: "cerrado_manual",
          eventos: [],
          psGanados: 2,
        },
        {
          id: "seg2",
          nombre: "PM",
          horaInicio: "14:00",
          horaFin: "18:00",
          color: "#fff",
          icono: "moon",
          estado: "entropia",
          eventos: [],
          psGanados: 0,
        },
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
    assert.equal(snap.schemaVersion, 2);
    assert.ok(snap.resistencia);
    assert.equal(snap.estadoAtencional, snap.resistencia?.fase);
    assert.equal(maxBanda("concentrado", "fluido"), "concentrado");
  });

  it("subTuvoFriccion detecta cruce concentrado en rutaEnfoque", () => {
    const dayStart = Date.now() - 3600_000;
    const ruta = createRutaEnfoqueState(6);
    ruta.activa = true;
    ruta.cruzado = { fluido: true, concentrado: true, limite: false };
    const sub: SubVehiculo = {
      id: "s1",
      titulo: "Sub",
      status: "cumplido",
      rutaEnfoque: ruta,
    };
    assert.equal(subTuvoFriccion(sub, [], dayStart), true);
    assert.equal(subEnDominioFluido(sub, [], dayStart), false);
  });

  it("computeResistenciaDia ignora declaración del usuario — solo contador objetivo", () => {
    const dayStart = Date.now() - 3600_000;
    const rutaTres = createRutaEnfoqueState(6);
    rutaTres.activa = true;
    rutaTres.cruzado = { fluido: true, concentrado: true, limite: true };

    const conEstructura = computeResistenciaDia(
      [
        makeDesglosadorVehicle([
          {
            id: "s1",
            titulo: "A",
            status: "cumplido",
            cierreAt: Date.now(),
            rutaEnfoque: rutaTres,
            rutaDeclarada: ["fluido"],
            tiempoSugeridoSeg: 600,
            duracionFinal: 400,
          },
        ]),
      ],
      dayStart
    );
    assert.equal(conEstructura.friccionBloques, 1);
    assert.equal(conEstructura.subsEstructuraCompleta, 1);
    assert.equal(conEstructura.bloquesDominioFluido, 0);

    const rutaSoloFluido = createRutaEnfoqueState(6);
    rutaSoloFluido.activa = true;
    rutaSoloFluido.cruzado = { fluido: true, concentrado: false, limite: false };

    const pilotoAuto = computeResistenciaDia(
      [
        makeDesglosadorVehicle([
          {
            id: "s1",
            titulo: "A",
            status: "cumplido",
            cierreAt: Date.now(),
            rutaEnfoque: rutaSoloFluido,
            rutaDeclarada: ["fluido", "concentrado", "limite"],
            tiempoSugeridoSeg: 600,
            duracionFinal: 200,
          },
        ]),
      ],
      dayStart
    );
    assert.equal(pilotoAuto.bloquesDominioFluido, 1);
    assert.equal(pilotoAuto.friccionBloques, 0);
    assert.equal(pilotoAuto.subsEstructuraCompleta, 0);
    assert.ok(pilotoAuto.indiceResistencia < conEstructura.indiceResistencia);
  });

  it("inferFaseAtencional clasifica integración en el medio", () => {
    const fase = inferFaseAtencional({
      subsConRuta: 4,
      bloquesDominioFluido: 1,
      friccionBloques: 3,
      subsEstructuraCompleta: 1,
      subsPersistenciaBC: 2,
      subsConGanancia: 2,
      gananciaTiempoSeg: 120,
      indiceResistencia: 58,
      fase: "entrenamiento",
    });
    assert.equal(fase, "integracion");
  });

  it("computeTermodinamicaCompare v1 sigue priorizando límite (legacy)", () => {
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

  it("computeTermodinamicaCompareV2 premia estructura objetiva, no declaración", () => {
    const dayStart = Date.now() - 3600_000;
    const rutaCompleta = createRutaEnfoqueState(6);
    rutaCompleta.activa = true;
    rutaCompleta.cruzado = { fluido: true, concentrado: true, limite: true };

    const rutaFluido = createRutaEnfoqueState(6);
    rutaFluido.activa = true;
    rutaFluido.cruzado = { fluido: true, concentrado: false, limite: false };

    const yesterday = buildDailySnapshot({
      fecha: "2026-05-17",
      segmentos: [],
      vehicles: [
        makeDesglosadorVehicle([
          {
            id: "s1",
            titulo: "A",
            status: "cumplido",
            cierreAt: Date.now(),
            rutaEnfoque: rutaFluido,
            tiempoSugeridoSeg: 600,
            duracionFinal: 200,
          },
        ]),
      ],
      dayStartMs: dayStart,
      logs: [],
    });

    const today = buildDailySnapshot({
      fecha: "2026-05-18",
      segmentos: [],
      vehicles: [
        makeDesglosadorVehicle([
          {
            id: "s1",
            titulo: "A",
            status: "cumplido",
            cierreAt: Date.now(),
            rutaEnfoque: rutaCompleta,
            tiempoSugeridoSeg: 600,
            duracionFinal: 500,
          },
          {
            id: "s2",
            titulo: "B",
            status: "cumplido",
            cierreAt: Date.now(),
            rutaEnfoque: rutaCompleta,
            tiempoSugeridoSeg: 400,
            duracionFinal: 360,
          },
        ]),
      ],
      dayStartMs: dayStart,
      logs: [],
    });

    const cmp = computeTermodinamicaCompareV2(yesterday, today);
    assert.equal(cmp.hasYesterday, true);
    assert.equal(cmp.rows.find(r => r.key === "estructura_completa")?.delta, 2);
    assert.equal(cmp.rows.find(r => r.key === "friccion")?.delta, 2);
    assert.ok(cmp.indiceHoy > cmp.indiceAyer!);
    const frRow = cmp.rows.find(r => r.key === "friccion");
    assert.equal(frRow?.betterWhenHigher, true);
  });
});
