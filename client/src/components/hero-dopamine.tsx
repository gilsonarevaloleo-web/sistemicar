import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Zap, TrendingUp, Sparkles, Star } from "lucide-react";
import { useAuthContext } from "@/App";
import { subscribeToProgression, UserProgression } from "@/lib/persistence";

interface MomentumData {
  currentWeekCP: number;
  previousWeekCP: number;
  daysSinceLastLog: number;
  daysSinceLastBossStep: number;
  activeStreak: number;
  momentumScore: number;
  isDecline: boolean;
}

const motivationalPhrases = [
  "Tu ENFOQUE es el faro que guía al subconsciente.",
  "Cada registro es un PASO hacia la transmutación.",
  "El CONFLICTO es oro en bruto esperando ser destilado.",
  "Tu conciencia está despierta. El ALCANCE se expande.",
  "Los 4 ejes vibran en armonía. Continúa.",
  "Hoy transmutas plomo en sabiduría.",
  "Tu puntería mental está afinada.",
  "La alquimia del día comienza ahora.",
];

export function HeroDopamine() {
  const { user } = useAuthContext();
  const [phrase, setPhrase] = useState("");
  const [showCelebration, setShowCelebration] = useState(false);
  const [progression, setProgression] = useState<UserProgression | null>(null);

  useEffect(() => {
    const randomPhrase = motivationalPhrases[Math.floor(Math.random() * motivationalPhrases.length)];
    setPhrase(randomPhrase);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProgression(
      user.uid,
      (prog) => {
        setProgression(prog);
        if (prog && prog.momentum >= 60) {
          setShowCelebration(true);
          setTimeout(() => setShowCelebration(false), 2000);
        }
      },
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  const totalCP = progression?.totalCP || 0;
  const sovereigntyPoints = progression?.sovereigntyPoints || 0;
  const streak = progression?.registrationDays || 0;
  const momentumScore = progression?.momentum || 50;

  const getMomentumColor = () => {
    if (momentumScore >= 70) return "from-emerald-500 to-teal-500";
    if (momentumScore >= 40) return "from-amber-500 to-orange-500";
    return "from-rose-500 to-red-500";
  };

  const getMomentumLabel = () => {
    if (momentumScore >= 70) return "En llamas";
    if (momentumScore >= 40) return "Activo";
    return "Reactivar";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-black via-[#0a0a0a] to-black border border-white/10 p-5 mb-6 backdrop-blur-2xl shadow-2xl"
    >
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 pointer-events-none"
          >
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={i}
                initial={{ 
                  x: "50%", 
                  y: "50%", 
                  scale: 0 
                }}
                animate={{ 
                  x: `${Math.random() * 100}%`, 
                  y: `${Math.random() * 100}%`,
                  scale: [0, 1, 0],
                  opacity: [0, 1, 0]
                }}
                transition={{ duration: 1, delay: i * 0.05 }}
                className="absolute w-2 h-2 bg-amber-400 rounded-full"
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl" />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-slate-400 text-xs uppercase tracking-wider mb-1"
            >
              Tu Comando Mental
            </motion.p>
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.3, type: "spring" }}
              className="flex items-baseline gap-2"
            >
              <span className="text-4xl font-bold text-white">{totalCP}</span>
              <span className="text-lg text-slate-400">CP</span>
            </motion.div>
            {sovereigntyPoints > 0 && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, type: "spring" }}
                className="flex items-baseline gap-1 mt-1"
              >
                <Star size={14} className="text-amber-400 fill-amber-400" />
                <span className="text-lg font-bold text-amber-400">{sovereigntyPoints}</span>
                <span className="text-xs text-amber-500/70">Soberanía</span>
              </motion.div>
            )}
          </div>

          {streak > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/20 border border-amber-500/30"
            >
              <Flame className="text-amber-500" size={16} />
              <span className="text-amber-400 font-bold text-sm">{streak} días</span>
            </motion.div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between text-xs mb-1.5">
            <span className="text-slate-400">Momentum</span>
            <span className={`font-bold bg-gradient-to-r ${getMomentumColor()} bg-clip-text text-transparent`}>
              {getMomentumLabel()}
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${momentumScore}%` }}
              transition={{ delay: 0.5, duration: 0.8, ease: "easeOut" }}
              className={`h-full bg-gradient-to-r ${getMomentumColor()} rounded-full`}
            />
          </div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="flex items-center gap-2 text-sm text-slate-400"
        >
          <Sparkles size={14} className="text-primary" />
          <span className="italic">{phrase}</span>
        </motion.div>
      </div>
    </motion.div>
  );
}
