/** Barra PS del día: ayer = 100%, escala visual hasta 120%. */

export const DAILY_PS_BAR_MAX_PCT = 120;
/** Referencia si ayer fue 0 PS (evita división por cero). */
export const DAILY_PS_REFERENCE_FALLBACK = 50;

export type DailyPsBarModel = {
  todayPs: number;
  referencePs: number;
  yesterdayPs: number;
  referenceLabel: string;
  fillWidthPct: number;
  marker100WidthPct: number;
  remainingTo100: number;
  pctOfReference: number;
  target120Ps: number;
  remainingTo120: number;
  atOrAbove100: boolean;
  atOrAbove120: boolean;
  statusText: string;
  usingFallbackReference: boolean;
};

export function computeDailyPsBarModel(
  todayPs: number,
  yesterdayPs: number,
  maxScalePct = DAILY_PS_BAR_MAX_PCT,
  fallbackReference = DAILY_PS_REFERENCE_FALLBACK
): DailyPsBarModel {
  const safeToday = Math.max(0, Math.round(todayPs));
  const safeYesterday = Math.max(0, Math.round(yesterdayPs));
  const usingFallbackReference = safeYesterday <= 0;
  const referencePs = usingFallbackReference ? fallbackReference : safeYesterday;
  const target120Ps = Math.round(referencePs * (maxScalePct / 100));
  const scaleMax = Math.max(1, target120Ps);
  const fillWidthPct = Math.min(100, (safeToday / scaleMax) * 100);
  const marker100WidthPct = (100 / maxScalePct) * 100;
  const remainingTo100 = Math.max(0, referencePs - safeToday);
  const remainingTo120 = Math.max(0, target120Ps - safeToday);
  const pctOfReference =
    referencePs > 0 ? Math.round((safeToday / referencePs) * 100) : 0;
  const atOrAbove100 = safeToday >= referencePs;
  const atOrAbove120 = safeToday >= target120Ps;

  let statusText: string;
  if (!atOrAbove100) {
    statusText = `Faltan ${remainingTo100} PS para tu 100%`;
  } else if (!atOrAbove120) {
    statusText = `${pctOfReference}% de ayer — faltan ${remainingTo120} PS para 120%`;
  } else {
    statusText = `${pctOfReference}% — superaste el 120% de ayer`;
  }

  const referenceLabel = usingFallbackReference
    ? `Ayer 0 PS — referencia ${fallbackReference} PS = 100%`
    : `Ayer ${safeYesterday} PS = 100% · meta 120% = ${target120Ps} PS`;

  return {
    todayPs: safeToday,
    referencePs,
    yesterdayPs: safeYesterday,
    referenceLabel,
    fillWidthPct,
    marker100WidthPct,
    remainingTo100,
    pctOfReference,
    target120Ps,
    remainingTo120,
    atOrAbove100,
    atOrAbove120,
    statusText,
    usingFallbackReference,
  };
}
