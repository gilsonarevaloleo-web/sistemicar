import { deliverPuertaVoice } from "./backgroundAttentionAlerts";
import { isPuertaVozEnabled } from "./tikSound";
import { getJournalDateString } from "./segmentTime";

const ORDINALES_PUERTA: Record<number, string> = {
  1: "primera",
  2: "segunda",
  3: "tercera",
  4: "cuarta",
  5: "quinta",
  6: "sexta",
  7: "séptima",
  8: "octava",
  9: "novena",
  10: "décima",
  11: "undécima",
  12: "duodécima",
};

function ordinalPuertaFem(n: number): string {
  return ORDINALES_PUERTA[n] ?? `${n}.ª`;
}

/** «Tercera puerta de 8 del día» — ubicación en el escalamiento diario. */
export function buildPuertaEscalamientoLabel(ordinal: number, total: number): string {
  if (total <= 1) return "Única puerta del día";
  return `${ordinalPuertaFem(ordinal)} puerta de ${total} del día`;
}

export type PuertaVozPreventionKind =
  | "recordatorio_apertura"
  | "puerta_cierra"
  | "cierre_intencion"
  | "entropia_inminente"
  | "puerta_perdida_sistema";

export function buildPuertaVozPreventionPhrase(params: {
  nombre: string;
  ordinal: number;
  total: number;
  kind: PuertaVozPreventionKind;
}): string {
  const ctx = buildPuertaEscalamientoLabel(params.ordinal, params.total);
  const { nombre, kind } = params;

  switch (kind) {
    case "recordatorio_apertura":
      return `${ctx}. ${nombre}. Abre la puerta de atención ahora, operador. Te queda un minuto en la ventana consciente.`;
    case "puerta_cierra":
      return `${ctx}. ${nombre}. La ventana de apertura cierra pronto. Abre atención consciente ya o caerás en entropía.`;
    case "cierre_intencion":
      return `${ctx}. ${nombre}. Cierra este segmento con intención. Estás en la ventana de cierre consciente.`;
    case "entropia_inminente":
      return `${ctx}. ${nombre}. Entropía inminente. Cierra ahora o pierdes los puntos del segmento.`;
    case "puerta_perdida_sistema":
      return `${ctx}. ${nombre}. Puerta abierta por el sistema. Marca cierre consciente para recuperar soberanía.`;
    default:
      return `${ctx}. ${nombre}.`;
  }
}

/** Voz del minuto 4 — escalamiento + prevención de apertura. */
export function buildPuertaVozPhrase(params: {
  nombre: string;
  ordinal: number;
  total: number;
}): string {
  return buildPuertaVozPreventionPhrase({
    ...params,
    kind: "recordatorio_apertura",
  });
}

export function speakPuertaSegmento(params: {
  nombre: string;
  ordinal: number;
  total: number;
}): void {
  if (!isPuertaVozEnabled()) return;
  const phrase = buildPuertaVozPhrase(params);
  deliverPuertaVoice(phrase, {
    source: "puerta",
    notifyTitle: `Puerta ${params.ordinal}/${params.total}: ${params.nombre}`,
    notifyBody: phrase,
    notifyTag: `puerta-live-${params.nombre}`,
  });
}

const CRUCE_GRACE_VOZ_PREFIX = "sistemicar_cruce_grace_voz_";

function cruceGraceVozKey(activeSegId: string): string {
  return `${CRUCE_GRACE_VOZ_PREFIX}${getJournalDateString()}_${activeSegId}`;
}

export function wasCruceGraceEndVoicePlayed(activeSegId: string): boolean {
  try {
    return sessionStorage.getItem(cruceGraceVozKey(activeSegId)) != null;
  } catch {
    return false;
  }
}

export function markCruceGraceEndVoicePlayed(activeSegId: string): void {
  try {
    sessionStorage.setItem(cruceGraceVozKey(activeSegId), String(Date.now()));
  } catch {
    /* noop */
  }
}

export function speakEntropiaAtencionCruce(activeSegId?: string): void {
  if (!isPuertaVozEnabled()) return;
  if (activeSegId) {
    if (wasCruceGraceEndVoicePlayed(activeSegId)) return;
    markCruceGraceEndVoicePlayed(activeSegId);
  }
  const phrase = "Cierre por entropía-atención. Ordena tu jornada, operador.";
  deliverPuertaVoice(phrase, {
    source: "puerta",
    notifyTitle: "Entropía-atención",
    notifyBody: "Cierra el vehículo del segmento anterior y abre otro en esta zona.",
    notifyTag: "entropia-cruce-live",
  });
}

/** Identifica frases de puerta por segmento (cola en segundo plano). */
export function missedPuertaVoiceMatchesSegment(text: string, nombre: string): boolean {
  if (!text.includes(nombre)) return false;
  return (
    text.includes("Abre la puerta de atención") ||
    text.includes("ventana de apertura cierra") ||
    text.includes("Cierra este segmento con intención") ||
    text.includes("Entropía inminente") ||
    text.includes("Puerta abierta por el sistema") ||
    text.includes("puerta de ") // escalamiento label
  );
}
