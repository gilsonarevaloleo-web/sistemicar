import type { TipoFlota, Vehicle } from "./persistence";

export const MAX_OPERATIONAL_SLOTS = 2;

export type VehicleLaunchKind = "flota_general" | "descanso" | "interrupcion" | "quick_save";

export interface OperationalSlotsCheck {
  allowed: boolean;
  reason?: string;
  blockingVehicles?: Vehicle[];
}

/** Activos conscientes que consumen slot operativo. */
export function getOperationalActives(vehicles: Vehicle[]): Vehicle[] {
  return vehicles.filter(v => v.status === "activo" && !v.autoVerdad);
}

/** Desglosador con trabajo en curso (durabilidad / cruce de segmentos). */
export function isDesglosadorEnFoco(vehicle: Vehicle): boolean {
  if (vehicle.tipoReloj !== "desglosador" || vehicle.status !== "activo") return false;
  if (vehicle.interrupcionActiva) return true;
  const subs = vehicle.subVehiculos ?? [];
  if (subs.length === 0) return false;
  return subs.some(s => s.status === "activo" || s.status === "pendiente");
}

export function isDesglosadorCrossSegmentExempt(vehicle: Vehicle): boolean {
  return isDesglosadorEnFoco(vehicle);
}

function blockResult(
  reason: string,
  blockingVehicles: Vehicle[]
): OperationalSlotsCheck {
  return { allowed: false, reason, blockingVehicles };
}

/**
 * Tope de 2 misiones operativas:
 * - Descanso como 2.º slot solo junto a desglosador en foco.
 * - Interrupción: padre pausado + hijo = 2 slots (máx. antes de lanzar: 1 activo = el padre).
 */
export function assertCanOpenVehicle(
  vehicles: Vehicle[],
  kind: VehicleLaunchKind,
  opts?: { parentDesglosadorId?: string }
): OperationalSlotsCheck {
  const actives = getOperationalActives(vehicles);

  if (kind === "interrupcion") {
    const parentId = opts?.parentDesglosadorId;
    const withoutParent = parentId ? actives.filter(v => v.id !== parentId) : actives;
    if (actives.length >= MAX_OPERATIONAL_SLOTS && withoutParent.length >= 1) {
      return blockResult(
        "Tienes 2 misiones abiertas. Cierra o retoma una antes de lanzar la interrupción.",
        actives
      );
    }
    return { allowed: true };
  }

  if (kind === "descanso") {
    if (actives.length >= MAX_OPERATIONAL_SLOTS) {
      return blockResult(
        "Tienes 2 misiones abiertas. Cierra una antes de abrir descanso.",
        actives
      );
    }
    if (actives.length === 1 && !isDesglosadorEnFoco(actives[0]!)) {
      return blockResult(
        "Descanso como 2.º slot solo junto a un desglosador en foco.",
        actives
      );
    }
    return { allowed: true };
  }

  if (actives.length >= MAX_OPERATIONAL_SLOTS) {
    return blockResult(
      "Tienes 2 misiones abiertas. Cierra o retoma una antes de abrir otra.",
      actives
    );
  }

  return { allowed: true };
}

export function formatOperationalSlotsBlockMessage(check: OperationalSlotsCheck): string {
  if (!check.reason) return "No puedes abrir otra misión ahora.";
  const names = check.blockingVehicles?.map(v => v.titulo).filter(Boolean) ?? [];
  if (names.length === 0) return check.reason;
  return `${check.reason} Abiertas: ${names.join(" · ")}.`;
}

export function launchKindFromFlota(tipoFlota: TipoFlota | undefined): VehicleLaunchKind {
  if (tipoFlota === "descanso") return "descanso";
  return "flota_general";
}
