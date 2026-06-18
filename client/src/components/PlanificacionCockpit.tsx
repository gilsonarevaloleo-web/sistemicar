import { ChevronDown, ChevronUp, Layers, Minimize2, Maximize2, Target } from "lucide-react";
import { memo, type ReactNode } from "react";

type PlanTab = "operar" | "metricas" | "meta";

type Props = {
  title?: string;
  tagline?: string;
  compact: boolean;
  onToggleCompact: () => void;
  minimized: boolean;
  onToggleMinimize: () => void;
  tab: PlanTab;
  onTabChange: (tab: PlanTab) => void;
  psLine: ReactNode;
  combustibleLine?: ReactNode;
  anillo: ReactNode;
  segmentoChip?: ReactNode;
};

function PlanificacionCockpit({
  title = "Jornada",
  tagline = "Cierre de jornada con conciencia",
  compact,
  onToggleCompact,
  minimized,
  onToggleMinimize,
  tab,
  onTabChange,
  psLine,
  combustibleLine,
  anillo,
  segmentoChip,
}: Props) {
  return (
    <div
      className="sticky top-0 z-30 -mx-4 px-4 pt-3 pb-2"
      style={{ backgroundColor: "rgba(2,2,2,0.92)", backdropFilter: "blur(8px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
      data-testid="plan-cockpit"
    >
      <div className="max-w-lg mx-auto">
        {!minimized && (
          <>
            <div className="flex items-center justify-between gap-2">
              <div className="min-w-0">
                <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest truncate">{title}</p>
                {tagline && (
                  <p className="text-[8px] text-slate-600 truncate mt-0.5">{tagline}</p>
                )}
                <div className="mt-0.5">{psLine}</div>
                {combustibleLine && <div className="mt-0.5">{combustibleLine}</div>}
              </div>
              <button
                type="button"
                onClick={onToggleCompact}
                className="px-2.5 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest"
                style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.55)" }}
                data-testid="plan-layout-toggle"
                title={compact ? "Cambiar a vista completa" : "Cambiar a vista compacta"}
              >
                {compact ? (
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronDown size={12} />
                    Completo
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5">
                    <ChevronUp size={12} />
                    Compacto
                  </span>
                )}
              </button>
            </div>

            {compact && (
              <div className="mt-2 flex items-center gap-2">
                <div className="shrink-0">{anillo}</div>
                <div className="min-w-0 flex-1">{segmentoChip}</div>
              </div>
            )}
          </>
        )}

        <div className={`flex items-center gap-1.5 ${minimized ? "mt-0" : compact ? "mt-2" : "mt-1.5"}`}>
          <div className="flex gap-1.5 flex-1 min-w-0">
            <button
              type="button"
              onClick={() => onTabChange("operar")}
              className="flex-1 rounded-xl border px-2 py-2 min-w-0"
              style={{
                borderColor: tab === "operar" ? "rgba(16,185,129,0.45)" : "rgba(255,255,255,0.08)",
                backgroundColor: tab === "operar" ? "rgba(16,185,129,0.12)" : "rgba(0,0,0,0.18)",
              }}
              data-testid="plan-tab-operar"
            >
              <span className="inline-flex items-center gap-1.5 justify-center w-full">
                <Layers size={12} style={{ color: tab === "operar" ? "#10b981" : "#94a3b8" }} />
                <span className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: tab === "operar" ? "#10b981" : "#94a3b8" }}>Operar</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange("metricas")}
              className="flex-1 rounded-xl border px-2 py-2 min-w-0"
              style={{
                borderColor: tab === "metricas" ? "rgba(56,189,248,0.45)" : "rgba(255,255,255,0.08)",
                backgroundColor: tab === "metricas" ? "rgba(56,189,248,0.12)" : "rgba(0,0,0,0.18)",
              }}
              data-testid="plan-tab-metricas"
            >
              <span className="inline-flex items-center gap-1.5 justify-center w-full">
                <Target size={12} style={{ color: tab === "metricas" ? "#38bdf8" : "#94a3b8" }} />
                <span className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: tab === "metricas" ? "#38bdf8" : "#94a3b8" }}>Métricas</span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => onTabChange("meta")}
              className="flex-1 rounded-xl border px-2 py-2 min-w-0"
              style={{
                borderColor: tab === "meta" ? "rgba(212,175,55,0.45)" : "rgba(255,255,255,0.08)",
                backgroundColor: tab === "meta" ? "rgba(212,175,55,0.12)" : "rgba(0,0,0,0.18)",
              }}
              data-testid="plan-tab-meta"
            >
              <span className="text-[9px] font-black uppercase tracking-widest truncate" style={{ color: tab === "meta" ? "#d4af37" : "#94a3b8" }}>Meta</span>
            </button>
          </div>
          <button
            type="button"
            onClick={onToggleMinimize}
            className="shrink-0 px-2 py-2 rounded-xl border"
            style={{ borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.25)", color: "rgba(255,255,255,0.55)" }}
            data-testid="plan-cockpit-minimize"
            title={minimized ? "Mostrar cabecera (PS, anillo…)" : "Reducir cabecera — más espacio"}
          >
            {minimized ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(PlanificacionCockpit);