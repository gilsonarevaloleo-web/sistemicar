/**
 * PROYECTOR - Módulo de Arquitectura de Realidad Futura
 * 
 * Sistema de cápsulas idéntico al Umbral (Depósito) pero en TIEMPO FUTURO.
 * 4 Ejes × 5 Niveles = Sistema de profundización progresiva hacia tu realidad proyectada.
 * 
 * Al final, la IA te "proyecta" a esa realidad futura con narrativa inmersiva.
 */

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Eye, 
  Target, 
  Zap, 
  Calendar, 
  Rocket,
  Star,
  Crown,
  Sparkles,
  CheckCircle,
  Plus,
  ChevronRight,
  Loader2,
  ArrowRight,
  Maximize,
  HelpCircle,
  X,
  Volume2,
  VolumeX
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/App";
import { ManualTriggerButton } from "@/components/master-manual-drawer";
import { 
  addProyeccion,
  updateProyeccion,
  subscribeToProyecciones,
  ProyeccionEntry,
  awardSovereigntyPoints
} from "@/lib/persistence";

const GOLD = "#D4AF37";
const VIOLET = "#7C3AED";
const EMERALD = "#10B981";
const ELECTRIC_BLUE = "#3b82f6";
const DARK_BG = "#050505";

// Modo Estructurado - niveles con preguntas del cerebro derecho (imaginación pura)
const PROYECCION_CAPSULES = [
  {
    id: "vision",
    label: "EJE VISIÓN",
    subtitulo: "El Destello",
    icon: Eye,
    color: ELECTRIC_BLUE,
    levels: [
      { nivel: 1, titulo: "Destello", pregunta: "Si hoy fuera el tráiler de tu película de éxito, ¿qué escena verías?", puntos: 5 },
      { nivel: 2, titulo: "Calor", pregunta: "Siente la luz de ese logro... ¿Qué parte de tu cuerpo se calienta primero?", puntos: 8 },
      { nivel: 3, titulo: "Asombro", pregunta: "Imagina que esa visión inspira a miles... ¿Qué rostro de asombro ves frente a ti?", puntos: 12 },
      { nivel: 4, titulo: "Perspectiva", pregunta: "Mira el mundo desde esa victoria... ¿Qué tan pequeñas se ven tus dudas hoy?", puntos: 15 },
      { nivel: 5, titulo: "Intuición", pregunta: "Eres el arquitecto de esta realidad. ¿Qué susurra tu intuición sobre el siguiente paso?", puntos: 20 }
    ]
  },
  {
    id: "tension",
    label: "EJE TENSIÓN",
    subtitulo: "La Onda Expansiva",
    icon: Zap,
    color: "#EF4444",
    levels: [
      { nivel: 1, titulo: "Orgullo", pregunta: "Imagina el rostro de quien más amas al verte lograrlo... ¿Qué palabras de orgullo escuchas?", puntos: 5 },
      { nivel: 2, titulo: "Aire", pregunta: "Visualiza tu entorno transformado. ¿Cómo ha cambiado el aire que respiras?", puntos: 8 },
      { nivel: 3, titulo: "Ritmo", pregunta: "Siente la frecuencia de la abundancia. ¿Qué ritmo tiene tu nueva vida?", puntos: 12 },
      { nivel: 4, titulo: "Disolución", pregunta: "Mira a tus antiguos 'imposibles'... ¿Cómo se disuelven como humo ante tu presencia?", puntos: 15 },
      { nivel: 5, titulo: "Imán", pregunta: "La novedad de tu logro es un imán. ¿Qué nuevas oportunidades ves acercarse?", puntos: 20 }
    ]
  },
  {
    id: "accion",
    label: "EJE ACCIÓN",
    subtitulo: "El Valor Real",
    icon: Target,
    color: EMERALD,
    levels: [
      { nivel: 1, titulo: "Impacto", pregunta: "Visualiza el momento donde tu logro salva a alguien más... ¿Qué sientes en tu pecho?", puntos: 5 },
      { nivel: 2, titulo: "Símbolo", pregunta: "¿Qué símbolo representa tu poder de ejecución hoy? (Un rayo, una roca, un río...)", puntos: 8 },
      { nivel: 3, titulo: "Manos", pregunta: "Mira tus manos en el futuro... ¿Qué están construyendo con absoluta facilidad?", puntos: 12 },
      { nivel: 4, titulo: "Sabor", pregunta: "Siente la descarga de energía al completar tu obra. ¿A qué sabe la victoria?", puntos: 15 },
      { nivel: 5, titulo: "Natural", pregunta: "El tiempo no existe aquí. ¿Qué tan natural se siente poseer este gran resultado?", puntos: 20 }
    ]
  },
  {
    id: "colapso",
    label: "EJE COLAPSO",
    subtitulo: "La Grandeza",
    icon: Calendar,
    color: GOLD,
    levels: [
      { nivel: 1, titulo: "Liberación", pregunta: "Mira hacia atrás desde el futuro... ¿Qué parte de tu 'mente de pato' ya no existe?", puntos: 5 },
      { nivel: 2, titulo: "Fecha Mágica", pregunta: "¿En qué fecha mágica del calendario estás celebrando ahora mismo?", puntos: 8 },
      { nivel: 3, titulo: "Paisaje", pregunta: "Describe el paisaje que rodea tu éxito. ¿Es de día o de noche? ¿Qué escuchas?", puntos: 12 },
      { nivel: 4, titulo: "Peso", pregunta: "Siente el peso de tu grandeza. Ya no eres el que intenta, eres el que ES. ¿Cómo caminas?", puntos: 15 },
      { nivel: 5, titulo: "Unión", pregunta: "El colapso es unión. Siente cómo tu visión y tu realidad se vuelven una sola pieza de oro.", puntos: 20 }
    ]
  }
];

// Modo Captura Libre - placeholders del cerebro derecho (sin lógica)
const CAPTURA_EJES = [
  { id: "vision", label: "VISIÓN", icon: Eye, color: ELECTRIC_BLUE, placeholder: "No pienses... ¿Qué imagen brilla en tu mente ahora mismo?" },
  { id: "tension", label: "TENSIÓN", icon: Zap, color: "#EF4444", placeholder: "¿Qué emoción vibrante sientes al imaginar este logro?" },
  { id: "accion", label: "ACCIÓN", icon: Target, color: EMERALD, placeholder: "¿Qué color tiene el éxito que estás construyendo?" },
  { id: "colapso", label: "COLAPSO", icon: Calendar, color: GOLD, placeholder: "Describe el olor y el sonido del momento final..." }
];

