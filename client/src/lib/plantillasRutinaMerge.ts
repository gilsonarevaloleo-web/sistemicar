export type PlantillaRutinaMerge = {
  id: string;
  creadaAt: unknown;
};

export function plantillaCreadaAtMs(creadaAt: unknown): number {
  if (!creadaAt) return 0;
  if (typeof creadaAt === "string") return new Date(creadaAt).getTime() || 0;
  if (typeof creadaAt === "number") return creadaAt;
  if (typeof creadaAt === "object" && creadaAt !== null && "seconds" in creadaAt) {
    return (creadaAt as { seconds: number }).seconds * 1000;
  }
  if (creadaAt instanceof Date) return creadaAt.getTime();
  return 0;
}

/** Merge local-first: conserva entradas locales m�s recientes o ausentes en Firebase. */
export function mergePlantillasRutina<T extends PlantillaRutinaMerge>(local: T[], remote: T[]): T[] {
  const byId = new Map<string, T>();
  for (const r of remote) byId.set(r.id, r);
  for (const l of local) {
    const existing = byId.get(l.id);
    if (!existing || plantillaCreadaAtMs(l.creadaAt) >= plantillaCreadaAtMs(existing.creadaAt)) {
      byId.set(l.id, l);
    }
  }
  return Array.from(byId.values()).sort(
    (a, b) => plantillaCreadaAtMs(b.creadaAt) - plantillaCreadaAtMs(a.creadaAt)
  );
}
