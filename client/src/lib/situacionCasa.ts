import type { DetalleSubTarea } from "./persistence";



/** Atajos para la Casa situacional: ideas y acciones sin cupo de tiempo. */

export const CASA_SITUACION_PRESETS = [

  "Una idea más",

  "Otra",

  "Escribir mensaje",

  "Un paso más",

  "Revisar",

  "Ajustar",

] as const;



export type CasaPreset = (typeof CASA_SITUACION_PRESETS)[number];



export type CasaTextoCount = {

  texto: string;

  total: number;

  hechas: number;

};



/** Agrupa items Casa por texto para mostrar cuántas veces hiciste lo mismo. */

export function groupCasaByTexto(items: DetalleSubTarea[]): CasaTextoCount[] {

  const map = new Map<string, { total: number; hechas: number }>();

  for (const d of items) {

    const key = d.texto.trim();

    if (!key) continue;

    const cur = map.get(key) ?? { total: 0, hechas: 0 };

    cur.total += 1;

    if (d.entregado) cur.hechas += 1;

    map.set(key, cur);

  }

  return [...map.entries()]

    .map(([texto, { total, hechas }]) => ({ texto, total, hechas }))

    .sort((a, b) => b.hechas - a.hechas || b.total - a.total || a.texto.localeCompare(b.texto));

}



export function countCasaHechas(items: DetalleSubTarea[]): number {

  return items.filter(d => d.entregado).length;

}

