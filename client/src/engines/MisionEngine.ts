export interface ResultadoMision {
  basePS: number;
  deepBonus: number;
  allDeepBonus: number;
  densityMultiplier: number;
  totalPS: number;
}

export const calcularTotalPS = (
  base: number,
  profundidad: number,
  maestria: number,
  esDenso: boolean
): ResultadoMision => {
  const multiplicador = esDenso ? 1.5 : 1.0;
  const total = (base + profundidad + maestria) * multiplicador;
  return {
    basePS: base,
    deepBonus: profundidad,
    allDeepBonus: maestria,
    densityMultiplier: multiplicador,
    totalPS: Math.round(total)
  };
};

export const verificarRecord = (
  tiempoActual: number,
  recordHistorico: number
): boolean => {
  if (recordHistorico === 0) return true;
  return tiempoActual < recordHistorico;
};

export const generarMensajeCierre = (
  puntos: number,
  fatiga: string
): string => {
  if (puntos > 100)
    return 'Soberanía Total. Tu voluntad ha vencido a la inercia.';
  if (fatiga === 'Cansancio')
    return 'Misión cumplida bajo fatiga. Tu Temple es alto, pero el descanso es parte del entrenamiento.';
  return 'Registro completado. La Bóveda de Récords ha sido actualizada.';
};

export const calcularDeudaTiempo = (
  targetMs: number,
  aperturaMs: number
): { autoCloseMs: number; margenMs: number } => {
  const duracionMs = Math.max(0, targetMs - aperturaMs);
  const margenMs = Math.floor(duracionMs * 0.5);
  return {
    autoCloseMs: targetMs + margenMs,
    margenMs
  };
};
