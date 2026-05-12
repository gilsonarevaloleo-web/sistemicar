import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import {
  Sword,
  Crown,
  Shield,
  Target,
  Flame,
  Lock,
  Unlock,
  Users,
  TrendingUp,
  Snowflake,
  X
} from "lucide-react";
import { 
  UserProgression, 
  markAllianceProposalShown,
  recordActivity,
  checkCooldown
} from "@/lib/persistence";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const EMERALD = "#50C878";
const VIOLET = "#9B59B6";

const RANK_CONFIG: Record<string, { label: string; color: string; icon: typeof Shield; points: string }> = {
  iniciado: { label: "Iniciado", color: "#6b7280", icon: Shield, points: "0-49" },
  guerrero: { label: "Guerrero", color: AZURE, icon: Sword, points: "50-499" },
  operador: { label: "Operador", color: VIOLET, icon: Target, points: "500+" },
  arquitecto: { label: "Arquitecto", color: GOLD, icon: Crown, points: "Maestro" }
};

export function RankBadge({ rank, points, size = "md" }: { 
  rank: string; 
  points: number;
  size?: "sm" | "md" | "lg";
}) {
  const config = RANK_CONFIG[rank] || RANK_CONFIG.iniciado;
  const Icon = config.icon;
  const sizes = {
    sm: { badge: "px-2 py-1", icon: 12, text: "text-[10px]" },
    md: { badge: "px-3 py-1.5", icon: 14, text: "text-xs" },
    lg: { badge: "px-4 py-2", icon: 18, text: "text-sm" }
  };
  const s = sizes[size];

  return (
    <motion.div
      initial={{ scale: 0.9 }}
      animate={{ scale: 1 }}
      className={cn("flex items-center gap-1.5 rounded-full border", s.badge)}
      style={{ 
        backgroundColor: `${config.color}15`,
        borderColor: `${config.color}50`
      }}
      data-testid="badge-rank"
    >
      <Icon size={s.icon} style={{ color: config.color }} />
      <span className={cn("font-bold uppercase tracking-wider", s.text)} style={{ color: config.color }}>
        {config.label}
      </span>
      <span className={cn("opacity-60", s.text)} style={{ color: config.color }}>
        ({points} pts)
      </span>
    </motion.div>
  );
}