// Modo Guiado con IA - Musa Creativa (cerebro derecho puro)
const GUIADO_EJES = [
  { 
    id: "vision", 
    label: "VISIÓN", 
    icon: Eye, 
    color: ELECTRIC_BLUE,
    descripcion: "El Destello",
    preguntaInicial: "Si hoy fuera el tráiler de tu película de éxito, ¿qué escena verías? Siente la luz de ese logro...",
    puntos: 15
  },
  { 
    id: "tension", 
    label: "TENSIÓN", 
    icon: Zap, 
    color: "#EF4444",
    descripcion: "La Onda Expansiva",
    preguntaInicial: "Imagina el rostro de quien más amas al verte lograrlo... ¿Qué palabras de orgullo escuchas?",
    puntos: 15
  },
  { 
    id: "accion", 
    label: "ACCIÓN", 
    icon: Target, 
    color: EMERALD,
    descripcion: "El Valor Real",
    preguntaInicial: "Visualiza el momento donde tu logro salva a alguien más... ¿Qué sientes en tu pecho?",
    puntos: 15
  },
  { 
    id: "colapso", 
    label: "COLAPSO", 
    icon: Calendar, 
    color: GOLD,
    descripcion: "La Grandeza",
    preguntaInicial: "Siente el peso de tu grandeza. Ya no eres el que intenta, eres el que ES. ¿Cómo caminas?",
    puntos: 15
  }
];

interface FragmentoCaptura {
  id: string;
  eje: string;
  contenido: string;
  createdAt: Date;
}

type ProyectorMode = "estructurado" | "captura" | "guiado";

interface FormData {
  capsulas: {
    [key: string]: { [nivel: number]: string };
  };
  horizonte?: string;
}

interface GuidedRespuestas {
  vision: string;
  tension: string;
  accion: string;
  colapso: string;
}

interface AIPrompt {
  pregunta: string;
  sugerencia: string;
}

type Phase = "gallery" | "capsules" | "projection" | "complete" | "captura" | "guiado";

// Tutorial Steps - Manual de Inducción al Cerebro Derecho
const TUTORIAL_STEPS = [
  {
    id: "welcome",
    title: "Donde la Realidad se Diseña, no se Calcula",
    description: "En la escuela te enseñaron a planificar con el cerebro izquierdo: listas, fechas y esfuerzo. Eso sirve para administrar el presente, pero es inútil para crear el futuro. El Proyector es el único lugar donde tienes PROHIBIDO ser lógico.",
    target: null,
    icon: Rocket
  },
  {
    id: "regla1",
    title: "Regla 1: Abandona el 'Cómo'",
    description: "No te preguntes CÓMO vas a lograr tu visión. El 'cómo' es ruido. Enfócate solo en la imagen final. Tu cerebro derecho encontrará el camino después.",
    target: null,
    icon: Eye
  },
  {
    id: "regla2",
    title: "Regla 2: Siente, No Pienses",
    description: "Si una pregunta te pide un color, un olor o una sensación, no busques una respuesta inteligente. Escribe lo primero que 'vibre' en tu pecho. La intuición es más rápida que el análisis.",
    target: null,
    icon: Sparkles
  },
  {
    id: "regla3",
    title: "Regla 3: La Imagen es el Comando",
    description: "Tu mente no entiende palabras vacías, entiende ESCENAS. Si quieres éxito económico, no escribas 'quiero dinero'; describe el tacto del papel o el sonido de la notificación de tu banco.",
    target: null,
    icon: Target
  },
  {
    id: "ejes",
    title: "Los 4 Ejes Creativos",
    description: "VISIÓN (El Destello), TENSIÓN (La Onda Expansiva), ACCIÓN (El Valor Real) y COLAPSO (La Grandeza). Cada uno activa diferentes partes de tu imaginación.",
    target: "ejes-grid",
    icon: Calendar
  },
  {
    id: "cierre",
    title: "Tú Eres el Rey",
    description: "El cerebro izquierdo es un excelente sirviente, pero el cerebro derecho es el único que puede ser Rey. Aquí, tú eres el Rey.",
    target: null,
    icon: Star
  }
];

const TUTORIAL_STORAGE_KEY = "sistemicar_proyector_tutorial_done";

