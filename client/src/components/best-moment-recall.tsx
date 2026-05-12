import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Sparkles, Flame, Star, Zap, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";
import { useAuthContext } from "@/App";
import { subscribeToProgression, UserProgression } from "@/lib/persistence";

interface BestMomentRecallProps {
  isOpen: boolean;
  onClose: () => void;
}

const energyLabels: Record<string, string> = {
  enfoque: "ENFOQUE",
  conflicto: "CONFLICTO",
  pasos: "PASOS", 
  alcance: "ALCANCE-LÍMITE",
};

const energyEmojis: Record<string, string> = {
  enfoque: "🎯",
  conflicto: "⚔️",
  pasos: "🔵", 
  alcance: "💠",
};

export function BestMomentRecall({ isOpen, onClose }: BestMomentRecallProps) {
  const [, navigate] = useLocation();
  const { user } = useAuthContext();
  const [progression, setProgression] = useState<UserProgression | null>(null);

  useEffect(() => {
    if (!user || !isOpen) return;
    const unsubscribe = subscribeToProgression(
      user.uid,
      (prog) => setProgression(prog),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user, isOpen]);

  const handleReactivate = () => {
    localStorage.setItem("sistemi_recall_shown", Date.now().toString());
    onClose();
    navigate("/espejo");
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "un día épico";
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString("es-ES", { 
        weekday: "long", 
        day: "numeric", 
        month: "long" 
      });
    } catch {
      return "un día épico";
    }
  };

  if (!isOpen) return null;
  
  const bestDayCP = progression?.bestDayCP || 0;
  if (!bestDayCP) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 20 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 border border-white/10 rounded-3xl max-w-sm w-full p-6 relative overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-amber-500/20 to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
            
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            <div className="relative z-10 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring" }}
                className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center"
              >
                <Star size={40} className="text-white" />
              </motion.div>

              <motion.h2
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xl font-bold text-white mb-2"
              >
                ¿Recuerdas tu mejor día?
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 text-sm mb-6"
              >
                Conseguiste <span className="text-amber-400 font-bold">{bestDayCP} CP</span> en tu mejor momento
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-white/5 rounded-xl p-4 mb-6 border border-white/10"
              >
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Flame className="text-amber-500" size={18} />
                  <span className="text-white font-bold">Tu Racha</span>
                </div>
                <p className="text-2xl font-bold text-amber-400">{progression?.registrationDays || 0} días</p>
                <p className="text-xs text-slate-500 mt-1">de consistencia</p>
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                onClick={handleReactivate}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                Reactivar mi poder
                <ArrowRight size={18} />
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
