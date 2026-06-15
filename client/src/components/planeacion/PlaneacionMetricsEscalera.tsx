import { memo } from "react";
import { EscaleraConcienciaCard } from "@/components/escalera-conciencia-card";
import type { DisciplinaSeriePoint } from "@/lib/disciplinaEngine";
import type { EscaleraConcienciaModel } from "@/lib/escaleraConcienciaEngine";

export interface PlaneacionMetricsEscaleraProps {
  visible: boolean;
  model: EscaleraConcienciaModel;
  disciplinaSerie: DisciplinaSeriePoint[];
  compact: boolean;
  detalleOpen: boolean;
}

function PlaneacionMetricsEscaleraInner({
  visible,
  model,
  disciplinaSerie,
  compact,
  detalleOpen,
}: PlaneacionMetricsEscaleraProps) {
  if (!visible) return null;
  return (
    <EscaleraConcienciaCard
      model={model}
      disciplinaSerie={disciplinaSerie}
      compact={compact}
      detalleOpen={detalleOpen}
    />
  );
}

const PlaneacionMetricsEscalera = memo(PlaneacionMetricsEscaleraInner);
export default PlaneacionMetricsEscalera;
