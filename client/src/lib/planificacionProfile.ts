import {
  hasOperativoAccess,
  hasSoberaniaDiaAccess,
  type UserProgression,
} from "./persistence";
import type { PlanificacionPlanProfile } from "./planificacionOnboarding";

export type { PlanificacionPlanProfile };

export function resolvePlanificacionProfile(
  subscriptionPlan?: string | null,
  email?: string | null,
  rank?: string | null,
  activeModules?: string[] | null
): PlanificacionPlanProfile {
  if (hasOperativoAccess(subscriptionPlan, email, rank, activeModules)) {
    return "produccion";
  }
  if (hasSoberaniaDiaAccess(subscriptionPlan, email, rank, activeModules)) {
    return "estudiante";
  }
  return "base";
}

export function progressionToProfile(
  prog: UserProgression | null,
  email?: string | null
): PlanificacionPlanProfile {
  if (!prog) return "base";
  return resolvePlanificacionProfile(
    prog.subscriptionPlan,
    email,
    prog.rank,
    prog.activeModules
  );
}
