/**
 * ESPEJO - Módulo de Inteligencia Emocional
 * 
 * ¿Cómo te sientes frente a X? (Familia, Trabajo, Relaciones, etc.)
 * 4 Ejes de Inteligencia Emocional: PERCIBO, RECONOZCO, CUENTO CON, TRANSFORMO
 * 
 * Dos modos:
 * - Captura Libre: Para mentes en proceso, fragmentos sin orden
 * - Estructurado: Análisis profundo con los 4 ejes
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { 
  Eye, 
  EyeOff,
  Heart,
  Briefcase,
  Users,
  DollarSign,
  Activity,
  Target,
  Sparkles,
  Brain,
  HandHeart,
  Wand2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  History,
  TrendingUp,
  HelpCircle,
  X,
  Plus,
  Rocket,
  Star
} from "lucide-react";
import { toast } from "sonner";
import { ConfettiCelebration, PointsPulse } from "@/components/confetti-celebration";
import { 
  RankBadge, 
  WarriorChallengeIndicator, 
  AllianceProposalModal,
  CooldownOverlay,
  useProgressionEffects
} from "@/components/funnel-components";
import { 
  subscribeToProgression, 
  UserProgression, 
  recordActivity, 
  subscribeToEnergyLogs,
  addEnergyLog,
  calculateTotalCP,
  awardSovereigntyPoints,
  addPrincipioMaestro,
  type EnergyLog
} from "@/lib/persistence";
import { useAuthContext } from "@/App";
import { ManualTriggerButton } from "@/components/master-manual-drawer";

const GOLD = "#D4AF37";
const VIOLET = "#7C3AED";
const EMERALD = "#10B981";
const ELECTRIC_BLUE = "#3b82f6";
const CORAL = "#F97316";
const DARK_BG = "#050505";

// Contextos de reflexión emocional
const CONTEXTOS = [
  { id: "familia", label: "Familia", icon: Heart, color: "#EF4444" },
  { id: "trabajo", label: "Trabajo", icon: Briefcase, color: ELECTRIC_BLUE },
  { id: "relaciones", label: "Relaciones", icon: Users, color: VIOLET },
  { id: "finanzas", label: "Finanzas", icon: DollarSign, color: EMERALD },
  { id: "salud", label: "Salud", icon: Activity, color: CORAL },
  { id: "proyecto", label: "Proyecto", icon: Target, color: GOLD }
];

// Los 4 Ejes de Inteligencia Emocional
const EJES_EMOCIONALES = [
  { 
    id: "percibo", 
    label: "PERCIBO", 
    pregunta: "¿Qué siento/percibo en esta situación?",
    placeholder: "La emoción que surge en mí...",
    icon: Eye,
    color: ELECTRIC_BLUE,
    points: 5
  },
  { 
    id: "reconozco", 
    label: "RECONOZCO", 
    pregunta: "¿Qué patrones emocionales identifico?",
    placeholder: "El patrón que se repite...",
    icon: Brain,
    color: VIOLET,
    points: 8
  },
  { 
    id: "cuento_con", 
    label: "CUENTO CON", 
    pregunta: "¿Qué recursos emocionales tengo/necesito?",
    placeholder: "Lo que me sostiene o necesito desarrollar...",
    icon: HandHeart,
    color: EMERALD,
    points: 10
  },
  { 
    id: "transformo", 
    label: "TRANSFORMO", 
    pregunta: "¿Hacia dónde quiero que evolucione esto?",
    placeholder: "La transformación que deseo...",
    icon: Wand2,
    color: GOLD,
    points: 15
  }
];

// Para modo Captura Libre
const CAPTURA_EJES = [
  { id: "percibo", label: "PERCIBO", icon: Eye, color: ELECTRIC_BLUE, placeholder: "Emociones que siento..." },
  { id: "reconozco", label: "RECONOZCO", icon: Brain, color: VIOLET, placeholder: "Patrones que noto..." },
  { id: "cuento_con", label: "CUENTO CON", icon: HandHeart, color: EMERALD, placeholder: "Recursos que tengo..." },
  { id: "transformo", label: "TRANSFORMO", icon: Wand2, color: GOLD, placeholder: "Cómo quiero que evolucione..." }
];

// Tutorial Steps
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Bienvenido al Espejo",
    description: "Este es tu espacio de inteligencia emocional. Aquí reflexionas sobre cómo te sientes frente a las diferentes áreas de tu vida.",
    icon: Eye
  },
  {
    id: "contextos",
    title: "Elige un Contexto",
    description: "¿Familia? ¿Trabajo? ¿Relaciones? Selecciona el área de tu vida sobre la cual quieres reflexionar.",
    icon: Heart
  },
  {
    id: "percibo",
    title: "PERCIBO",
    description: "¿Qué sientes? La emoción en bruto, sin filtros. Es el primer paso hacia la claridad emocional.",
    icon: Eye
  },
  {
    id: "reconozco",
    title: "RECONOZCO",
    description: "¿Qué patrones notas? Identificar patrones te da poder sobre tus reacciones automáticas.",
    icon: Brain
  },
  {
    id: "cuento_con",
    title: "CUENTO CON",
    description: "¿Qué recursos emocionales tienes? Reconocer tu fortaleza interior y lo que necesitas desarrollar.",
    icon: HandHeart
  },
  {
    id: "transformo",
    title: "TRANSFORMO",
    description: "¿Hacia dónde quieres que evolucione? El poder de dirigir tu transformación emocional.",
    icon: Wand2
  }
];

const TUTORIAL_STORAGE_KEY = "sistemicar_espejo_tutorial_done";

type EspejoMode = "estructurado" | "captura";
type Phase = "selector" | "reflexion" | "captura" | "celebracion";

interface FragmentoCaptura {
  id: string;
  eje: string;
  contenido: string;
  contexto?: string;
  createdAt: Date;
}

interface SanacionRespuesta {
  eje: string;
  texto: string;
  guardado: boolean;
}

interface SesionEspejo {
  id: string;
  contexto: string;
  wizardStep: number;
  respuestas: { [ejeId: string]: string };
  sanacionRespuestas: SanacionRespuesta[];
  totalPuntos: number;
  completada: boolean;
  fecha: string;
}

const SESION_STORAGE_KEY = "sistemicar_espejo_sesion";
const SESIONES_COMPLETADAS_KEY = "sistemicar_espejo_sesiones";

export default function Console() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [mode, setMode] = useState<EspejoMode>("captura");
  const [phase, setPhase] = useState<Phase>("selector");
  const [selectedContexto, setSelectedContexto] = useState<string | null>(null);
  const [respuestas, setRespuestas] = useState<{ [ejeId: string]: string }>({});
  const [pointsAnimation, setPointsAnimation] = useState<{ points: number; id: number } | null>(null);
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [showAllianceModal, setShowAllianceModal] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [logs, setLogs] = useState<EnergyLog[]>([]);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [fragmentos, setFragmentos] = useState<FragmentoCaptura[]>([]);
  const [capturaActiva, setCapturaActiva] = useState<string | null>(null);
  const [textoCaptura, setTextoCaptura] = useState("");
  const [marcarSelloEspejo, setMarcarSelloEspejo] = useState(false);
  const [wizardStep, setWizardStep] = useState(0);
  const [sanacionRespuestas, setSanacionRespuestas] = useState<SanacionRespuesta[]>([]);
  const [totalPuntosSesion, setTotalPuntosSesion] = useState(0);
  const [sesionPendiente, setSesionPendiente] = useState<SesionEspejo | null>(null);
  const [sesionesCompletadas, setSesionesCompletadas] = useState<SesionEspejo[]>([]);
  const [sesionExpandida, setSesionExpandida] = useState<string | null>(null);

  const { showCooldown, cooldownDays, closeCooldown } = useProgressionEffects(user?.uid);

  // Cargar sesión pendiente y sesiones completadas
  useEffect(() => {
    const pendiente = localStorage.getItem(SESION_STORAGE_KEY);
    if (pendiente) {
      try {
        setSesionPendiente(JSON.parse(pendiente));
      } catch (e) {
        localStorage.removeItem(SESION_STORAGE_KEY);
      }
    }
    
    const completadas = localStorage.getItem(SESIONES_COMPLETADAS_KEY);
    if (completadas) {
      try {
        setSesionesCompletadas(JSON.parse(completadas));
      } catch (e) {
        localStorage.removeItem(SESIONES_COMPLETADAS_KEY);
      }
    }
  }, []);

  // Guardar sesión en progreso
  useEffect(() => {
    if (phase === "reflexion" && selectedContexto && wizardStep > 0) {
      const sesion: SesionEspejo = {
        id: `sesion_${Date.now()}`,
        contexto: selectedContexto,
        wizardStep,
        respuestas,
        sanacionRespuestas,
        totalPuntos: totalPuntosSesion,
        completada: false,
        fecha: new Date().toISOString()
      };
      localStorage.setItem(SESION_STORAGE_KEY, JSON.stringify(sesion));
      setSesionPendiente(sesion);
    }
  }, [wizardStep, sanacionRespuestas, selectedContexto, phase]);

  const continuarSesion = () => {
    if (!sesionPendiente) return;
    setSelectedContexto(sesionPendiente.contexto);
    setWizardStep(sesionPendiente.wizardStep);
    setRespuestas(sesionPendiente.respuestas);
    setSanacionRespuestas(sesionPendiente.sanacionRespuestas);
    setTotalPuntosSesion(sesionPendiente.totalPuntos);
    setMode("estructurado");
    setPhase("reflexion");
  };

  const descartarSesion = () => {
    localStorage.removeItem(SESION_STORAGE_KEY);
    setSesionPendiente(null);
  };

  const guardarSesionCompletada = (sesion: SesionEspejo) => {
    const nuevas = [sesion, ...sesionesCompletadas].slice(0, 10);
    setSesionesCompletadas(nuevas);
    localStorage.setItem(SESIONES_COMPLETADAS_KEY, JSON.stringify(nuevas));
    localStorage.removeItem(SESION_STORAGE_KEY);
    setSesionPendiente(null);
  };

  useEffect(() => {
    const tutorialDone = localStorage.getItem(TUTORIAL_STORAGE_KEY);
    if (!tutorialDone) {
      setShowTutorial(true);
    }
  }, []);

  const completeTutorial = () => {
    localStorage.setItem(TUTORIAL_STORAGE_KEY, "true");
    setShowTutorial(false);
    setTutorialStep(0);
  };

  const nextTutorialStep = () => {
    if (tutorialStep < TUTORIAL_STEPS.length - 1) {
      setTutorialStep(prev => prev + 1);
    } else {
      completeTutorial();
    }
  };

  const prevTutorialStep = () => {
    if (tutorialStep > 0) {
      setTutorialStep(prev => prev - 1);
    }
  };

  const restartTutorial = () => {
    setTutorialStep(0);
    setShowTutorial(true);
  };

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToProgression(
      user.uid,
      (prog) => {
        setProgression(prog);
        if (prog.allianceProposalUnlocked && !prog.allianceProposalShown) {
          setShowAllianceModal(true);
        }
      },
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToEnergyLogs(
      user.uid,
      (data) => setLogs(data),
      (error) => console.error("Energy logs error:", error)
    );
    return unsubscribe;
  }, [user]);

  useEffect(() => {
    if (!user) return;
    recordActivity(user.uid).then(result => {
      if (result.warriorUnlocked) {
        toast.success("¡Reto de Guerrero Desbloqueado!", {
          description: "Completa 3 misiones difíciles consecutivas",
          duration: 5000
        });
      }
    });
  }, [user]);

  const handleSaveReflexion = async (ejeId: string) => {
    if (!user) return;
    
    const texto = respuestas[ejeId]?.trim();
    if (!texto || texto.length < 3) {
      toast.error("Escribe al menos 3 caracteres para continuar");
      return;
    }
    
    const eje = EJES_EMOCIONALES.find(e => e.id === ejeId);
    const contexto = CONTEXTOS.find(c => c.id === selectedContexto);
    const points = eje?.points || 5;
    
    try {
      await addEnergyLog(user.uid, { 
        text: `[${contexto?.label || "General"}] ${texto}`, 
        type: ejeId as EnergyLog["type"], 
        points 
      });
      
      await awardSovereigntyPoints(user.uid, points, `Espejo: ${eje?.label} - ${contexto?.label || "General"}`);
      
      setSanacionRespuestas(prev => [...prev, { eje: ejeId, texto, guardado: true }]);
      setTotalPuntosSesion(prev => prev + points);
      
      setPointsAnimation({ points, id: Date.now() });
      setTimeout(() => setPointsAnimation(null), 1500);
      
      if (wizardStep < 3) {
        setWizardStep(prev => prev + 1);
        toast.success(`+${points} · Siguiente paso`, {
          style: { backgroundColor: "#0a0a0a", border: `1px solid ${eje?.color}`, color: eje?.color }
        });
      } else {
        const bonusFinal = 20;
        const totalFinal = totalPuntosSesion + points + bonusFinal;
        await awardSovereigntyPoints(user.uid, bonusFinal, `Espejo: Sesión completa - ${contexto?.label || "General"}`);
        setTotalPuntosSesion(totalFinal);
        
        const nuevasRespuestas = [...sanacionRespuestas, { eje: ejeId, texto, guardado: true }];
        const sesionCompleta: SesionEspejo = {
          id: `sesion_${Date.now()}`,
          contexto: selectedContexto || "",
          wizardStep: 4,
          respuestas,
          sanacionRespuestas: nuevasRespuestas,
          totalPuntos: totalFinal,
          completada: true,
          fecha: new Date().toISOString()
        };
        guardarSesionCompletada(sesionCompleta);
        
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 4000);
        setPhase("celebracion");
      }
    } catch (error) {
      toast.error("Error al registrar");
    }
  };

  const addFragmento = async () => {
    if (!user || !capturaActiva || !textoCaptura.trim()) {
      if (!textoCaptura.trim()) {
        toast.error("Escribe algo antes de capturar");
      }
      return;
    }
    
    const nuevoFragmento: FragmentoCaptura = {
      id: `frag_${Date.now()}`,
      eje: capturaActiva,
      contenido: textoCaptura.trim(),
      contexto: selectedContexto || undefined,
      createdAt: new Date()
    };
    
    setFragmentos(prev => [nuevoFragmento, ...prev]);
    
    const eje = CAPTURA_EJES.find(e => e.id === capturaActiva);
    await awardSovereigntyPoints(user.uid, 3, `Espejo: Fragmento ${eje?.label}`);
    
    await addEnergyLog(user.uid, { 
      text: textoCaptura.trim(), 
      type: capturaActiva as EnergyLog["type"], 
      points: 3 
    });

    if (marcarSelloEspejo) {
      await addPrincipioMaestro({
        texto: textoCaptura.trim(),
        fuente: "sello_soberania",
        moduloOrigen: "espejo"
      });
      setMarcarSelloEspejo(false);
    }
    
    setTextoCaptura("");
    
    toast.success(marcarSelloEspejo ? "+3 PS · Sellado como Principio Maestro" : "+3 Puntos - Fragmento Capturado", {
      style: { backgroundColor: "#0a0a0a", border: `1px solid ${eje?.color}`, color: eje?.color }
    });
  };

  const getFragmentosByEje = (ejeId: string) => {
    return fragmentos.filter(f => f.eje === ejeId);
  };

  const startReflexion = (contextoId: string) => {
    setSelectedContexto(contextoId);
    setRespuestas({});
    setWizardStep(0);
    setSanacionRespuestas([]);
    setTotalPuntosSesion(0);
    setPhase("reflexion");
  };

  const startCapturaLibre = () => {
    setMode("captura");
    setPhase("captura");
  };

  const cp = calculateTotalCP(logs);

  const maskText = (text: string): string => {
    return text.replace(/./g, "•");
  };

  return (
    <div className="p-4 max-w-lg mx-auto min-h-screen pb-32" style={{ backgroundColor: DARK_BG }}>
      
      <ConfettiCelebration trigger={showConfetti} type="medium" />
      <PointsPulse points={pointsAnimation?.points || 0} show={!!pointsAnimation} />
      
      {showCooldown && (
        <CooldownOverlay daysInactive={cooldownDays} onContinue={closeCooldown} />
      )}

      {showAllianceModal && progression && user && (
        <AllianceProposalModal 
          progression={progression} 
          onClose={() => setShowAllianceModal(false)}
          userId={user.uid}
        />
      )}

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Eye size={24} style={{ color: GOLD }} />
              <h1 className="text-2xl font-black text-white">ESPEJO</h1>
            </div>
            <p className="text-xs text-slate-500">Inteligencia emocional</p>
          </div>
          <ManualTriggerButton manualType="espejo" />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={restartTutorial}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            title="Ver tutorial"
            data-testid="btn-ver-tutorial"
          >
            <HelpCircle size={16} className="text-slate-400" />
          </button>
          {phase !== "selector" && (
            <button
              onClick={() => setPhase("selector")}
              className="text-xs text-slate-400 hover:text-white transition-colors"
              data-testid="btn-volver"
            >
              ← Volver
            </button>
          )}
          <div className="text-right">
            <AnimatePresence>
              {pointsAnimation && (
                <motion.span
                  key={pointsAnimation.id}
                  initial={{ opacity: 1, y: 0 }}
                  animate={{ opacity: 0, y: -20 }}
                  className="absolute text-green-400 font-black"
                >
                  +{pointsAnimation.points}
                </motion.span>
              )}
            </AnimatePresence>
            <p className="text-xl font-black text-white">{cp > 0 ? "+" : ""}{cp}</p>
            <p className="text-[8px] text-slate-500 uppercase">CP</p>
          </div>
        </div>
      </div>

      {/* RANK BADGE */}
      {progression && (
        <div className="flex justify-center mb-4">
          <RankBadge rank={progression.rank} points={progression.points} size="sm" />
        </div>
      )}

      {/* WARRIOR CHALLENGE */}
      {progression && !progression.warriorChallengeCompleted && (
        <WarriorChallengeIndicator progression={progression} />
      )}

      <AnimatePresence mode="wait">
        {/* FASE: SELECTOR DE MODO Y CONTEXTO */}
        {phase === "selector" && (
          <motion.div
            key="selector"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Pestañas de Modo */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={startCapturaLibre}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === "captura" 
                    ? "text-black" 
                    : "bg-white/5 text-slate-400 border border-white/10"
                }`}
                style={mode === "captura" ? { backgroundColor: EMERALD } : {}}
                data-testid="tab-captura-libre"
              >
                <Sparkles size={16} />
                Captura Libre
              </button>
              <button
                onClick={() => setMode("estructurado")}
                className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  mode === "estructurado" 
                    ? "text-black" 
                    : "bg-white/5 text-slate-400 border border-white/10"
                }`}
                style={mode === "estructurado" ? { backgroundColor: GOLD } : {}}
                data-testid="tab-estructurado"
              >
                <Target size={16} />
                Estructurado
              </button>
            </div>

            {/* Descripción del modo */}
            <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
              <p className="text-xs text-slate-400">
                {mode === "captura" 
                  ? "Captura emociones sin orden. Perfecto cuando necesitas desahogarte o procesar."
                  : "Análisis profundo: elige un área de tu vida y reflexiona con los 4 ejes."
                }
              </p>
            </div>

            {/* Selector de Contexto (solo para modo estructurado) */}
            {mode === "estructurado" && (
              <>
                <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center mb-4">
                  ¿Sobre qué área quieres reflexionar?
                </p>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {CONTEXTOS.map(contexto => {
                    const Icon = contexto.icon;
                    return (
                      <motion.button
                        key={contexto.id}
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => startReflexion(contexto.id)}
                        className="p-4 rounded-xl flex flex-col items-center gap-2 border transition-all"
                        style={{ 
                          backgroundColor: "#0a0a0a",
                          borderColor: `${contexto.color}40`
                        }}
                        data-testid={`contexto-${contexto.id}`}
                      >
                        <div 
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${contexto.color}20` }}
                        >
                          <Icon size={20} style={{ color: contexto.color }} />
                        </div>
                        <span className="text-xs font-bold text-white">{contexto.label}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </>
            )}

            {/* Sesión Pendiente */}
            {mode === "estructurado" && sesionPendiente && !sesionPendiente.completada && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 rounded-xl border-2"
                style={{ backgroundColor: `${CORAL}15`, borderColor: CORAL }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Rocket size={18} style={{ color: CORAL }} />
                    <span className="text-sm font-bold text-white">Sesión en Progreso</span>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-lg" style={{ backgroundColor: `${CORAL}30`, color: CORAL }}>
                    Paso {sesionPendiente.wizardStep}/4
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  {CONTEXTOS.find(c => c.id === sesionPendiente.contexto)?.label || "Sesión"} · +{sesionPendiente.totalPuntos} pts
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={continuarSesion}
                    className="flex-1 py-2 rounded-lg text-sm font-bold"
                    style={{ backgroundColor: CORAL, color: "#000" }}
                    data-testid="btn-continuar-sesion"
                  >
                    Continuar
                  </button>
                  <button
                    onClick={descartarSesion}
                    className="px-4 py-2 rounded-lg text-sm text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                    data-testid="btn-descartar-sesion"
                  >
                    Descartar
                  </button>
                </div>
              </motion.div>
            )}

            {/* Sesiones Completadas */}
            {sesionesCompletadas.length > 0 && (
              <div className="mt-4">
                <button
                  onClick={() => setShowStats(!showStats)}
                  className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10"
                  data-testid="btn-ver-sesiones"
                >
                  <div className="flex items-center gap-2">
                    <History size={16} className="text-slate-400" />
                    <span className="text-sm text-slate-400">Sesiones Completadas ({sesionesCompletadas.length})</span>
                  </div>
                  {showStats ? <ChevronUp size={16} className="text-slate-400" /> : <ChevronDown size={16} className="text-slate-400" />}
                </button>

                <AnimatePresence>
                  {showStats && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden mt-2"
                    >
                      <div className="space-y-2">
                        {sesionesCompletadas.map(sesion => {
                          const contexto = CONTEXTOS.find(c => c.id === sesion.contexto);
                          const ContextoIcon = contexto?.icon || Heart;
                          const isExpanded = sesionExpandida === sesion.id;
                          
                          return (
                            <div 
                              key={sesion.id}
                              className="rounded-xl border overflow-hidden"
                              style={{ backgroundColor: "#0a0a0a", borderColor: `${contexto?.color || "#666"}30` }}
                            >
                              <button
                                onClick={() => setSesionExpandida(isExpanded ? null : sesion.id)}
                                className="w-full p-3 flex items-center justify-between"
                                data-testid={`sesion-${sesion.id}`}
                              >
                                <div className="flex items-center gap-2">
                                  <ContextoIcon size={16} style={{ color: contexto?.color }} />
                                  <div className="text-left">
                                    <p className="text-xs font-bold text-white">{contexto?.label}</p>
                                    <p className="text-[9px] text-slate-500">
                                      {new Date(sesion.fecha).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-bold" style={{ color: GOLD }}>+{sesion.totalPuntos}</span>
                                  {isExpanded ? <ChevronUp size={14} className="text-slate-400" /> : <ChevronDown size={14} className="text-slate-400" />}
                                </div>
                              </button>
                              
                              <AnimatePresence>
                                {isExpanded && (
                                  <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: "auto", opacity: 1 }}
                                    exit={{ height: 0, opacity: 0 }}
                                    className="overflow-hidden"
                                  >
                                    <div className="px-3 pb-3 space-y-2">
                                      {sesion.sanacionRespuestas.map((resp, idx) => {
                                        const ejeData = EJES_EMOCIONALES.find(e => e.id === resp.eje);
                                        const EjeIcon = ejeData?.icon || Eye;
                                        return (
                                          <div 
                                            key={idx}
                                            className="p-2 rounded-lg"
                                            style={{ backgroundColor: `${ejeData?.color}10` }}
                                          >
                                            <div className="flex items-center gap-1.5 mb-1">
                                              <EjeIcon size={12} style={{ color: ejeData?.color }} />
                                              <span className="text-[9px] font-bold uppercase" style={{ color: ejeData?.color }}>{ejeData?.label}</span>
                                            </div>
                                            <p className="text-[11px] text-white/70 leading-relaxed">
                                              {isPrivacyMode ? maskText(resp.texto) : resp.texto}
                                            </p>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                      
                      {/* Toggle privacidad */}
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                          className={cn(
                            "flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold uppercase",
                            isPrivacyMode 
                              ? "bg-emerald-500/20 text-emerald-400" 
                              : "bg-white/5 text-slate-500"
                          )}
                        >
                          {isPrivacyMode ? <EyeOff size={10} /> : <Eye size={10} />}
                          {isPrivacyMode ? "Cifrado" : "Visible"}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
        )}

        {/* FASE: REFLEXIÓN ESTRUCTURADA - WIZARD SECUENCIAL */}
        {phase === "reflexion" && selectedContexto && (
          <motion.div
            key="reflexion"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            {/* Header con contexto y progreso */}
            {(() => {
              const contexto = CONTEXTOS.find(c => c.id === selectedContexto);
              const Icon = contexto?.icon || Heart;
              return (
                <div className="mb-6">
                  <div 
                    className="p-4 rounded-xl flex items-center gap-3 mb-4"
                    style={{ backgroundColor: `${contexto?.color}20`, border: `1px solid ${contexto?.color}40` }}
                  >
                    <Icon size={24} style={{ color: contexto?.color }} />
                    <div className="flex-1">
                      <p className="text-white font-bold">{contexto?.label}</p>
                      <p className="text-xs text-slate-400">Sesión de sanación emocional</p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black" style={{ color: GOLD }}>+{totalPuntosSesion}</p>
                      <p className="text-[8px] text-slate-500">pts sesión</p>
                    </div>
                  </div>
                  
                  {/* Barra de progreso */}
                  <div className="flex gap-1 mb-2">
                    {EJES_EMOCIONALES.map((eje, idx) => (
                      <div 
                        key={eje.id}
                        className="flex-1 h-1.5 rounded-full transition-all duration-500"
                        style={{ 
                          backgroundColor: idx <= wizardStep ? eje.color : "rgba(255,255,255,0.1)"
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-[10px] text-center text-slate-500">
                    Paso {wizardStep + 1} de 4
                  </p>
                </div>
              );
            })()}

            {/* Paso actual del wizard */}
            {(() => {
              const eje = EJES_EMOCIONALES[wizardStep];
              const Icon = eje.icon;
              const hasContent = (respuestas[eje.id] || "").trim().length >= 3;
              
              return (
                <motion.div
                  key={eje.id}
                  initial={{ opacity: 0, x: 50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -50 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                >
                  {/* Icono grande del paso */}
                  <div className="text-center mb-6">
                    <motion.div 
                      initial={{ scale: 0.5, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
                      style={{ 
                        background: `linear-gradient(135deg, ${eje.color}30 0%, ${eje.color}10 100%)`,
                        border: `2px solid ${eje.color}60`
                      }}
                    >
                      <Icon size={40} style={{ color: eje.color }} />
                    </motion.div>
                    <h2 className="text-2xl font-black" style={{ color: eje.color }}>{eje.label}</h2>
                    <p className="text-sm text-slate-400 mt-1">{eje.pregunta}</p>
                  </div>

                  {/* Área de escritura */}
                  <div 
                    className="p-5 rounded-2xl border-2 mb-4 transition-all"
                    style={{ 
                      backgroundColor: "#0a0a0a",
                      borderColor: hasContent ? eje.color : `${eje.color}30`
                    }}
                  >
                    <textarea
                      value={respuestas[eje.id] || ""}
                      onChange={(e) => setRespuestas(prev => ({ ...prev, [eje.id]: e.target.value }))}
                      placeholder={eje.placeholder}
                      className="w-full bg-transparent text-white text-base placeholder:text-slate-600 focus:outline-none resize-none leading-relaxed"
                      rows={4}
                      autoFocus
                      data-testid={`input-${eje.id}`}
                    />
                  </div>

                  {/* Botón continuar */}
                  <motion.button
                    whileHover={{ scale: hasContent ? 1.02 : 1 }}
                    whileTap={{ scale: hasContent ? 0.98 : 1 }}
                    onClick={() => handleSaveReflexion(eje.id)}
                    disabled={!hasContent}
                    className="w-full py-4 rounded-xl text-lg font-black transition-all flex items-center justify-center gap-3 disabled:opacity-30"
                    style={{ 
                      backgroundColor: hasContent ? eje.color : "rgba(255,255,255,0.05)",
                      color: hasContent ? "#000" : "#666"
                    }}
                    data-testid={`btn-continuar-${eje.id}`}
                  >
                    {wizardStep < 3 ? (
                      <>
                        Continuar
                        <ChevronRight size={20} />
                      </>
                    ) : (
                      <>
                        <Star size={20} />
                        Completar Sesión
                      </>
                    )}
                  </motion.button>

                  <div className="flex justify-between items-center mt-3">
                    <span className="text-[11px] text-slate-500">+{eje.points} puntos al continuar</span>
                    {wizardStep === 3 && (
                      <span className="text-[11px] font-bold" style={{ color: GOLD }}>+20 bonus al completar</span>
                    )}
                  </div>

                  {/* Resumen de pasos anteriores */}
                  {sanacionRespuestas.length > 0 && (
                    <div className="mt-8">
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3">Tu proceso hasta ahora</p>
                      <div className="space-y-2">
                        {sanacionRespuestas.map((resp, idx) => {
                          const ejeResp = EJES_EMOCIONALES.find(e => e.id === resp.eje);
                          const EjeIcon = ejeResp?.icon || Eye;
                          return (
                            <div 
                              key={idx}
                              className="flex items-start gap-2 p-3 rounded-xl"
                              style={{ backgroundColor: `${ejeResp?.color}10` }}
                            >
                              <EjeIcon size={14} style={{ color: ejeResp?.color }} className="mt-0.5 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="text-[9px] font-bold uppercase" style={{ color: ejeResp?.color }}>{ejeResp?.label}</p>
                                <p className="text-xs text-white/70 truncate">{resp.texto}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })()}
          </motion.div>
        )}

        {/* FASE: CELEBRACIÓN FINAL */}
        {phase === "celebracion" && (
          <motion.div
            key="celebracion"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="text-center py-8"
          >
            {(() => {
              const contexto = CONTEXTOS.find(c => c.id === selectedContexto);
              return (
                <>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1, rotate: [0, -10, 10, -10, 0] }}
                    transition={{ delay: 0.2, type: "spring" }}
                    className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center mb-6"
                    style={{ 
                      background: `linear-gradient(135deg, ${GOLD}40 0%, ${EMERALD}40 100%)`,
                      border: `2px solid ${GOLD}`
                    }}
                  >
                    <Sparkles size={50} style={{ color: GOLD }} />
                  </motion.div>

                  <motion.h1
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-3xl font-black mb-2"
                    style={{ color: GOLD }}
                  >
                    ¡Sesión Completa!
                  </motion.h1>

                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4 }}
                    className="text-slate-400 mb-6"
                  >
                    Has completado tu proceso de sanación en {contexto?.label}
                  </motion.p>

                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.5, type: "spring" }}
                    className="inline-block px-8 py-4 rounded-2xl mb-8"
                    style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}40` }}
                  >
                    <p className="text-4xl font-black" style={{ color: GOLD }}>+{totalPuntosSesion}</p>
                    <p className="text-xs text-slate-400">Puntos de Soberanía</p>
                  </motion.div>

                  {/* Resumen de la sesión */}
                  <motion.div
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-left mb-8"
                  >
                    <p className="text-[10px] text-slate-600 uppercase tracking-widest mb-3 text-center">Tu proceso de hoy</p>
                    <div className="space-y-3">
                      {sanacionRespuestas.map((resp, idx) => {
                        const ejeResp = EJES_EMOCIONALES.find(e => e.id === resp.eje);
                        const EjeIcon = ejeResp?.icon || Eye;
                        return (
                          <motion.div 
                            key={idx}
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            transition={{ delay: 0.7 + idx * 0.1 }}
                            className="p-4 rounded-xl"
                            style={{ backgroundColor: `${ejeResp?.color}15`, border: `1px solid ${ejeResp?.color}30` }}
                          >
                            <div className="flex items-center gap-2 mb-2">
                              <EjeIcon size={16} style={{ color: ejeResp?.color }} />
                              <span className="text-sm font-bold" style={{ color: ejeResp?.color }}>{ejeResp?.label}</span>
                            </div>
                            <p className="text-sm text-white/80 leading-relaxed">{resp.texto}</p>
                          </motion.div>
                        );
                      })}
                    </div>
                  </motion.div>

                  {/* Botones de acción */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.1 }}
                    className="space-y-3"
                  >
                    <button
                      onClick={() => {
                        setPhase("selector");
                        setSelectedContexto(null);
                        setRespuestas({});
                        setSanacionRespuestas([]);
                        setWizardStep(0);
                        setTotalPuntosSesion(0);
                      }}
                      className="w-full py-4 rounded-xl text-base font-bold"
                      style={{ backgroundColor: GOLD, color: "#000" }}
                      data-testid="btn-nueva-sesion"
                    >
                      Nueva Sesión
                    </button>
                    <button
                      onClick={() => navigate("/consola")}
                      className="w-full py-3 rounded-xl text-sm text-slate-400 bg-white/5 hover:bg-white/10 transition-colors"
                      data-testid="btn-ir-consola"
                    >
                      Volver a la Consola
                    </button>
                  </motion.div>
                </>
              );
            })()}
          </motion.div>
        )}

        {/* FASE: CAPTURA LIBRE */}
        {phase === "captura" && (
          <motion.div
            key="captura"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="mb-6 text-center">
              <h2 className="text-lg font-bold text-white mb-2">Captura Libre</h2>
              <p className="text-xs text-slate-500">
                Escribe fragmentos emocionales sin orden. Todo es válido.
              </p>
            </div>

            {/* Selector de Eje para Captura */}
            <div className="grid grid-cols-4 gap-2 mb-4">
              {CAPTURA_EJES.map(eje => {
                const Icon = eje.icon;
                const isActive = capturaActiva === eje.id;
                const fragmentCount = getFragmentosByEje(eje.id).length;
                return (
                  <button
                    key={eje.id}
                    onClick={() => setCapturaActiva(isActive ? null : eje.id)}
                    className={`p-3 rounded-xl flex flex-col items-center gap-1 transition-all border ${
                      isActive ? "border-opacity-100" : "border-opacity-30"
                    }`}
                    style={{
                      backgroundColor: isActive ? `${eje.color}20` : "#0a0a0a",
                      borderColor: eje.color
                    }}
                    data-testid={`captura-eje-${eje.id}`}
                  >
                    <Icon size={20} style={{ color: eje.color }} />
                    <span className="text-[8px] font-bold" style={{ color: eje.color }}>
                      {eje.label}
                    </span>
                    {fragmentCount > 0 && (
                      <span className="text-[8px] text-slate-500">{fragmentCount}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Input de Captura */}
            {capturaActiva && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div 
                  className="p-4 rounded-xl border"
                  style={{ 
                    backgroundColor: `${CAPTURA_EJES.find(e => e.id === capturaActiva)?.color}10`,
                    borderColor: CAPTURA_EJES.find(e => e.id === capturaActiva)?.color 
                  }}
                >
                  <textarea
                    value={textoCaptura}
                    onChange={(e) => setTextoCaptura(e.target.value)}
                    placeholder={CAPTURA_EJES.find(e => e.id === capturaActiva)?.placeholder}
                    className="w-full bg-transparent text-white text-sm resize-none focus:outline-none placeholder:text-slate-600"
                    rows={3}
                    data-testid="input-fragmento"
                  />
                  <div className="flex justify-between items-center mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-slate-500">
                        +3 pts por fragmento
                      </span>
                      <button
                        onClick={() => setMarcarSelloEspejo(!marcarSelloEspejo)}
                        className={cn(
                          "p-1 rounded-lg transition-colors",
                          marcarSelloEspejo
                            ? "bg-amber-500/20 text-amber-400"
                            : "bg-white/5 text-slate-500 hover:text-amber-400"
                        )}
                        title="Sellar como Principio Maestro"
                        data-testid="toggle-sello-espejo"
                      >
                        <Star size={12} fill={marcarSelloEspejo ? "currentColor" : "none"} />
                      </button>
                    </div>
                    <button
                      onClick={addFragmento}
                      disabled={!textoCaptura.trim()}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all disabled:opacity-50"
                      style={{ 
                        backgroundColor: CAPTURA_EJES.find(e => e.id === capturaActiva)?.color,
                        color: "#000"
                      }}
                      data-testid="btn-guardar-fragmento"
                    >
                      Capturar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Fragmentos Capturados */}
            <div className="space-y-4">
              {CAPTURA_EJES.map(eje => {
                const frags = getFragmentosByEje(eje.id);
                if (frags.length === 0) return null;
                const Icon = eje.icon;
                return (
                  <div key={eje.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <Icon size={14} style={{ color: eje.color }} />
                      <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: eje.color }}>
                        {eje.label} ({frags.length})
                      </span>
                    </div>
                    <div className="space-y-2 pl-5">
                      {frags.map(frag => (
                        <div 
                          key={frag.id}
                          className="p-3 rounded-xl text-sm text-white/80"
                          style={{ backgroundColor: `${eje.color}10` }}
                        >
                          {frag.contenido}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mensaje si no hay fragmentos */}
            {fragmentos.length === 0 && !capturaActiva && (
              <div className="text-center py-8">
                <Sparkles size={40} className="mx-auto mb-4" style={{ color: EMERALD }} />
                <p className="text-slate-500 text-sm">
                  Selecciona un eje y empieza a capturar<br/>
                  tus emociones y reflexiones.
                </p>
              </div>
            )}

            {/* Volver al selector */}
            <button
              onClick={() => setPhase("selector")}
              className="mt-6 w-full py-3 text-center text-xs text-slate-500 hover:text-white transition-colors"
              data-testid="btn-volver-selector"
            >
              ← Volver al Selector
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tutorial Overlay */}
      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.9)" }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-md rounded-2xl overflow-hidden"
              style={{ backgroundColor: "#0a0a0a", border: `1px solid ${GOLD}40` }}
            >
              {/* Header del Tutorial */}
              <div 
                className="p-4 flex items-center justify-between"
                style={{ borderBottom: `1px solid ${GOLD}20` }}
              >
                <div className="flex items-center gap-2">
                  <Eye size={20} style={{ color: GOLD }} />
                  <span className="text-sm font-bold text-white">Tutorial Espejo</span>
                </div>
                <button
                  onClick={completeTutorial}
                  className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                  data-testid="btn-cerrar-tutorial"
                >
                  <X size={16} className="text-slate-400" />
                </button>
              </div>

              {/* Contenido del Paso */}
              <div className="p-6">
                {(() => {
                  const step = TUTORIAL_STEPS[tutorialStep];
                  const StepIcon = step.icon;
                  return (
                    <div className="text-center">
                      <motion.div
                        key={tutorialStep}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: "spring", stiffness: 200, damping: 15 }}
                        className="w-20 h-20 mx-auto rounded-2xl flex items-center justify-center mb-6"
                        style={{ 
                          background: `linear-gradient(135deg, ${GOLD}20 0%, ${ELECTRIC_BLUE}20 100%)`,
                          border: `1px solid ${GOLD}40`
                        }}
                      >
                        <StepIcon size={40} style={{ color: GOLD }} />
                      </motion.div>

                      <motion.h2
                        key={`title-${tutorialStep}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                        className="text-xl font-black text-white mb-3"
                      >
                        {step.title}
                      </motion.h2>

                      <motion.p
                        key={`desc-${tutorialStep}`}
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="text-slate-400 text-sm leading-relaxed"
                      >
                        {step.description}
                      </motion.p>
                    </div>
                  );
                })()}
              </div>

              {/* Progress Dots */}
              <div className="flex justify-center gap-2 pb-4">
                {TUTORIAL_STEPS.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setTutorialStep(idx)}
                    className="w-2 h-2 rounded-full transition-all"
                    style={{ 
                      backgroundColor: idx === tutorialStep ? GOLD : "rgba(255,255,255,0.2)",
                      transform: idx === tutorialStep ? "scale(1.3)" : "scale(1)"
                    }}
                    data-testid={`tutorial-dot-${idx}`}
                  />
                ))}
              </div>

              {/* Botones de Navegación */}
              <div 
                className="p-4 flex gap-3"
                style={{ borderTop: `1px solid ${GOLD}20` }}
              >
                {tutorialStep > 0 && (
                  <button
                    onClick={prevTutorialStep}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-white/5 text-white hover:bg-white/10 transition-colors"
                    data-testid="btn-tutorial-anterior"
                  >
                    Anterior
                  </button>
                )}
                <button
                  onClick={nextTutorialStep}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                  style={{ backgroundColor: GOLD, color: "#000" }}
                  data-testid="btn-tutorial-siguiente"
                >
                  {tutorialStep === TUTORIAL_STEPS.length - 1 ? "¡Empezar!" : "Siguiente"}
                </button>
              </div>

              {/* Skip */}
              <div className="pb-4 text-center">
                <button
                  onClick={completeTutorial}
                  className="text-xs text-slate-500 hover:text-slate-400 transition-colors"
                  data-testid="btn-saltar-tutorial"
                >
                  Saltar tutorial
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
