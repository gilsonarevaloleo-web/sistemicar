import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Copy, Check, ChevronDown, ChevronRight, ExternalLink, Clock, Calendar, Image, Youtube, Scissors } from "lucide-react";
import type { MasterclassYT } from "@/lib/persistence";

const GOLD = "#D4AF37";
const CYAN = "#00FFC3";
const RED = "#FF3131";
const DARK = "#0A0A0A";

const CLINICAL_KEYWORDS = [
  "Voltaje", "Hardware", "Chófer", "Pasajero", "Mendigo", "Interfaz",
  "Soberano", "Egrégore", "Terminal", "Frecuencia", "Estática",
  "Calibración", "Descompresión", "Cortocircuito", "Falla", "Mando",
  "M01", "M02", "M03", "M04", "M05", "M06", "M07", "M08", "M09", "M10",
  "Territorio", "Flujo", "Poder", "Resonancia", "Emisión", "Estrategia",
  "Procesamiento", "Autoridad", "Integración"
];

interface PreviewMasterclassProps {
  masterclass: MasterclassYT;
  onClose: () => void;
}

export default function PreviewMasterclass({ masterclass, onClose }: PreviewMasterclassProps) {
  const [copied, setCopied] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    guion: true,
    titulos: true,
    thumbnail: false,
    descripcion: false,
    shorts: false,
    timing: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const copyText = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(field);
      setTimeout(() => setCopied(null), 2000);
    } catch {}
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backgroundColor: "rgba(0,0,0,0.95)" }}
      data-testid="preview-masterclass-overlay"
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl relative"
        style={{ backgroundColor: DARK, border: `1px solid ${GOLD}40` }}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full flex items-center justify-center"
          style={{ backgroundColor: `${RED}20`, border: `1px solid ${RED}40` }}
          data-testid="btn-close-masterclass"
        >
          <X size={16} style={{ color: RED }} />
        </button>

        <div className="p-5 pb-3" style={{ borderBottom: `1px solid ${GOLD}15` }}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-[10px] font-mono tracking-widest px-2 py-1 rounded" style={{ color: CYAN, backgroundColor: `${CYAN}15`, border: `1px solid ${CYAN}30` }} data-testid="mc-interfaz-badge">
              {masterclass.interfaz}
            </span>
            <span className="text-[9px] font-mono px-2 py-1 rounded flex items-center gap-1" style={{ color: `${GOLD}80`, backgroundColor: `${GOLD}08` }}>
              <Youtube size={10} />
              ~10 min
            </span>
          </div>
          <h2 className="text-lg font-black text-white" data-testid="mc-nombre">{masterclass.nombre_interfaz}</h2>
          {masterclass.tracking_url && (
            <a
              href={masterclass.tracking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[9px] flex items-center gap-1 mt-2 w-fit px-2 py-1 rounded"
              style={{ color: CYAN, backgroundColor: `${CYAN}10`, border: `1px solid ${CYAN}20` }}
              data-testid="mc-tracking-link"
            >
              <ExternalLink size={10} />
              {masterclass.tracking_url}
            </a>
          )}
        </div>

        <div className="p-5 space-y-3">
          <CollapsibleSection
            title="Guion Extendido (~10 min)"
            icon={<Youtube size={14} />}
            sectionKey="guion"
            expanded={expandedSections.guion}
            onToggle={toggleSection}
          >
            <div className="relative group">
              <CopyBtn field="guion" text={masterclass.guion_extendido} copied={copied} onCopy={copyText} />
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid="mc-guion">
                {highlightInContent(masterclass.guion_extendido)}
              </div>
              <div className="mt-3 flex items-center gap-3 text-[9px] text-slate-600">
                <span>{masterclass.guion_extendido.split(/\s+/).length} palabras</span>
                <span>~{Math.ceil(masterclass.guion_extendido.split(/\s+/).length / 150)} min lectura</span>
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="3 Títulos Alternativos"
            icon={<span className="text-[10px] font-bold">ABC</span>}
            sectionKey="titulos"
            expanded={expandedSections.titulos}
            onToggle={toggleSection}
          >
            <div className="space-y-2">
              <TitleRow label="MIEDO (Mendigo)" color={RED} text={masterclass.titulos.miedo} field="titulo-miedo" copied={copied} onCopy={copyText} />
              <TitleRow label="PODER (Pasajero)" color={CYAN} text={masterclass.titulos.poder} field="titulo-poder" copied={copied} onCopy={copyText} />
              <TitleRow label="TÉCNICO (Interfaz)" color={GOLD} text={masterclass.titulos.tecnico} field="titulo-tecnico" copied={copied} onCopy={copyText} />
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Thumbnail Prompt"
            icon={<Image size={14} />}
            sectionKey="thumbnail"
            expanded={expandedSections.thumbnail}
            onToggle={toggleSection}
          >
            <div className="relative group">
              <CopyBtn field="thumbnail" text={masterclass.thumbnail_prompt} copied={copied} onCopy={copyText} />
              <p className="text-xs text-slate-300 leading-relaxed italic" data-testid="mc-thumbnail">{masterclass.thumbnail_prompt}</p>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Descripción SEO (~500 palabras)"
            icon={<span className="text-[10px]">SEO</span>}
            sectionKey="descripcion"
            expanded={expandedSections.descripcion}
            onToggle={toggleSection}
          >
            <div className="relative group">
              <CopyBtn field="descripcion" text={masterclass.descripcion_seo} copied={copied} onCopy={copyText} />
              <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid="mc-descripcion">
                {highlightInContent(masterclass.descripcion_seo)}
              </div>
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title={`3 Shorts (Anzuelos de Voltaje)`}
            icon={<Scissors size={14} />}
            sectionKey="shorts"
            expanded={expandedSections.shorts}
            onToggle={toggleSection}
          >
            <div className="space-y-3">
              {masterclass.shorts.map((short, idx) => (
                <div key={idx} className="rounded-xl p-3" style={{ backgroundColor: `${RED}06`, border: `1px solid ${RED}15` }}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `${RED}20`, color: RED }}>
                        SHORT {idx + 1}
                      </span>
                      <span className="text-xs font-bold text-white">{short.titulo}</span>
                    </div>
                    <CopyBtn
                      field={`short-${idx}`}
                      text={`${short.titulo}\n\nHOOK: ${short.hook}\n\nGUIÓN:\n${short.guion}`}
                      copied={copied}
                      onCopy={copyText}
                      inline
                    />
                  </div>
                  <div className="mb-2 rounded-lg p-2" style={{ backgroundColor: `${RED}08` }}>
                    <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: RED }}>Hook (3s)</span>
                    <p className="text-xs text-white font-bold" data-testid={`mc-short-hook-${idx}`}>"{short.hook}"</p>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider block mb-1" style={{ color: `${GOLD}80` }}>Guion (30-60s)</span>
                    <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap" data-testid={`mc-short-guion-${idx}`}>{short.guion}</p>
                  </div>
                </div>
              ))}
            </div>
          </CollapsibleSection>

          <CollapsibleSection
            title="Timing de Publicación"
            icon={<Calendar size={14} />}
            sectionKey="timing"
            expanded={expandedSections.timing}
            onToggle={toggleSection}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-xl p-3 text-center flex-1" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${GOLD}15` }}>
                <p className="text-2xl font-black" style={{ color: GOLD }}>{masterclass.timing.orden_publicacion}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Orden</p>
              </div>
              <div className="rounded-xl p-3 text-center flex-1" style={{ backgroundColor: `${CYAN}08`, border: `1px solid ${CYAN}15` }}>
                <p className="text-sm font-bold" style={{ color: CYAN }}>{masterclass.timing.dia_semana}</p>
                <p className="text-[9px] text-slate-500 uppercase tracking-wider">Día Sugerido</p>
              </div>
            </div>
            {masterclass.timing.razon && (
              <p className="text-[11px] text-slate-400 mt-2 italic" data-testid="mc-timing-razon">{masterclass.timing.razon}</p>
            )}
          </CollapsibleSection>
        </div>
      </motion.div>
    </motion.div>
  );
}

