import { motion } from "framer-motion";
import type { TimelineClockArc } from "@/engines/ConcienciaEngine";

interface SegmentoLite {
  horaInicio: string;
  horaFin: string;
  estado: string;
  nombre?: string;
}

interface AnilloConcienciaProps {
  planificacionPct: number;
  timelineArcs?: TimelineClockArc[];
  conquistaArcPct?: number;
  entropiaArcPct?: number;
  /** @deprecated use conquistaArcPct */
  conquistaPct?: number;
  /** @deprecated use entropiaArcPct */
  entropiaPct?: number;
  conquistaPulse?: boolean;
  size?: number;
  segmentos?: SegmentoLite[];
}

const parseMin = (t: string): number => {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
};

const toRad = (deg: number) => (deg * Math.PI) / 180;

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const start = toRad(startDeg - 90);
  const end = toRad(endDeg - 90);
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const span = endDeg - startDeg;
  const large = span > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

const TRACK_BG = "rgba(30, 35, 48, 0.95)";
const PURPLE = "#8B5CF6";
const BLOOD = "#FF3131";
const GOLD = "#D4AF37";
const CYAN = "#00FFC3";

export default function AnilloConciencia({
  planificacionPct,
  timelineArcs = [],
  conquistaArcPct,
  entropiaArcPct: entropiaArcPctProp,
  conquistaPct,
  entropiaPct,
  conquistaPulse = false,
  size = 140,
  segmentos = [],
}: AnilloConcienciaProps) {
  const resolvedConquista = conquistaArcPct ?? conquistaPct ?? 0;
  const resolvedEntropia = entropiaArcPctProp ?? entropiaPct ?? 0;

  const cx = size / 2;
  const cy = size / 2;

  // De afuera hacia adentro: segmentos → reloj 24h → plan → conquista/entropía
  const segR = size * 0.455;
  const timelineR = size * 0.405;
  const outerR = size * 0.375;
  const innerR = size * 0.265;

  const strokeW = size * 0.055;
  const segSW = size * 0.05;
  const timelineSW = size * 0.048;

  const outerCirc = 2 * Math.PI * outerR;
  const innerCirc = 2 * Math.PI * innerR;
  const outerDash = (planificacionPct / 100) * outerCirc;
  const conquistaDash = (Math.min(100, resolvedConquista) / 100) * innerCirc;
  const entropiaDash = (Math.min(100, resolvedEntropia) / 100) * innerCirc;

  const planLabel = Math.round(planificacionPct);
  const conquLabel = Math.round(resolvedConquista);
  const entropiaLabel = Math.round(resolvedEntropia);
  const fillLabel = Math.round(Math.min(100, resolvedConquista + resolvedEntropia));

  const planColor = planLabel >= 70 ? CYAN : planLabel >= 40 ? GOLD : "#6b7280";
  const showEntropia = resolvedEntropia > 0;
  const showConquista = resolvedConquista > 0;

  const fondoArcs = timelineArcs.filter(a => a.kind === "fondo");
  const entropiaTimelineArcs = timelineArcs.filter(a => a.kind === "entropia");
  const conquistaTimelineArcs = timelineArcs.filter(a => a.kind === "conquista");

  const hourMarks = [12, 15, 18, 21, 0, 3, 6, 9];

  const segDataRaw = segmentos
    .map(s => {
      const ini = parseMin(s.horaInicio);
      const fin = parseMin(s.horaFin);
      const dur = fin >= ini ? fin - ini : fin + 1440 - ini;
      return { dur: Math.max(0, dur), estado: s.estado || "pendiente" };
    })
    .filter(s => s.dur > 0);

  const totalMin = segDataRaw.reduce((acc, s) => acc + s.dur, 0);
  const GAP_DEG = totalMin > 0 && segDataRaw.length > 1 ? Math.min(2, 360 / segDataRaw.length / 6) : 0;

  const segArcs: { path: string; color: string; glow: string; isActive: boolean }[] = [];
  let cumDeg = 0;
  for (const s of segDataRaw) {
    const arcDeg = (s.dur / totalMin) * 360;
    const startDeg = cumDeg + GAP_DEG / 2;
    const endDeg = cumDeg + arcDeg - GAP_DEG / 2;
    cumDeg += arcDeg;
    if (endDeg <= startDeg) continue;

    const color =
      s.estado === "cerrado_manual" || s.estado === "entropia" ? GOLD
      : s.estado === "activo" ? CYAN
      : "rgba(255,255,255,0.12)";
    const glow =
      s.estado === "cerrado_manual" || s.estado === "entropia" ? `${GOLD}80`
      : s.estado === "activo" ? `${CYAN}90`
      : "transparent";

    segArcs.push({
      path: arcPath(cx, cy, segR, startDeg, endDeg),
      color,
      glow,
      isActive: s.estado === "activo",
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">

          {/* 1. Anillo exterior: segmentos planificados */}
          <circle cx={cx} cy={cy} r={segR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={segSW} />
          {segArcs.map((arc, i) => (
            <motion.path
              key={`seg-${i}`}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={segSW}
              strokeLinecap="butt"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.8, delay: i * 0.07, ease: "easeOut" }}
              style={{
                filter: arc.isActive
                  ? `drop-shadow(0 0 5px ${arc.glow})`
                  : arc.color !== "rgba(255,255,255,0.12)"
                  ? `drop-shadow(0 0 3px ${arc.glow})`
                  : "none",
              }}
            />
          ))}
          {segArcs.filter(a => a.isActive).map((arc, i) => (
            <motion.path
              key={`seg-glow-${i}`}
              d={arc.path}
              fill="none"
              stroke={CYAN}
              strokeWidth={segSW * 0.6}
              strokeLinecap="butt"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          ))}

          {/* 2. Reloj madre 24h — fondo + rojo + morado */}
          {fondoArcs.map((_, i) => (
            <circle
              key={`fondo-${i}`}
              cx={cx} cy={cy} r={timelineR}
              fill="none"
              stroke={TRACK_BG}
              strokeWidth={timelineSW}
            />
          ))}
          {hourMarks.map(h => {
            const deg = (h === 12 ? 0 : ((h * 60 - 720) + 1440) % 1440 / 1440) * 360;
            const rad = toRad(deg - 90);
            const inner = timelineR - timelineSW / 2 - 1;
            const outer = timelineR + timelineSW / 2 + 1;
            const isMain = h === 12 || h === 0 || h === 6 || h === 18;
            return (
              <g key={`h-${h}`}>
                <line
                  x1={cx + inner * Math.cos(rad)}
                  y1={cy + inner * Math.sin(rad)}
                  x2={cx + outer * Math.cos(rad)}
                  y2={cy + outer * Math.sin(rad)}
                  stroke={isMain ? "rgba(255,255,255,0.28)" : "rgba(255,255,255,0.1)"}
                  strokeWidth={isMain ? 1.2 : 0.6}
                />
              </g>
            );
          })}
          {entropiaTimelineArcs.map((arc, i) => (
            <motion.path
              key={`tl-ent-${i}`}
              d={arcPath(cx, cy, timelineR, arc.startDeg, arc.endDeg)}
              fill="none"
              stroke={BLOOD}
              strokeWidth={timelineSW}
              strokeLinecap="butt"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: i * 0.03, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 3px ${BLOOD}70)` }}
            />
          ))}
          {conquistaTimelineArcs.map((arc, i) => (
            <motion.path
              key={`tl-conq-${i}`}
              d={arcPath(cx, cy, timelineR, arc.startDeg, arc.endDeg)}
              fill="none"
              stroke={PURPLE}
              strokeWidth={conquistaPulse ? timelineSW * 1.12 : timelineSW}
              strokeLinecap="butt"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: conquistaPulse ? [1, 0.7, 1] : 1 }}
              transition={{
                pathLength: { duration: 0.5, delay: i * 0.03, ease: "easeOut" },
                opacity: conquistaPulse ? { duration: 0.8, repeat: Infinity } : { duration: 0 },
              }}
              style={{ filter: `drop-shadow(0 0 4px ${PURPLE}80)` }}
            />
          ))}

          {/* 3. Anillo planificación */}
          <circle cx={cx} cy={cy} r={outerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
          <motion.circle
            cx={cx} cy={cy} r={outerR} fill="none"
            stroke={planColor} strokeWidth={strokeW} strokeLinecap="round"
            strokeDasharray={`${outerDash} ${outerCirc}`}
            transform={`rotate(-90 ${cx} ${cy})`}
            initial={{ strokeDasharray: `0 ${outerCirc}` }}
            animate={{ strokeDasharray: `${outerDash} ${outerCirc}` }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            style={{ filter: `drop-shadow(0 0 4px ${planColor}60)` }}
          />

          {/* 4. Anillo interior: conquista vs entropía agregados */}
          <circle cx={cx} cy={cy} r={innerR} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={strokeW} />
          {showEntropia && (
            <motion.circle
              cx={cx} cy={cy} r={innerR} fill="none"
              stroke={BLOOD} strokeWidth={strokeW} strokeLinecap="round"
              strokeDasharray={`${entropiaDash} ${innerCirc}`}
              transform={`rotate(90 ${cx} ${cy})`}
              initial={{ strokeDasharray: `0 ${innerCirc}` }}
              animate={{ strokeDasharray: `${entropiaDash} ${innerCirc}` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              style={{ filter: `drop-shadow(0 0 5px ${BLOOD}70)` }}
            />
          )}
          {showConquista && (
            <motion.circle
              cx={cx} cy={cy} r={innerR} fill="none"
              stroke={PURPLE}
              strokeWidth={conquistaPulse ? strokeW * 1.35 : strokeW}
              strokeLinecap="round"
              strokeDasharray={`${conquistaDash} ${innerCirc}`}
              transform={`rotate(-90 ${cx} ${cy})`}
              initial={{ strokeDasharray: `0 ${innerCirc}` }}
              animate={{
                strokeDasharray: `${conquistaDash} ${innerCirc}`,
                opacity: conquistaPulse ? [1, 0.65, 1] : 1,
              }}
              transition={{
                strokeDasharray: { duration: 0.8, ease: "easeOut" },
                opacity: conquistaPulse ? { duration: 0.8, times: [0, 0.5, 1] } : { duration: 0 },
              }}
              style={{
                filter: conquistaPulse
                  ? `drop-shadow(0 0 10px ${PURPLE})`
                  : `drop-shadow(0 0 4px ${PURPLE}60)`,
              }}
            />
          )}

          {/* Aguja hora actual (reloj 24h) */}
          {(() => {
            const now = new Date();
            const min = now.getHours() * 60 + now.getMinutes();
            const deg = ((min - 720 + 1440) % 1440 / 1440) * 360;
            const rad = toRad(deg - 90);
            const needleLen = timelineR - timelineSW * 0.5;
            return (
              <line
                x1={cx}
                y1={cy}
                x2={cx + needleLen * Math.cos(rad)}
                y2={cy + needleLen * Math.sin(rad)}
                stroke="rgba(255,255,255,0.45)"
                strokeWidth={1}
                strokeLinecap="round"
              />
            );
          })()}

          <circle cx={cx} cy={cy} r={2.5} fill="rgba(255,255,255,0.55)" />

          <text x={cx} y={cy - 8} textAnchor="middle" fill={planColor}
            fontSize={size * 0.13} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            {planLabel}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.22)"
            fontSize={size * 0.05} fontFamily="JetBrains Mono, monospace">
            PLAN
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fill={showEntropia && !showConquista ? BLOOD : PURPLE}
            fontSize={size * 0.09} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            {showEntropia && showConquista ? fillLabel : showEntropia ? entropiaLabel : conquLabel}%
          </text>
        </svg>

        <div
          className="absolute top-0 left-0 w-full h-full rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle at center, rgba(212,175,55,0.03) 0%, transparent 70%)" }}
        />
      </div>

      <div className="flex items-center flex-wrap justify-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: planColor, boxShadow: `0 0 4px ${planColor}` }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Plan</span>
        </div>
        {showEntropia && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: BLOOD, boxShadow: `0 0 4px ${BLOOD}` }} />
            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: BLOOD }}>Entropía {entropiaLabel}%</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PURPLE, boxShadow: `0 0 4px ${PURPLE}` }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Conquista {conquLabel}%</span>
        </div>
        {segmentos.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD, boxShadow: `0 0 4px ${GOLD}` }} />
            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Segmentos</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: TRACK_BG, border: "1px solid rgba(255,255,255,0.12)" }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.3)" }}>24h</span>
        </div>
      </div>
    </div>
  );
}
