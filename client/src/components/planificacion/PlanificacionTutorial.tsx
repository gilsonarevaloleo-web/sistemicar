import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronRight, ChevronLeft, Compass, MessageCircle } from "lucide-react";
import {
  getTutorialSteps,
  markTutorialDone,
  profileLabel,
  type PlanificacionPlanProfile,
} from "@/lib/planificacionOnboarding";

const GOLD = "#D4AF37";
const BLOOD = "#FF3131";

type Props = {
  uid: string;
  profile: PlanificacionPlanProfile;
  onComplete: () => void;
  onAskDoctor?: (prompt: string) => void;
};

export function PlanificacionTutorial({ uid, profile, onComplete, onAskDoctor }: Props) {
  const steps = getTutorialSteps(profile);
  const [step, setStep] = useState(0);

  const finish = () => {
    markTutorialDone(uid);
    onComplete();
  };

  const current = steps[step];
  const isLast = step >= steps.length - 1;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-end sm:items-center justify-center p-4 bg-black/85"
      data-testid="overlay-planificacion-tutorial"
    >
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md rounded-2xl border p-5"
        style={{ borderColor: `${GOLD}40`, backgroundColor: "#0a0a0a" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Compass size={18} style={{ color: GOLD }} />
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
              Tutorial · {profileLabel(profile)}
            </span>
          </div>
          <button
            type="button"
            onClick={finish}
            className="p-1 rounded-lg hover:bg-white/5 text-slate-500"
            aria-label="Cerrar tutorial"
            data-testid="btn-skip-planificacion-tutorial"
          >
            <X size={18} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
          >
            <h2 className="text-lg font-black text-white mb-2">{current.title}</h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-3">{current.description}</p>
            {current.action && (
              <p className="text-xs font-bold rounded-lg px-3 py-2" style={{ color: GOLD, backgroundColor: `${GOLD}12` }}>
                {current.action}
              </p>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-1.5 justify-center my-4">
          {steps.map((_, i) => (
            <span
              key={i}
              className="w-2 h-2 rounded-full transition-transform"
              style={{
                backgroundColor: i === step ? GOLD : "rgba(255,255,255,0.15)",
                transform: i === step ? "scale(1.25)" : "scale(1)",
              }}
            />
          ))}
        </div>

        <div className="flex gap-2">
          {step > 0 && (
            <button
              type="button"
              onClick={() => setStep(s => s - 1)}
              className="flex-1 py-2.5 rounded-xl border border-white/10 text-xs text-slate-300 flex items-center justify-center gap-1"
              data-testid="btn-tutorial-plan-prev"
            >
              <ChevronLeft size={14} />
              Anterior
            </button>
          )}
          <button
            type="button"
            onClick={() => (isLast ? finish() : setStep(s => s + 1))}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold text-black flex items-center justify-center gap-1"
            style={{ background: GOLD }}
            data-testid="btn-tutorial-plan-next"
          >
            {isLast ? "¡Empezar!" : "Siguiente"}
            {!isLast && <ChevronRight size={14} />}
          </button>
        </div>

        {isLast && onAskDoctor && (
          <button
            type="button"
            onClick={() => {
              finish();
              onAskDoctor("¿Por dónde empiezo hoy en Planificación?");
            }}
            className="w-full mt-3 py-2 rounded-xl border text-[11px] text-slate-300 flex items-center justify-center gap-2"
            style={{ borderColor: `${BLOOD}40` }}
            data-testid="btn-tutorial-ask-doctor"
          >
            <MessageCircle size={14} style={{ color: BLOOD }} />
            Preguntar al Doctor IA
          </button>
        )}
      </motion.div>
    </div>
  );
}
