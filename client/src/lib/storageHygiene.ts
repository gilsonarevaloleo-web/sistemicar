/** Utilidades para evitar QuotaExceeded y pantallas negras por localStorage lleno. */

export function isQuotaExceededError(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { name?: string; code?: number; message?: string };
  if (e.name === "QuotaExceededError") return true;
  if (typeof e.code === "number" && (e.code === 22 || e.code === 1014)) return true;
  if (typeof e.message === "string" && e.message.toLowerCase().includes("quota")) return true;
  return false;
}

export function estimateStorageBytes(): number {
  let total = 0;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key) continue;
      const val = localStorage.getItem(key);
      total += key.length + (val?.length ?? 0);
    }
  } catch {
    return 0;
  }
  return total;
}

export type PruneReport = {
  removedKeys: number;
  freedBytesEstimate: number;
};

const PLANILLA_PREFIX = "sistemicar_planilla_v5_";
const BACKUP_PREFIX = "sistemicar_backup_";
const KEEP_PLANILLAS = 14;

function keySize(key: string, value: string | null): number {
  return key.length + (value?.length ?? 0);
}

/** Libera espacio sin borrar datos críticos del día (vehículos activos, progresión, reservas). */
export function emergencyPruneStorage(opts?: { aggressive?: boolean }): PruneReport {
  let removedKeys = 0;
  let freedBytesEstimate = 0;

  const removeKey = (key: string) => {
    try {
      const val = localStorage.getItem(key);
      if (val == null) return;
      freedBytesEstimate += keySize(key, val);
      localStorage.removeItem(key);
      removedKeys++;
    } catch {
      // ignore
    }
  };

  const keys: string[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k) keys.push(k);
    }
  } catch {
    return { removedKeys, freedBytesEstimate };
  }

  for (const k of keys) {
    if (k.startsWith(BACKUP_PREFIX)) removeKey(k);
  }

  const planillaKeys = keys.filter(k => k.startsWith(PLANILLA_PREFIX)).sort().reverse();
  for (const k of planillaKeys.slice(KEEP_PLANILLAS)) removeKey(k);

  removeKey("sistemicar_migration_pending");

  if (opts?.aggressive) {
    for (const k of keys) {
      if (k.startsWith("sistemicar_sp_log_")) {
        try {
          const raw = localStorage.getItem(k);
          if (!raw) continue;
          const parsed = JSON.parse(raw) as unknown[];
          if (Array.isArray(parsed) && parsed.length > 400) {
            const trimmed = JSON.stringify(parsed.slice(0, 400));
            freedBytesEstimate += Math.max(0, keySize(k, raw) - keySize(k, trimmed));
            localStorage.setItem(k, trimmed);
          }
        } catch {
          removeKey(k);
        }
      }
    }

    try {
      const vehiclesRaw = localStorage.getItem("sistemicar_vehicles");
      if (vehiclesRaw) {
        const vehicles = JSON.parse(vehiclesRaw) as { status?: string }[];
        if (Array.isArray(vehicles) && vehicles.length > 50) {
          const activos = vehicles.filter(v => v.status === "activo");
          const archivados = vehicles.filter(v => v.status !== "activo").slice(0, 30);
          const trimmed = JSON.stringify([...activos, ...archivados]);
          freedBytesEstimate += Math.max(0, keySize("sistemicar_vehicles", vehiclesRaw) - keySize("sistemicar_vehicles", trimmed));
          localStorage.setItem("sistemicar_vehicles", trimmed);
        }
      }
    } catch {
      // ignore
    }
  }

  return { removedKeys, freedBytesEstimate };
}

/** Intenta guardar; si el disco del navegador está lleno, poda y reintenta. */
export function safeSetItem(key: string, value: string): boolean {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (err) {
    if (!isQuotaExceededError(err)) throw err;
    emergencyPruneStorage({ aggressive: true });
    try {
      localStorage.setItem(key, value);
      return true;
    } catch {
      return false;
    }
  }
}

/** Al arrancar: poda copias de respaldo si el almacenamiento local supera ~4 MB. */
export function runStartupStorageHygiene(): PruneReport | null {
  const bytes = estimateStorageBytes();
  if (bytes < 4_000_000) return null;
  return emergencyPruneStorage({ aggressive: bytes > 5_500_000 });
}
