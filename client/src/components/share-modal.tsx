import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, MessageCircle, Twitter, Facebook, Loader2, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

type ShareType = "espejo" | "planeacion" | "esperanza" | "deposito" | "alquimia";

interface ShareItem {
  type: ShareType;
  text: string;
  subtype?: string;
  points?: number;
  date?: string;
}

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: ShareItem;
}


const shareConfig = {
  espejo: {
    emoji: "🪞",
    title: "Momento de Claridad",
    gradient: "from-blue-500/20 to-blue-600/10",
    border: "border-blue-500/30",
    accent: "text-blue-400",
  },
  planeacion: {
    emoji: "🧭",
    title: "Compromiso Futuro",
    gradient: "from-cyan-500/20 to-cyan-600/10",
    border: "border-cyan-500/30",
    accent: "text-cyan-400",
  },
  esperanza: {
    emoji: "💗",
    title: "Recuerdo de Esperanza",
    gradient: "from-pink-500/20 to-pink-600/10",
    border: "border-pink-500/30",
    accent: "text-pink-400",
  },
  deposito: {
    emoji: "💎",
    title: "Aprendizaje Depositado",
    gradient: "from-pink-500/20 to-pink-600/10",
    border: "border-pink-500/30",
    accent: "text-pink-400",
  },
  alquimia: {
    emoji: "⚗️",
    title: "Transmutación Alquímica",
    gradient: "from-amber-500/20 to-amber-600/10",
    border: "border-amber-500/30",
    accent: "text-amber-400",
  },
};

const typeEmojis: Record<string, string> = {
  mastery: "🧠",
  flow: "🔥",
  conflict: "⚡",
  trivial: "☕",
  dominio: "🎯",
  resonancia: "🧭",
  carga: "⚡",
  reparacion: "🔧",
  completed: "✅",
  esperanza: "💗",
};

const typeLabels: Record<string, string> = {
  mastery: "MOMENTO DE MAESTRÍA",
  flow: "ESTADO DE FLUJO",
  conflict: "CONFLICTO TRANSMUTADO",
  trivial: "CONSCIENCIA EN LO PEQUEÑO",
  dominio: "COMPROMISO DE DOMINIO",
  resonancia: "COMPROMISO DE RESONANCIA",
  carga: "COMPROMISO DE CARGA",
  reparacion: "COMPROMISO DE REPARACIÓN",
  completed: "COMPROMISO CUMPLIDO",
  esperanza: "MEMORIA DE ESPERANZA",
};

const APP_URL = typeof window !== 'undefined' ? window.location.origin : 'https://sistemicar.app';

export function ShareModal({ isOpen, onClose, item }: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [alchemyPhrase, setAlchemyPhrase] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const config = shareConfig[item.type];
  const emoji = typeEmojis[item.subtype || item.type] || "✨";
  const label = typeLabels[item.subtype || item.type] || "LOGRO PERSONAL";

  useEffect(() => {
    if (isOpen && item) {
      setAlchemyPhrase(getFallbackPhrase());
    }
  }, [isOpen, item]);

  const getFallbackPhrase = () => {
    const fallbacks: Record<string, string> = {
      mastery: "Ha alcanzado un nuevo nivel de dominio mental",
      flow: "Fluye en armonía con su propósito",
      conflict: "Ha transmutado un desafío en sabiduría",
      trivial: "Encuentra consciencia incluso en lo pequeño",
      dominio: "Se compromete con su evolución personal",
      resonancia: "Alinea sus acciones con sus valores más profundos",
      carga: "Acepta el peso que fortalece su carácter",
      reparacion: "Reconstruye con la sabiduría del que ha caído",
      completed: "Cumple lo prometido a su yo futuro",
      esperanza: "Guarda luz para iluminar los días oscuros",
    };
    return fallbacks[item.subtype || item.type] || "Avanza en su camino de transformación";
  };
  
  const getShareMessage = () => {
    const phrase = alchemyPhrase || getFallbackPhrase();
    
    const referralCode = localStorage.getItem("user_referral_code") || "";
    const shareUrl = referralCode ? `${APP_URL}?ref=${referralCode}` : APP_URL;
    
    return `✨ "${phrase}"\n\n🚀 Diseña tu día con SISTEMICAR\n${shareUrl}`;
  };

  const shareMessage = getShareMessage();
  
  const shareToWhatsApp = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const shareToTwitter = () => {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const shareToFacebook = () => {
    const url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(shareMessage)}`;
    window.open(url, "_blank");
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Error copying:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className={cn(
            "bg-[#0a0c14] border rounded-2xl max-w-md w-full p-6 relative",
            config.border
          )}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>

          <div className="text-center mb-6">
            <div className={cn(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 bg-gradient-to-br",
              config.gradient
            )}>
              <span className="text-3xl">{emoji}</span>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{config.title}</h2>
            <p className={cn("text-xs uppercase tracking-widest font-bold", config.accent)}>
              {label}
            </p>
          </div>

          <div className={cn(
            "p-4 rounded-xl border mb-6 bg-gradient-to-br",
            config.gradient,
            config.border
          )}>
            <p className="text-white/90 text-sm italic text-center">
              "{item.text}"
            </p>
            {item.points && (
              <p className="text-center mt-2">
                <span className={cn("font-bold", config.accent)}>+{item.points} CP</span>
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <button
              onClick={shareToWhatsApp}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-green-600/20 border border-green-600/30 text-green-400 hover:bg-green-600/30 transition-colors"
            >
              <MessageCircle size={18} />
              <span className="font-medium text-sm">WhatsApp</span>
            </button>
            <button
              onClick={shareToTwitter}
              className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-sky-500/20 border border-sky-500/30 text-sky-400 hover:bg-sky-500/30 transition-colors"
            >
              <Twitter size={18} />
              <span className="font-medium text-sm">Twitter</span>
            </button>
          </div>

          <button
            onClick={copyToClipboard}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors"
          >
            {copied ? (
              <>
                <Check size={18} className="text-green-400" />
                <span className="text-green-400 font-medium">¡Copiado!</span>
              </>
            ) : (
              <>
                <Copy size={18} />
                <span className="font-medium">Copiar mensaje</span>
              </>
            )}
          </button>

          <div className="flex items-center justify-center gap-2 mt-4 text-slate-500 text-xs">
            <Shield size={12} />
            <span>Tu progreso inspira a otros</span>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
