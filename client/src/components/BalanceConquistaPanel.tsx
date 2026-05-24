import type { BalanceConquistaJornada } from "@/engines/ConcienciaEngine";
import { formatMinutosJornada } from "@/engines/ConcienciaEngine";

const CONQU_COLOR = "#8B5CF6";
const BLOOD = "#FF3131";

interface BalanceConquistaPanelProps {
  balance: BalanceConquistaJornada;
}

export default function BalanceConquistaPanel({ balance }: BalanceConquistaPanelProps) {
  const stackedBarPct = (part: number) =>
    balance.jornadaMin > 0 ? Math.min(100, (part / balance.jornadaMin) * 100) : 0;

  return (
    <div
      className="p-3 rounded-xl border space-y-3"
      style={{ backgroundColor: "rgba(139,92,246,0.06)", borderColor: `${CONQU_COLOR}30` }}
      data-testid="cierre-balance-conquista"
    >
      <div className="flex items-center justify-between gap-2">
        <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: CONQU_COLOR }}>
          Balance de Conquista
        </p>
        <span className="text-[8px] text-slate-500 font-mono">
          Jornada planificada · {formatMinutosJornada(balance.jornadaMin)}
        </span>
      </div>

      <div className="h-3 rounded-full overflow-hidden flex" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
        {balance.conquistaMin > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${stackedBarPct(balance.conquistaMin)}%`,
              backgroundColor: CONQU_COLOR,
              boxShadow: `0 0 8px ${CONQU_COLOR}60`,
            }}
            title={`Conquista ${formatMinutosJornada(balance.conquistaMin)}`}
          />
        )}
        {balance.entropiaMin > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${stackedBarPct(balance.entropiaMin)}%`,
              backgroundColor: BLOOD,
              boxShadow: `0 0 8px ${BLOOD}50`,
            }}
            title={`Centinela ${formatMinutosJornada(balance.entropiaMin)}`}
          />
        )}
        {balance.vacioMin > 0 && (
          <div
            className="h-full transition-all"
            style={{
              width: `${stackedBarPct(balance.vacioMin)}%`,
              backgroundColor: "rgba(255,255,255,0.12)",
            }}
            title={`Sin conquistar ${formatMinutosJornada(balance.vacioMin)}`}
          />
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <p className="text-[7px] uppercase text-slate-500 mb-0.5">Conquista</p>
          <p className="text-xs font-black" style={{ color: CONQU_COLOR }} data-testid="cierre-conquista-min">
            {formatMinutosJornada(balance.conquistaMin)}
          </p>
          <p className="text-[8px] text-slate-600">{balance.conquistaPct}%</p>
        </div>
        <div>
          <p className="text-[7px] uppercase text-slate-500 mb-0.5">Centinela</p>
          <p className="text-xs font-black" style={{ color: BLOOD }} data-testid="cierre-entropia-min">
            {formatMinutosJornada(balance.entropiaMin)}
          </p>
          <p className="text-[8px] text-slate-600">{balance.entropiaPct}%</p>
        </div>
        <div>
          <p className="text-[7px] uppercase text-slate-500 mb-0.5">Sin conquistar</p>
          <p className="text-xs font-black text-slate-400" data-testid="cierre-vacio-min">
            {formatMinutosJornada(balance.vacioMin)}
          </p>
          <p className="text-[8px] text-slate-600">{balance.vacioPct}%</p>
        </div>
      </div>

      {balance.segmentos.length > 0 && (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Por segmento del día</p>
          {balance.segmentos.map((seg, i) => {
            const segTotal = seg.duracionMin || 1;
            const cPct = (seg.conquistaMin / segTotal) * 100;
            const ePct = (seg.entropiaMin / segTotal) * 100;
            const vPct = (seg.vacioMin / segTotal) * 100;
            return (
              <div key={`${seg.nombre}-${i}`} className="space-y-1" data-testid={`cierre-seg-balance-${i}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[9px] font-bold text-slate-300 truncate">{seg.nombre}</span>
                  <span className="text-[8px] text-slate-500 font-mono shrink-0">
                    {seg.horaInicio}–{seg.horaFin}
                  </span>
                </div>
                <div
                  className="h-1.5 rounded-full overflow-hidden flex"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  {cPct > 0 && <div className="h-full" style={{ width: `${cPct}%`, backgroundColor: CONQU_COLOR }} />}
                  {ePct > 0 && <div className="h-full" style={{ width: `${ePct}%`, backgroundColor: BLOOD }} />}
                  {vPct > 0 && (
                    <div className="h-full" style={{ width: `${vPct}%`, backgroundColor: "rgba(255,255,255,0.15)" }} />
                  )}
                </div>
                <p className="text-[7px] text-slate-500">
                  <span style={{ color: CONQU_COLOR }}>{formatMinutosJornada(seg.conquistaMin)}</span>
                  {" · "}
                  <span style={{ color: BLOOD }}>Centinela {formatMinutosJornada(seg.entropiaMin)}</span>
                  {" · "}
                  <span>Vacío {formatMinutosJornada(seg.vacioMin)}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
