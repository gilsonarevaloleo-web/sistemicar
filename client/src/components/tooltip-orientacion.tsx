import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, X } from "lucide-react";
import { generarTooltipOrientacion } from "@/lib/gemini";

const GOLD = "#D4AF37";

interface TooltipOrientacionProps {
  inactivityMs?: number;
  onDismiss?: () => void;
}

export function TooltipOrientacion({ inactivityMs = 120000, onDismiss }: TooltipOrientacionProps) {
  const [show, setShow] = useState(false);
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    let lastActivity = Date.now();

    const resetTimer = () => {
      lastActivity = Date.now();
      setShow(false);
    };

    const checkInactivity = async () => {
      if (Date.now() - lastActivity >= inactivityMs && !show) {
        const tooltip = await generarTooltipOrientacion();
        setMensaje(tooltip);
        setShow(true);
      }
    };

    const events = ["mousedown", "mousemove", "keydown", "scroll", "touchstart"];
    events.forEach(event => window.addEventListener(event, resetTimer));

    const interval = setInterval(checkInactivity, 10000);

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [inactivityMs, show]);

  const handleDismiss = () => {
    setShow(false);
    onDismiss?.();
  };

  return (
    <AnimatePresence>
      {show && mensaje && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.9 }}
          className="fixed bottom-20 left-4 right-4 z-40 max-w-sm mx-auto"
        >
          <div 
            className="p-4 rounded-2xl border backdrop-blur-xl shadow-2xl"
            style={{ 
              backgroundColor: "rgba(20, 20, 20, 0.95)",
              borderColor: `${GOLD}40`,
              boxShadow: `0 0 30px ${GOLD}20`
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: `${GOLD}20` }}
              >
                <Sparkles size={18} style={{ color: GOLD }} />
              </div>
              <div className="flex-1">
                <p className="text-[10px] font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
                  Mentor IA
                </p>
                <p className="text-sm text-zinc-300 leading-relaxed">
                  {mensaje}
                </p>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              >
                <X size={14} className="text-zinc-500" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
