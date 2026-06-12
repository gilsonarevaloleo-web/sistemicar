import { deliverPuertaVoice, enqueueMissedPuertaVoice, isAppInBackground } from "./backgroundAttentionAlerts";
import { findSegmentInNotificationState, readNotificationState } from "./notificationState";
import { buildPuertaVozPhrase, speakEntropiaAtencionCruce } from "./puertaAtencionVoice";
import {
  CRUCE_GRACE_MIN,
  CRUCE_WARNING_MIN,
  getCruceGraceEndMs,
  getCrossingVehiclesState,
} from "./segmentCrossEntropyEngine";
import type { SegmentoV5, Vehicle } from "./persistence";
import {
  getPuertaWindowMs,
  getVozDisparoMs,
  PUERTA_MARGIN_MIN,
  segmentOrdinalIndex,
} from "./segmentAttentionEngine";
import { getLimaDayStartMs, segmentClockMs } from "./segmentTime";
import { isPuertaVozEnabled } from "./tikSound";

const segmentTimers: ReturnType<typeof setTimeout>[] = [];
const crossEntropyTimers: ReturnType<typeof setTimeout>[] = [];
const MAX_SCHEDULE_MS = 24 * 3600_000;

function findSegment(segId: string) {
  return findSegmentInNotificationState(segId);
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (!("Notification" in window)) return false;
  if (Notification.permission === "granted") return true;
  if (Notification.permission === "denied") return false;
  const result = await Notification.requestPermission();
  return result === "granted";
}

export function getNotificationPermission(): NotificationPermission | "unsupported" {
  if (!("Notification" in window)) return "unsupported";
  return Notification.permission;
}

function timeStringToMs(horaInicio: string): number {
  const [h, m] = horaInicio.split(":").map(Number);
  const now = new Date();
  const target = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
  return target.getTime() - Date.now();
}

function scheduleIn(
  bucket: ReturnType<typeof setTimeout>[],
  msFromNow: number,
  fn: () => void
): void {
  if (msFromNow <= 0 || msFromNow > MAX_SCHEDULE_MS) return;
  bucket.push(setTimeout(fn, msFromNow));
}

function showScheduledNotification(opts: {
  title: string;
  body: string;
  tag: string;
  voicePhrase?: string;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: "/favicon.ico",
      tag: opts.tag,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = "/planeacion";
      n.close();
    };
  } catch {
    /* noop */
  }
  if (opts.voicePhrase && isPuertaVozEnabled()) {
    if (isAppInBackground()) {
      enqueueMissedPuertaVoice(opts.voicePhrase, "puerta");
    } else {
      deliverPuertaVoice(opts.voicePhrase, {
        source: "puerta",
        notifyTitle: opts.title,
        notifyBody: opts.body,
        notifyTag: opts.tag,
      });
    }
  }
}

export function cancelCrossEntropyNotifications(): void {
  crossEntropyTimers.forEach(t => clearTimeout(t));
  crossEntropyTimers.length = 0;
}

export function scheduleCrossEntropyNotifications(segmentos: SegmentoV5[], _vehicles: Vehicle[]): void {
  cancelCrossEntropyNotifications();
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const dayStart = getLimaDayStartMs();
  const activeSeg = segmentos.find(s => s.estado === "activo");
  if (!activeSeg) return;

  const activeSegId = activeSeg.id;
  const segmentStartMs = segmentClockMs(activeSeg.horaInicio, dayStart);
  const warningMs = segmentStartMs + CRUCE_WARNING_MIN * 60000;
  const graceEndMs = getCruceGraceEndMs(activeSeg.horaInicio, dayStart);

  const msUntilWarning = warningMs - Date.now();
  scheduleIn(crossEntropyTimers, msUntilWarning, () => {
    const state = readNotificationState();
    if (!state) return;
    const ctx = getCrossingVehiclesState(state.segmentos, state.vehicles, dayStart);
    if (!ctx || ctx.activeSegment.id !== activeSegId) return;

    showScheduledNotification({
      title: `Cruce de segmento: ${ctx.activeSegment.nombre}`,
      body: `${ctx.crossing.length} vehículo(s) del segmento anterior. Cierra y abre otro en ~${CRUCE_GRACE_MIN - CRUCE_WARNING_MIN} min.`,
      tag: `cruce-warn-${activeSegId}`,
      voicePhrase: `Segmento ${ctx.activeSegment.nombre}. Cierra vehículos del bloque anterior y abre otro en esta zona.`,
    });
  });

  const msUntilGraceEnd = graceEndMs - Date.now();
  scheduleIn(crossEntropyTimers, msUntilGraceEnd, () => {
    const state = readNotificationState();
    if (!state) return;
    const ctx = getCrossingVehiclesState(state.segmentos, state.vehicles, dayStart);
    if (!ctx || ctx.activeSegment.id !== activeSegId) return;

    showScheduledNotification({
      title: `Cierre automático: ${ctx.activeSegment.nombre}`,
      body: "Gracia agotada. Los vehículos del segmento anterior se archivan por entropía-atención.",
      tag: `cruce-close-${activeSegId}`,
    });
    speakEntropiaAtencionCruce(activeSegId);
  });
}

