import type { ProyectoEtiqueta } from "./claridadDireccion";
import type { SubTarea } from "./persistence";
import { registrarPasoEjecutadoEnProyecto } from "./proyectos";
import { markImanReservaEjecutada, type SituacionReservaItem } from "./situacionReserva";

/** Pensamientos sin proyecto asignado — aterrizar después. */
export const NIDO_INBOX_ID = "__inbox__";

export const IMAN_PENSAMIENTOS_TITLE = "Imán de pensamientos";
export const IMAN_PENSAMIENTOS_TAGLINE =
  "Tus ideas aterrizan en proyectos y centros — no saltan al vacío como en la mente sin sistema.";
export const NIDO_INBOX_LABEL = "Aterrizaje pendiente";

export type ImanNidoKey = string;

export interface ImanNidoGrupo {
  nidoId: ImanNidoKey;
  titulo: string;
  etiqueta?: ProyectoEtiqueta;
  color?: string;
  items: SituacionReservaItem[];
}

export interface ImanProyectoOpcion {
  id: string;
  titulo: string;
  etiqueta: ProyectoEtiqueta;
  color?: string;
}

export function nidoKeyFromReserva(item: SituacionReservaItem): ImanNidoKey {
  return item.proyectoId?.trim() || NIDO_INBOX_ID;
}

export function agruparImanPorNido(
  items: SituacionReservaItem[],
  proyectos: ImanProyectoOpcion[]
): ImanNidoGrupo[] {
  const byNido = new Map<ImanNidoKey, SituacionReservaItem[]>();
  for (const item of items) {
    const key = nidoKeyFromReserva(item);
    const list = byNido.get(key) ?? [];
    list.push(item);
    byNido.set(key, list);
  }

  const proyectosById = new Map(proyectos.map(p => [p.id, p]));
  const grupos: ImanNidoGrupo[] = [];

  for (const p of proyectos) {
    const list = byNido.get(p.id);
    if (!list?.length) continue;
    grupos.push({
      nidoId: p.id,
      titulo: p.titulo,
      etiqueta: p.etiqueta,
      color: p.color,
      items: list.sort((a, b) => b.reservadaAt - a.reservadaAt),
    });
    byNido.delete(p.id);
  }

  const inbox = byNido.get(NIDO_INBOX_ID);
  if (inbox?.length) {
    grupos.push({
      nidoId: NIDO_INBOX_ID,
      titulo: NIDO_INBOX_LABEL,
      items: inbox.sort((a, b) => b.reservadaAt - a.reservadaAt),
    });
  }

  for (const [nidoId, list] of Array.from(byNido.entries())) {
    if (!list.length) continue;
    const p = proyectosById.get(nidoId);
    grupos.push({
      nidoId,
      titulo: p?.titulo ?? "Proyecto",
      etiqueta: p?.etiqueta,
      color: p?.color,
      items: list.sort((a: SituacionReservaItem, b: SituacionReservaItem) => b.reservadaAt - a.reservadaAt),
    });
  }

  return grupos.sort((a, b) => {
    if (a.nidoId === NIDO_INBOX_ID) return 1;
    if (b.nidoId === NIDO_INBOX_ID) return -1;
    return b.items.length - a.items.length;
  });
}

/** Items del nido listos para el desglosador (excluye solo consideración). */
export function imanItemsParaDesglosador(items: SituacionReservaItem[]): SituacionReservaItem[] {
  return items.filter(i => (i.ruta ?? "ejecucion") !== "consideracion");
}

export function subTareaFromImanItem(item: SituacionReservaItem, idSuffix?: string): SubTarea {
  const suffix = idSuffix ?? `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
  return {
    id: `st_${suffix}`,
    texto: item.texto,
    completada: false,
    creadaAt: Date.now(),
    ...(item.proyectoId ? { proyectoId: item.proyectoId } : {}),
    ...(item.id ? { origenImanId: item.id } : {}),
    ...(item.rutaSeguimientoPaso ? { rutaSeguimientoPaso: item.rutaSeguimientoPaso } : {}),
    ...(item.minutosCupo != null && item.minutosCupo > 0 ? { minutosCupo: item.minutosCupo } : {}),
    ...(item.detalles?.length
      ? {
          detalles: item.detalles.map(d => ({
            ...d,
            id: `dt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          })),
        }
      : {}),
  };
}

/** Al cumplir sub con proyecto: incrementa correlativo y marca la reserva del imán. */
export async function registrarPasoDesdeSubIman(
  userId: string,
  sub: Pick<SubTarea, "proyectoId" | "origenImanId">
): Promise<number | null> {
  if (!sub.proyectoId?.trim()) return null;
  const result = await registrarPasoEjecutadoEnProyecto(userId, sub.proyectoId);
  if (!result) return null;
  if (sub.origenImanId) {
    await markImanReservaEjecutada(userId, sub.origenImanId, result.pasoNumero);
  }
  return result.pasoNumero;
}

export function subTareaConPasoEjecutado(subTareas: SubTarea[], subTareaId: string, pasoNumero: number): SubTarea[] {
  return subTareas.map(st => (st.id === subTareaId ? { ...st, pasoEjecutadoNumero: pasoNumero } : st));
}
