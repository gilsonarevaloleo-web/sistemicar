/**
 * PS de profundidad por sesi�n desglosador � curva progresiva sin tope de horas.
 * Hora 1 = 5 PS; hora n (n?2) = award(n-1) + 2^(n-2) ? 5, 6, 8, 12, 20, 36�
 */

/** PS otorgados al completar la hora n (1-based). */
export function depthAwardForHour(n: number): number {
  if (!Number.isFinite(n) || n <= 0) return 0;
  if (n === 1) return 5;
  return 4 + (1 << (n - 1));
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

/** PS de la pr�xima hora a cruzar (para badge UI). */
export function nextDepthAwardAfterHours(completedHours: number): number {
  if (!Number.isFinite(completedHours) || completedHours < 0) return depthAwardForHour(1);
  return depthAwardForHour(completedHours + 1);
}
