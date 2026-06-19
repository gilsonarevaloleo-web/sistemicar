import { useEffect } from "react";
import { useVehicleTimerTick } from "@/lib/concienciaClock";

/** Suscripción al reloj global — solo montar cuando el card necesita tick en vivo. */
export function VehicleCardLiveClock({ onTick }: { onTick: () => void }) {
  const tick = useVehicleTimerTick();
  useEffect(() => {
    onTick();
  }, [tick, onTick]);
  return null;
}