export function scheduleSegmentNotifications(segmentos: SegmentoV5[]): void {
  cancelAllNotifications();
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const dayStart = getLimaDayStartMs();
  const total = segmentos.length;

  segmentos.forEach((seg, idx) => {
    const ordinal = segmentOrdinalIndex(segmentos, seg.id) || idx + 1;
    const segId = seg.id;

    if (seg.estado === "pendiente") {
      const msUntilStart = timeStringToMs(seg.horaInicio);
      if (msUntilStart > 0) {
        scheduleIn(segmentTimers, msUntilStart, () => {
          const segNow = findSegment(segId);
          if (!segNow || segNow.estado !== "pendiente") return;
          showScheduledNotification({
            title: `Segmento: ${segNow.nombre}`,
            body: `${segNow.horaInicio} — ${segNow.horaFin ?? "sin fin"}`,
            tag: `seg-start-${segId}`,
          });
        });
      }

      if (seg.vozDisparadaAt == null) {
        const vozMs = getVozDisparoMs(seg.horaInicio, dayStart);
        const msUntilVoz = vozMs - Date.now();
        const phrase = buildPuertaVozPhrase({ nombre: seg.nombre, ordinal, total });
        scheduleIn(segmentTimers, msUntilVoz, () => {
          const segNow = findSegment(segId);
          if (!segNow || segNow.estado !== "pendiente" || segNow.vozDisparadaAt != null) return;
          showScheduledNotification({
            title: `Puerta de atención: ${segNow.nombre}`,
            body: phrase,
            tag: `seg-voz-${segId}`,
            voicePhrase: phrase,
          });
        });
      }

      const { windowEndMs } = getPuertaWindowMs(seg.horaInicio, dayStart);
      const msUntilPuertaEnd = windowEndMs - Date.now();
      scheduleIn(segmentTimers, msUntilPuertaEnd, () => {
        const segNow = findSegment(segId);
        if (!segNow || segNow.estado !== "pendiente") return;
        showScheduledNotification({
          title: `Puerta cierra: ${segNow.nombre}`,
          body: "Si no abriste la puerta en ±5 min, el segmento puede caer en entropía.",
          tag: `seg-puerta-end-${segId}`,
          voicePhrase: `Puerta de ${segNow.nombre} cerrada. Abre atención consciente o caerás en entropía.`,
        });
      });
    }

    if ((seg.estado === "pendiente" || seg.estado === "activo") && seg.horaFin) {
      const finMs = segmentClockMs(seg.horaFin, dayStart);
      let endAnchor = finMs;
      if (endAnchor <= segmentClockMs(seg.horaInicio, dayStart)) {
        endAnchor += 24 * 3600_000;
      }
      const cierreMs = endAnchor - PUERTA_MARGIN_MIN * 60000;
      const msUntilCierre = cierreMs - Date.now();
      scheduleIn(segmentTimers, msUntilCierre, () => {
        const segNow = findSegment(segId);
        if (!segNow || segNow.estado !== "activo") return;
        showScheduledNotification({
          title: `Cierra con intención: ${segNow.nombre}`,
          body: `Ventana de cierre ±${PUERTA_MARGIN_MIN} min de ${segNow.horaFin}. +2 PS si cierras a tiempo.`,
          tag: `seg-cierre-${segId}`,
          voicePhrase: `Cierra ${segNow.nombre} con intención. Estás en la ventana de cierre.`,
        });
      });

      const msUntilEntropia = endAnchor + PUERTA_MARGIN_MIN * 60000 - Date.now();
      scheduleIn(segmentTimers, msUntilEntropia, () => {
        const segNow = findSegment(segId);
        if (!segNow || segNow.estado === "entropia" || segNow.estado === "cerrado_manual") return;
        showScheduledNotification({
          title: `Último aviso: ${segNow.nombre}`,
          body: "Si no cerraste, el segmento pasará a entropía automáticamente.",
          tag: `seg-entropia-${segId}`,
          voicePhrase: `Entropía inminente en ${segNow.nombre}. Cierra ahora o pierdes los puntos.`,
        });
      });
    }
  });
}

export function cancelAllNotifications(): void {
  segmentTimers.forEach(t => clearTimeout(t));
  segmentTimers.length = 0;
  cancelCrossEntropyNotifications();
}

/** Alerta situacional — siempre que haya permiso (también con pestaña visible). */
export function notifySituacionAlert(opts: {
  title: string;
  body: string;
  tag: string;
  requireInteraction?: boolean;
  vehicleId?: string;
}): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  try {
    const n = new Notification(opts.title, {
      body: opts.body,
      icon: "/favicon.ico",
      tag: opts.tag,
      requireInteraction: opts.requireInteraction ?? false,
    });
    n.onclick = () => {
      window.focus();
      window.location.href = opts.vehicleId ? `/planeacion?vehicle=${opts.vehicleId}` : "/planeacion";
      n.close();
    };
  } catch {
    /* noop */
  }
}

export function scheduleEspejoFollowup(habitoTitulo: string): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;
  const VEINTICUATRO_HORAS = 24 * 60 * 60 * 1000;
  const timer = setTimeout(() => {
    try {
      const titulo = habitoTitulo ? `Doctor IA — Revisa tu señal: ${habitoTitulo.substring(0, 50)}` : "Doctor IA — Revisa tu señal";
      const n = new Notification(titulo, {
        body: habitoTitulo ? `Protocolo activo: ${habitoTitulo}` : "Tu protocolo de calibración sigue en espera.",
        icon: "/favicon.ico",
        tag: "espejo-followup",
      });
      n.onclick = () => {
        window.focus();
        window.location.href = "/planeacion";
      };
    } catch { }
  }, VEINTICUATRO_HORAS);
  segmentTimers.push(timer);
}
