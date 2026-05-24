import { notifySituacionAlert } from "./notifications";
import {
  playSituacion2MinBell,
  playSituacionCupoSiren,
  vibrateSituacion2Min,
  vibrateSituacionCupo,
} from "./situacionAlertSounds";
import { isSituacionAlertsEnabled } from "./tikSound";
import { speakUbicacionSingle } from "./speechQueue";

function trimSubText(text: string, max = 48): string {
  const t = text.trim();
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export function fireSituacion2MinAlert(params: {
  vehicleId: string;
  vehicleTitulo: string;
  subTexto: string;
  tagKey: string;
}): void {
  if (!isSituacionAlertsEnabled()) return;
  const fila = trimSubText(params.subTexto);
  void playSituacion2MinBell();
  vibrateSituacion2Min();
  notifySituacionAlert({
    title: `? 2 min · ${params.vehicleTitulo}`,
    body: `Quedan 2 minutos para la fila: «${fila}». Prepárate.`,
    tag: `situacion-2m-${params.vehicleId}-${params.tagKey}`,
    vehicleId: params.vehicleId,
  });
  speakUbicacionSingle(`Dos minutos para la fila: ${fila}`);
}

export function fireSituacionCupoAlert(params: {
  vehicleId: string;
  vehicleTitulo: string;
  subTexto: string;
  tagKey: string;
  escalation?: boolean;
}): void {
  if (!isSituacionAlertsEnabled()) return;
  const fila = trimSubText(params.subTexto);
  void playSituacionCupoSiren();
  vibrateSituacionCupo();
  notifySituacionAlert({
    title: params.escalation ? `?? Cupo · ${params.vehicleTitulo} (recordatorio)` : `?? Cupo · ${params.vehicleTitulo}`,
    body: params.escalation
      ? `Aún pendiente: «${fila}». Marca Cumplido o Incumplido.`
      : `Cupo alcanzado en «${fila}». Marca Cumplido o Incumplido.`,
    tag: `situacion-cupo-${params.vehicleId}-${params.tagKey}${params.escalation ? "-esc" : ""}`,
    requireInteraction: !params.escalation,
    vehicleId: params.vehicleId,
  });
  if (!params.escalation) {
    speakUbicacionSingle(`Cupo alcanzado. Marca cumplido o incumplido en ${fila}`);
  }
}

export const SITUACION_CUPO_ESCALATION_MS = 60_000;
export const SITUACION_CUPO_ESCALATION_MAX = 5;
