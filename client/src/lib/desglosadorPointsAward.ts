import type { SubVehiculo } from "./persistence";
import {
  computeDesglosadorSubAwardPS,
  DESGLOSADOR_CYCLE_CLOSE_BASE_PS,
} from "./sovereigntyPointsConfig";

export type AwardPsFn = (amount: number, source: string) => Promise<boolean>;

function subAwardSource(vehicleTitulo: string, sub: SubVehiculo): string {
  const titulo = sub.titulo.trim() || "Sub";
  return `Desglosador · ${vehicleTitulo} → ${titulo} [${sub.id}]`;
}

/** Otorga PS de un sub cumplido si aún no tiene psOtorgados. */
export async function awardDesglosadorSubPointsIfNeeded(
  vehicleTitulo: string,
  sub: SubVehiculo,
  award: AwardPsFn
): Promise<{ sub: SubVehiculo; awarded: number }> {
  if (sub.status !== "cumplido") return { sub, awarded: 0 };
  if ((sub.psOtorgados ?? 0) > 0) return { sub, awarded: 0 };

  const amount = computeDesglosadorSubAwardPS(sub);
  if (amount <= 0) return { sub, awarded: 0 };

  const ok = await award(amount, subAwardSource(vehicleTitulo, sub));
  if (!ok) return { sub, awarded: 0 };
  return { sub: { ...sub, psOtorgados: amount }, awarded: amount };
}

export function desglosadorCycleCloseSource(vehicleId: string, vehicleTitulo: string): string {
  return `Cierre ciclo desglosador [${vehicleId}]: ${vehicleTitulo}`;
}

/** Asegura PS de todos los subs cumplidos + base de cierre de ciclo (una vez por vehículo). */
export async function settleDesglosadorCyclePoints(
  vehicleId: string,
  vehicleTitulo: string,
  subs: SubVehiculo[],
  award: AwardPsFn,
  options?: { skipCycleClose?: boolean }
): Promise<{
  subs: SubVehiculo[];
  subsPsAwarded: number;
  cycleClosePs: number;
}> {
  let subsPsAwarded = 0;
  const nextSubs = [...subs];

  for (let i = 0; i < nextSubs.length; i++) {
    const { sub, awarded } = await awardDesglosadorSubPointsIfNeeded(
      vehicleTitulo,
      nextSubs[i],
      award
    );
    nextSubs[i] = sub;
    subsPsAwarded += awarded;
  }

  let cycleClosePs = 0;
  if (!options?.skipCycleClose && DESGLOSADOR_CYCLE_CLOSE_BASE_PS > 0) {
    const ok = await award(
      DESGLOSADOR_CYCLE_CLOSE_BASE_PS,
      desglosadorCycleCloseSource(vehicleId, vehicleTitulo)
    );
    if (ok) cycleClosePs = DESGLOSADOR_CYCLE_CLOSE_BASE_PS;
  }

  return { subs: nextSubs, subsPsAwarded, cycleClosePs };
}

export function sumDesglosadorSubsPsAlreadyGranted(subs: SubVehiculo[]): number {
  return subs
    .filter(s => s.status === "cumplido")
    .reduce((sum, s) => sum + (s.psOtorgados ?? 0), 0);
}

/** Estimación de PS de sesión (subs + cierre + profundidad ya otorgada). */
export function estimateDesglosadorSessionPs(
  subs: SubVehiculo[],
  depthGranted = 0
): number {
  const subsPs = subs
    .filter(s => s.status === "cumplido")
    .reduce(
      (sum, s) => sum + (s.psOtorgados ?? computeDesglosadorSubAwardPS(s)),
      0
    );
  return subsPs + DESGLOSADOR_CYCLE_CLOSE_BASE_PS + depthGranted;
}
