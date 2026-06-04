export type ProyectoEtiqueta = "proyecto" | "centro";
export type RutaMentalId = "a" | "b" | "c";
export type ClaridadProfundidad = "ligera" | "media" | "profunda";

export interface RutaMentalPaso {
  numero: 1 | 2 | 3;
  titulo: string;
}

export interface RutaMental {
  id: RutaMentalId;
  label: string;
  perfil: ClaridadProfundidad;
  pasos: RutaMentalPaso[];
}

export interface RutasMentalesSet {
  rutaActiva: RutaMentalId;
  rutas: Record<RutaMentalId, RutaMental>;
}

export type ClaridadProyectoRef = {
  titulo: string;
  etiqueta: ProyectoEtiqueta;
  claridadActiva?: RutasMentalesSet;
  oleadaTitulo?: string;
};

export type ClaridadPeldanoRef = {
  titulo: string;
  estado: "idea" | "en_curso" | "conquistado";
  origenSegmento?: boolean;
  rutasMentales?: RutasMentalesSet;
};

const PROFUNDIDAD_LABEL: Record<ClaridadProfundidad, string> = {
  ligera: "Claridad ligera",
  media: "Claridad media",
  profunda: "Claridad profunda",
};

function migrateProfundidad(raw: string | undefined): ClaridadProfundidad {
  if (raw === "ligera" || raw === "solo_fluido") return "ligera";
  if (raw === "media" || raw === "fluido_concentrado") return "media";
  if (raw === "profunda" || raw === "secuencia_completa") return "profunda";
  return "ligera";
}

/** Normaliza datos guardados (perfiles biológicos legacy → claridad). */
export function normalizeRutasMentales(rutas: RutasMentalesSet): RutasMentalesSet {
  const rutasNorm = {} as Record<RutaMentalId, RutaMental>;
  for (const id of ["a", "b", "c"] as const) {
    const r = rutas.rutas[id];
    if (!r) continue;
    rutasNorm[id] = {
      ...r,
      perfil: migrateProfundidad(r.perfil as string),
    };
  }
  return { rutaActiva: rutas.rutaActiva, rutas: rutasNorm };
}

function pasosClaridad(
  etiqueta: ProyectoEtiqueta,
  foco: string,
  profundidad: ClaridadProfundidad
): RutaMental["pasos"] {
  const f = foco.trim() || (etiqueta === "centro" ? "Este centro" : "Este proyecto");
  if (etiqueta === "centro") {
    if (profundidad === "ligera") {
      return [
        { numero: 1, titulo: `${f} — qué debo cumplir en este bloque` },
        { numero: 2, titulo: `${f} — qué cierro para no arrastrar deuda` },
        { numero: 3, titulo: `${f} — qué dejo listo para el siguiente turno` },
      ];
    }
    if (profundidad === "media") {
      return [
        { numero: 1, titulo: `${f} — deber concreto del bloque` },
        { numero: 2, titulo: `${f} — entrega mínima exigible` },
        { numero: 3, titulo: `${f} — cierre de deber sin fuga mental` },
      ];
    }
    return [
      { numero: 1, titulo: `${f} — mapa del deber (qué, cuándo, límite)` },
      { numero: 2, titulo: `${f} — entrega verificable del bloque` },
      { numero: 3, titulo: `${f} — handoff: qué queda resuelto` },
    ];
  }
  if (profundidad === "ligera") {
    return [
      { numero: 1, titulo: `${f} — qué quiero tener claro al entrar` },
      { numero: 2, titulo: `${f} — qué avance dejo en este bloque` },
      { numero: 3, titulo: `${f} — cómo cierro mentalmente el bloque` },
    ];
  }
  if (profundidad === "media") {
    return [
      { numero: 1, titulo: `${f} — intención del bloque (por qué ahora)` },
      { numero: 2, titulo: `${f} — entrega visible de este tramo` },
      { numero: 3, titulo: `${f} — siguiente paso de la oleada` },
    ];
  }
  return [
    { numero: 1, titulo: `${f} — visión del tramo (qué construyo)` },
    { numero: 2, titulo: `${f} — entrega que mueve la oleada` },
    { numero: 3, titulo: `${f} — cierre: qué queda conquistado` },
  ];
}

function rutaClaridad(
  id: RutaMentalId,
  profundidad: ClaridadProfundidad,
  etiqueta: ProyectoEtiqueta,
  foco: string
): RutaMental {
  const suf =
    id === "a" ? " · ahora" : id === "b" ? " · tramo medio" : " · horizonte del bloque";
  return {
    id,
    label: `${PROFUNDIDAD_LABEL[profundidad]}${suf}`,
    perfil: profundidad,
    pasos: pasosClaridad(etiqueta, foco, profundidad),
  };
}

