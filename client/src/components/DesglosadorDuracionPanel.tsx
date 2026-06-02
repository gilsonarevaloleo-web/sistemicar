import { motion } from "framer-motion";
import { Hourglass, Shield } from "lucide-react";
import {
  desglosadorHourProgress,
  formatDesglosadorDurationHuman,
  formatElapsedHHMMSS,
} from "@/lib/desglosadorClock";
import { depthAwardForHour, nextDepthAwardAfterHours } from "@/lib/desglosadorDepth";

type Props = {
  elapsedSec: number;
  depthPsGranted: number;
  compact?: boolean;
};

export default function DesglosadorDuracionPanel({ elapsedSec, depthPsGranted, compact = false }: Props) {
  const { hoursDone, pctToNextHour, secToNextHour } = desglosadorHourProgress(elapsedSec);
  const nextAward = nextDepthAwardAfterHours(hoursDone);
  const minsToHour = Math.max(0, Math.ceil(secToNextHour / 60));

  if (compact) {
    return (
      <span
        className="text-[8px] font-mono font-bold px-1.5 py-0.5 rounded"
        style={{ backgroundColor: "rgba(56,189,248,0.12)", color: "#38BDF8" }}
        data-testid="desglosador-duracion-compact"
      >
        ⏱ {formatElapsedHHMMSS(elapsedSec)}
      </span>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border-2 p-3 space-y-2.5"
      style={{
        backgroundColor: "rgba(56,189,248,0.06)",
        borderColor: "rgba(56,189,248,0.35)",
        boxShadow: "0 0 16px rgba(56,189,248,0.08)",
      }}
      data-testid="desglosador-duracion-panel"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <Hourglass size={14} style={{ color: "#38BDF8" }} className="shrink-0" />
          <div className="min-w-0">
            <p className="text-[8px] font-black uppercase tracking-widest" style={{ color: "#38BDF8" }}>
              Duración del desglose
            </p>
            <p className="text-[7px] text-slate-500 leading-snug mt-0.5">
              Resistir más aquí fortalece tu termodinámica atencional
            </p>
          </div>
        </div>
        <div className="text-right shrink-0">
          <p
            className="text-xl font-black tabular-nums leading-none"
            style={{ color: "#38BDF8", fontFamily: "JetBrains Mono, monospace" }}
            data-testid="desglosador-duracion-clock"
          >
            {formatElapsedHHMMSS(elapsedSec)}
          </p>
          <p className="text-[7px] text-slate-500 mt-0.5">{formatDesglosadorDurationHuman(elapsedSec)}</p>
        </div>
      </div>

      <div className="space-y-1">
        <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.06)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{
              width: `${pctToNextHour}%`,
              background: `linear-gradient(90deg, rgba(56,189,248,0.5), #38BDF8)`,
            }}
            animate={{ width: `${pctToNextHour}%` }}
            transition={{ duration: 0.4 }}
          />
        </div>
        <div className="flex items-center justify-between text-[7px]">
          <span className="text-slate-500">
            {hoursDone > 0 ? `${hoursDone}h completada${hoursDone !== 1 ? "s" : ""}` : "Hacia 1.ª hora"}
          </span>
          <span className="font-bold" style={{ color: "#D4AF37" }}>
            {minsToHour}m → +{nextAward} PS prof.
          </span>
        </div>
      </div>

      <div
        className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
        style={{ backgroundColor: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}
      >
        <Shield size={11} style={{ color: "#D4AF37" }} />
        <span className="text-[8px] text-slate-400 leading-snug flex-1">
          Profundidad acumulada: <span className="font-black text-white">{depthPsGranted} PS</span>
          {hoursDone > 0 && (
            <span className="text-slate-500">
              {" "}
              · última hora +{depthAwardForHour(hoursDone)}
            </span>
          )}
        </span>
      </div>
    </motion.div>
  );
}
