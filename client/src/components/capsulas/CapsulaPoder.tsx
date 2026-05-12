import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronUp,
  Share2,
  Star,
  Copy,
  ClipboardCheck,
  Eye,
  Brain,
  Flame,
  Zap,
  Coffee,
  Heart,
  Target,
  Check,
  Archive,
  Compass,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";

const GOLD = "#D4AF37";

export type CapsulaTipo = "espejo" | "alquimia" | "planificacion" | "deposito";

export interface CapsulaDato {
  id: string;
  tipo: CapsulaTipo;
  titulo: string;
  texto: string;
  subtexto?: string;
  puntos: number;
  fecha: Date;
  esPrincipioMaestro?: boolean;
  expandedFields?: { label: string; value: string; color?: string }[];
  status?: string;
  badge?: string;
  badgeColor?: string;
}

const TIPO_CONFIG: Record<CapsulaTipo, {
  label: string;
  icon: any;
  color: string;
  bgColor: string;
  borderColor: string;
}> = {
  espejo: {
    label: "ESPEJO",
    icon: Eye,
    color: "#3B82F6",
    bgColor: "rgba(59,130,246,0.08)",
    borderColor: "rgba(59,130,246,0.2)",
  },
  alquimia: {
    label: "ALQUIMIA",
    icon: Sparkles,
    color: "#D4AF37",
    bgColor: "rgba(212,175,55,0.08)",
    borderColor: "rgba(212,175,55,0.2)",
  },
  planificacion: {
    label: "PLANIFICACIÓN",
    icon: Compass,
    color: "#06B6D4",
    bgColor: "rgba(6,182,212,0.08)",
    borderColor: "rgba(6,182,212,0.2)",
  },
  deposito: {
    label: "DEPÓSITO",
    icon: Heart,
    color: "#EC4899",
    bgColor: "rgba(236,72,153,0.08)",
    borderColor: "rgba(236,72,153,0.2)",
  },
};

interface CapsulaPorProps {
  dato: CapsulaDato;
  esOwner: boolean;
  onSello?: (id: string, texto: string, modulo: string) => void;
  onShare?: (dato: CapsulaDato) => void;
}

export function CapsulaPoder({ dato, esOwner, onSello, onShare }: CapsulaPorProps) {
  const [expanded, setExpanded] = useState(false);
  const config = TIPO_CONFIG[dato.tipo];
  const Icon = config.icon;
  const isLong = dato.texto.length > 80 || (dato.expandedFields && dato.expandedFields.length > 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        expanded ? "ring-1" : ""
      )}
      style={{
        backgroundColor: config.bgColor,
        borderColor: config.borderColor,
        ...(expanded ? { ringColor: config.color } : {}),
      }}
      data-testid={`capsula-${dato.tipo}-${dato.id}`}
    >
      <button
        onClick={() => isLong && setExpanded(!expanded)}
        className="w-full p-4 text-left"
      >
        <div className="flex items-start gap-3">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
            style={{ backgroundColor: `${config.color}20` }}
          >
            <Icon size={16} style={{ color: config.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span
                className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                style={{ backgroundColor: `${config.color}20`, color: config.color }}
              >
                {config.label}
              </span>
              {dato.badge && (
                <span
                  className="text-[8px] font-bold uppercase px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: `${dato.badgeColor || config.color}20`,
                    color: dato.badgeColor || config.color,
                  }}
                >
                  {dato.badge}
                </span>
              )}
              {dato.esPrincipioMaestro && (
                <Star size={10} className="text-amber-400" fill="currentColor" />
              )}
            </div>
            <p className="text-sm font-bold text-white mb-0.5">{dato.titulo}</p>
            <p
              className={cn(
                "text-xs text-slate-400 leading-relaxed",
                !expanded && isLong && "line-clamp-2"
              )}
            >
              {dato.texto}
            </p>
            <div className="flex items-center gap-3 mt-2">
              <span className="text-[9px] text-slate-600">
                +{dato.puntos} PS
              </span>
              <span className="text-[9px] text-slate-600">
                {dato.fecha.toLocaleDateString("es", {
                  day: "numeric",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare(dato);
                  }}
                  className="ml-auto p-1.5 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                  data-testid={`share-capsula-${dato.id}`}
                >
                  <Share2 size={12} className="text-slate-400" />
                </button>
              )}
              {esOwner && onSello && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSello(dato.id, dato.texto || dato.titulo, dato.tipo);
                  }}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    dato.esPrincipioMaestro
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-white/5 hover:bg-white/10 text-slate-400 hover:text-amber-400"
                  )}
                  title="Sellar como Principio Maestro"
                  data-testid={`seal-capsula-${dato.id}`}
                >
                  <Star
                    size={12}
                    fill={dato.esPrincipioMaestro ? "currentColor" : "none"}
                  />
                </button>
              )}
              {isLong && (
                <span className="text-slate-500">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </span>
              )}
            </div>
          </div>
        </div>
      </button>

      <AnimatePresence>
        {expanded && dato.expandedFields && dato.expandedFields.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div
              className="px-4 pb-4 pt-2 space-y-2 border-t"
              style={{ borderColor: "rgba(255,255,255,0.05)" }}
            >
              {dato.expandedFields.map((field, i) => (
                <div key={i} className="p-2.5 rounded-xl bg-black/20">
                  <span
                    className="text-[9px] font-bold uppercase tracking-wider block mb-1"
                    style={{ color: field.color || config.color }}
                  >
                    {field.label}
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed italic" style={{ fontFamily: "Georgia, serif" }}>
                    {field.value}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export function CopiadoEstructurado({
  capsulas,
  dateLabel,
}: {
  capsulas: CapsulaDato[];
  dateLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const lines = capsulas.map((c) => {
      const config = TIPO_CONFIG[c.tipo];
      const time = c.fecha.toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
      let text = `[${config.label} +${c.puntos}PS] ${time}\n${c.titulo}`;
      if (c.texto && c.texto !== c.titulo) {
        text += `\n${c.texto}`;
      }
      if (c.expandedFields) {
        c.expandedFields.forEach((f) => {
          if (f.value) text += `\n  ${f.label}: ${f.value}`;
        });
      }
      if (c.badge) text += `\n  Estado: ${c.badge}`;
      return text;
    });

    const fullText = `--- ${dateLabel.toUpperCase()} ---\n\n${lines.join("\n\n")}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      toast.success("Copiado al portapapeles");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="p-1 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
      title="Copiar registros del día"
      data-testid={`copy-date-${dateLabel}`}
    >
      {copied ? (
        <ClipboardCheck size={12} className="text-emerald-400" />
      ) : (
        <Copy size={12} className="text-slate-500" />
      )}
    </button>
  );
}
