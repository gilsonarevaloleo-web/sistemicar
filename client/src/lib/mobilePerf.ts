import { isCoarseConcienciaDevice } from "./concienciaClock";

/** Móvil / pantalla táctil estrecha: modo rendimiento conservador. */
export function isMobilePerfMode(): boolean {
  return isCoarseConcienciaDevice();
}

export const MOBILE_PERF = {
  ATTENTION_INITIAL_DEFER_MS: 18_000,
  ATTENTION_TICK_MS: 25_000,
  ATTENTION_MIN_GAP_MS: 10_000,
  ANILLO_DEFER_MS: 6_000,
  ANILLO_CACHE_BUCKET_MS: 6_000,
  SKIP_RETRO_CENTINELA: true,
} as const;
