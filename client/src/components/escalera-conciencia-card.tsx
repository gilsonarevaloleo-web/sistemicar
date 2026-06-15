import { memo, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  ESCALERA_NIVEL_LABEL,
  type EscaleraCapaId,
  type EscaleraCapaMetric,
  type EscaleraConcienciaModel,
  type EscaleraNivel,
} from "@/lib/escaleraConcienciaEngine";
import type { DisciplinaSeriePoint } from "@/lib/disciplinaEngine";

const PIZARRA = "#1e293b";
const CAPA_COLOR = {
  presencia: "#8B5CF6",
  entrada: "#D4AF37",
  produccion: "#A855F7",
} as const;

const NIVEL_COLOR: Record<EscaleraNivel, string> = {
  semilla: "#64748b",
  tallo: "#94a3b8",
  hoja: "#50C878",
  flor: "#00FFC3",
};

function CapaRow({
  capa,
  expanded,
  onToggle,
  compact,
  children,
}: {
  capa: EscaleraCapaMetric;
  expanded: boolean;
  onToggle: () => void;
  compact: boolean;
  children?: React.ReactNode;
}) {
  const color = CAPA_COLOR[capa.id];
  const nivelColor = NIVEL_COLOR[capa.nivel];

  return (
    <div className="relative pl-4" data-testid={`escalera-capa-${capa.id}`}>
      <div
        className="absolute left-1.5 top-0 bottom-0 w-px"
        style={{ background: `linear-gradient(180deg, ${color}60, ${color}15)` }}
      />
      <div
        className="absolute left-0 top-3 w-3 h-3 rounded-full border-2"
        style={{ backgroundColor: PIZARRA, borderColor: color, boxShadow: `0 0 8px ${color}40` }}
      />

      <button
        type="button"
        onClick={onToggle}
        className="w-full text-left rounded-xl border px-3 py-2.5 transition-colors"
        style={{
          backgroundColor: `${color}08`,
          borderColor: `${color}30`,
        }}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-[7px] font-black uppercase tracking-widest" style={{ color }}>
              Capa {capa.capa} · {capa.titulo}
            </p>
            <p className="text-[8px] text-slate-500 mt-0.5">{capa.subtitulo}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className="text-[7px] text-slate-500 uppercase tracking-wider">Nivel</p>
            <p className="text-[10px] font-black" style={{ color: nivelColor }}>
              {ESCALERA_NIVEL_LABEL[capa.nivel]}
            </p>
          </div>
        </div>

        <div className="flex items-baseline justify-between gap-2 mt-2">
          <p className="text-sm font-black tabular-nums text-white">{capa.valorPrincipal}</p>
          {capa.valorSecundario && (
            <p className="text-[8px] font-bold text-slate-400 tabular-nums">{capa.valorSecundario}</p>
          )}
        </div>

        <div className="mt-2 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{ width: `${capa.score}%`, backgroundColor: color }}
          />
        </div>

        {(expanded || !compact) && (
          <p className="text-[8px] text-slate-400 mt-2 leading-relaxed">{capa.headline}</p>
        )}
      </button>

      {expanded && children && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="mt-2 ml-1 overflow-hidden"
        >
          {children}
        </motion.div>
      )}
    </div>
  );
}

export interface EscaleraConcienciaCardProps {
  model: EscaleraConcienciaModel;
  disciplinaSerie: DisciplinaSeriePoint[];
  compact?: boolean;
  detalleOpen?: boolean;
}

