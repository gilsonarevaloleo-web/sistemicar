import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildEscaleraConciencia,
  buildProduccionPulsoSerie,
  detectBrechaPresenciaProduccion,
  scorePresencia,
  serializeEscaleraForCierreWithStats,
} from "./escaleraConcienciaEngine.ts";
import type { CombustibleDia } from "./termodinamicaAtencional.ts";
import type { DisciplinaDia } from "./disciplinaEngine.ts";

const emptyDisciplina: DisciplinaDia = {
  indiceDisciplina: 0,
  entradasTotales: 0,
  sinEntrada: 0,
  montajes: 0,
  deltaMedioDesdeInicioMin: null,
  deltaMedioDesdePuertaMin: null,
  segmentos: [],
  estudioTipos: [],
};

const emptyCombustible: CombustibleDia = {
  bloques: 0,
  desglosadoresCerrados: 0,
  bloquesOtros: 0,
  decisiones: 0,
  subsTiempo: 0,
  subsSituacion: 0,
  misionesDirectas: 0,
};

describe("escaleraConcienciaEngine", () => {
  it("detectBrechaPresenciaProduccion cuando hay conquista sin decisiones", () => {
    assert.equal(detectBrechaPresenciaProduccion(60, 10, 1), true);
    assert.equal(detectBrechaPresenciaProduccion(60, 10, 8), false);
    assert.equal(detectBrechaPresenciaProduccion(10, 50, 0), false);
  });

  it("buildProduccionPulsoSerie acumula por hora", () => {
    const dayStart = Date.UTC(2026, 5, 14, 10, 0, 0);
    const ledger = [
      { key: "a", kind: "sub_desglosador" as const, vehicleId: "v1", ts: dayStart + 15 * 60_000 },
      { key: "b", kind: "sub_desglosador" as const, vehicleId: "v1", ts: dayStart + 75 * 60_000 },
    ];
    const serie = buildProduccionPulsoSerie(ledger, dayStart, dayStart + 3 * 3600_000);
    assert.ok(serie.length >= 2);
    assert.equal(serie[0]?.decisionesHora, 1);
    assert.equal(serie[serie.length - 1]?.acumulado, 2);
  });

  it("buildEscaleraConciencia ordena capas presencia → entrada → produccion", () => {
    const dayStart = Date.now() - 3600_000;
    const model = buildEscaleraConciencia({
      dayStats: { conquistaMin: 55, entropiaMin: 12, vacioMin: 8, centinelaMin: 0 },
      conquistaArcPct: 62,
      disciplina: {
        ...emptyDisciplina,
        indiceDisciplina: 72,
        entradasTotales: 2,
        segmentos: [{ segmentoId: "s1" } as DisciplinaDia["segmentos"][0]],
      },
      combustible: { ...emptyCombustible, decisiones: 1, subsTiempo: 1 },
      ledger: [{ key: "k", kind: "sub_desglosador", vehicleId: "v", ts: dayStart + 1000 }],
      dayStartMs: dayStart,
      nowMs: dayStart + 7200_000,
    });
    assert.equal(model.capas.length, 3);
    assert.equal(model.capas[0]?.id, "presencia");
    assert.equal(model.capas[1]?.id, "entrada");
    assert.equal(model.capas[2]?.id, "produccion");
    assert.ok(model.integracion.length > 20);
  });

  it("scorePresencia prioriza conquista sobre entropía", () => {
    const alto = scorePresencia({
      dayStats: { conquistaMin: 80, entropiaMin: 10, vacioMin: 10, centinelaMin: 0 },
      conquistaArcPct: 70,
    });
    const bajo = scorePresencia({
      dayStats: { conquistaMin: 15, entropiaMin: 70, vacioMin: 15, centinelaMin: 0 },
      conquistaArcPct: 20,
    });
    assert.ok(alto.score > bajo.score);
  });

  it("serializeEscaleraForCierre persiste capas para cierre de jornada", () => {
    const dayStart = Date.now() - 3600_000;
    const model = buildEscaleraConciencia({
      dayStats: { conquistaMin: 50, entropiaMin: 8, vacioMin: 5, centinelaMin: 0 },
      conquistaArcPct: 55,
      disciplina: { ...emptyDisciplina, indiceDisciplina: 65, segmentos: [] },
      combustible: { ...emptyCombustible, decisiones: 4, subsTiempo: 4 },
      ledger: [],
      dayStartMs: dayStart,
    });
    const snap = serializeEscaleraForCierreWithStats(model, 8);
    assert.equal(snap.decisionesHoy, 4);
    assert.equal(snap.presenciaScore, model.capas[0]?.score);
    assert.ok(snap.integracion.length > 10);
    assert.equal(snap.entropiaMin, 8);
  });
});
