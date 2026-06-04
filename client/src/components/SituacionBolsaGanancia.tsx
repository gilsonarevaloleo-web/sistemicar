import { motion } from "framer-motion";
import { Gem, TrendingUp } from "lucide-react";
import type { SituacionBolsaGanancia } from "@/lib/situacionGanancia";
import { retoSituacionCorto } from "@/lib/situacionGanancia";

const CYAN = "#00FFC3";
const GOLD = "#D4AF37";
const VERDE = "#00C851";

type Props = {
  bolsa: SituacionBolsaGanancia;
  compact?: boolean;
};

/** Cuadro visible de tiempo recuperado por eficiencia situacional. */
export function SituacionBolsaGananciaPanel({ bolsa, compact = false }: Props) {
  const totalVisible =
    bolsa.minutosGanadosReto > 0
      ? bolsa.minutosGanadosReto
      : bolsa.minutosEnCola + bolsa.minutosAdelanto;
  const hasGanancia = totalVisible > 0 || bolsa.minutosEnCola > 0 || bolsa.minutosAdelanto > 0;

  return (
    <div
      className={`rounded-xl border overflow-hidden ${compact ? "mb-2" : "mb-3"}`}
      style={{
        backgroundColor: "rgba(0,255,195,0.04)",
        borderColor: hasGanancia ? `${CYAN}40` : "rgba(255,255,255,0.08)",
        boxShadow: hasGanancia ? `0 0 14px ${CYAN}12` : undefined,
      }}
      data-testid="situacion-bolsa-ganancia"
    >
      <div className="flex items-center justify-between gap-2 px-2.5 py-1.5 border-b border-white/5">
        <div className="flex items-center gap-1.5 min-w-0">
          <Gem size={11} style={{ color: CYAN }} className="shrink-0" />
          <span className="text-[8px] font-black uppercase tracking-wider truncate" style={{ color: CYAN }}>
            Bolsa de ganancia
          </span>
        </div>
        <span className="text-[7px] font-bold uppercase tracking-wider shrink-0 text-slate-500">
          {retoSituacionCorto(bolsa.retoNumero)}
        </span>
      </div>
      <div className="px-2.5 py-2 space-y-1.5">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[8px] text-slate-500 uppercase tracking-wide">Tiempo recuperado</span>
          <motion.span
            key={totalVisible}
            initial={{ scale: 1.2, color: GOLD }}
            animate={{ scale: 1, color: hasGanancia ? VERDE : "#64748b" }}
            className="text-base font-black font-mono tabular-nums"
          >
            +{totalVisible} min
          </motion.span>
        </div>
        {(bolsa.minutosEnCola > 0 || bolsa.minutosAdelanto > 0) && (
          <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[7px] text-slate-500">
            {bolsa.minutosEnCola > 0 && (
              <span>
                En cola: <span style={{ color: CYAN }}>{bolsa.minutosEnCola} min</span>
              </span>
            )}
            {bolsa.minutosAdelanto > 0 && (
              <span>
                Adelanto: <span style={{ color: VERDE }}>{bolsa.minutosAdelanto} min</span>
              </span>
            )}
          </div>
        )}
        {bolsa.minutosGanadosSesion > bolsa.minutosGanadosReto && (
          <div className="flex items-center gap-1 text-[7px] text-slate-600">
            <TrendingUp size={9} />
            Sesión: +{bolsa.minutosGanadosSesion} min acumulados
          </div>
        )}
        {!hasGanancia && (
          <p className="text-[7px] text-slate-600 leading-snug">
            Cierra filas antes del cupo — el tiempo sobrante entra aquí.
          </p>
        )}
      </div>
    </div>
  );
}