function CollapsibleSection({ title, icon, sectionKey, expanded, onToggle, children }: {
  title: string;
  icon: React.ReactNode;
  sectionKey: string;
  expanded: boolean;
  onToggle: (key: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl overflow-hidden" style={{ backgroundColor: `${GOLD}04`, border: `1px solid ${GOLD}12` }}>
      <button
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center gap-2 p-3 text-left transition-colors hover:bg-white/[0.02]"
        data-testid={`mc-toggle-${sectionKey}`}
      >
        <span style={{ color: GOLD }}>{icon}</span>
        <span className="text-[11px] font-bold uppercase tracking-wider flex-1" style={{ color: GOLD }}>{title}</span>
        {expanded ? <ChevronDown size={14} style={{ color: `${GOLD}60` }} /> : <ChevronRight size={14} style={{ color: `${GOLD}60` }} />}
      </button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-3 pb-3">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TitleRow({ label, color, text, field, copied, onCopy }: {
  label: string;
  color: string;
  text: string;
  field: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
}) {
  return (
    <div className="flex items-start gap-3 rounded-lg p-2 group" style={{ backgroundColor: `${color}06`, border: `1px solid ${color}12` }}>
      <span className="text-[8px] font-bold uppercase tracking-wider mt-1 shrink-0 w-28" style={{ color }}>{label}</span>
      <p className="text-xs text-white font-bold flex-1" data-testid={`mc-${field}`}>{text}</p>
      <button
        onClick={() => onCopy(text, field)}
        className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
        data-testid={`btn-copy-${field}`}
      >
        {copied === field ? <Check size={10} style={{ color: CYAN }} /> : <Copy size={10} style={{ color: `${color}80` }} />}
      </button>
    </div>
  );
}

function CopyBtn({ field, text, copied, onCopy, inline }: {
  field: string;
  text: string;
  copied: string | null;
  onCopy: (text: string, field: string) => void;
  inline?: boolean;
}) {
  if (inline) {
    return (
      <button
        onClick={() => onCopy(text, field)}
        className="w-6 h-6 rounded flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${GOLD}15` }}
        data-testid={`btn-copy-${field}`}
      >
        {copied === field ? <Check size={10} style={{ color: CYAN }} /> : <Copy size={10} style={{ color: `${GOLD}80` }} />}
      </button>
    );
  }
  return (
    <button
      onClick={() => onCopy(text, field)}
      className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded flex items-center justify-center"
      style={{ backgroundColor: `${GOLD}15` }}
      data-testid={`btn-copy-${field}`}
    >
      {copied === field ? <Check size={10} style={{ color: CYAN }} /> : <Copy size={10} style={{ color: `${GOLD}80` }} />}
    </button>
  );
}

function highlightInContent(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let keyIdx = 0;
  while (remaining.length > 0) {
    let earliestIdx = remaining.length;
    let matchedKeyword = "";
    for (const kw of CLINICAL_KEYWORDS) {
      const idx = remaining.toLowerCase().indexOf(kw.toLowerCase());
      if (idx !== -1 && idx < earliestIdx) {
        earliestIdx = idx;
        matchedKeyword = kw;
      }
    }
    if (matchedKeyword && earliestIdx < remaining.length) {
      if (earliestIdx > 0) parts.push(remaining.slice(0, earliestIdx));
      parts.push(
        <span key={keyIdx++} className="font-bold" style={{ color: CYAN }}>
          {remaining.slice(earliestIdx, earliestIdx + matchedKeyword.length)}
        </span>
      );
      remaining = remaining.slice(earliestIdx + matchedKeyword.length);
    } else {
      parts.push(remaining);
      break;
    }
  }
  return <>{parts}</>;
}
