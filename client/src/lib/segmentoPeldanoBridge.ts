import type { SegmentoV5, Vehicle } from "./persistence";
import {
  getPeldanosByProyecto,
  updatePeldano,
  upsertPeldanoDesdeSegmento,
  refreshProyectoStatsPublic,
  type ProyectoPeldanoResumen,
  type RutasMentalesSet,
} from "./proyectos";
import { inferFaseAtencional, computeResistenciaDia } from "./termodinamicaAtencional";
import type { FocusBandEvent } from "./focusBandLedger";

export type { RutasMentalesSet, RutaMental, RutaMentalId, RutaMentalPaso } from "./proyectos";

/** Tres rutas A/B/C con pasos 1→3 (actual + dos siguientes) para imagen mental. */
export function buildDefaultRutasMentales(titulo: string): RutasMentalesSet {
  const t = titulo.trim() || "Este bloque";
  const pasos = (p1: string, p2: string, p3: string) => [
    { numero: 1 as const, titulo: p1 },
    { numero: 2 as const, titulo: p2 },
    { numero: 3 as const, titulo: p3 },
  ];
  return {
    rutaActiva: "a",
    rutas: {
      a: {
        id: "a",
        label: "Ruta A · Piloto automático",
        perfil: "solo_fluido",
        pasos: pasos(t, `${t} — ritmo sostenido`, `${t} — cierre antes del pitido`),
      },
      b: {
        id: "b",
        label: "Ruta B · Columna",
        perfil: "fluido_concentrado",
        pasos: pasos(`${t} — fluido`, `${t} — enderezar columna`, `${t} — sostener alineación`),
      },
      c: {
        id: "c",
        label: "Ruta C · Base y respiración",
        perfil: "secuencia_completa",
        pasos: pasos(`${t} — entrar`, `${t} — concentrado`, `${t} — base + respiración`),
      },
    },
  };
}

/** Actualiza paso 1 de cada ruta cuando cambia el título del segmento. */
export function refreshRutasTituloBase(rutas: RutasMentalesSet, titulo: string): RutasMentalesSet {
  const fresh = buildDefaultRutasMentales(titulo);
  return {
    rutaActiva: rutas.rutaActiva,
    rutas: {
      a: { ...fresh.rutas.a, pasos: [fresh.rutas.a.pasos[0], rutas.rutas.a.pasos[1], rutas.rutas.a.pasos[2]] },
      b: { ...fresh.rutas.b, pasos: [fresh.rutas.b.pasos[0], rutas.rutas.b.pasos[1], rutas.rutas.b.pasos[2]] },
      c: { ...fresh.rutas.c, pasos: [fresh.rutas.c.pasos[0], rutas.rutas.c.pasos[1], rutas.rutas.c.pasos[2]] },
      },
  };
}

export async function ensurePeldanoFromSegmento(
  userId: string,
  params: {
    proyectoId: string;
    segmento: Pick<SegmentoV5, "id" | "nombre" | "horaInicio" | "horaFin">;
    planillaFecha: string;
    rutasMentales: RutasMentalesSet;
  }
): Promise<{ peldanoId: string }> {
  const peldano = await upsertPeldanoDesdeSegmento(userId, {
    proyectoId: params.proyectoId,
    segmentoId: params.segmento.id,
    planillaFecha: params.planillaFecha,
    titulo: params.segmento.nombre,
    horaInicio: params.segmento.horaInicio,
    horaFin: params.segmento.horaFin,
    rutasMentales: params.rutasMentales,
  });
  return { peldanoId: peldano.id };
}

function vehiclesForSegment(vehicles: Vehicle[], segmentoId: string): Vehicle[] {
  return vehicles.filter(v => v.segmentoId === segmentoId);
}

function buildResumenFromSegment(
  vehicles: Vehicle[],
  rutasMentales?: RutasMentalesSet,
  fase?: string
): ProyectoPeldanoResumen {
  let duracionMin = 0;
  let psGanados = 0;
  let subsCumplidos = 0;
  let subsTotal = 0;
  const subResumen: NonNullable<ProyectoPeldanoResumen["subResumen"]> = [];

  for (const v of vehicles) {
    duracionMin += v.duracionFinal ?? 0;
    if (v.tipoReloj === "desglosador" && v.subVehiculos?.length) {
      for (const sv of v.subVehiculos) {
        if (sv.status !== "cumplido" && sv.status !== "fallado") continue;
        subsTotal++;
        if (sv.status === "cumplido") subsCumplidos++;
        subResumen.push({
          titulo: sv.titulo,
          status: sv.status as "cumplido" | "fallado",
          duracionMin: sv.duracionFinal != null ? Math.round(sv.duracionFinal / 60) : undefined,
        });
        psGanados += sv.psOtorgados ?? 0;
      }
    }
  }

  const rutaActiva = rutasMentales?.rutas[rutasMentales.rutaActiva]?.label;

  return {
    subsCumplidos,
    subsTotal,
    duracionMin,
    psGanados,
    subResumen: subResumen.length ? subResumen : undefined,
    segmentoResumen: {
      rutaMentalActiva: rutasMentales?.rutaActiva,
      rutaMentalLabel: rutaActiva,
      faseAtencional: fase,
      vehiculosCerrados: vehicles.filter(v => v.status === "cumplido").length,
    },
  };
}

export async function sealPeldanosFromSegmentos(
  userId: string,
  params: {
    fecha: string;
    segmentos: SegmentoV5[];
    vehicles: Vehicle[];
    dayStartMs: number;
    events?: FocusBandEvent[];
  }
): Promise<{ sealed: number; peldanoIds: string[] }> {
  const { segmentos, vehicles, dayStartMs, events = [] } = params;
  const peldanoIds: string[] = [];
  let sealed = 0;

  const resistencia = computeResistenciaDia(vehicles, dayStartMs, events);
  const fase = inferFaseAtencional(resistencia);

  for (const seg of segmentos) {
    if (!seg.proyectoVinculadoId || !seg.proyectoPeldanoId) continue;
    if (seg.estado !== "cerrado_manual") continue;

    const peldano = (await getPeldanosByProyecto(userId, seg.proyectoVinculadoId)).find(
      p => p.id === seg.proyectoPeldanoId
    );
    if (peldano?.estado === "conquistado") continue;

    const segVehicles = vehiclesForSegment(vehicles, seg.id);
    const resumen = buildResumenFromSegment(segVehicles, seg.rutasMentales, fase);

    await updatePeldano(userId, seg.proyectoPeldanoId, {
      estado: "conquistado",
      cerradoAt: seg.cerradoAt ?? Date.now(),
      tipoOrigen: "tiempo",
      rutasMentales: seg.rutasMentales,
      resumen,
    });

    await refreshProyectoStatsPublic(userId, seg.proyectoVinculadoId);
    peldanoIds.push(seg.proyectoPeldanoId);
    sealed++;
  }

  return { sealed, peldanoIds };
}

export function countSegmentosListosParaSellar(segmentos: SegmentoV5[]): number {
  return segmentos.filter(
    s => s.proyectoVinculadoId && s.proyectoPeldanoId && s.estado === "cerrado_manual"
  ).length;
}
