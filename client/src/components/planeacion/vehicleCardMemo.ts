import type { Planilla, Vehicle } from "@/lib/persistence";
import { situacionRelojDebeMostrarse } from "@/lib/situacionCupoDistrib";
import { vehiclesReactiveSignature } from "@/lib/situacionRepair";

export function vehicleCardNeedsLiveTick(vehicle: Vehicle, expanded: boolean): boolean {
  if (vehicle.status !== "activo") return false;
  if (expanded) return true;
  if (vehicle.tipoReloj === "desglosador") return true;
  if (vehicle.tipoFlota === "situacion") {
    if (situacionRelojDebeMostrarse(vehicle)) return true;
    if (vehicle.situacionCronometro?.activo === true) return true;
  }
  return false;
}

export type VehicleCardMemoProps = {
  vehicle: Vehicle;
  expanded: boolean;
  minimal?: boolean;
  segmentoNumero?: number | null;
  planilla?: Planilla | null;
  arquitectoUnlocked?: boolean;
  situacionBloquePsTotal?: number;
  situacionDesgloseSummary?: { vehicleId?: string; psTotal?: number };
};

export function areVehicleCardPropsEqual(
  prev: VehicleCardMemoProps,
  next: VehicleCardMemoProps
): boolean {
  if (prev.expanded !== next.expanded) return false;
  if (prev.minimal !== next.minimal) return false;
  if (prev.segmentoNumero !== next.segmentoNumero) return false;
  if (prev.arquitectoUnlocked !== next.arquitectoUnlocked) return false;
  if (prev.situacionBloquePsTotal !== next.situacionBloquePsTotal) return false;
  if (prev.situacionDesgloseSummary?.vehicleId !== next.situacionDesgloseSummary?.vehicleId) return false;
  if (prev.situacionDesgloseSummary?.psTotal !== next.situacionDesgloseSummary?.psTotal) return false;
  if (prev.planilla?.fecha !== next.planilla?.fecha) return false;
  if (vehiclesReactiveSignature([prev.vehicle]) !== vehiclesReactiveSignature([next.vehicle])) {
    return false;
  }
  return true;
}
