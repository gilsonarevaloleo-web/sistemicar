import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getJuicioMensaje, getResistenciaColor, calcularVoltajeResistencia } from "@/engines/ConcienciaEngine";

interface RelojResistenciaProps {
  onComplete: (puntos: number) => void;
}

export function RelojResistencia({ onComplete }: RelojResistenciaProps) {
  const [segundos, setSegundos] = useState(0);
  const [showIntro, setShowIntro] = useState(true);

  useEffect(() => {
    const introTimer = setTimeout(() => setShowIntro(false), 3500);
    return () => clearTimeout(introTimer);
  }, []);

  useEffect(() => {
    if (showIntro) return;
    const timer = setInterval(() => setSegundos(s => s + 1), 1000);
    return () => clearInterval(timer);
  }, [showIntro]);

  const handleFinalizar = () => {
    const puntos = calcularVoltajeResistencia(segundos);
    onComplete(puntos);
  };

  const progreso = (segundos % 300) / 300;
  const color = getResistenciaColor(segundos);
  const ciclo = Math.floor(segundos / 300) + 1;

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  return (
    <div
      className="rounded-2xl border text-center relative overflow-hidden"
      style={{
        backgroundColor: "#050505",
        borderColor: "rgba(153,27,27,0.3)",
        padding: "2rem 1.5rem"
      }}
    >
      <AnimatePresence mode="wait">
        {showIntro ? (
          <motion.div
            key="intro"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="py-8"
          >
            <p
              className="text-[9px] font-black tracking-[0.4em] mb-4 uppercase"
              style={{ color: "#991b1b" }}
            >
              Territorio de Soberanos
            </p>
            <p
              className="text-base font-bold italic leading-relaxed"
              style={{ color: "rgba(255,255,255,0.85)" }}
            >
              "SOLO LOS FUERTES TRANSMUTAN EL CANSANCIO EN PODER."
            </p>
          </motion.div>
        ) : (
          <motion.div
            key="reloj"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-[9px] tracking-[0.4em] uppercase mb-1"
              style={{ color: "#475569" }}
            >
              Reloj de Juicio — Ciclo {ciclo}
            </p>

            <div
              className="text-5xl font-mono font-black mb-1 transition-colors duration-500"
              style={{ color }}
            >
              {fmtTime(segundos)}
            </div>

            <div className="w-full h-0.5 rounded-full overflow-hidden mb-4" style={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ width: `${progreso * 100}%`, backgroundColor: color }}
                transition={{ duration: 0.5 }}
              />
            </div>

            <div className="min-h-[60px] flex items-center justify-center px-2 mb-6">
              <motion.p
                key={Math.floor(segundos / 150)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-xs italic leading-relaxed"
                style={{ color: "rgba(203,213,225,0.75)" }}
              >
                {getJuicioMensaje(segundos)}
              </motion.p>
            </div>

            <button
              onClick={handleFinalizar}
              className="px-8 py-2.5 border uppercase text-[9px] tracking-widest font-black transition-all hover:border-red-700"
              style={{
                borderColor: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.35)"
              }}
              data-testid="btn-terminar-juicio"
            >
              Terminar Juicio
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
