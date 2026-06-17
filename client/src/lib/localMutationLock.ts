/** Candado temporal contra ecos de Firebase durante mutaciones locales (create/close/delete). */

const LOCK_MS = 1500;

let lockUntil = 0;
let lockReason: string | undefined;

export function beginLocalVehicleMutation(reason?: string): void {
  lockUntil = Date.now() + LOCK_MS;
  lockReason = reason;
}

export function extendLocalVehicleMutation(reason?: string): void {
  lockUntil = Date.now() + LOCK_MS;
  if (reason) lockReason = reason;
}

export function isLocalVehicleMutationLocked(): boolean {
  return Date.now() < lockUntil;
}

export function getLocalMutationLockDebug(): { until: number; reason?: string } {
  return { until: lockUntil, reason: lockReason };
}

/** Expuesto para tests con fake timers. */
export function resetLocalVehicleMutationLockForTests(): void {
  lockUntil = 0;
  lockReason = undefined;
}

export const LOCAL_VEHICLE_MUTATION_LOCK_MS = LOCK_MS;
