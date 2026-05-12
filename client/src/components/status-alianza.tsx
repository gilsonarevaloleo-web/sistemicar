import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Star, 
  Link2, 
  Copy, 
  Check,
  Sparkles,
  Crown,
  ChevronRight,
  Zap
} from "lucide-react";
import { UserProgression, updateProgression, subscribeToConviccion } from "@/lib/persistence";
import { toast } from "sonner";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const CYAN = "#00FFC3";
const UNLOCK_THRESHOLD = 232;
const CONVICCION_REQUIRED = 4;

interface Milestone {
  pts: number;
  label: string;
  icon: string;
  color: string;
}

const MILESTONES: Milestone[] = [
  { pts: 0,     label: "Observador",         icon: "👁",  color: "#71717a" },
  { pts: 100,   label: "Centurión",          icon: "🏆",  color: "#CD7F32" },
  { pts: 232,   label: "Alianza Activa",     icon: "⚔️",  color: AZURE },
  { pts: 300,   label: "Guerrero",           icon: "🗡",  color: "#C0C0C0" },
  { pts: 700,   label: "Soberanía",          icon: "👑",  color: GOLD },
  { pts: 750,   label: "Leyenda",            icon: "👑",  color: GOLD },
  { pts: 1500,  label: "Titán",              icon: "🔱",  color: "#9b5de5" },
  { pts: 2500,  label: "Arconte",            icon: "⚡",  color: "#f72585" },
  { pts: 5000,  label: "Soberano",           icon: "🌟",  color: CYAN },
  { pts: 10000, label: "Gran Maestro",       icon: "🔮",  color: "#7b2ff7" },
  { pts: 25000, label: "Arquitecto Supremo", icon: "🌌",  color: "#00FFC3" },
  { pts: 50000, label: "Creador del Juego",  icon: "✦",   color: GOLD },
];

function getMilestoneSegment(pts: number): { prev: Milestone; next: Milestone; pct: number } {
  for (let i = MILESTONES.length - 1; i >= 0; i--) {
    if (pts >= MILESTONES[i].pts && i < MILESTONES.length - 1) {
      const prev = MILESTONES[i];
      const next = MILESTONES[i + 1];
      const range = next.pts - prev.pts;
      const earned = pts - prev.pts;
      const pct = Math.min((earned / range) * 100, 100);
      return { prev, next, pct };
    }
  }
  const last = MILESTONES[MILESTONES.length - 1];
  return { prev: last, next: last, pct: 100 };
}

interface StatusAlianzaProps {
  progression: UserProgression | null;
  userId: string;
  onRankUpgrade?: () => void;
  conviccionLevel?: number;
}

function generateReferralCode(userId: string): string {
  const base = userId.slice(-6).toUpperCase();
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `SIST-${base}${random}`;
}

