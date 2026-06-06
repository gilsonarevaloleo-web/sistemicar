import { deliverPuertaVoice } from "./backgroundAttentionAlerts";
import { isPuertaVozEnabled } from "./tikSound";

const ORDINALES: Record<number, string> = {
  1: "primer",
  2: "segundo",
  3: "tercer",
  4: "cuarto",
  5: "quinto",
  6: "sexto",
  7: "séptimo",
  8: "octavo",
  9: "noveno",
  10: "décimo",
  11: "undécimo",
  12: "duodécimo",
};

function ordinalEs(n: number): string {
  return ORDINALES[n] ?? `${n}º`;
}

export function buildPuertaVozPhrase(params: {
  nombre: string;
  ordinal: number;
  total: number;
}): string {
  const ord = ordinalEs(params.ordinal);
  const totalLabel = params.total === 1 ? "único segmento" : `${params.total} del día`;
  return `${params.nombre}. ${ord} segmento de ${totalLabel}.`;
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
    notifyTitle: `Puerta: ${params.nombre}`,
    notifyBody: phrase,
    notifyTag: `puerta-live-${params.nombre}`,
  });
}

export function speakEntropiaAtencionCruce(): void {
  if (!isPuertaVozEnabled()) return;
  const phrase = "Cierre por entropía-atención. Ordena tu jornada, operador.";
  deliverPuertaVoice(phrase, {
    source: "puerta",
    notifyTitle: "Entropía-atención",
    notifyBody: "Cierra el vehículo del segmento anterior y abre otro en esta zona.",
    notifyTag: "entropia-cruce-live",
  });
}
