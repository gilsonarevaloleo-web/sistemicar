import type { BalanceConquistaJornada } from "@/engines/ConcienciaEngine";
import { formatMinutosJornada } from "@/engines/ConcienciaEngine";

const CONQU_COLOR = "#8B5CF6";
const BLOOD = "#FF3131";

interface BalanceConquistaPanelProps {
  balance: BalanceConquistaJornada;
}

function StatCell({
  label,
  value,
  sub,
  color = "#e2e8f0",
}: {
  label: string;
  value: string | number;
  sub?: string;
  color?: string;
}) {
  return (
    <div className="p-2.5 rounded-lg text-center" style={{ backgroundColor: "rgba(255,255,255,0.04)" }}>
      <p className="text-[7px] uppercase tracking-wider text-slate-500 mb-1">{label}</p>
      <p className="text-lg font-black tabular-nums leading-none" style={{ color }} data-testid={`cierre-stat-${label}`}>
        {value}
      </p>
      {sub && <p className="text-[8px] text-slate-600 mt-1">{sub}</p>}
    </div>
  );
}

export default function BalanceConquistaPanel({ balance }: BalanceConquistaPanelProps) {
  const centinelaSegmentoCero =
    balance.segmentos.length > 0 && balance.segmentos.every(s => s.entropiaMin <= 0);
  const resumenEntropiaCero = balance.entropiaMin <= 0;

  return (
    <div
      className="p-3 rounded-xl border space-y-3"
      style={{ backgroundColor: "rgba(139,92,246,0.06)", borderColor: `${CONQU_COLOR}30` }}
      data-testid="cierre-balance-conquista"
    >
      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: CONQU_COLOR }}>
            Balance de Conquista
          </p>
          <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">
            Conquista = trabajo consciente · Entropía = huecos y Centinela · Vacío = plan sin cubrir
          </p>
        </div>
        <span className="text-[8px] text-slate-500 font-mono">
          Jornada planificada {formatMinutosJornada(balance.jornadaMin)}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <StatCell
          label="Conquista"
          value={formatMinutosJornada(balance.conquistaMin)}
          sub={`${balance.conquistaPct}% del plan`}
          color={CONQU_COLOR}
        />
        <StatCell
          label="Entropía"
          value={formatMinutosJornada(balance.entropiaMin)}
          sub={`${balance.entropiaPct}% del plan · huecos + Centinela`}
          color={BLOOD}
        />
        <StatCell
          label="Sin conquistar"
          value={formatMinutosJornada(balance.vacioMin)}
          sub={`${balance.vacioPct}% del plan`}
          color="#94a3b8"
        />
      </div>

      {resumenEntropiaCero && (
        <p className="text-[8px] text-slate-500 leading-relaxed px-0.5" data-testid="cierre-nota-entropia-cero">
          Entropía en cero: no hubo huecos relevantes ni tiempo del vehículo Centinela hoy. Es habitual si trabajaste con vehículos conscientes la mayor parte del día.
        </p>
      )}

      {balance.segmentos.length > 0 && (
        <div className="space-y-2 pt-1 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <p className="text-[8px] font-bold uppercase tracking-wider text-slate-500">Por segmento (minutos)</p>
          {centinelaSegmentoCero && (
            <p className="text-[8px] text-slate-500 leading-relaxed" data-testid="cierre-nota-centinela-cero">
              La columna Centinela cuenta solo el vehículo automático «Modo Centinela» en ese horario. Si todo sale 0 min, es normal: hoy no se activó o no estuvo abierto en esos bloques (no es entropía de puerta ni de segmento).
            </p>
          )}
          {balance.segmentos.map((seg, i) => (
            <div
              key={`${seg.nombre}-${i}`}
              className="p-2 rounded-lg"
              style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              data-testid={`cierre-seg-balance-${i}`}
            >
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <span className="text-[9px] font-bold text-slate-300 truncate">{seg.nombre}</span>
                <span className="text-[8px] text-slate-500 font-mono shrink-0">
                  {seg.horaInicio}–{seg.horaFin}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div>
                  <p className="text-[6px] uppercase text-slate-600">Conquista</p>
                  <p className="text-xs font-black tabular-nums" style={{ color: CONQU_COLOR }}>
                    {formatMinutosJornada(seg.conquistaMin)}
                  </p>
                </div>
                <div>
                  <p className="text-[6px] uppercase text-slate-600">Centinela</p>
                  <p className="text-xs font-black tabular-nums" style={{ color: BLOOD }}>
                    {formatMinutosJornada(seg.entropiaMin)}
                  </p>
                </div>
                <div>
                  <p className="text-[6px] uppercase text-slate-600">Vacío</p>
                  <p className="text-xs font-black tabular-nums text-slate-400">
                    {formatMinutosJornada(seg.vacioMin)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