/** Dirección de claridad por defecto en el Hub (fuente de verdad). */
export function buildDefaultClaridadDireccion(opts: {
  tituloProyecto: string;
  etiqueta: ProyectoEtiqueta;
  focoTitulo?: string;
  segmentoNombre?: string;
}): RutasMentalesSet {
  const foco =
    opts.focoTitulo?.trim() ||
    opts.segmentoNombre?.trim() ||
    opts.tituloProyecto.trim() ||
    "Bloque";
  const etiqueta = opts.etiqueta;
  return {
    rutaActiva: "a",
    rutas: {
      a: rutaClaridad("a", "ligera", etiqueta, foco),
      b: rutaClaridad("b", "media", etiqueta, foco),
      c: rutaClaridad("c", "profunda", etiqueta, foco),
    },
  };
}

/** Peldaño oleada activa: en_curso no ligado solo a un segmento del día. */
export function getOleadaEnCurso(peldanos: ClaridadPeldanoRef[]): ClaridadPeldanoRef | null {
  const enCurso = peldanos.filter(p => p.estado === "en_curso");
  const oleada = enCurso.find(p => !p.origenSegmento) ?? enCurso[0];
  return oleada ?? null;
}

/** Próxima idea en cola si no hay oleada en curso. */
export function getProximaIdea(peldanos: ClaridadPeldanoRef[]): ClaridadPeldanoRef | null {
  const ideas = peldanos
    .filter(p => p.estado === "idea")
    .sort((a, b) => a.orden - b.orden);
  return ideas[0] ?? null;
}

export function resolveClaridadParaProyecto(
  proyecto: ClaridadProyectoRef | null | undefined,
  peldanos: ClaridadPeldanoRef[],
  segmentoNombre?: string
): RutasMentalesSet | undefined {
  if (!proyecto) return undefined;

  const oleada = getOleadaEnCurso(peldanos);
  const proximaIdea = getProximaIdea(peldanos);
  const focoTitulo =
    proyecto.oleadaTitulo?.trim() ||
    oleada?.titulo ||
    proximaIdea?.titulo ||
    proyecto.titulo;

  if (proyecto.claridadActiva) {
    const base = normalizeRutasMentales(proyecto.claridadActiva);
    if (segmentoNombre?.trim()) {
      return refreshClaridadPaso1(base, segmentoNombre, focoTitulo, proyecto.etiqueta);
    }
    return base;
  }

  if (oleada?.rutasMentales) {
    const base = normalizeRutasMentales(oleada.rutasMentales);
    return segmentoNombre?.trim()
      ? refreshClaridadPaso1(base, segmentoNombre, focoTitulo, proyecto.etiqueta)
      : base;
  }

  return buildDefaultClaridadDireccion({
    tituloProyecto: proyecto.titulo,
    etiqueta: proyecto.etiqueta,
    focoTitulo,
    segmentoNombre,
  });
}

/** Actualiza paso 1 con el bloque del día; conserva pasos 2–3 definidos en el proyecto. */
export function refreshClaridadPaso1(
  rutas: RutasMentalesSet,
  segmentoNombre: string,
  focoTitulo: string | undefined,
  etiqueta: ProyectoEtiqueta
): RutasMentalesSet {
  const foco = focoTitulo?.trim() || segmentoNombre.trim() || "Bloque";
  const rutasOut = { ...rutas.rutas };
  for (const id of ["a", "b", "c"] as const) {
    const r = rutasOut[id];
    if (!r) continue;
    const fresh = pasosClaridad(etiqueta, foco, migrateProfundidad(r.perfil as string));
    rutasOut[id] = {
      ...r,
      pasos: [
        fresh[0],
        r.pasos[1] ?? fresh[1],
        r.pasos[2] ?? fresh[2],
      ],
    };
  }
  return { rutaActiva: rutas.rutaActiva, rutas: rutasOut };
}

/** @deprecated Usar buildDefaultClaridadDireccion */
export function buildDefaultRutasMentales(titulo: string, etiqueta: ProyectoEtiqueta = "proyecto"): RutasMentalesSet {
  return buildDefaultClaridadDireccion({ tituloProyecto: titulo, etiqueta, segmentoNombre: titulo });
}

/** @deprecated Usar refreshClaridadPaso1 */
export function refreshRutasTituloBase(rutas: RutasMentalesSet, titulo: string): RutasMentalesSet {
  return refreshClaridadPaso1(rutas, titulo, titulo, "proyecto");
}
