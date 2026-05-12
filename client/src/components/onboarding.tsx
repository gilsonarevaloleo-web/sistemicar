import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Zap, Eye, Lock, Sparkles, Award } from "lucide-react";

interface OnboardingProps {
  isOpen: boolean;
  onComplete: () => void;
}

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";

const steps = [
  {
    id: 1,
    title: "Bienvenido a SISTEMICAR",
    subtitle: "Tu Plataforma de Comando Mental",
    content: "SISTEMICAR usa los mismos mecanismos que las redes sociales, pero para ENFOCARTE en lugar de distraerte. Es alquimia mental: transformamos tus pensamientos en acción.",
    icon: Zap,
    color: GOLD
  },
  {
    id: 2,
    title: "Las 3 Áreas de Transmutación",
    subtitle: "Transforma tu experiencia cotidiana",
    content: null,
    icon: Sparkles,
    color: GOLD,
    isAreasStep: true
  },
  {
    id: 3,
    title: "Sistema de Puntos de Comando",
    subtitle: "Gana CP por cada acción consciente",
    content: null,
    icon: Award,
    color: "#3B82F6",
    isPointsStep: true
  },
  {
    id: 4,
    title: "¡Empieza Ahora!",
    subtitle: "Tu primera transmutación",
    content: "Ve a ESPERANZA y registra algo que te dé fuerzas para el futuro. Puede ser un recuerdo, una meta, o algo que te inspire. ¡Cada registro suma CP!",
    icon: Lock,
    color: AZURE
  }
];

const areas = [
  { 
    name: "ESPEJO", 
    icon: Eye, 
    color: "#A855F7", 
    desc: "Observa tu estado mental actual sin juicio. La consola de auto-conocimiento." 
  },
  { 
    name: "ESPERANZA", 
    icon: Lock, 
    color: AZURE, 
    desc: "Guarda lo que te da fuerzas. Tu bóveda de motivación para días difíciles." 
  },
  { 
    name: "ALQUIMIA", 
    icon: Sparkles, 
    color: GOLD, 
    desc: "Destila sabiduría de tus experiencias. Transforma lo vivido en aprendizaje." 
  }
];

const pointsTable = [
  { type: "Registrar en Espejo", points: "+8 pts" },
  { type: "Guardar en Esperanza", points: "+8 pts" },
  { type: "Destilar en Alquimia", points: "+8 pts" },
  { type: "Llegar a 180 pts", points: "= Alianza" }
];

export function Onboarding({ isOpen, onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  if (!isOpen) return null;

  const step = steps[currentStep];
  const StepIcon = step.icon;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-xl z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="w-full max-w-lg rounded-2xl p-4 relative max-h-[85vh] overflow-y-auto"
          style={{ backgroundColor: "#0a0a0a", border: "1px solid rgba(212, 175, 55, 0.2)" }}
        >
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-slate-500 hover:text-white transition-colors"
            data-testid="button-skip-onboarding"
          >
            <X size={20} />
          </button>

          <div className="flex justify-center gap-2 mb-6">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className="h-1 w-8 rounded-full transition-all"
                style={{
                  backgroundColor: idx <= currentStep ? GOLD : "rgba(255,255,255,0.1)"
                }}
              />
            ))}
          </div>

          <div className="flex justify-center mb-3">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${step.color}20`, border: `2px solid ${step.color}` }}
            >
              <StepIcon size={24} style={{ color: step.color }} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-center text-white mb-1">{step.title}</h2>
          <p className="text-xs text-center mb-4" style={{ color: step.color }}>{step.subtitle}</p>

          {step.content && (
            <p className="text-slate-300 text-center mb-4 leading-relaxed text-sm">{step.content}</p>
          )}

          {step.isAreasStep && (
            <div className="space-y-2 mb-4">
              {areas.map((area) => {
                const AreaIcon = area.icon;
                return (
                  <div
                    key={area.name}
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: `${area.color}10`, border: `1px solid ${area.color}30` }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <AreaIcon size={16} style={{ color: area.color }} />
                      <span className="font-bold text-sm" style={{ color: area.color }}>{area.name}</span>
                    </div>
                    <p className="text-xs text-slate-400">{area.desc}</p>
                  </div>
                );
              })}
            </div>
          )}

          {step.isPointsStep && (
            <div className="space-y-1 mb-4">
              {pointsTable.map((row, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg"
                  style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                >
                  <span className="text-white text-xs">{row.type}</span>
                  <span className="font-bold text-amber-400 text-xs">{row.points}</span>
                </div>
              ))}
              <p className="text-xs text-center text-slate-500 mt-2">
                180 pts Soberanía = Alianza (30% comisión)
              </p>
            </div>
          )}

          <div className="flex gap-3">
            {currentStep > 0 && (
              <button
                onClick={handlePrev}
                className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 text-slate-400 hover:text-white transition-colors"
                style={{ backgroundColor: "rgba(255,255,255,0.05)" }}
                data-testid="button-onboarding-prev"
              >
                <ChevronLeft size={18} />
                Anterior
              </button>
            )}
            <button
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl flex items-center justify-center gap-2 font-bold text-black transition-all hover:scale-[1.02]"
              style={{ backgroundColor: GOLD }}
              data-testid="button-onboarding-next"
            >
              {currentStep === steps.length - 1 ? "¡Comenzar!" : "Siguiente"}
              {currentStep < steps.length - 1 && <ChevronRight size={18} />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
