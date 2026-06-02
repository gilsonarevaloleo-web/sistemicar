import type { RutaBandaId } from "./rutaEnfoque";

/**
 * Guiones de voz ruta de enfoque — cadencia tech-noir, anclas corporales por tramo.
 * La voz dicta la acción física; el usuario declara después qué pudo seguir.
 */

function cleanTituloParaVoz(titulo: string): string {
  return titulo.replace(/\s+/g, " ").trim();
}

/** Tramo 1 — Modo fluido (apertura del sub, ~50% del tiempo). */
export function rutaVozFluidoParts(subTitulo: string): string[] {
  const nombre = cleanTituloParaVoz(subTitulo) || "Subtarea";
  return [
    `${nombre}: Iniciando tramo uno.`,
    "Active piloto automático. Fluya sin esfuerzo.",
  ];
}

/** Tramo 2 — Modo concentrado (~25%, eje vertical). */
export function rutaVozConcentradoParts(): string[] {
  return [
    "Tramo dos: Enfoque consciente.",
    "Enderece la columna vertebral. Alineación ahora.",
  ];
}

/** Tramo 3 — Modo al límite (~25%, base y respiración). */
export function rutaVozLimiteParts(): string[] {
  return [
    "Tramo final: Al límite.",
    "Ancle su base de fuerza. Respire profundo.",
  ];
}

export function rutaVozPartsForBanda(banda: Extract<RutaBandaId, "concentrado" | "limite">): string[] {
  return banda === "concentrado" ? rutaVozConcentradoParts() : rutaVozLimiteParts();
}

/** Una sola frase (p. ej. logs o preview). */
export function rutaVozFluidoLinea(subTitulo: string): string {
  return rutaVozFluidoParts(subTitulo).join(" ");
}

export function rutaVozConcentradoLinea(): string {
  return rutaVozConcentradoParts().join(" ");
}

export function rutaVozLimiteLinea(): string {
  return rutaVozLimiteParts().join(" ");
}
