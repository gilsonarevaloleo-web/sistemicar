import { deliverPuertaVoice, enqueueMissedPuertaVoice, isAppInBackground } from "./backgroundAttentionAlerts";
import { buildPuertaVozPhrase } from "./puertaAtencionVoice";
import { CRUCE_GRACE_MIN, CRUCE_WARNING_MIN, getCruceGraceEndMs } from "./segmentCrossEntropyEngine";
import type { SegmentoV5, Vehicle } from "./persistence";
import {
  getPuertaWindowMs,
  getVozDisparoMs,
  PUERTA_MARGIN_MIN,
  segmentOrdinalIndex,
} from "./segmentAttentionEngine";
import { getLimaDayStartMs, segmentClockMs } from "./segmentTime";
import { isPuertaVozEnabled } from "./tikSound";

const scheduledTimers: ReturnType<typeof setTimeout>[] = [];
const MAX_SCHEDULE_MS = 24 * 3600_000;

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

function scheduleAt(msFromNow: number, fn: () => void): void {
  if (msFromNow <= 0 || msFromNow > MAX_SCHEDULE_MS) return;
  scheduledTimers.push(setTimeout(fn, msFromNow));
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

export function scheduleCrossEntropyNotifications(segmentos: SegmentoV5[], vehicles: Vehicle[]): void {
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const dayStart = getLimaDayStartMs();
  const activeSeg = segmentos.find(s => s.estado === "activo");
  if (!activeSeg) return;

  const segmentStartMs = segmentClockMs(activeSeg.horaInicio, dayStart);
  const warningMs = segmentStartMs + CRUCE_WARNING_MIN * 60000;
  const graceEndMs = getCruceGraceEndMs(activeSeg.horaInicio, dayStart);
  const crossing = vehicles.filter(
    v =>
      v.status === "activo" &&
      !v.autoVerdad &&
      v.tipoFlota !== "descanso" &&
      v.segmentoId &&
      v.segmentoId !== activeSeg.id
  );

  const msUntilWarning = warningMs - Date.now();
  scheduleAt(msUntilWarning, () => {
    showScheduledNotification({
      title: `Cruce de segmento: ${activeSeg.nombre}`,
      body:
        crossing.length > 0
          ? `${crossing.length} vehículo(s) del segmento anterior. Cierra y abre otro en ~${CRUCE_GRACE_MIN - CRUCE_WARNING_MIN} min.`
          : "Si arrastras vehículos del segmento anterior, ciérralos y abre otro en esta zona.",
      tag: `cruce-warn-${activeSeg.id}`,
      voicePhrase: `Segmento ${activeSeg.nombre}. Cierra vehículos del bloque anterior y abre otro en esta zona.`,
    });
  });

  const msUntilGraceEnd = graceEndMs - Date.now();
  scheduleAt(msUntilGraceEnd, () => {
    showScheduledNotification({
      title: `Cierre automático: ${activeSeg.nombre}`,
      body: "Gracia agotada. Los vehículos del segmento anterior se archivan por entropía-atención.",
      tag: `cruce-close-${activeSeg.id}`,
      voicePhrase: "Cierre por entropía-atención. Ordena tu jornada, operador.",
    });
  });
}

export function scheduleSegmentNotifications(segmentos: SegmentoV5[]): void {
  cancelAllNotifications();
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  const dayStart = getLimaDayStartMs();
  const total = segmentos.length;

  segmentos.forEach((seg, idx) => {
    const ordinal = segmentOrdinalIndex(segmentos, seg.id) || idx + 1;

    if (seg.estado === "pendiente") {
      const msUntilStart = timeStringToMs(seg.horaInicio);
      if (msUntilStart > 0) {
        scheduleAt(msUntilStart, () => {
          showScheduledNotification({
            title: `Segmento: ${seg.nombre}`,
            body: `${seg.horaInicio} — ${seg.horaFin ?? "sin fin"}`,
            tag: `seg-start-${seg.id}`,
          });
        });
      }

      if (seg.vozDisparadaAt == null) {
        const vozMs = getVozDisparoMs(seg.horaInicio, dayStart);
        const msUntilVoz = vozMs - Date.now();
        const phrase = buildPuertaVozPhrase({ nombre: seg.nombre, ordinal, total });
        scheduleAt(msUntilVoz, () => {
          showScheduledNotification({
            title: `Puerta de atención: ${seg.nombre}`,
            body: phrase,
            tag: `seg-voz-${seg.id}`,
            voicePhrase: phrase,
          });
        });
      }

      const { windowEndMs } = getPuertaWindowMs(seg.horaInicio, dayStart);
      const msUntilPuertaEnd = windowEndMs - Date.now();
      scheduleAt(msUntilPuertaEnd, () => {
        showScheduledNotification({
          title: `Puerta cierra: ${seg.nombre}`,
          body: "Si no abriste la puerta en ±5 min, el segmento puede caer en entropía.",
          tag: `seg-puerta-end-${seg.id}`,
          voicePhrase: `Puerta de ${seg.nombre} cerrada. Abre atención consciente o caerás en entropía.`,
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
      scheduleAt(msUntilCierre, () => {
        showScheduledNotification({
          title: `Cierra con intención: ${seg.nombre}`,
          body: `Ventana de cierre ±${PUERTA_MARGIN_MIN} min de ${seg.horaFin}. +2 PS si cierras a tiempo.`,
          tag: `seg-cierre-${seg.id}`,
          voicePhrase: `Cierra ${seg.nombre} con intención. Estás en la ventana de cierre.`,
        });
      });

      const msUntilEntropia = endAnchor + PUERTA_MARGIN_MIN * 60000 - Date.now();
      scheduleAt(msUntilEntropia, () => {
        showScheduledNotification({
          title: `Último aviso: ${seg.nombre}`,
          body: "Si no cerraste, el segmento pasará a entropía automáticamente.",
          tag: `seg-entropia-${seg.id}`,
          voicePhrase: `Entropía inminente en ${seg.nombre}. Cierra ahora o pierdes los puntos.`,
        });
      });
    }
  });
}

export function cancelAllNotifications(): void {
  scheduledTimers.forEach((t) => clearTimeout(t));
  scheduledTimers.length = 0;
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
  scheduledTimers.push(timer);
}
