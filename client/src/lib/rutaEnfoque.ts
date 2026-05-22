/** Banda de la ruta de enfoque (cuenta atr�s por unidades restantes). */
export type RutaBandaId = "fluido" | "concentrado" | "limite";

export interface RutaEnfoqueUmbrales {
  fluido: number;
  concentrado: number;
}

export interface RutaCruzadaSnapshot {
  fluido: boolean;
  concentrado: boolean;
  limite: boolean;
}

export interface RutaEnfoqueState {
  activa: boolean;
  N: number;
  umbrales: RutaEnfoqueUmbrales;
  cruzado: RutaCruzadaSnapshot;
}

export const RUTA_BANDA_META: Record<RutaBandaId, { label: string; icon: string; color: string }> = {
  fluido: { label: "Fluido", icon: "?", color: "#94a3b8" },
  concentrado: { label: "Concentrado", icon: "?", color: "#a78bfa" },
  limite: { label: "Al l�mite", icon: "?", color: "#f87171" },
};

/** Umbrales enteros: fluido = ceil(N/2), concentrado = ceil(N/4). */
export function computeRutaUmbrales(N: number): RutaEnfoqueUmbrales {
  const n = Math.max(1, Math.floor(N));
  return {
    fluido: Math.ceil(n / 2),
    concentrado: Math.ceil(n / 4),
  };
}

export function createRutaEnfoqueState(N: number): RutaEnfoqueState {
  const n = Math.max(1, Math.floor(N));
  return {
    activa: true,
    N: n,
    umbrales: computeRutaUmbrales(n),
    cruzado: { fluido: true, concentrado: false, limite: false },
  };
}

/** Banda actual seg�n unidades restantes (enteras). */
export function getRutaBandaActual(restantes: number, umbrales: RutaEnfoqueUmbrales): RutaBandaId {
  const r = Math.max(0, Math.floor(restantes));
  if (r > umbrales.fluido) return "fluido";
  if (r > umbrales.concentrado) return "concentrado";
  return "limite";
}

export type RutaUmbralAlert = "concentrado" | "limite";

/** Actualiza `cruzado` al bajar restantes; devuelve aviso si se cruza umbral por primera vez. */
export function applyRutaThresholdCrossing(
  ruta: RutaEnfoqueState,
  restantes: number,
  prevRestantes: number | null
): { ruta: RutaEnfoqueState; alert?: RutaUmbralAlert } {
  const curr = Math.max(0, Math.floor(restantes));
  const prev = prevRestantes == null ? null : Math.max(0, Math.floor(prevRestantes));
  const { umbrales, cruzado } = ruta;
  let alert: RutaUmbralAlert | undefined;
  const nextCruzado = { ...cruzado };

  if (!cruzado.concentrado && curr <= umbrales.fluido && (prev === null || prev > umbrales.fluido)) {
    nextCruzado.concentrado = true;
    alert = "concentrado";
  }
  if (!cruzado.limite && curr <= umbrales.concentrado && (prev === null || prev > umbrales.concentrado)) {
    nextCruzado.limite = true;
    alert = "limite";
  }

  if (alert === undefined && nextCruzado.concentrado === cruzado.concentrado && nextCruzado.limite === cruzado.limite) {
    return { ruta };
  }
  return { ruta: { ...ruta, cruzado: nextCruzado }, alert };
}

export function mergeRutaCruzadaFromSubs(
  subs: { rutaEnfoque?: RutaEnfoqueState }[]
): RutaCruzadaSnapshot | null {
  const withRuta = subs.filter(s => s.rutaEnfoque?.activa);
  if (withRuta.length === 0) return null;
  return {
    fluido: withRuta.some(s => s.rutaEnfoque!.cruzado.fluido),
    concentrado: withRuta.some(s => s.rutaEnfoque!.cruzado.concentrado),
    limite: withRuta.some(s => s.rutaEnfoque!.cruzado.limite),
  };
}

/** PS ruta: 0 / 2 / 5 / 8 seg�n bandas declaradas coherentes con lo cruzado autom�ticamente. */
export function computeRutaEnfoquePS(
  declarada: RutaBandaId[],
  cruzada: RutaCruzadaSnapshot
): number {
  const bandasValidas = declarada.filter(b => cruzada[b]).length;
  if (bandasValidas === 0) return 0;
  if (bandasValidas === 1) return 2;
  if (bandasValidas === 2) return 5;
  return 8;
}

/** Suma PS de ruta por subvehículo (cada sub declara sus bandas). */
export function computeRutaEnfoquePSFromSubs(
  subs: { rutaEnfoque?: RutaEnfoqueState; rutaDeclarada?: RutaBandaId[] }[]
): number {
  return subs.reduce((sum, s) => {
    if (!s.rutaEnfoque?.activa || !s.rutaDeclarada?.length) return sum;
    return sum + computeRutaEnfoquePS(s.rutaDeclarada, s.rutaEnfoque.cruzado);
  }, 0);
}

export function formatRutaPreview(N: number): string {
  const u = computeRutaUmbrales(N);
  return `${N} ? ${u.fluido} ? | ${u.fluido} ? ${u.concentrado} ? | ${u.concentrado} ? 0 ?`;
}
