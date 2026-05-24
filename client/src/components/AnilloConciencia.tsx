import { motion } from "framer-motion";

interface SegmentoLite {
  horaInicio: string;
  horaFin: string;
  estado: string;
  nombre?: string;
}

interface AnilloConcienciaProps {
  planificacionPct: number;
  /** Arco violeta (conquista) dentro del presupuesto compartido de jornada */
  conquistaArcPct: number;
  /** Arco rojo (entropía / centinela) — opuesto a conquista en el mismo anillo */
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
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return `M ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(2)} ${y2.toFixed(2)}`;
}

export default function AnilloConciencia({
  planificacionPct,
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

  const GOLD = "#D4AF37";
  const CYAN = "#00FFC3";
  const BLOOD = "#FF3131";

  const cx = size / 2;
  const cy = size / 2;

  const relojR = size * 0.455;
  const outerR = size * 0.375;
  const innerR = size * 0.265;
  const strokeW = size * 0.055;
  const relojSW = size * 0.05;

  const circumference = (r: number) => 2 * Math.PI * r;
  const outerCirc = circumference(outerR);
  const innerCirc = circumference(innerR);

  const outerDash = (planificacionPct / 100) * outerCirc;
  const conquistaDash = (Math.min(100, resolvedConquista) / 100) * innerCirc;
  const entropiaDash = (Math.min(100, resolvedEntropia) / 100) * innerCirc;

  const planLabel = Math.round(planificacionPct);
  const conquLabel = Math.round(resolvedConquista);
  const entropiaLabel = Math.round(resolvedEntropia);
  const fillLabel = Math.round(Math.min(100, resolvedConquista + resolvedEntropia));

  const PURPLE = "#8B5CF6";
  const planColor = planLabel >= 70 ? CYAN : planLabel >= 40 ? GOLD : "#6b7280";
  const conquColor = PURPLE;
  const showEntropia = resolvedEntropia > 0;
  const showConquista = resolvedConquista > 0;

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
      s.estado === "cerrado_manual" ? GOLD
      : s.estado === "entropia" ? BLOOD
      : s.estado === "activo" ? CYAN
      : "rgba(255,255,255,0.12)";
    const glow =
      s.estado === "cerrado_manual" ? `${GOLD}80`
      : s.estado === "entropia" ? `${BLOOD}70`
      : s.estado === "activo" ? `${CYAN}90`
      : "transparent";

    segArcs.push({
      path: arcPath(cx, cy, relojR, startDeg, endDeg),
      color,
      glow,
      isActive: s.estado === "activo",
    });
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} overflow="visible">

          <circle cx={cx} cy={cy} r={relojR} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth={relojSW} />
          {segArcs.map((arc, i) => (
            <motion.path
              key={i}
              d={arc.path}
              fill="none"
              stroke={arc.color}
              strokeWidth={relojSW}
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
              key={`active-glow-${i}`}
              d={arc.path}
              fill="none"
              stroke={CYAN}
              strokeWidth={relojSW * 0.6}
              strokeLinecap="butt"
              animate={{ opacity: [0.3, 0.9, 0.3] }}
              transition={{ duration: 1.8, repeat: Infinity }}
            />
          ))}

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

          {/* Anillo interno compartido: conquista (horario) vs entropía (antihorario) */}
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
              stroke={conquColor}
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
                  ? `drop-shadow(0 0 10px ${conquColor})`
                  : `drop-shadow(0 0 4px ${conquColor}60)`,
              }}
            />
          )}

          <text x={cx} y={cy - 8} textAnchor="middle" fill={planColor}
            fontSize={size * 0.13} fontFamily="JetBrains Mono, monospace" fontWeight="bold">
            {planLabel}%
          </text>
          <text x={cx} y={cy + 8} textAnchor="middle" fill="rgba(255,255,255,0.22)"
            fontSize={size * 0.05} fontFamily="JetBrains Mono, monospace">
            PLAN
          </text>
          <text x={cx} y={cy + 20} textAnchor="middle" fill={showEntropia && !showConquista ? BLOOD : conquColor}
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
          <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: conquColor, boxShadow: `0 0 4px ${conquColor}` }} />
          <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Conquista {conquLabel}%</span>
        </div>
        {segmentos.length > 0 && (
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: GOLD, boxShadow: `0 0 4px ${GOLD}` }} />
            <span className="text-[7px] font-black uppercase tracking-widest" style={{ color: "rgba(255,255,255,0.4)" }}>Segmentos</span>
          </div>
        )}
      </div>
    </div>
  );
}
