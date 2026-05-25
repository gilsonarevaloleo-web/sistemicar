/** Utilidades de horario para segmentos del d�a (zona Lima, ventanas que cruzan medianoche). */

export const MAX_SEGMENT_DURATION_MIN = 24 * 60;

export function parseSegmentTime(t: string): { h: number; m: number } | null {
  const match = (t || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const h = parseInt(match[1], 10);
  const m = parseInt(match[2], 10);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return { h, m };
}

export function segmentTimeToMinutes(t: string): number {
  const parsed = parseSegmentTime(t);
  if (!parsed) return 0;
  return parsed.h * 60 + parsed.m;
}

/** Inicio del d�a calendario Lima (UTC-5) en ms. */
export function getLimaDayStartMs(fromMs: number = Date.now()): number {
  const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000;
  const nowLima = new Date(fromMs + LIMA_OFFSET_MS);
  const msSinceMidnight =
    nowLima.getUTCHours() * 3600000 +
    nowLima.getUTCMinutes() * 60000 +
    nowLima.getUTCSeconds() * 1000 +
    nowLima.getUTCMilliseconds();
  return fromMs - msSinceMidnight;
}

/** Inicio del día-jornada (después de dormir). Por defecto 05:00 Lima. */
export const JOURNAL_DAY_START = "05:00";

export function getJournalDayStartMs(fromMs: number = Date.now()): number {
  const calDayStart = getLimaDayStartMs(fromMs);
  const fiveAm = segmentClockMs(JOURNAL_DAY_START, calDayStart);
  if (fromMs >= fiveAm) return fiveAm;
  return fiveAm - 86400000;
}

/** Fecha YYYY-MM-DD del día-jornada (cambia a las 05:00, no a medianoche). */
export function getJournalDateString(fromMs: number = Date.now()): string {
  const LIMA_OFFSET_MS = -5 * 60 * 60 * 1000;
  const lima = new Date(getJournalDayStartMs(fromMs) + LIMA_OFFSET_MS);
  const y = lima.getUTCFullYear();
  const mo = String(lima.getUTCMonth() + 1).padStart(2, "0");
  const d = String(lima.getUTCDate()).padStart(2, "0");
  return `${y}-${mo}-${d}`;
}

export function isPastJournalDayStart(nowMs: number = Date.now()): boolean {
  const calDayStart = getLimaDayStartMs(nowMs);
  return nowMs >= segmentClockMs(JOURNAL_DAY_START, calDayStart);
}

/** Próxima medianoche Lima (inicio del siguiente día calendario). */
export function getNextLimaMidnightMs(fromMs: number = Date.now()): number {
  return getLimaDayStartMs(fromMs) + 86400000;
}

/** Próximo inicio de día-jornada (05:00 Lima). */
export function getNextJournalDayStartMs(fromMs: number = Date.now()): number {
  return getJournalDayStartMs(fromMs) + 86400000;
}

export function segmentClockMs(hora: string, dayStartMs: number): number {
  const parsed = parseSegmentTime(hora);
  if (!parsed) return dayStartMs;
  return dayStartMs + (parsed.h * 60 + parsed.m) * 60000;
}

/** Ventana [inicio, fin] del segmento dentro del d�a planificado (fin puede ser al d�a siguiente). */
export function segmentWindowMs(
  horaInicio: string,
  horaFin: string,
  dayStartMs: number
): { start: number; end: number; durationMin: number } {
  const start = segmentClockMs(horaInicio, dayStartMs);
  let end = segmentClockMs(horaFin, dayStartMs);
  if (end <= start) {
    end += MAX_SEGMENT_DURATION_MIN * 60000;
  }
  const maxEnd = start + MAX_SEGMENT_DURATION_MIN * 60000;
  if (end > maxEnd) end = maxEnd;
  const durationMin = (end - start) / 60000;
  return { start, end, durationMin };
}

export function segmentDurationMinutes(horaInicio: string, horaFin: string): number {
  return segmentWindowMs(horaInicio, horaFin, getLimaDayStartMs()).durationMin;
}

export function validateSegmentTimes(
  horaInicio: string,
  horaFin: string
): { ok: true; durationMin: number } | { ok: false; error: string } {
  if (!parseSegmentTime(horaInicio) || !parseSegmentTime(horaFin)) {
    return { ok: false, error: "Horario inv�lido (usa HH:mm)" };
  }
  const { durationMin } = segmentWindowMs(horaInicio, horaFin, getLimaDayStartMs());
  if (durationMin < 1) {
    return { ok: false, error: "La duraci�n debe ser al menos 1 minuto" };
  }
  if (durationMin > MAX_SEGMENT_DURATION_MIN) {
    return { ok: false, error: "Un segmento no puede durar m�s de 24 horas" };
  }
  return { ok: true, durationMin };
}

export function isPastSegmentEnd(
  nowMs: number,
  horaInicio: string,
  horaFin: string,
  marginMin = 5,
  dayStartMs?: number
): boolean {
  const dayStart = dayStartMs ?? getLimaDayStartMs(nowMs);
  const { end } = segmentWindowMs(horaInicio, horaFin, dayStart);
  return nowMs >= end + marginMin * 60000;
}

export function isPastSegmentAutoStart(
  nowMs: number,
  horaInicio: string,
  horaFin: string,
  delayMin = 6,
  dayStartMs?: number
): boolean {
  const dayStart = dayStartMs ?? getLimaDayStartMs(nowMs);
  const { start } = segmentWindowMs(horaInicio, horaFin, dayStart);
  return nowMs >= start + delayMin * 60000;
}

export function isWithinSegmentTimeMargin(
  nowMs: number,
  horaInicio: string,
  horaFin: string,
  target: "inicio" | "fin",
  marginMin = 5,
  dayStartMs?: number
): boolean {
  const dayStart = dayStartMs ?? getLimaDayStartMs(nowMs);
  const { start, end } = segmentWindowMs(horaInicio, horaFin, dayStart);
  const targetMs = target === "inicio" ? start : end;
  return Math.abs(nowMs - targetMs) <= marginMin * 60000;
}