export function StatusAlianza({ progression, userId, onRankUpgrade, conviccionLevel: propConviccion }: StatusAlianzaProps) {
  const [copied, setCopied] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [justUnlocked, setJustUnlocked] = useState(false);
  const [internalConviccion, setInternalConviccion] = useState(0);

  const conviccion = propConviccion !== undefined ? propConviccion : internalConviccion;

  useEffect(() => {
    if (propConviccion !== undefined || !userId) return;
    const unsub = subscribeToConviccion(userId, (level) => setInternalConviccion(level), () => {});
    return unsub;
  }, [userId, propConviccion]);

  const sovereigntyPoints = progression?.sovereigntyPoints || 0;
  const meetsConviccion = conviccion >= CONVICCION_REQUIRED;
  const meetsPS = sovereigntyPoints >= UNLOCK_THRESHOLD;
  const isFortalecido = progression?.afiliadoActivo || (meetsConviccion && meetsPS);
  const progress = Math.min((sovereigntyPoints / UNLOCK_THRESHOLD) * 100, 100);
  const remaining = Math.max(UNLOCK_THRESHOLD - sovereigntyPoints, 0);
  const remainingConviccion = Math.max(CONVICCION_REQUIRED - conviccion, 0);

  const segment = getMilestoneSegment(sovereigntyPoints);
  const ptsInSegment = sovereigntyPoints - segment.prev.pts;
  const ptsNeeded = segment.next.pts - segment.prev.pts;
  const ptsFaltan = Math.max(segment.next.pts - sovereigntyPoints, 0);
  const isMaxMilestone = segment.prev.pts === segment.next.pts;

  const currentMilestone = MILESTONES.slice().reverse().find(m => sovereigntyPoints >= m.pts) || MILESTONES[0];

  useEffect(() => {
    if (!progression || !userId) return;
    
    if (meetsConviccion && meetsPS && !progression.afiliadoActivo) {
      const newCode = generateReferralCode(userId);
      
      updateProgression(userId, {
        afiliadoActivo: true,
        referralCode: newCode,
        rank: "guerrero"
      }).then(() => {
        setJustUnlocked(true);
        setShowCelebration(true);
        onRankUpgrade?.();
        
        setTimeout(() => setShowCelebration(false), 5000);
      });
    }
  }, [sovereigntyPoints, conviccion, progression?.afiliadoActivo, userId, onRankUpgrade]);

  const referralLink = progression?.referralCode 
    ? `https://sistemicar.app/?ref=${progression.referralCode}`
    : null;

  const copyLink = () => {
    if (referralLink) {
      navigator.clipboard.writeText(referralLink);
      setCopied(true);
      toast.success("Link copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!progression) return null;

  return (
    <>
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={() => setShowCelebration(false)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-gradient-to-br from-amber-900/90 to-zinc-900 rounded-3xl p-8 max-w-sm w-full text-center border-2"
              style={{ borderColor: GOLD }}
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
                transition={{ duration: 0.5, repeat: 3 }}
              >
                <Crown size={64} className="mx-auto mb-4" style={{ color: GOLD }} />
              </motion.div>
              
              <h2 className="text-2xl font-black mb-2" style={{ color: GOLD }}>
                ¡FELICIDADES GUERRERO!
              </h2>
              <p className="text-white/80 mb-4">
                Has demostrado consistencia y disciplina.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <Sparkles size={20} style={{ color: GOLD }} />
                  <span className="text-white text-sm">Acceso Premium Desbloqueado</span>
                </div>
                <div className="flex items-center gap-3 bg-white/10 rounded-xl p-3">
                  <Link2 size={20} style={{ color: AZURE }} />
                  <span className="text-white text-sm">Negocio de Alianza 30%</span>
                </div>
              </div>

              <p className="text-xs text-zinc-400">
                Toca fuera para cerrar
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border overflow-hidden"
        style={{
          backgroundColor: isFortalecido ? `${GOLD}08` : "rgba(255,255,255,0.02)",
          borderColor: isFortalecido ? `${GOLD}40` : "rgba(255,255,255,0.1)"
        }}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {isFortalecido ? (
                <Trophy size={18} style={{ color: GOLD }} />
              ) : (
                <Star size={18} className="text-zinc-500" />
              )}
              <span 
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: isFortalecido ? GOLD : "#71717a" }}
              >
                {isFortalecido ? "GUERRERO FORTALECIDO" : "OBSERVADOR"}
              </span>
            </div>
            <span className="text-sm font-black" style={{ color: GOLD }}>
              {sovereigntyPoints.toLocaleString()} pts
            </span>
          </div>

          {!isFortalecido ? (
            <>
              <div className="relative h-2 rounded-full bg-zinc-800 overflow-hidden mb-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{ backgroundColor: AZURE }}
                />
              </div>
              <p className="text-[10px] text-zinc-500 text-center">
                {!meetsPS && (
                  <>Faltan <span className="font-bold text-white">{remaining} pts</span> de Soberanía</>
                )}
                {!meetsPS && !meetsConviccion && " y "}
                {!meetsConviccion && (
                  <><span className="font-bold text-white">{remainingConviccion}</span> sesiones de convicción</>
                )}
                {" "}para Alianza 30%
              </p>
            </>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-xs text-zinc-400">
                <Check size={14} className="text-green-400" />
                <span>Alianza activa - Ganas 30% por cada referido</span>
              </div>
              
              {referralLink && (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={referralLink}
                    readOnly
                    className="flex-1 text-[10px] bg-black/50 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-300"
                    data-testid="input-referral-link"
                  />
                  <button
                    onClick={copyLink}
                    className="p-2 rounded-lg transition-colors"
                    style={{ backgroundColor: copied ? "#22c55e20" : `${GOLD}20` }}
                    data-testid="button-copy-referral"
                  >
                    {copied ? (
                      <Check size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} style={{ color: GOLD }} />
                    )}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* BARRA DE PROGRESIÓN INFINITA POR HITOS */}
          <div className="mt-4 pt-3" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            
            {/* Hito actual → próximo hito */}
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="text-sm">{currentMilestone.icon}</span>
                <span
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: currentMilestone.color }}
                  data-testid="text-sovereignty-label"
                >
                  {currentMilestone.label}
                </span>
              </div>
              {!isMaxMilestone && (
                <div className="flex items-center gap-1">
                  <ChevronRight size={10} className="text-zinc-600" />
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                    {segment.next.label}
                  </span>
                  <span className="text-sm">{segment.next.icon}</span>
                </div>
              )}
            </div>

            {/* Barra del segmento actual */}
            <div 
              className="relative h-2.5 rounded-full overflow-hidden mb-1.5"
              style={{ backgroundColor: "rgba(212, 175, 55, 0.1)" }}
              data-testid="bar-sovereignty-progress"
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${isMaxMilestone ? 100 : segment.pct}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ 
                  backgroundColor: isMaxMilestone ? CYAN : segment.next.color,
                  boxShadow: `0 0 6px ${isMaxMilestone ? CYAN : segment.next.color}60`
                }}
              />
            </div>

            {/* Contador: X/Y pts del segmento */}
            <div className="flex items-center justify-between">
              {!isMaxMilestone ? (
                <>
                  <span className="text-[10px] text-zinc-500">
                    <span className="font-bold text-white">{sovereigntyPoints.toLocaleString()}</span>
                    <span className="text-zinc-600"> / {segment.next.pts.toLocaleString()} PS</span>
                  </span>
                  <span className="text-[10px]" style={{ color: segment.next.color }}>
                    Faltan <span className="font-bold">{ptsFaltan.toLocaleString()} pts</span>
                  </span>
                </>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-[10px] text-center w-full font-bold uppercase tracking-widest"
                  style={{ color: CYAN, textShadow: `0 0 8px ${CYAN}80` }}
                  data-testid="text-soberano-certificado"
                >
                  ✦ Creador del Juego — {sovereigntyPoints.toLocaleString()} PS ✦
                </motion.p>
              )}
            </div>

            {/* Hitos completados (compacto) */}
            {sovereigntyPoints > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {MILESTONES.filter(m => m.pts > 0 && m.pts <= sovereigntyPoints).map(m => (
                  <span
                    key={m.pts}
                    className="text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide"
                    style={{ 
                      backgroundColor: `${m.color}18`,
                      color: m.color,
                      border: `1px solid ${m.color}30`
                    }}
                  >
                    {m.icon} {m.label}
                  </span>
                ))}
              </div>
            )}

            {/* Mini-barras de módulo */}
            {(() => {
              const ptsEspejo = progression?.ptsEspejo || 0;
              const ptsPlanificacion = progression?.ptsPlanificacion || 0;
              const ptsDeposito = progression?.ptsDeposito || 0;

              const MOD_THRESHOLDS = [10, 50, 150, 500];
              const MOD_LABELS = ["Iniciado", "Centurión", "Guerrero", "Soberano"];

              function getModLevel(pts: number): { label: string; next: number; pct: number } {
                for (let i = MOD_THRESHOLDS.length - 1; i >= 0; i--) {
                  if (pts >= MOD_THRESHOLDS[i]) {
                    if (i === MOD_THRESHOLDS.length - 1) return { label: MOD_LABELS[i], next: MOD_THRESHOLDS[i], pct: 100 };
                    const range = MOD_THRESHOLDS[i + 1] - MOD_THRESHOLDS[i];
                    const earned = pts - MOD_THRESHOLDS[i];
                    return { label: MOD_LABELS[i], next: MOD_THRESHOLDS[i + 1], pct: Math.min((earned / range) * 100, 100) };
                  }
                }
                return { label: "—", next: MOD_THRESHOLDS[0], pct: Math.min((pts / MOD_THRESHOLDS[0]) * 100, 100) };
              }

              const mods = [
                { key: "espejo",        label: "Espejo",         pts: ptsEspejo,        color: "#FF3131", icon: "🧪" },
                { key: "planificacion", label: "Planificación",  pts: ptsPlanificacion, color: "#D4AF37", icon: "🗓" },
                { key: "deposito",      label: "Depósito",       pts: ptsDeposito,      color: "#10B981", icon: "💎" },
              ];

              return (
                <div className="mt-3 pt-2.5 space-y-2" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  {mods.map(mod => {
                    const level = getModLevel(mod.pts);
                    return (
                      <div key={mod.key} data-testid={`module-bar-${mod.key}`}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: mod.color }}>
                            {mod.icon} {mod.label}
                          </span>
                          <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)" }}>
                            {level.label} · {mod.pts}/{level.next} pts
                          </span>
                        </div>
                        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: `${mod.color}15` }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${level.pct}%` }}
                            transition={{ duration: 0.6, ease: "easeOut" }}
                            className="h-full rounded-full"
                            style={{ backgroundColor: mod.color, boxShadow: `0 0 4px ${mod.color}60` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      </motion.div>
    </>
  );
}