export function WarriorChallengeIndicator({ progression }: { progression: UserProgression }) {
  if (progression.warriorChallengeCompleted) return null;
  if (!progression.warriorChallengeUnlocked) {
    const daysLeft = 5 - progression.registrationDays;
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-2xl border"
        style={{ 
          backgroundColor: "rgba(107, 114, 128, 0.1)",
          borderColor: "rgba(107, 114, 128, 0.3)"
        }}
        data-testid="warrior-challenge-locked"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-slate-800">
            <Lock size={18} className="text-slate-500" />
          </div>
          <div className="flex-1">
            <h4 className="text-sm font-bold text-slate-400">Reto de Guerrero</h4>
            <p className="text-xs text-slate-600">
              {daysLeft > 0 
                ? `Bloqueado • Regresa ${daysLeft} día${daysLeft > 1 ? "s" : ""} más`
                : "Desbloqueando..."}
            </p>
          </div>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map(d => (
              <div
                key={d}
                className="w-2 h-2 rounded-full"
                style={{ 
                  backgroundColor: d <= progression.registrationDays ? AZURE : "rgba(255,255,255,0.1)" 
                }}
              />
            ))}
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-2xl border"
      style={{ 
        backgroundColor: `${AZURE}10`,
        borderColor: `${AZURE}40`,
        boxShadow: `0 0 20px ${AZURE}20`
      }}
      data-testid="warrior-challenge-active"
    >
      <div className="flex items-center gap-3">
        <motion.div 
          className="w-10 h-10 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: `${AZURE}20` }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 2 }}
        >
          <Sword size={18} style={{ color: AZURE }} />
        </motion.div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-white">Reto de Guerrero Activo</h4>
          <p className="text-xs" style={{ color: AZURE }}>
            Completa 3 misiones difíciles consecutivas
          </p>
        </div>
        <div className="flex gap-2">
          {[1, 2, 3].map(n => (
            <motion.div
              key={n}
              className="w-8 h-8 rounded-full border-2 flex items-center justify-center"
              style={{ 
                borderColor: n <= progression.consecutiveMissionStreak ? EMERALD : "rgba(255,255,255,0.2)",
                backgroundColor: n <= progression.consecutiveMissionStreak ? `${EMERALD}20` : "transparent"
              }}
              animate={n === progression.consecutiveMissionStreak + 1 ? { scale: [1, 1.1, 1] } : {}}
              transition={{ repeat: Infinity, duration: 1.5 }}
            >
              {n <= progression.consecutiveMissionStreak ? (
                <Flame size={14} style={{ color: EMERALD }} />
              ) : (
                <span className="text-xs text-slate-600">{n}</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
      {progression.consecutiveMissionStreak > 0 && (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-center mt-3 text-slate-500"
        >
          Racha actual: <span style={{ color: EMERALD }}>{progression.consecutiveMissionStreak}/3</span>
          {progression.consecutiveMissionStreak === 2 && " • ¡Una más!"}
        </motion.p>
      )}
    </motion.div>
  );
}

export function AllianceProposalModal({ 
  progression, 
  onClose,
  userId 
}: { 
  progression: UserProgression;
  onClose: () => void;
  userId: string;
}) {
  const [, navigate] = useLocation();

  if (!progression.allianceProposalUnlocked || progression.allianceProposalShown) {
    return null;
  }

  const handleAccept = async () => {
    await markAllianceProposalShown(userId);
    navigate("/socios");
    onClose();
  };

  const handleDecline = async () => {
    await markAllianceProposalShown(userId);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
        data-testid="modal-alliance"
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="w-full max-w-md rounded-3xl border p-6 space-y-6"
          style={{ 
            backgroundColor: "#0a0a0a",
            borderColor: `${GOLD}40`,
            boxShadow: `0 0 60px ${GOLD}30`
          }}
        >
          <div className="text-center">
            <motion.div
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ 
                background: `linear-gradient(135deg, ${GOLD}30, ${VIOLET}20)`,
                border: `2px solid ${GOLD}`
              }}
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ repeat: Infinity, duration: 4 }}
            >
              <Crown size={36} style={{ color: GOLD }} />
            </motion.div>
            <h2 className="text-xl font-black text-white mb-2">
              Propuesta de Alianza
            </h2>
            <p className="text-sm text-slate-400 italic" style={{ fontFamily: "Georgia, serif" }}>
              "Los guerreros probados expanden el imperio"
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${EMERALD}10` }}>
              <TrendingUp size={20} style={{ color: EMERALD }} />
              <div>
                <p className="text-sm font-bold text-white">Tu Dominio Está Probado</p>
                <p className="text-xs text-slate-500">
                  {progression.totalMissionsCompleted} misiones • 7 días de esperanza alta
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: `${GOLD}10` }}>
              <Users size={20} style={{ color: GOLD }} />
              <div>
                <p className="text-sm font-bold text-white">Misión de Expansión</p>
                <p className="text-xs text-slate-500">
                  Gana el 30% de cada guerrero que reclutes
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleDecline}
              className="flex-1 py-3 rounded-xl border text-sm font-bold transition-colors hover:bg-white/5"
              style={{ borderColor: "rgba(255,255,255,0.2)", color: "#6b7280" }}
              data-testid="button-decline-alliance"
            >
              Ahora no
            </button>
            <motion.button
              onClick={handleAccept}
              className="flex-1 py-3 rounded-xl text-sm font-black transition-colors"
              style={{ 
                background: `linear-gradient(135deg, ${GOLD}, ${GOLD}cc)`,
                color: "#000"
              }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="button-accept-alliance"
            >
              Ver Detalles
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export function CooldownOverlay({ 
  daysInactive, 
  onContinue 
}: { 
  daysInactive: number;
  onContinue: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,10,0.95)" }}
      data-testid="overlay-cooldown"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        className="w-full max-w-md rounded-3xl border p-6 space-y-6 text-center"
        style={{ 
          backgroundColor: "#050510",
          borderColor: "rgba(100, 150, 255, 0.3)"
        }}
      >
        <motion.div
          className="w-20 h-20 rounded-full mx-auto flex items-center justify-center"
          style={{ backgroundColor: "rgba(100, 150, 255, 0.1)" }}
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
        >
          <Snowflake size={36} className="text-blue-400" />
        </motion.div>

        <div>
          <h2 className="text-xl font-black text-white mb-2">
            Sistema en Enfriamiento
          </h2>
          <p className="text-sm text-slate-400">
            Detectamos {daysInactive} días de inactividad.
          </p>
          <p className="text-sm text-slate-500 mt-2 italic" style={{ fontFamily: "Georgia, serif" }}>
            "La soberanía requiere atención constante"
          </p>
        </div>

        <div className="p-4 rounded-xl" style={{ backgroundColor: "rgba(255,255,255,0.03)" }}>
          <p className="text-xs text-slate-500 mb-2">Tu progreso se ha reiniciado:</p>
          <div className="flex justify-center gap-4 text-center">
            <div>
              <p className="text-2xl font-black text-red-400">0</p>
              <p className="text-[10px] text-slate-600 uppercase">Días</p>
            </div>
            <div>
              <p className="text-2xl font-black text-red-400">0</p>
              <p className="text-[10px] text-slate-600 uppercase">Racha</p>
            </div>
          </div>
        </div>

        <motion.button
          onClick={onContinue}
          className="w-full py-4 rounded-xl text-sm font-black"
          style={{ 
            background: `linear-gradient(135deg, ${AZURE}, ${AZURE}cc)`,
            color: "#fff"
          }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          data-testid="button-continue-cooldown"
        >
          Comenzar de Nuevo
        </motion.button>
      </motion.div>
    </motion.div>
  );
}

export function useProgressionEffects(userId: string | undefined) {
  const [showCooldown, setShowCooldown] = useState(false);
  const [cooldownDays, setCooldownDays] = useState(0);
  const [warriorUnlocked, setWarriorUnlocked] = useState(false);

  useEffect(() => {
    if (!userId) return;
    
    const checkEffects = async () => {
      const cooldown = await checkCooldown(userId);
      if (cooldown.inCooldown && cooldown.daysInactive > 0) {
        setCooldownDays(cooldown.daysInactive);
        setShowCooldown(true);
      }

      const activity = await recordActivity(userId);
      if (activity.warriorUnlocked) {
        setWarriorUnlocked(true);
      }
    };

    checkEffects();
  }, [userId]);

  return {
    showCooldown,
    cooldownDays,
    closeCooldown: () => setShowCooldown(false),
    warriorUnlocked
  };
}
