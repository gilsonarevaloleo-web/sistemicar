import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { 
  UserProgression, 
  getClientMode, 
  EnergyLog, 
  calculateTotalCP 
} from "@/lib/persistence";
import { generateSeductionMessage, ClientMode } from "@/lib/gemini";

interface SeductionMessageProps {
  progression: UserProgression | null;
  energyLogs?: EnergyLog[];
  extraContext?: string;
  className?: string;
}

export function SeductionMessage({ 
  progression, 
  energyLogs = [], 
  extraContext,
  className 
}: SeductionMessageProps) {
  const [, navigate] = useLocation();
  const [message, setMessage] = useState<string>("");
  const [mode, setMode] = useState<ClientMode>("gratuito");

  useEffect(() => {
    if (!progression) return;
    
    const clientMode = getClientMode(progression);
    setMode(clientMode);
    
    const recentLogs = energyLogs.slice(0, 10);
    const positiveTypes = ["enfoque", "pasos"];
    const positiveCount = recentLogs.filter(l => positiveTypes.includes(l.type)).length;
    const hopePercent = Math.round((positiveCount / Math.max(recentLogs.length, 1)) * 100);
    const currentCP = calculateTotalCP(energyLogs);
    
    generateSeductionMessage({
      mode: clientMode,
      hopePercent,
      totalCP: progression.totalCP || currentCP,
      registrationDays: progression.registrationDays || 0
    }, extraContext).then(msg => {
      setMessage(msg);
    });
  }, [progression, energyLogs, extraContext]);

  if (!message) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "p-4 rounded-2xl border backdrop-blur-xl",
        mode === "gratuito" && "bg-gradient-to-r from-purple-900/30 to-indigo-900/30 border-purple-500/30",
        mode === "pago" && "bg-gradient-to-r from-blue-900/30 to-cyan-900/30 border-blue-500/30",
        mode === "reto" && "bg-gradient-to-r from-amber-900/30 to-orange-900/30 border-amber-500/30",
        className
      )}
      data-testid="seduction-message"
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
          mode === "gratuito" && "bg-purple-500/20",
          mode === "pago" && "bg-blue-500/20",
          mode === "reto" && "bg-amber-500/20"
        )}>
          <Sparkles size={16} className={cn(
            mode === "gratuito" && "text-purple-400",
            mode === "pago" && "text-blue-400",
            mode === "reto" && "text-amber-400"
          )} />
        </div>
        <div className="flex-1">
          <p className="text-sm text-white/90 leading-relaxed" data-testid="seduction-text">
            {message}
          </p>
          {mode === "pago" && (
            <button
              onClick={() => navigate("/esperanza")}
              className="mt-2 text-xs text-blue-400 hover:text-blue-300 underline underline-offset-2"
              data-testid="link-acervo"
            >
              Fortalecer en Depósito
            </button>
          )}
          {mode === "reto" && (
            <button
              onClick={() => navigate("/socios")}
              className="mt-2 text-xs text-amber-400 hover:text-amber-300 underline underline-offset-2"
              data-testid="link-alliance"
            >
              Ver Propuesta de Alianza
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