function ProgressBar({ current, total }: { current: number; total: number }) {
  const percent = Math.min((current / total) * 100, 100);
  return (
    <div className="w-full">
      <div className="flex justify-between text-[10px] mb-1">
        <span className="text-slate-500">Puntos de Proyección</span>
        <span style={{ color: GOLD }} className="font-bold">{current}/{total}</span>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/10">
        <motion.div
          className="h-full rounded-full"
          style={{ background: `linear-gradient(90deg, ${ELECTRIC_BLUE} 0%, ${GOLD} 100%)` }}
          initial={{ width: 0 }}
          animate={{ width: `${percent}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>
    </div>
  );
}

export default function Proyector() {
  const { user } = useAuthContext();
  const [mode, setMode] = useState<ProyectorMode>("captura");
  const [phase, setPhase] = useState<Phase>("gallery");
  const [proyecciones, setProyecciones] = useState<ProyeccionEntry[]>([]);
  const [currentProyeccion, setCurrentProyeccion] = useState<ProyeccionEntry | null>(null);
  const [selectedCapsule, setSelectedCapsule] = useState<string | null>(null);
  const [capsuleLevels, setCapsuleLevels] = useState<{ [key: string]: number }>({
    vision: 1, arquitectura: 1, recurso: 1, colapso: 1
  });
  const [formData, setFormData] = useState<FormData>({
    capsulas: {},
    horizonte: ""
  });
  const [isGeneratingProjection, setIsGeneratingProjection] = useState(false);
  const [projectionNarrative, setProjectionNarrative] = useState("");
  const [expandedProyeccion, setExpandedProyeccion] = useState<ProyeccionEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [fragmentos, setFragmentos] = useState<FragmentoCaptura[]>([]);
  const [capturaActiva, setCapturaActiva] = useState<string | null>(null);
  const [textoCaptura, setTextoCaptura] = useState("");
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  
  // Estados para Modo Guiado con IA
  const [guidedStep, setGuidedStep] = useState(0);
  const [guidedRespuestas, setGuidedRespuestas] = useState<GuidedRespuestas>({
    vision: "", tension: "", accion: "", colapso: ""
  });
  const [guidedTexto, setGuidedTexto] = useState("");
  const [aiPrompt, setAiPrompt] = useState<AIPrompt | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [guidedSintesis, setGuidedSintesis] = useState("");
  const [showGuidedComplete, setShowGuidedComplete] = useState(false);

  // Sistema de Audio - Ancla Sonora
  const [audioEnabled, setAudioEnabled] = useState(true);
  const audioContextRef = useRef<AudioContext | null>(null);
  const ambientAudioRef = useRef<HTMLAudioElement | null>(null);

  // Inicializar AudioContext
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Sonido de Campana Tibetana (síntesis)
  const playTibetanBell = useCallback(() => {
    if (!audioEnabled) return;
    
    try {
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') ctx.resume();
      
      const now = ctx.currentTime;
      
      // Crear osciladores para sonido de campana tibetana
      const fundamental = ctx.createOscillator();
      const harmonic1 = ctx.createOscillator();
      const harmonic2 = ctx.createOscillator();
      
      fundamental.frequency.value = 528; // Frecuencia de sanación
      harmonic1.frequency.value = 528 * 2.1;
      harmonic2.frequency.value = 528 * 3.2;
      
      fundamental.type = 'sine';
      harmonic1.type = 'sine';
      harmonic2.type = 'sine';
      
      // Envolvente de amplitud (fade-out suave)
      const gainNode = ctx.createGain();
      const harmGain1 = ctx.createGain();
      const harmGain2 = ctx.createGain();
      
      gainNode.gain.setValueAtTime(0.3, now);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 3);
      
      harmGain1.gain.setValueAtTime(0.15, now);
      harmGain1.gain.exponentialRampToValueAtTime(0.001, now + 2.5);
      
      harmGain2.gain.setValueAtTime(0.08, now);
      harmGain2.gain.exponentialRampToValueAtTime(0.001, now + 2);
      
      // Conectar
      fundamental.connect(gainNode);
      harmonic1.connect(harmGain1);
      harmonic2.connect(harmGain2);
      
      gainNode.connect(ctx.destination);
      harmGain1.connect(ctx.destination);
      harmGain2.connect(ctx.destination);
      
      // Reproducir
      fundamental.start(now);
      harmonic1.start(now);
      harmonic2.start(now);
      
      fundamental.stop(now + 3);
      harmonic1.stop(now + 2.5);
      harmonic2.stop(now + 2);
    } catch (e) {
      console.log('Audio not available');
    }
  }, [audioEnabled, getAudioContext]);

  // Música ambiental de fondo (ondas Alpha)
  useEffect(() => {
    if (!ambientAudioRef.current) {
      const audio = new Audio();
      audio.src = 'https://cdn.pixabay.com/audio/2024/02/14/audio_47d704a7c4.mp3'; // Sonido ambiental relajante
      audio.loop = true;
      audio.volume = 0.15; // 15% volumen - muy sutil
      ambientAudioRef.current = audio;
    }
    
    return () => {
      if (ambientAudioRef.current) {
        ambientAudioRef.current.pause();
        ambientAudioRef.current = null;
      }
    };
  }, []);

  // Controlar música ambiental
  useEffect(() => {
    if (ambientAudioRef.current) {
      if (audioEnabled) {
        ambientAudioRef.current.play().catch(() => {});
      } else {
        ambientAudioRef.current.pause();
      }
    }
  }, [audioEnabled]);

  // Toggle audio
  const toggleAudio = useCallback(() => {
    setAudioEnabled(prev => !prev);
  }, []);

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
    const unsubscribe = subscribeToProyecciones(
      user.uid,
      (data: ProyeccionEntry[]) => {
        setProyecciones(data);
        setLoading(false);
      },
      (error: Error) => {
        console.error("Error loading proyecciones:", error);
        setLoading(false);
      }
    );
    return unsubscribe;
  }, [user]);

  const calculatePoints = (entry: ProyeccionEntry | null, form: FormData): number => {
    let total = 0;
    PROYECCION_CAPSULES.forEach(capsule => {
      capsule.levels.forEach(level => {
        const value = entry?.capsulas?.[capsule.id]?.[level.nivel] || 
                     form.capsulas[capsule.id]?.[level.nivel];
        if (value && value.trim().length >= 5) {
          total += level.puntos;
        }
      });
    });
    return total;
  };

  const maxPoints = PROYECCION_CAPSULES.reduce((acc, c) => 
    acc + c.levels.reduce((a, l) => a + l.puntos, 0), 0
  );

  const startNewProyeccion = () => {
    setCurrentProyeccion(null);
    setFormData({ capsulas: {}, horizonte: "" });
    setCapsuleLevels({ vision: 1, arquitectura: 1, recurso: 1, colapso: 1 });
    setSelectedCapsule(null);
    setProjectionNarrative("");
    setMode("estructurado");
    setPhase("capsules");
  };

  const addFragmento = async () => {
    if (!user || !capturaActiva || !textoCaptura.trim()) return;
    
    const nuevoFragmento: FragmentoCaptura = {
      id: `frag_${Date.now()}`,
      eje: capturaActiva,
      contenido: textoCaptura.trim(),
      createdAt: new Date()
    };
    
    setFragmentos(prev => [nuevoFragmento, ...prev]);
    setTextoCaptura("");
    
    const eje = CAPTURA_EJES.find(e => e.id === capturaActiva);
    await awardSovereigntyPoints(user.uid, 3, `Proyector: Fragmento ${eje?.label}`);
    playTibetanBell();
    
    toast.success("+3 Puntos - Fragmento Capturado", {
      style: { backgroundColor: "#0a0a0a", border: `1px solid ${eje?.color}`, color: eje?.color }
    });
  };

  const getFragmentosByEje = (ejeId: string) => {
    return fragmentos.filter(f => f.eje === ejeId);
  };

  const openExistingProyeccion = (entry: ProyeccionEntry) => {
    setCurrentProyeccion(entry);
    setFormData({ capsulas: entry.capsulas || {} });
    
    const newLevels: { [key: string]: number } = {};
    PROYECCION_CAPSULES.forEach(capsule => {
      let maxCompleted = 0;
      capsule.levels.forEach(level => {
        const value = entry.capsulas?.[capsule.id]?.[level.nivel];
        if (value && value.trim().length >= 5) {
          maxCompleted = level.nivel;
        }
      });
      newLevels[capsule.id] = Math.min(maxCompleted + 1, 5);
    });
    setCapsuleLevels(newLevels);
    setSelectedCapsule(null);
    setProjectionNarrative(entry.projectionNarrative || "");
    setPhase("capsules");
  };

  const handleCapsuleChange = (capsuleId: string, nivel: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      capsulas: {
        ...prev.capsulas,
        [capsuleId]: {
          ...prev.capsulas[capsuleId],
          [nivel]: value
        }
      }
    }));
  };

  const completeLevelAndAdvance = async (capsuleId: string, nivel: number) => {
    if (!user) return;
    
    const value = formData.capsulas[capsuleId]?.[nivel];
    if (!value || value.trim().length < 5) {
      toast.error("Escribe al menos 5 caracteres");
      return;
    }

    const capsule = PROYECCION_CAPSULES.find(c => c.id === capsuleId);
    const levelData = capsule?.levels.find(l => l.nivel === nivel);
    
    try {
      const updatedCapsulas = {
        ...formData.capsulas,
        [capsuleId]: {
          ...formData.capsulas[capsuleId],
          [nivel]: value
        }
      };

      if (currentProyeccion) {
        await updateProyeccion(user.uid, currentProyeccion.id, {
          capsulas: updatedCapsulas,
          updatedAt: new Date()
        });
      } else {
        const newEntry = await addProyeccion(user.uid, {
          capsulas: updatedCapsulas,
          projectionNarrative: "",
          createdAt: new Date(),
          updatedAt: new Date()
        });
        setCurrentProyeccion(newEntry);
      }

      await awardSovereigntyPoints(user.uid, levelData?.puntos || 5, `Proyector: ${capsule?.label} Nivel ${nivel}`);
      
      // Reproducir campana tibetana al completar nivel
      playTibetanBell();
      
      toast.success(`+${levelData?.puntos} Puntos de Proyección`, {
        style: { backgroundColor: "#0a0a0a", border: `1px solid ${capsule?.color}`, color: capsule?.color }
      });

      if (nivel < 5) {
        setCapsuleLevels(prev => ({ ...prev, [capsuleId]: nivel + 1 }));
      } else {
        setSelectedCapsule(null);
        toast.success(`¡${capsule?.label} COMPLETADO!`, {
          style: { backgroundColor: "#0a0a0a", border: `1px solid ${GOLD}`, color: GOLD }
        });
      }
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Error al guardar");
    }
  };

  const getCompletedCapsules = (): number => {
    return PROYECCION_CAPSULES.filter(capsule => {
      return capsule.levels.every(level => {
        const value = currentProyeccion?.capsulas?.[capsule.id]?.[level.nivel] ||
                     formData.capsulas[capsule.id]?.[level.nivel];
        return value && value.trim().length >= 5;
      });
    }).length;
  };

  const generateProjectionNarrative = async () => {
    if (!user) return;
    
    setIsGeneratingProjection(true);
    
    try {
      const capsulasData: { [key: string]: { [key: number]: string } } = {};
      PROYECCION_CAPSULES.forEach(capsule => {
        capsulasData[capsule.id] = {};
        capsule.levels.forEach(level => {
          const value = currentProyeccion?.capsulas?.[capsule.id]?.[level.nivel] ||
                       formData.capsulas[capsule.id]?.[level.nivel];
          if (value) {
            capsulasData[capsule.id][level.nivel] = value;
          }
        });
      });

      const response = await fetch("/api/proyector/generate-narrative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ capsulas: capsulasData })
      });

      if (!response.ok) throw new Error("Error generating narrative");
      
      const data = await response.json();
      setProjectionNarrative(data.narrative);
      
      if (currentProyeccion) {
        await updateProyeccion(user.uid, currentProyeccion.id, {
          projectionNarrative: data.narrative,
          updatedAt: new Date()
        });
      }
      
      await awardSovereigntyPoints(user.uid, 50, "Proyector: Narrativa de Proyección Generada");
      
      setPhase("projection");
      toast.success("+50 Puntos de Proyección", {
        style: { backgroundColor: "#0a0a0a", border: `1px solid ${GOLD}`, color: GOLD }
      });
    } catch (error) {
      console.error("Error generating projection:", error);
      toast.error("Error al generar proyección");
    } finally {
      setIsGeneratingProjection(false);
    }
  };

  const canGenerateProjection = getCompletedCapsules() >= 2;

  // ==================== FUNCIONES MODO GUIADO ====================
  
  const startGuidedMode = async () => {
    setMode("guiado");
    setPhase("guiado");
    setGuidedStep(0);
    setGuidedRespuestas({ vision: "", tension: "", accion: "", colapso: "" });
    setGuidedTexto("");
    setGuidedSintesis("");
    setShowGuidedComplete(false);
    await fetchAIPrompt("vision", "");
  };

  const fetchAIPrompt = async (eje: string, respuestaActual: string) => {
    setIsLoadingAI(true);
    try {
      const response = await fetch("/api/proyector/guided-prompt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eje,
          respuestaActual,
          respuestasAnteriores: guidedRespuestas,
          paso: guidedStep
        })
      });
      const data = await response.json();
      setAiPrompt(data);
    } catch (error) {
      console.error("Error fetching AI prompt:", error);
      const ejeInfo = GUIADO_EJES.find(e => e.id === eje);
      setAiPrompt({
        pregunta: ejeInfo?.preguntaInicial || "¿Qué ves en tu futuro?",
        sugerencia: "Cierra los ojos y visualiza con detalle..."
      });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const handleGuidedNext = async () => {
    if (!user || guidedTexto.trim().length < 5) {
      toast.error("Escribe al menos 5 caracteres");
      return;
    }

    const currentEje = GUIADO_EJES[guidedStep];
    const ejeId = currentEje.id as keyof GuidedRespuestas;
    
    // Guardar respuesta actual
    const newRespuestas = { ...guidedRespuestas, [ejeId]: guidedTexto.trim() };
    setGuidedRespuestas(newRespuestas);
    
    // Dar puntos y reproducir campana
    await awardSovereigntyPoints(user.uid, currentEje.puntos, `Proyección Guiada: ${currentEje.label}`);
    playTibetanBell();
    toast.success(`+${currentEje.puntos} Puntos - ${currentEje.label}`, {
      style: { backgroundColor: "#0a0a0a", border: `1px solid ${currentEje.color}`, color: currentEje.color }
    });

    // Avanzar al siguiente paso o completar
    if (guidedStep < GUIADO_EJES.length - 1) {
      const nextEje = GUIADO_EJES[guidedStep + 1];
      setGuidedStep(prev => prev + 1);
      setGuidedTexto("");
      await fetchAIPrompt(nextEje.id, "");
    } else {
      // Completar y generar síntesis
      await generateGuidedSynthesis(newRespuestas);
    }
  };

  const generateGuidedSynthesis = async (respuestas: GuidedRespuestas) => {
    if (!user) return;
    
    setIsLoadingAI(true);
    try {
      const response = await fetch("/api/proyector/guided-synthesis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ respuestas })
      });
      const data = await response.json();
      setGuidedSintesis(data.sintesis);
      
      // Bonus por completar y reproducir campana
      await awardSovereigntyPoints(user.uid, 30, "Proyección Guiada: Síntesis Completada");
      playTibetanBell();
      toast.success("+30 Puntos Bonus - ¡Proyección Completa!", {
        style: { backgroundColor: "#0a0a0a", border: `1px solid ${GOLD}`, color: GOLD }
      });
      
      setShowGuidedComplete(true);
    } catch (error) {
      console.error("Error generating synthesis:", error);
      setGuidedSintesis("Tu visión es clara. La tensión te impulsa. Tus acciones son el puente. El colapso es inevitable.");
      setShowGuidedComplete(true);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const resetGuidedMode = () => {
    setGuidedStep(0);
    setGuidedRespuestas({ vision: "", tension: "", accion: "", colapso: "" });
    setGuidedTexto("");
    setGuidedSintesis("");
    setShowGuidedComplete(false);
    setAiPrompt(null);
    setPhase("gallery");
  };

  // ==================== FIN FUNCIONES MODO GUIADO ====================

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DARK_BG }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Rocket size={40} style={{ color: ELECTRIC_BLUE }} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: DARK_BG }}>
      <div className="max-w-lg mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <Rocket size={24} style={{ color: GOLD }} />
                <h1 className="text-2xl font-black text-white">PROYECTOR</h1>
              </div>
              <p className="text-xs text-slate-500">Tu realidad futura manifestada</p>
            </div>
            <ManualTriggerButton manualType="proyector" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={toggleAudio}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title={audioEnabled ? "Silenciar audio" : "Activar audio"}
              data-testid="btn-toggle-audio"
            >
              {audioEnabled ? (
                <Volume2 size={16} style={{ color: GOLD }} />
              ) : (
                <VolumeX size={16} className="text-slate-500" />
              )}
            </button>
            <button
              onClick={restartTutorial}
              className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
              title="Ver tutorial"
              data-testid="btn-ver-tutorial"
            >
              <HelpCircle size={16} className="text-slate-400" />
            </button>
            {phase !== "gallery" && (
              <button
                onClick={() => setPhase("gallery")}
                className="text-xs text-slate-400 hover:text-white transition-colors"
                data-testid="btn-volver-galeria"
              >
                ← Galería
              </button>
            )}
          </div>
        </div>

        {/* Progress Bar */}
        {phase !== "gallery" && (
          <div className="mb-6">
            <ProgressBar 
              current={calculatePoints(currentProyeccion, formData)} 
              total={maxPoints} 
            />
          </div>
        )}

        <AnimatePresence mode="wait">
          {/* FASE: GALERÍA DE PROYECCIONES */}
          {phase === "gallery" && (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Pestañas de Modo */}
              <div className="grid grid-cols-3 gap-2 mb-4">
                <button
                  onClick={() => { setMode("captura"); setPhase("captura"); }}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    mode === "captura" 
                      ? "text-black" 
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                  style={mode === "captura" ? { backgroundColor: EMERALD } : {}}
                  data-testid="tab-captura-libre"
                >
                  <Sparkles size={18} />
                  Captura
                </button>
                <button
                  onClick={() => startGuidedMode()}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 relative ${
                    mode === "guiado" 
                      ? "text-black" 
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                  style={mode === "guiado" ? { backgroundColor: VIOLET } : {}}
                  data-testid="tab-guiado"
                >
                  <Star size={18} />
                  Guiado IA
                  <span className="absolute -top-1 -right-1 text-[8px] px-1.5 py-0.5 rounded-full bg-violet-500 text-white">
                    NUEVO
                  </span>
                </button>
                <button
                  onClick={() => startNewProyeccion()}
                  className={`py-3 px-2 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 ${
                    mode === "estructurado" 
                      ? "text-black" 
                      : "bg-white/5 text-slate-400 border border-white/10"
                  }`}
                  style={mode === "estructurado" ? { backgroundColor: GOLD } : {}}
                  data-testid="tab-estructurado"
                >
                  <Target size={18} />
                  Profundo
                </button>
              </div>

              {/* Descripción del modo actual */}
              <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-xs text-slate-400">
                  {mode === "captura" 
                    ? "Captura fragmentos de ideas sin orden. Perfecto para mentes en proceso."
                    : mode === "guiado"
                    ? "La IA te guía paso a paso por VISIÓN, TENSIÓN, ACCIÓN y COLAPSO."
                    : "Sistema avanzado con 4 ejes × 5 niveles. Para máxima profundidad."
                  }
                </p>
              </div>

              {/* Lista de Proyecciones */}
              {proyecciones.length > 0 ? (
                <div className="space-y-3">
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest">
                    Proyecciones Guardadas ({proyecciones.length})
                  </p>
                  {proyecciones.map((entry) => {
                    const points = calculatePoints(entry, { capsulas: {} });
                    const completedCapsules = PROYECCION_CAPSULES.filter(capsule => 
                      capsule.levels.every(level => 
                        entry.capsulas?.[capsule.id]?.[level.nivel]?.trim().length >= 5
                      )
                    ).length;
                    
                    return (
                      <motion.div
                        key={entry.id}
                        whileHover={{ scale: 1.01 }}
                        className="p-4 rounded-2xl border cursor-pointer transition-all"
                        style={{ 
                          backgroundColor: "#0a0a0a", 
                          borderColor: entry.projectionNarrative ? `${GOLD}40` : "rgba(255,255,255,0.1)" 
                        }}
                        onClick={() => entry.projectionNarrative ? setExpandedProyeccion(entry) : openExistingProyeccion(entry)}
                        data-testid={`proyeccion-${entry.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div 
                              className="w-10 h-10 rounded-xl flex items-center justify-center"
                              style={{ 
                                background: entry.projectionNarrative 
                                  ? `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`
                                  : "rgba(255,255,255,0.1)"
                              }}
                            >
                              {entry.projectionNarrative ? (
                                <Crown size={20} className="text-black" />
                              ) : (
                                <Rocket size={20} className="text-slate-400" />
                              )}
                            </div>
                            <div>
                              <p className="text-white font-bold text-sm">
                                {entry.projectionNarrative ? "Proyección Completa" : "En Progreso"}
                              </p>
                              <p className="text-xs text-slate-500">
                                {completedCapsules}/4 cápsulas · +{points} pts
                              </p>
                            </div>
                          </div>
                          <ChevronRight size={16} className="text-slate-600" />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Rocket size={48} className="mx-auto mb-4 text-slate-700" />
                  <p className="text-slate-500 text-sm">
                    Aún no tienes proyecciones.<br/>
                    ¡Crea tu primera realidad futura!
                  </p>
                </div>
              )}
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
                  Escribe fragmentos de ideas sin orden. Todo es válido aquí.
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
                      <span className="text-[9px] font-bold" style={{ color: eje.color }}>
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
                      <span className="text-[10px] text-slate-500">
                        +3 pts por fragmento
                      </span>
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

              {/* Fragmentos Capturados por Eje */}
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
                    los fragmentos de tu visión futura.
                  </p>
                </div>
              )}

              {/* Botón para ir al modo estructurado cuando haya fragmentos */}
              {fragmentos.length >= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6 p-4 rounded-xl border text-center"
                  style={{ borderColor: `${GOLD}40`, backgroundColor: "#0a0a0a" }}
                >
                  <p className="text-xs text-slate-400 mb-3">
                    Tienes {fragmentos.length} fragmentos. ¿Listo para estructurar?
                  </p>
                  <button
                    onClick={startNewProyeccion}
                    className="px-6 py-2 rounded-xl text-sm font-bold transition-all"
                    style={{ backgroundColor: GOLD, color: "#000" }}
                    data-testid="btn-ir-estructurado"
                  >
                    Ir a Modo Estructurado
                  </button>
                </motion.div>
              )}

              {/* Volver a galería */}
              <button
                onClick={() => setPhase("gallery")}
                className="mt-6 w-full py-3 text-center text-xs text-slate-500 hover:text-white transition-colors"
                data-testid="btn-volver-galeria-captura"
              >
                ← Volver a Galería
              </button>
            </motion.div>
          )}

          {/* FASE: PROYECCIÓN GUIADA CON IA */}
          {phase === "guiado" && (
            <motion.div
              key="guiado"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {!showGuidedComplete ? (
                <>
                  {/* Progress Steps */}
                  <div className="flex items-center justify-between mb-6">
                    {GUIADO_EJES.map((eje, index) => {
                      const Icon = eje.icon;
                      const isActive = guidedStep === index;
                      const isCompleted = index < guidedStep;
                      return (
                        <div key={eje.id} className="flex-1 flex flex-col items-center">
                          <div 
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                              isCompleted ? "scale-90" : isActive ? "scale-110" : "scale-75 opacity-40"
                            }`}
                            style={{ 
                              backgroundColor: isCompleted || isActive ? `${eje.color}30` : "rgba(255,255,255,0.05)",
                              border: `2px solid ${isCompleted || isActive ? eje.color : "rgba(255,255,255,0.1)"}`
                            }}
                          >
                            {isCompleted ? (
                              <CheckCircle size={18} style={{ color: eje.color }} />
                            ) : (
                              <Icon size={18} style={{ color: isActive ? eje.color : "rgba(255,255,255,0.3)" }} />
                            )}
                          </div>
                          <span 
                            className="text-[9px] mt-1 font-bold"
                            style={{ color: isActive ? eje.color : "rgba(255,255,255,0.3)" }}
                          >
                            {eje.label}
                          </span>
                          {index < GUIADO_EJES.length - 1 && (
                            <div 
                              className="absolute h-0.5 w-8 -translate-x-1/2 left-1/2"
                              style={{ 
                                backgroundColor: isCompleted ? GUIADO_EJES[index].color : "rgba(255,255,255,0.1)",
                                top: "20px"
                              }}
                            />
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Current Step Card */}
                  <motion.div
                    key={guidedStep}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-6 rounded-2xl border"
                    style={{ 
                      backgroundColor: `${GUIADO_EJES[guidedStep].color}08`,
                      borderColor: `${GUIADO_EJES[guidedStep].color}40`
                    }}
                  >
                    <div className="flex items-center gap-3 mb-4">
                      {(() => {
                        const Icon = GUIADO_EJES[guidedStep].icon;
                        return <Icon size={24} style={{ color: GUIADO_EJES[guidedStep].color }} />;
                      })()}
                      <div>
                        <h3 className="font-bold text-white">{GUIADO_EJES[guidedStep].label}</h3>
                        <p className="text-[10px] text-slate-500">{GUIADO_EJES[guidedStep].descripcion}</p>
                      </div>
                    </div>

                    {/* AI Question */}
                    {isLoadingAI ? (
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 size={16} className="animate-spin" style={{ color: VIOLET }} />
                        <span className="text-sm text-slate-400">La IA está preparando tu pregunta...</span>
                      </div>
                    ) : aiPrompt && (
                      <div className="mb-4">
                        <p className="text-white text-sm mb-2 leading-relaxed">
                          {aiPrompt.pregunta}
                        </p>
                        <p className="text-[10px] text-slate-500 italic">
                          💡 {aiPrompt.sugerencia}
                        </p>
                      </div>
                    )}

                    {/* Input Area */}
                    <textarea
                      value={guidedTexto}
                      onChange={(e) => setGuidedTexto(e.target.value)}
                      placeholder="Escribe tu respuesta aquí..."
                      className="w-full bg-black/30 text-white text-sm resize-none focus:outline-none placeholder:text-slate-600 rounded-xl p-4 border border-white/10 min-h-[120px]"
                      disabled={isLoadingAI}
                      data-testid="input-guiado"
                    />

                    {/* Character count & Submit */}
                    <div className="flex justify-between items-center mt-4">
                      <span className={`text-[10px] ${guidedTexto.length >= 5 ? "text-slate-500" : "text-red-400"}`}>
                        {guidedTexto.length}/5 caracteres mínimo
                      </span>
                      <button
                        onClick={handleGuidedNext}
                        disabled={guidedTexto.trim().length < 5 || isLoadingAI}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all disabled:opacity-50"
                        style={{ 
                          backgroundColor: GUIADO_EJES[guidedStep].color,
                          color: "#000"
                        }}
                        data-testid="btn-guided-next"
                      >
                        {guidedStep < GUIADO_EJES.length - 1 ? (
                          <>
                            Siguiente
                            <ArrowRight size={16} />
                          </>
                        ) : (
                          <>
                            Completar
                            <CheckCircle size={16} />
                          </>
                        )}
                      </button>
                    </div>
                  </motion.div>

                  {/* Points Info */}
                  <div className="text-center">
                    <p className="text-[10px] text-slate-500">
                      +{GUIADO_EJES[guidedStep].puntos} puntos por completar este paso
                    </p>
                  </div>

                  {/* Previous Answers */}
                  {guidedStep > 0 && (
                    <div className="space-y-2">
                      <p className="text-[10px] text-slate-600 uppercase tracking-widest">Tus respuestas anteriores</p>
                      {GUIADO_EJES.slice(0, guidedStep).map(eje => {
                        const respuesta = guidedRespuestas[eje.id as keyof GuidedRespuestas];
                        if (!respuesta) return null;
                        const Icon = eje.icon;
                        return (
                          <div 
                            key={eje.id}
                            className="p-3 rounded-xl bg-white/5 border border-white/10"
                          >
                            <div className="flex items-center gap-2 mb-1">
                              <Icon size={12} style={{ color: eje.color }} />
                              <span className="text-[10px] font-bold" style={{ color: eje.color }}>{eje.label}</span>
                            </div>
                            <p className="text-xs text-slate-400 line-clamp-2">{respuesta}</p>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </>
              ) : (
                /* Completion Screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center space-y-6"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-20 h-20 mx-auto rounded-full flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${VIOLET} 0%, ${GOLD} 100%)` }}
                  >
                    <Crown size={40} className="text-white" />
                  </motion.div>

                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">¡Proyección Completa!</h2>
                    <p className="text-sm text-slate-400">
                      Has ganado <span style={{ color: GOLD }} className="font-bold">+90 puntos</span> en total
                    </p>
                  </div>

                  {/* Synthesis */}
                  <div 
                    className="p-5 rounded-2xl text-left"
                    style={{ 
                      backgroundColor: "rgba(124, 58, 237, 0.1)",
                      border: `1px solid ${VIOLET}40`
                    }}
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <Star size={16} style={{ color: VIOLET }} />
                      <span className="text-xs font-bold" style={{ color: VIOLET }}>
                        TU DECLARACIÓN DE MANIFESTACIÓN
                      </span>
                    </div>
                    {isLoadingAI ? (
                      <div className="flex items-center gap-2 py-4">
                        <Loader2 size={16} className="animate-spin" style={{ color: VIOLET }} />
                        <span className="text-sm text-slate-400">Generando tu síntesis...</span>
                      </div>
                    ) : (
                      <p className="text-sm text-white/90 leading-relaxed italic">
                        "{guidedSintesis}"
                      </p>
                    )}
                  </div>

                  {/* Summary of Answers */}
                  <div className="space-y-2 text-left">
                    {GUIADO_EJES.map(eje => {
                      const respuesta = guidedRespuestas[eje.id as keyof GuidedRespuestas];
                      if (!respuesta) return null;
                      const Icon = eje.icon;
                      return (
                        <div 
                          key={eje.id}
                          className="p-3 rounded-xl"
                          style={{ backgroundColor: `${eje.color}10`, border: `1px solid ${eje.color}30` }}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <Icon size={12} style={{ color: eje.color }} />
                            <span className="text-[10px] font-bold" style={{ color: eje.color }}>{eje.label}</span>
                          </div>
                          <p className="text-xs text-white/80">{respuesta}</p>
                        </div>
                      );
                    })}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3">
                    <button
                      onClick={resetGuidedMode}
                      className="flex-1 py-3 rounded-xl text-sm font-medium bg-white/5 text-slate-300 border border-white/10"
                      data-testid="btn-volver-galeria-guiado"
                    >
                      Volver a Galería
                    </button>
                    <button
                      onClick={() => startGuidedMode()}
                      className="flex-1 py-3 rounded-xl text-sm font-bold"
                      style={{ backgroundColor: VIOLET, color: "#fff" }}
                      data-testid="btn-nueva-proyeccion-guiada"
                    >
                      Nueva Proyección
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Back to Gallery */}
              {!showGuidedComplete && (
                <button
                  onClick={resetGuidedMode}
                  className="w-full py-3 text-center text-xs text-slate-500 hover:text-white transition-colors"
                  data-testid="btn-cancelar-guiado"
                >
                  ← Cancelar y Volver
                </button>
              )}
            </motion.div>
          )}

          {/* FASE: CÁPSULAS */}
          {phase === "capsules" && (
            <motion.div
              key="capsules"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {/* Selector de Cápsulas */}
              {!selectedCapsule && (
                <div className="space-y-3 mb-6">
                  <p className="text-[10px] text-slate-600 uppercase tracking-widest text-center mb-4">
                    Selecciona un eje para desarrollar tu proyección futura
                  </p>
                  
                  {PROYECCION_CAPSULES.map((capsule) => {
                    const Icon = capsule.icon;
                    const currentLevel = capsuleLevels[capsule.id] || 1;
                    const completedLevels = currentLevel - 1;
                    const isComplete = completedLevels >= 5;
                    const totalPoints = capsule.levels.reduce((a, l) => a + l.puntos, 0);
                    const earnedPoints = capsule.levels.filter(l => l.nivel < currentLevel).reduce((a, l) => a + l.puntos, 0);
                    
                    return (
                      <motion.button
                        key={capsule.id}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => !isComplete && setSelectedCapsule(capsule.id)}
                        disabled={isComplete}
                        className="w-full p-4 rounded-2xl border text-left transition-all flex items-center gap-4"
                        style={{ 
                          backgroundColor: isComplete ? `${capsule.color}10` : "#0a0a0a",
                          borderColor: isComplete ? capsule.color : `${capsule.color}30`,
                          opacity: isComplete ? 0.8 : 1
                        }}
                        data-testid={`capsule-${capsule.id}`}
                      >
                        <div 
                          className="w-12 h-12 rounded-xl flex items-center justify-center"
                          style={{ 
                            background: isComplete 
                              ? capsule.color 
                              : `${capsule.color}20`,
                            border: `1px solid ${capsule.color}50`
                          }}
                        >
                          {isComplete ? (
                            <CheckCircle size={24} className="text-black" />
                          ) : (
                            <Icon size={24} style={{ color: capsule.color }} />
                          )}
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-bold text-sm">{capsule.label}</span>
                            {isComplete && (
                              <span 
                                className="text-[8px] px-2 py-0.5 rounded-full font-bold"
                                style={{ backgroundColor: capsule.color, color: "#000" }}
                              >
                                COMPLETO
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex gap-1">
                              {[1, 2, 3, 4, 5].map(n => (
                                <div 
                                  key={n}
                                  className="w-4 h-1 rounded-full"
                                  style={{ 
                                    backgroundColor: n <= completedLevels ? capsule.color : "rgba(255,255,255,0.1)"
                                  }}
                                />
                              ))}
                            </div>
                            <span className="text-[10px] text-slate-500">
                              Nivel {Math.min(currentLevel, 5)}/5
                            </span>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <span className="text-sm font-bold" style={{ color: capsule.color }}>
                            +{earnedPoints}
                          </span>
                          <span className="text-[10px] text-slate-600">/{totalPoints}</span>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}

              {/* Botón Generar Proyección */}
              {!selectedCapsule && canGenerateProjection && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={generateProjectionNarrative}
                  disabled={isGeneratingProjection}
                  className="w-full p-5 rounded-2xl font-bold text-sm flex items-center justify-center gap-3"
                  style={{ 
                    background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`,
                    color: "#000"
                  }}
                  data-testid="btn-generar-proyeccion"
                >
                  {isGeneratingProjection ? (
                    <>
                      <Loader2 size={20} className="animate-spin" />
                      Proyectándote al futuro...
                    </>
                  ) : (
                    <>
                      <Sparkles size={20} />
                      GENERAR PROYECCIÓN IA
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              )}

              {/* Vista de Cápsula Seleccionada */}
              {selectedCapsule && (() => {
                const capsule = PROYECCION_CAPSULES.find(c => c.id === selectedCapsule)!;
                const Icon = capsule.icon;
                const nivel = capsuleLevels[selectedCapsule] || 1;
                const levelData = capsule.levels.find(l => l.nivel === nivel)!;
                const value = formData.capsulas[selectedCapsule]?.[nivel] || 
                             currentProyeccion?.capsulas?.[selectedCapsule]?.[nivel] || "";
                const completedLevels = nivel - 1;

                return (
                  <>
                    {/* Header de Cápsula */}
                    <div className="flex items-center justify-between mb-6">
                      <button
                        onClick={() => setSelectedCapsule(null)}
                        className="text-slate-400 hover:text-white transition-colors text-sm"
                        data-testid="btn-volver-capsulas"
                      >
                        ← Volver
                      </button>
                      <div className="flex items-center gap-2">
                        <Icon size={16} style={{ color: capsule.color }} />
                        <span className="text-sm font-bold" style={{ color: capsule.color }}>
                          {capsule.label}
                        </span>
                      </div>
                    </div>

                    {/* Nivel Actual */}
                    <div
                      className="p-6 rounded-2xl border"
                      style={{ backgroundColor: "#0a0a0a", borderColor: `${capsule.color}40` }}
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          <Star size={16} style={{ color: capsule.color }} />
                          <span className="text-sm font-bold text-white">
                            Nivel {nivel}: {levelData.titulo}
                          </span>
                        </div>
                        <span 
                          className="text-[10px] font-bold px-2 py-1 rounded"
                          style={{ backgroundColor: `${capsule.color}20`, color: capsule.color }}
                        >
                          +{levelData.puntos} pts
                        </span>
                      </div>
                      
                      <p className="text-sm mb-4" style={{ color: capsule.color }}>
                        {levelData.pregunta}
                      </p>
                      
                      <textarea
                        value={value}
                        onChange={(e) => handleCapsuleChange(selectedCapsule, nivel, e.target.value)}
                        placeholder="Tu visión futura..."
                        rows={4}
                        className="w-full bg-zinc-900/50 rounded-xl p-4 text-white text-sm placeholder:text-slate-700 focus:outline-none resize-none border transition-colors mb-4"
                        style={{ borderColor: value.trim().length >= 5 ? `${capsule.color}40` : "transparent" }}
                        data-testid={`input-capsule-${selectedCapsule}-${nivel}`}
                      />
                      
                      <button
                        onClick={() => completeLevelAndAdvance(selectedCapsule, nivel)}
                        disabled={value.trim().length < 5}
                        className="w-full py-4 rounded-xl font-black text-sm uppercase tracking-wide transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ 
                          background: value.trim().length >= 5 
                            ? capsule.color
                            : "rgba(255,255,255,0.1)",
                          color: value.trim().length >= 5 ? "#000" : "#666"
                        }}
                        data-testid={`btn-completar-nivel-${nivel}`}
                      >
                        <CheckCircle size={18} />
                        {nivel < 5 ? `Cerrar Nivel ${nivel} y Avanzar` : `Completar ${capsule.label}`}
                      </button>
                    </div>

                    {/* Niveles Anteriores */}
                    {completedLevels > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-[10px] text-slate-600 uppercase tracking-widest">Niveles anteriores</p>
                        {capsule.levels.filter(l => l.nivel < nivel && completedLevels >= l.nivel).map(l => {
                          const prevValue = currentProyeccion?.capsulas?.[selectedCapsule]?.[l.nivel] ||
                                           formData.capsulas[selectedCapsule]?.[l.nivel];
                          return (
                            <div 
                              key={l.nivel}
                              className="p-3 rounded-xl bg-white/5 flex items-center gap-3"
                            >
                              <CheckCircle size={14} style={{ color: capsule.color }} />
                              <div className="flex-1">
                                <p className="text-xs font-bold text-white">{l.titulo}</p>
                                <p className="text-[10px] text-slate-500 truncate">{prevValue}</p>
                              </div>
                              <span className="text-[10px] font-bold" style={{ color: capsule.color }}>
                                +{l.puntos}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </>
                );
              })()}
            </motion.div>
          )}

          {/* FASE: PROYECCIÓN GENERADA */}
          {phase === "projection" && (
            <motion.div
              key="projection"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-20 h-20 mx-auto mb-6 rounded-2xl flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)` }}
              >
                <Crown size={40} className="text-black" />
              </motion.div>
              
              <h2 className="text-2xl font-black text-white mb-2">
                TU REALIDAD PROYECTADA
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                La IA ha colapsado tu visión en una narrativa
              </p>

              <div 
                className="p-6 rounded-2xl border text-left mb-6"
                style={{ backgroundColor: "#0a0a0a", borderColor: `${GOLD}40` }}
              >
                <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                  {projectionNarrative}
                </p>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setPhase("capsules")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm bg-white/10 text-white"
                  data-testid="btn-volver-editar"
                >
                  Editar Cápsulas
                </button>
                <button
                  onClick={() => setPhase("gallery")}
                  className="flex-1 py-3 rounded-xl font-bold text-sm"
                  style={{ backgroundColor: GOLD, color: "#000" }}
                  data-testid="btn-finalizar"
                >
                  Finalizar
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Modal Vista Expandida */}
        <AnimatePresence>
          {expandedProyeccion && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-start justify-center p-4 overflow-y-auto"
              style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
              onClick={() => setExpandedProyeccion(null)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="w-full max-w-lg my-8 rounded-3xl border overflow-hidden"
                style={{ backgroundColor: "#0a0a0a", borderColor: `${GOLD}40` }}
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="p-4 border-b border-white/10 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)` }}
                    >
                      <Crown size={24} className="text-black" />
                    </div>
                    <div>
                      <h2 className="text-white font-bold">Tu Proyección Completa</h2>
                      <p className="text-xs text-slate-500">
                        +{calculatePoints(expandedProyeccion, { capsulas: {} })} Puntos
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setExpandedProyeccion(null)}
                    className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white transition-colors"
                    data-testid="btn-cerrar-vista"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-6 space-y-6">
                  {/* Narrativa */}
                  {expandedProyeccion.projectionNarrative && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles size={16} style={{ color: GOLD }} />
                        <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                          Tu Realidad Proyectada
                        </h3>
                      </div>
                      <div 
                        className="p-4 rounded-xl"
                        style={{ backgroundColor: `${GOLD}10` }}
                      >
                        <p className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                          {expandedProyeccion.projectionNarrative}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cápsulas */}
                  {PROYECCION_CAPSULES.map(capsule => {
                    const levels = expandedProyeccion.capsulas?.[capsule.id];
                    if (!levels || Object.keys(levels).length === 0) return null;
                    const Icon = capsule.icon;
                    return (
                      <div key={capsule.id}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icon size={16} style={{ color: capsule.color }} />
                          <h3 className="text-sm font-bold uppercase tracking-widest" style={{ color: capsule.color }}>
                            {capsule.label}
                          </h3>
                        </div>
                        <div className="space-y-2 pl-6">
                          {Object.entries(levels).map(([nivel, value]) => {
                            const levelData = capsule.levels.find(l => l.nivel === parseInt(nivel));
                            return (
                              <div 
                                key={nivel}
                                className="p-3 rounded-xl"
                                style={{ backgroundColor: `${capsule.color}10` }}
                              >
                                <p className="text-[10px] text-slate-500 mb-1">
                                  Nivel {nivel} - {levelData?.titulo}
                                </p>
                                <p className="text-sm text-white">{String(value)}</p>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-white/10">
                  <button
                    onClick={() => {
                      setExpandedProyeccion(null);
                      openExistingProyeccion(expandedProyeccion);
                    }}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
                    style={{ backgroundColor: GOLD, color: "#000" }}
                    data-testid="btn-continuar-desarrollo"
                  >
                    Continuar Desarrollando
                    <ChevronRight size={16} />
                  </button>
                </div>
              </motion.div>
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
                    <Rocket size={20} style={{ color: GOLD }} />
                    <span className="text-sm font-bold text-white">Tutorial Proyector</span>
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
    </div>
  );
}
