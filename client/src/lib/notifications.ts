import { SegmentoV5 } from "./persistence";

const scheduledTimers: ReturnType<typeof setTimeout>[] = [];

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

export function scheduleSegmentNotifications(segmentos: SegmentoV5[]): void {
  cancelAllNotifications();
  if (!("Notification" in window) || Notification.permission !== "granted") return;

  segmentos.forEach((seg) => {
    if (seg.estado !== "pendiente") return;
    const msUntilStart = timeStringToMs(seg.horaInicio);
    if (msUntilStart < 0) return;

    const timer = setTimeout(() => {
      try {
        new Notification(`Segmento: ${seg.nombre}`, {
          body: `${seg.horaInicio} — ${seg.horaFin}`,
          icon: "/favicon.ico",
          tag: `seg-${seg.id}`,
        });
      } catch { }
    }, msUntilStart);
    scheduledTimers.push(timer);
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
