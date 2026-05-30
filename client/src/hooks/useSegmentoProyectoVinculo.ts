import { useCallback, useEffect, useMemo, useState } from "react";
import type { SegmentoV5, Vehicle } from "@/lib/persistence";
import { getProyectos, subscribeToProyectos, type Proyecto } from "@/lib/proyectos";
import {
  ordenFlotaParaSegmento,
  resolverProyectoIdVehiculo,
  segmentoEsEjeSaludRecuperacion,
  volcarMetricasVehiculoAlHub,
} from "@/lib/segmentoProyectoHub";

/** Estado compartido: segmento activo ↔ Hub de Proyectos y orquestación de flota. */
export function useSegmentoProyectoVinculo(
  userId: string | undefined,
  segmentoActivo: SegmentoV5 | null
) {
  const [proyectosHub, setProyectosHub] = useState<Proyecto[]>([]);

  useEffect(() => {
    if (!userId) return;
    void getProyectos(userId).then(setProyectosHub);
    return subscribeToProyectos(userId, () => {
      void getProyectos(userId).then(setProyectosHub);
    });
  }, [userId]);

  const flotaOrden = useMemo(
    () => ordenFlotaParaSegmento(segmentoActivo),
    [segmentoActivo]
  );

  const proyectoVinculadoActivo = useMemo(() => {
    const id = segmentoActivo?.proyectoVinculadoId;
    if (!id) return null;
    return proyectosHub.find((p) => p.id === id) ?? null;
  }, [segmentoActivo?.proyectoVinculadoId, proyectosHub]);

  const priorizaDescanso = useMemo(
    () => (segmentoActivo ? segmentoEsEjeSaludRecuperacion(segmentoActivo) : false),
    [segmentoActivo]
  );

  const resolverProyectoId = useCallback(
    (launchCtx: { proyectoId: string; peldanoId?: string } | null) =>
      resolverProyectoIdVehiculo(segmentoActivo, launchCtx),
    [segmentoActivo]
  );

  const volcarMetricasAlHub = useCallback(
    async (vehicle: Vehicle, opts: { ps?: number; minutos?: number } = {}) => {
      if (!userId) return;
      await volcarMetricasVehiculoAlHub(userId, vehicle, segmentoActivo, opts);
    },
    [userId, segmentoActivo]
  );

  return {
    proyectosHub,
    flotaOrden,
    proyectoVinculadoActivo,
    priorizaDescanso,
    resolverProyectoId,
    volcarMetricasAlHub,
    segmentoEsEjeSaludRecuperacion,
  };
}
