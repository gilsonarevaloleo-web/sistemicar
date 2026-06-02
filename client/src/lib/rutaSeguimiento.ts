import { computeSubCloseVerdict, suggestedSec } from "./desglosadorClock";
import type { SubVehiculo } from "./persistence";
import type { RutaBandaId } from "./rutaEnfoque";

/** Patrón declarado por el usuario al cierre (verdad operativa, no el cruce automático). */
export type RutaSeguimientoPatron =
  | "solo_fluido"
  | "fluido_concentrado"
  | "secuencia_completa"
  | "personalizado"
  | "sin_ruta";

export const RUTA_SEGUIMIENTO_PRESETS: {
  id: Exclude<RutaSeguimientoPatron, "personalizado" | "sin_ruta">;
  label: string;
  hint: string;
  bandas: RutaBandaId[];
}[] = [
  {
    id: "solo_fluido",
    label: "Solo modo fluido",
    hint: "Entraste y cerraste en piloto automático — máxima resistencia cuando hay ganancia de tiempo.",
    bandas: ["fluido"],
  },
  {
    id: "fluido_concentrado",
    label: "Fluido + concentrado",
    hint: "Pagaste calibración de postura; la voz te empujó, tú sostuviste dos tramos.",
    bandas: ["fluido", "concentrado"],
  },
  {
    id: "secuencia_completa",
    label: "Los tres pasos",
    hint: "Recorriste fluido → concentrado → al límite. Fricción de entrenamiento, no premio final.",
    bandas: ["fluido", "concentrado", "limite"],
  },
];

/** Segmento temporal del contador (A/B/C) respecto al tiempo sugerido. */
export type RutaTiempoSegmento = "A" | "B" | "C";

export function getRutaTiempoSegmento(
  realSec: number,
  refSec: number
): RutaTiempoSegmento | null {
  if (refSec <= 0 || realSec < 0) return null;
  const pct = realSec / refSec;
  if (pct <= 0.5) return "A";
  if (pct <= 0.75) return "B";
  return "C";
}

export function bandasToPatron(bandas: RutaBandaId[]): RutaSeguimientoPatron {
  if (bandas.length === 0) return "sin_ruta";
  const set = new Set(bandas);
  const hasF = set.has("fluido");
  const hasC = set.has("concentrado");
  const hasL = set.has("limite");
  if (hasF && !hasC && !hasL) return "solo_fluido";
  if (hasF && hasC && !hasL) return "fluido_concentrado";
  if (hasF && hasC && hasL) return "secuencia_completa";
  return "personalizado";
}

export function patronFromSub(sub: SubVehiculo): RutaSeguimientoPatron {
  if (!sub.rutaEnfoque?.activa) return "sin_ruta";
  if (sub.rutaSeguimientoPatron) return sub.rutaSeguimientoPatron;
  if (!sub.rutaDeclarada?.length) return "sin_ruta";
  return bandasToPatron(sub.rutaDeclarada);
}

/** Cierre en segmento A (0–50% del tiempo) con ganancia neta — Conquista de Fluidez Absoluta. */
export function detectConquistaFluidezAbsoluta(sub: SubVehiculo): boolean {
  const refSec = suggestedSec(sub);
  const realSec = sub.duracionFinal ?? null;
  if (refSec == null || realSec == null) return false;
  const segmento = getRutaTiempoSegmento(realSec, refSec);
  if (segmento !== "A") return false;
  const patron = patronFromSub(sub);
  if (patron !== "solo_fluido") return false;
  return computeSubCloseVerdict(sub).verdict === "gain";
}

/** Fricción según lo que el usuario declaró (no lo que el pitido/voz cruzó). */
export function subFriccionPorDeclaracion(sub: SubVehiculo): boolean {
  if (!sub.rutaEnfoque?.activa) return false;
  const bandas = sub.rutaDeclarada;
  if (!bandas?.length) return false;
  return bandas.includes("concentrado") || bandas.includes("limite");
}

export function subDominioFluidoPorDeclaracion(sub: SubVehiculo): boolean {
  if (!sub.rutaEnfoque?.activa || sub.status !== "cumplido") return false;
  const bandas = sub.rutaDeclarada;
  if (!bandas?.length) return false;
  return bandas.includes("fluido") && !subFriccionPorDeclaracion(sub);
}

/**
 * Bonus PS de ruta (privilegio de fluidez).
 * Concentrado/límite = costo de calibración (0–1 PS), no trofeo.
 * Máximo cuando dominio fluido + cierre en segmento A con ganancia de tiempo.
 */
export function computeRutaPrivilegioPS(sub: SubVehiculo): number {
  if (!sub.rutaEnfoque?.activa || sub.status !== "cumplido") return 0;
  const bandas = sub.rutaDeclarada;
  if (!bandas?.length) return 0;

  const patron = bandasToPatron(bandas);
  const verdict = computeSubCloseVerdict(sub).verdict;

  if (patron === "solo_fluido") {
    if (detectConquistaFluidezAbsoluta(sub)) return 8;
    if (verdict === "gain") return 5;
    return 2;
  }
  if (patron === "fluido_concentrado") return 1;
  if (patron === "secuencia_completa") return 0;
  if (bandas.includes("fluido") && !subFriccionPorDeclaracion(sub)) return 2;
  return 0;
}

export function enrichSubRutaCierre(
  sub: SubVehiculo,
  rutaDeclarada: RutaBandaId[]
): SubVehiculo {
  if (!sub.rutaEnfoque?.activa) return sub;
  const patron = bandasToPatron(rutaDeclarada);
  const patched: SubVehiculo = {
    ...sub,
    rutaDeclarada,
    rutaSeguimientoPatron: patron,
  };
  return {
    ...patched,
    conquistaFluidezAbsoluta: detectConquistaFluidezAbsoluta(patched),
  };
}
