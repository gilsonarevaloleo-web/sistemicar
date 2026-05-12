import { motion, AnimatePresence } from "framer-motion";

type Fase = "AZUL" | "ESPEJO" | "POLO" | "PIO" | null;

interface PhaseIndicatorProps {
  fase: Fase;
}

const FASES = [
  { id: "AZUL", label: "SINTONÍA", color: "#2563EB" },
  { id: "ESPEJO", label: "DIAGNÓSTICO", color: "#D4AF37" },
  { id: "POLO", label: "TRANSMUTACIÓN", color: "#00FFC3" },
];

export default function PhaseIndicator({ fase }: PhaseIndicatorProps) {
  if (!fase) return null;

  const isPIO = fase === "PIO";

  return (
    <div
      className="w-full mb-3"
      style={{ fontFamily: "monospace" }}
      data-testid="phase-indicator"
    >
      <div className="flex items-center gap-1 w-full">
        {FASES.map((f, i) => {
          const isActive = isPIO ? true : fase === f.id;
          const color = isPIO ? "#FF3131" : f.color;

          return (
            <div key={f.id} className="flex items-center" style={{ flex: 1 }}>
              <div className="flex flex-col items-start w-full gap-0.5">
                <div className="flex items-center gap-1">
                  {isActive ? (
                    <motion.div
                      className="rounded-full"
                      style={{ width: 6, height: 6, backgroundColor: color, boxShadow: `0 0 6px ${color}` }}
                      animate={isPIO
                        ? { scale: [1, 1.5, 1], opacity: [1, 0.5, 1] }
                        : { scale: [1, 1.4, 1] }
                      }
                      transition={{ duration: isPIO ? 0.6 : 1.5, repeat: Infinity }}
                    />
                  ) : (
                    <div className="rounded-full" style={{ width: 6, height: 6, backgroundColor: "rgba(255,255,255,0.1)" }} />
                  )}
                  <span
                    className="text-[8px] font-bold tracking-widest uppercase"
                    style={{ color: isActive ? color : "rgba(255,255,255,0.2)" }}
                  >
                    {isPIO && f.id === "AZUL" ? "⚠ PIO" : f.label}
                  </span>
                </div>
                <div
                  className="rounded-full overflow-hidden"
                  style={{ height: 3, width: "100%", backgroundColor: "rgba(255,255,255,0.05)" }}
                >
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: color, boxShadow: `0 0 4px ${color}` }}
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 0.3, ease: "easeOut" }}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {i < FASES.length - 1 && (
                <div className="mx-1 h-px flex-shrink-0" style={{ width: 8, backgroundColor: "rgba(255,255,255,0.08)" }} />
              )}
            </div>
          );
        })}
      </div>

      {isPIO && (
        <motion.p
          className="text-[8px] tracking-widest uppercase mt-1"
          style={{ color: "#FF3131", fontFamily: "monospace" }}
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.6, repeat: Infinity }}
        >
          DIFERENCIAL CERO — OXIDACIÓN ACTIVA
        </motion.p>
      )}
    </div>
  );
}
