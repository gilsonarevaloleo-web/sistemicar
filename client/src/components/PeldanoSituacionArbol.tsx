import type { ProyectoSubTareaResumen } from "@/lib/proyectos";

const CYAN = "#00FFC3";
const GOLD = "#D4AF37";
const EMERALD = "#10b981";
const BLOOD = "#f87171";
const SLATE = "#64748b";

function resultadoColor(resultado?: string): string {
  if (resultado === "cumplido") return EMERALD;
  if (resultado === "fallado") return BLOOD;
  return SLATE;
}

function resultadoLabel(resultado?: string): string {
  if (resultado === "cumplido") return "cumplido";
  if (resultado === "fallado") return "fallado";
  if (resultado === "pendiente") return "pendiente";
  return "—";
}

type Props = {
  subTareas: ProyectoSubTareaResumen[];
  compact?: boolean;
};

/** Árbol subtarea → detalles del desglose situacional conquistado. */
export function PeldanoSituacionArbol({ subTareas, compact = false }: Props) {
  if (subTareas.length === 0) return null;

  return (
    <div className={compact ? "space-y-2" : "space-y-3"}>
      <p
        className="text-[8px] font-bold uppercase tracking-widest"
        style={{ color: CYAN }}
      >
        Profundidad situacional
      </p>
      <div className="space-y-2">
        {subTareas.map((st, i) => {
          const color = resultadoColor(st.resultado);
          const detalles = st.detalles ?? [];
          const entregados = detalles.filter(d => d.entregado).length;
          return (
            <div
              key={`${st.texto}-${i}`}
              className="rounded-lg border border-white/5 overflow-hidden"
              style={{ backgroundColor: "rgba(255,255,255,0.02)" }}
            >
              <div className="flex items-start gap-2 p-2">
                <div
                  className="shrink-0 w-2 h-2 rounded-full mt-1"
                  style={{ backgroundColor: color }}
                />
                <div className="min-w-0 flex-1">
                  <p
                    className={`font-semibold text-white leading-snug ${compact ? "text-[9px]" : "text-[10px]"}`}
                  >
                    {st.texto}
                  </p>
                  <p className="text-[7px] uppercase tracking-wider mt-0.5" style={{ color }}>
                    {resultadoLabel(st.resultado)}
                    {detalles.length > 0 && (
                      <span className="text-slate-500">
                        {" "}
                        · ⚡ {entregados}/{detalles.length} detalles
                      </span>
                    )}
                  </p>
                </div>
              </div>
              {detalles.length > 0 && (
                <div className="border-t border-white/5 px-2 py-1.5 space-y-1">
                  {detalles.map((d, j) => (
                    <div key={j} className="flex items-start gap-2 pl-3 relative">
                      <div
                        className="absolute left-0 top-0 bottom-0 w-px"
                        style={{ backgroundColor: `${CYAN}25` }}
                      />
                      <span
                        className="shrink-0 text-[7px] font-black mt-0.5"
                        style={{ color: d.entregado ? GOLD : SLATE }}
                      >
                        {d.entregado ? "◆" : "◇"}
                      </span>
                      <p
                        className={`leading-snug ${compact ? "text-[8px]" : "text-[9px]"} ${
                          d.entregado ? "text-slate-400 line-through" : "text-slate-300"
                        }`}
                      >
                        {d.texto}
                        {d.casa && (
                          <span className="text-[7px] text-slate-600 ml-1 uppercase">casa</span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
