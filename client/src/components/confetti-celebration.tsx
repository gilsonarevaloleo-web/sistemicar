import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface ConfettiCelebrationProps {
  trigger: boolean;
  type?: "small" | "medium" | "large";
}

const confettiColors = [
  "#6366f1", // primary purple
  "#f59e0b", // amber
  "#10b981", // emerald
  "#f43f5e", // rose
  "#3b82f6", // blue
  "#8b5cf6", // violet
];

export function ConfettiCelebration({ trigger, type = "small" }: ConfettiCelebrationProps) {
  const [particles, setParticles] = useState<Array<{
    id: number;
    x: number;
    y: number;
    color: string;
    rotation: number;
    scale: number;
    delay: number;
  }>>([]);

  useEffect(() => {
    if (trigger) {
      const count = type === "large" ? 30 : type === "medium" ? 18 : 10;
      const newParticles = Array.from({ length: count }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 100,
        y: Math.random() * 30 - 10,
        color: confettiColors[Math.floor(Math.random() * confettiColors.length)],
        rotation: Math.random() * 360,
        scale: 0.5 + Math.random() * 0.5,
        delay: Math.random() * 0.3,
      }));
      setParticles(newParticles);
      
      const timeout = setTimeout(() => setParticles([]), 2000);
      return () => clearTimeout(timeout);
    }
  }, [trigger, type]);

  return (
    <AnimatePresence>
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{
            opacity: 1,
            x: `${particle.x}%`,
            y: `${particle.y}%`,
            scale: 0,
            rotate: particle.rotation,
          }}
          animate={{
            opacity: [1, 1, 0],
            y: [`${particle.y}%`, `${particle.y + 80}%`],
            scale: [0, particle.scale, particle.scale * 0.5],
            rotate: particle.rotation + 180,
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            delay: particle.delay,
            ease: "easeOut",
          }}
          className="fixed pointer-events-none z-50"
          style={{
            width: type === "large" ? 12 : type === "medium" ? 8 : 6,
            height: type === "large" ? 12 : type === "medium" ? 8 : 6,
            backgroundColor: particle.color,
            borderRadius: Math.random() > 0.5 ? "50%" : "2px",
          }}
        />
      ))}
    </AnimatePresence>
  );
}

interface PointsPulseProps {
  points: number;
  show: boolean;
}

export function PointsPulse({ points, show }: PointsPulseProps) {
  if (!show) return null;

  const isPositive = points > 0;
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 0, scale: 0.5 }}
          animate={{ opacity: 1, y: -30, scale: 1 }}
          exit={{ opacity: 0, y: -60, scale: 0.8 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none ${
            isPositive ? "text-emerald-400" : "text-rose-400"
          } font-black text-4xl`}
        >
          {isPositive ? `+${points}` : points} CP
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function CPMilestoneToast({ milestone }: { milestone: number }) {
  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      className="flex items-center gap-3 bg-gradient-to-r from-amber-500/20 to-orange-500/20 border border-amber-500/30 rounded-xl px-4 py-3"
    >
      <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
        <span className="text-white text-lg">🎯</span>
      </div>
      <div>
        <p className="text-amber-400 font-bold">¡Hito alcanzado!</p>
        <p className="text-slate-300 text-sm">{milestone} CP acumulados</p>
      </div>
    </motion.div>
  );
}
