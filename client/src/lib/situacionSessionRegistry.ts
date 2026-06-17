/** Registro de cleanups imperativos por vehículo situacional (sin side effects). */

const cleanupsByVehicle = new Map<string, Set<() => void>>();
const tornDownIds = new Set<string>();

export function registerSituacionSessionCleanup(
  vehicleId: string,
  fn: () => void
): () => void {
  let set = cleanupsByVehicle.get(vehicleId);
  if (!set) {
    set = new Set();
    cleanupsByVehicle.set(vehicleId, set);
  }
  set.add(fn);
  tornDownIds.delete(vehicleId);
  return () => {
    cleanupsByVehicle.get(vehicleId)?.delete(fn);
  };
}

export function resetSituacionSessionTeardownGate(vehicleId: string): void {
  tornDownIds.delete(vehicleId);
}

export function runSituacionSessionCleanups(vehicleId: string): boolean {
  if (tornDownIds.has(vehicleId)) return false;
  tornDownIds.add(vehicleId);

  const fns = cleanupsByVehicle.get(vehicleId);
  if (fns) {
    for (const fn of [...fns]) {
      try {
        fn();
      } catch {
        /* noop */
      }
    }
    fns.clear();
  }
  return true;
}

export function listSituacionSessionVehicleIds(): string[] {
  return [...cleanupsByVehicle.keys()];
}

export function clearSituacionSessionRegistry(): void {
  cleanupsByVehicle.clear();
  tornDownIds.clear();
}
