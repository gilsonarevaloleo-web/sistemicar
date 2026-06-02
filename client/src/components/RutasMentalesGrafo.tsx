import type { RutaMentalId, RutasMentalesSet } from "@/lib/proyectos";

const RUTA_COLOR: Record<RutaMentalId, string> = {
  a: "#38BDF8",
  b: "#A855F7",
  c: "#f87171",
};

type Props = {
  rutas: RutasMentalesSet;
  compact?: boolean;
};

/** Grafo sobrio: paso actual + dos siguientes en la ruta activa. */
export function RutasMentalesGrafo({ rutas, compact = false }: Props) {
  const activa = rutas.rutas[rutas.rutaActiva];
  const color = RUTA_COLOR[rutas.rutaActiva];

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <div className="flex gap-1.5">
        {(["a", "b", "c"] as const).map(id => (
          <span
            key={id}
            className="text-[7px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded"
            style={{
              color: rutas.rutaActiva === id ? RUTA_COLOR[id] : "#64748b",
              backgroundColor: rutas.rutaActiva === id ? `${RUTA_COLOR[id]}18` : "rgba(255,255,255,0.04)",
              border: `1px solid ${rutas.rutaActiva === id ? `${RUTA_COLOR[id]}40` : "rgba(255,255,255,0.06)"}`,
            }}
          >
            {id.toUpperCase()}
          </span>
        ))}
      </div>
      <p className="text-[8px] font-bold" style={{ color }}>
        {activa.label}
      </p>
      <div className="relative pl-1">
        {activa.pasos.map((paso, i) => (
          <div key={paso.numero} className="flex gap-2 items-start relative pb-2 last:pb-0">
            {i < activa.pasos.length - 1 && (
              <div
                className="absolute left-[7px] top-3 bottom-0 w-px"
                style={{ backgroundColor: `${color}35` }}
              />
            )}
            <div
              className="shrink-0 w-3.5 h-3.5 rounded-full flex items-center justify-center text-[7px] font-black z-[1]"
              style={{
                backgroundColor: i === 0 ? `${color}30` : "rgba(255,255,255,0.06)",
                color: i === 0 ? color : "#94a3b8",
                border: `1px solid ${i === 0 ? color : "rgba(255,255,255,0.1)"}`,
              }}
            >
              {paso.numero}
            </div>
            <p
              className={`leading-snug pt-0.5 ${compact ? "text-[8px]" : "text-[9px]"} ${i === 0 ? "text-white font-semibold" : "text-slate-500"}`}
            >
              {paso.titulo}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
