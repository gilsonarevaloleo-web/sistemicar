/**
 * PS de profundidad por sesión desglosador — curva suave sin explosión exponencial.
 * Hora 1 = 4 PS; hora 2 = 6; hora 3 = 8; luego +1–2 PS/h hasta estabilizar en +1/h.
 */

const DEPTH_AWARD_TABLE: readonly number[] = [4, 6, 8, 9, 10, 11, 12];

/** PS otorgados al completar la hora n (1-based). */
export function depthAwardForHour(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n <= DEPTH_AWARD_TABLE.length) return DEPTH_AWARD_TABLE[n - 1];
  const tail = DEPTH_AWARD_TABLE[DEPTH_AWARD_TABLE.length - 1];
  return tail + (n - DEPTH_AWARD_TABLE.length);
}

/** PS acumulados tras floor(elapsedSec / 3600) horas completas. */
export function computeDesglosadorSessionDepthPS(elapsedSec: number): number {
  if (!Number.isFinite(elapsedSec) || elapsedSec <= 0) return 0;
  const completedHours = Math.floor(elapsedSec / 3600);
  if (completedHours <= 0) return 0;
  let total = 0;
  for (let h = 1; h <= completedHours; h++) {
    total += depthAwardForHour(h);
  }
  return total;
}

/** PS de la próxima hora a cruzar (para badge UI). */
export function nextDepthAwardAfterHours(completedHours: number): number {
  if (!Number.isFinite(completedHours) || completedHours < 0) return depthAwardForHour(1);
  return depthAwardForHour(completedHours + 1);
}

/** Texto corto para UI (primeras horas + cola). */
export function formatDepthAwardPreview(maxHours = 4): string {
  const parts: string[] = [];
  for (let h = 1; h <= maxHours; h++) parts.push(String(depthAwardForHour(h)));
  return `${parts.join(" → ")}… (+1/h después)`;
}