function EscaleraConcienciaCard({
  model,
  disciplinaSerie,
  compact = false,
  detalleOpen = false,
}: EscaleraConcienciaCardProps) {
  const [expanded, setExpanded] = useState<EscaleraCapaId | "all">("produccion");
  const showDetail = !compact || detalleOpen;

  const presencia = model.capas.find(c => c.id === "presencia")!;
  const entrada = model.capas.find(c => c.id === "entrada")!;
  const produccion = model.capas.find(c => c.id === "produccion")!;

  const pulsoChart = useMemo(
    () => model.pulso.filter(p => p.decisionesHora > 0 || p.acumulado > 0),
    [model.pulso]
  );

  const toggle = (id: EscaleraCapaId) => {
    setExpanded(prev => (prev === id ? "all" : id));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-3 rounded-xl border overflow-hidden"
      style={{
        backgroundColor: PIZARRA,
        borderColor: "rgba(168,85,247,0.35)",
        boxShadow: model.brechaPresenciaProduccion
          ? "inset 0 0 0 1px rgba(168,85,247,0.15)"
          : undefined,
      }}
      data-testid="escalera-conciencia-card"
    >
      <div className="flex items-start justify-between gap-2 mb-3">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#A855F7" }}>
            Escalera de Conciencia
          </p>
          <p className="text-[7px] text-slate-500 mt-0.5 leading-snug max-w-[260px]">
            Tres capas de desarrollo — presencia, entrada y producción. Ninguna sustituye a la otra.
          </p>
        </div>
        {model.brechaPresenciaProduccion && (
          <span
            className="shrink-0 text-[7px] font-black uppercase tracking-wider px-2 py-1 rounded-lg border"
            style={{
              color: "#A855F7",
              borderColor: "rgba(168,85,247,0.35)",
              backgroundColor: "rgba(168,85,247,0.08)",
            }}
            data-testid="escalera-brecha-badge"
          >
            Puente
          </span>
        )}
      </div>

      <div className="space-y-3 mb-3">
        <CapaRow
          capa={presencia}
          expanded={expanded === "presencia" || expanded === "all"}
          onToggle={() => toggle("presencia")}
          compact={compact}
        >
          <p className="text-[7px] text-slate-500 px-2 pb-2 leading-relaxed">{presencia.detalle}</p>
        </CapaRow>

        <CapaRow
          capa={entrada}
          expanded={expanded === "entrada" || expanded === "all"}
          onToggle={() => toggle("entrada")}
          compact={compact}
        >
          <div className="px-1 pb-2">
            <p className="text-[7px] text-slate-500 mb-2 leading-relaxed">{entrada.detalle}</p>
            {disciplinaSerie.length >= 2 && showDetail && (
              <div className={compact ? "h-16" : "h-20"}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={disciplinaSerie}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 7, fill: "#64748b" }}
                      axisLine={false}
                      tickLine={false}
                      interval="preserveStartEnd"
                    />
                    <YAxis hide domain={[0, 100]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: PIZARRA,
                        border: "1px solid rgba(212,175,55,0.3)",
                        borderRadius: 8,
                        fontSize: 10,
                      }}
                      formatter={(value: number) => [`${value}`, "Disciplina"]}
                    />
                    <Line
                      type="monotone"
                      dataKey="indiceDisciplina"
                      stroke={CAPA_COLOR.entrada}
                      strokeWidth={1.5}
                      dot={false}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </CapaRow>

        <CapaRow
          capa={produccion}
          expanded={expanded === "produccion" || expanded === "all"}
          onToggle={() => toggle("produccion")}
          compact={compact}
        >
          <div className="px-1 pb-2 space-y-2">
            <p className="text-[7px] text-slate-500 leading-relaxed">{produccion.detalle}</p>

            {pulsoChart.length >= 1 && showDetail && (
              <div>
                <p className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Pulso de producción
                </p>
                <div className={compact ? "h-20" : "h-24"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={model.pulso}>
                      <defs>
                        <linearGradient id="pulsoFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#A855F7" stopOpacity={0.45} />
                          <stop offset="100%" stopColor="#A855F7" stopOpacity={0.02} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 7, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                      />
                      <YAxis
                        tick={{ fontSize: 7, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        width={20}
                        allowDecimals={false}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: PIZARRA,
                          border: "1px solid rgba(168,85,247,0.35)",
                          borderRadius: 8,
                          fontSize: 10,
                        }}
                        formatter={(value: number, name: string) => [
                          value,
                          name === "acumulado" ? "Acumulado" : "Esta hora",
                        ]}
                        labelFormatter={label => `${label}:00`}
                      />
                      <Area
                        type="monotone"
                        dataKey="acumulado"
                        stroke="#A855F7"
                        strokeWidth={2}
                        fill="url(#pulsoFill)"
                      />
                      <Line
                        type="monotone"
                        dataKey="decisionesHora"
                        stroke="#00FFC3"
                        strokeWidth={1}
                        dot={{ r: 2, fill: "#00FFC3", strokeWidth: 0 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {model.historicaProduccion.length >= 2 && showDetail && (
              <div>
                <p className="text-[7px] font-bold uppercase tracking-widest text-slate-500 mb-1">
                  Decisiones · días recientes
                </p>
                <div className={compact ? "h-14" : "h-16"}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={model.historicaProduccion}>
                      <XAxis
                        dataKey="label"
                        tick={{ fontSize: 7, fill: "#64748b" }}
                        axisLine={false}
                        tickLine={false}
                        interval="preserveStartEnd"
                      />
                      <YAxis hide allowDecimals={false} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: PIZARRA,
                          border: "1px solid rgba(168,85,247,0.35)",
                          borderRadius: 8,
                          fontSize: 10,
                        }}
                        formatter={(value: number) => [`${value}`, "Decisiones"]}
                      />
                      <Line
                        type="monotone"
                        dataKey="decisiones"
                        stroke="#A855F7"
                        strokeWidth={1.5}
                        dot={{ r: 2, fill: "#A855F7", strokeWidth: 0 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </div>
        </CapaRow>
      </div>

      <div
        className="p-2.5 rounded-lg border"
        style={{ backgroundColor: "rgba(255,255,255,0.03)", borderColor: "rgba(255,255,255,0.06)" }}
        data-testid="escalera-integracion"
      >
        <p className="text-[8px] text-slate-300 leading-relaxed italic">{model.integracion}</p>
        {model.ratioDecisionesPorHoraConquista != null && showDetail && (
          <p className="text-[7px] text-slate-500 mt-1.5 tabular-nums">
            {model.decisionesHoy} decisiones · {model.conquistaMin} min conquista ·{" "}
            {model.ratioDecisionesPorHoraConquista.toFixed(1)} dec/h
          </p>
        )}
      </div>
    </motion.div>
  );
}

const EscaleraConcienciaCardMemo = memo(EscaleraConcienciaCard);
export { EscaleraConcienciaCardMemo as EscaleraConcienciaCard };
