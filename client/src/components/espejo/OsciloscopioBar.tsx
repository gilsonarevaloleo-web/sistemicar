import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";

const VOCABULARIO: Record<string, string[]> = {
  ROJO: ["hambre", "miedo", "deuda", "escasez", "pánico", "panico", "perder", "quiebra", "pagar", "quitan", "familia en riesgo", "aguantar", "resistir", "sobrevivir", "arruinar", "perdi", "sin dinero", "deudas", "riesgo"],
  NARANJA: ["idea", "crear", "proyectar", "diseñar", "disenar", "imaginar", "nuevo", "propuesta", "inventar", "bloqueo", "creativo", "gustaría", "gustaria", "quiero hacer", "diferente", "innovar"],
  AMARILLO: ["orgullo", "vergüenza", "verguenza", "quién soy yo", "reconocimiento", "ego", "status", "qué dirán", "que diran", "soberbia", "soy suficiente", "suficiente", "mejor que", "no valgo", "inferioridad"],
  VERDE: ["familia", "pareja", "traición", "traicion", "envidia", "injusto", "él sí", "el si", "resentimiento", "abandono", "sacrificio", "nadie me entiende", "soledad", "relación", "relacion", "vínculo", "vinculo"],
  AZUL: ["callé", "calle", "cómo decirlo", "como decirlo", "guardé", "guarde", "no puedo expresar", "mentira", "hipocresía", "hipocresia", "dije lo que", "nudo", "garganta", "silencio", "callado"],
  MORADO: ["plan", "proyecto", "estrategia", "futuro", "confusión", "confusion", "no veo el camino", "traición estratégica", "traicion estrategica", "qué hacer con", "que hacer con", "perdí el norte", "perdi el norte", "dirección", "direccion"],
  VIOLETA: ["propósito", "proposito", "destino", "fe", "sirvo", "legado", "nihilismo", "da igual", "solo en el universo", "abandono existencial", "para qué", "para que", "sin sentido"],
};

const POSTERGACION = ["no sé", "no se", "quizás", "quizas", "mañana", "manana", "tal vez", "voy a intentar", "cuando pueda", "si se puede", "ya veremos", "depende", "a ver", "más tarde", "mas tarde"];

const CORTOCIRCUITOS: Array<{ colores: [string, string]; mensaje: string }> = [
  { colores: ["MORADO", "ROJO"], mensaje: "visión con motor sin gasolina" },
  { colores: ["VIOLETA", "AMARILLO"], mensaje: "propósito sin materialización" },
  { colores: ["AZUL", "VERDE"], mensaje: "verdad callada por miedo a la relación" },
  { colores: ["NARANJA", "ROJO"], mensaje: "ideas sin fuerza de ejecución" },
  { colores: ["AMARILLO", "AZUL"], mensaje: "soberbia que no puede emitir el comando" },
];

const COLOR_HEX: Record<string, string> = {
  ROJO: "#FF3131",
  NARANJA: "#F97316",
  AMARILLO: "#EAB308",
  VERDE: "#22C55E",
  AZUL: "#3B82F6",
  MORADO: "#8B5CF6",
  VIOLETA: "#A78BFA",
};

const COLOR_LABEL: Record<string, string> = {
  ROJO: "instinto · supervivencia",
  NARANJA: "creatividad · asombro",
  AMARILLO: "ego · voluntad",
  VERDE: "fricción · relación",
  AZUL: "verdad · voz",
  MORADO: "mando · estrategia",
  VIOLETA: "fe · soberanía",
};

interface OsciloscopioBarProps {
  texto: string;
  onColorChange?: (color: string | null) => void;
  voiceActive?: boolean;
  voiceAmplitude?: number;
}

function analizar(texto: string, minWords: number = 10): {
  dominante: string | null;
  segundo: string | null;
  pct: number;
  pct2: number;
  esPostergacion: boolean;
  cortocircuito: string | null;
} {
  const lower = texto.toLowerCase();
  const wordCount = texto.trim().split(/\s+/).filter(Boolean).length;

  if (wordCount < minWords) return { dominante: null, segundo: null, pct: 0, pct2: 0, esPostergacion: false, cortocircuito: null };

  const esPostergacion = POSTERGACION.some(p => lower.includes(p)) &&
    !Object.values(VOCABULARIO).flat().some(w => lower.includes(w));

  const scores: Record<string, number> = {};
  for (const [color, palabras] of Object.entries(VOCABULARIO)) {
    scores[color] = 0;
    for (const p of palabras) {
      if (lower.includes(p)) scores[color]++;
    }
  }

  const sorted = Object.entries(scores).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return { dominante: null, segundo: null, pct: 0, pct2: 0, esPostergacion, cortocircuito: null };

  const total = sorted.reduce((acc, [, v]) => acc + v, 0);
  const dominante = sorted[0][0];
  const pct = Math.round((sorted[0][1] / total) * 100);
  const segundo = sorted[1]?.[0] ?? null;
  const pct2 = sorted[1] ? Math.round((sorted[1][1] / total) * 100) : 0;

  let cortocircuito: string | null = null;
  if (segundo && pct2 >= 25) {
    const par = CORTOCIRCUITOS.find(
      c => (c.colores[0] === dominante && c.colores[1] === segundo) ||
           (c.colores[0] === segundo && c.colores[1] === dominante)
    );
    if (par) cortocircuito = par.mensaje;
  }

  return { dominante, segundo, pct, pct2, esPostergacion, cortocircuito };
}

export default function OsciloscopioBar({ texto, onColorChange, voiceActive = false, voiceAmplitude = 0 }: OsciloscopioBarProps) {
  const [resultado, setResultado] = useState<ReturnType<typeof analizar> | null>(null);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const minWords = voiceActive ? 5 : 10;

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      const r = analizar(texto, minWords);
      setResultado(r);
      setVisible(true);
      onColorChange?.(r.dominante);
    }, voiceActive ? 300 : 600);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [texto, voiceActive]);

  useEffect(() => {
    if (!texto.trim()) {
      setVisible(false);
      onColorChange?.(null);
    }
  }, [texto]);

  const wordCount = texto.trim().split(/\s+/).filter(Boolean).length;
  const hex = resultado?.dominante ? COLOR_HEX[resultado.dominante] : "#6B7280";
  const hex2 = resultado?.segundo ? COLOR_HEX[resultado.segundo] : null;
  const ampPct = Math.min(100, voiceAmplitude);

  return (
    <div className="mt-2 mb-1" data-testid="osciloscopio-bar">
      {voiceActive && (
        <motion.div
          className="mb-1 rounded overflow-hidden"
          style={{ height: 3, backgroundColor: "rgba(255,255,255,0.04)", position: "relative" }}
        >
          <motion.div
            className="h-full"
            style={{ position: "absolute", left: 0, backgroundColor: "#00FF88", opacity: 0.7 }}
            animate={{ width: `${ampPct}%`, opacity: voiceAmplitude > 5 ? [0.5, 1, 0.5] : 0.2 }}
            transition={{ duration: 0.12, ease: "linear" }}
          />
        </motion.div>
      )}
      <div
        className="rounded-lg overflow-hidden"
        style={{ height: 8, backgroundColor: "rgba(255,255,255,0.06)", position: "relative" }}
      >
        {!visible || wordCount < minWords ? (
          <div
            className="h-full"
            style={{
              width: "100%",
              background: voiceActive && voiceAmplitude > 5
                ? `repeating-linear-gradient(90deg, rgba(0,255,136,0.15) 0, rgba(0,255,136,0.15) 6px, transparent 6px, transparent 12px)`
                : "repeating-linear-gradient(90deg, rgba(255,255,255,0.08) 0, rgba(255,255,255,0.08) 6px, transparent 6px, transparent 12px)",
              opacity: voiceActive ? 0.6 : 0.4
            }}
          />
        ) : resultado?.esPostergacion ? (
          <motion.div
            className="h-full"
            style={{
              width: "100%",
              background: "repeating-linear-gradient(90deg, #EAB30880 0, #EAB30880 4px, transparent 4px, transparent 8px)"
            }}
            animate={{ opacity: [0.5, 0.9, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        ) : resultado?.dominante ? (
          <>
            <motion.div
              className="h-full absolute left-0"
              style={{ backgroundColor: hex, opacity: 0.85 }}
              animate={{ width: `${resultado.pct}%` }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            />
            {hex2 && resultado.pct2 >= 25 && (
              <motion.div
                className="h-full absolute"
                style={{ backgroundColor: hex2, opacity: 0.55, left: `${resultado.pct}%` }}
                animate={{ width: `${resultado.pct2}%` }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />
            )}
          </>
        ) : (
          <div className="h-full" style={{ width: "100%", backgroundColor: "rgba(255,255,255,0.05)" }} />
        )}
      </div>

      <div className="mt-1 min-h-[14px] flex items-center justify-between">
        {wordCount < minWords ? (
          <span className="text-[9px] text-slate-600" style={{ fontFamily: "monospace" }}>
            {voiceActive ? `escucha de voz activa (${wordCount}/${minWords} palabras)` : `escribe tu ducha mental (${wordCount}/${minWords} palabras)`}
          </span>
        ) : resultado?.esPostergacion ? (
          <>
            <span className="text-[9px] font-bold tracking-widest" style={{ color: "#EAB308", fontFamily: "monospace" }}>DORADO∅</span>
            <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>frecuencia de materialización bloqueada</span>
          </>
        ) : resultado?.dominante ? (
          <>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-2 h-2 rounded-full" style={{ backgroundColor: hex }} />
              <span className="text-[9px] font-bold tracking-widest uppercase" style={{ color: hex, fontFamily: "monospace" }}>
                {resultado.dominante} {resultado.pct}%
              </span>
              {resultado.segundo && resultado.pct2 >= 25 && (
                <>
                  <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>+</span>
                  <span className="text-[9px] font-bold" style={{ color: hex2 || "#fff", fontFamily: "monospace" }}>
                    {resultado.segundo}
                  </span>
                </>
              )}
            </div>
            {resultado.cortocircuito ? (
              <span className="text-[9px]" style={{ color: "#FF3131", fontFamily: "monospace" }}>
                ⚡ {resultado.cortocircuito}
              </span>
            ) : (
              <span className="text-[9px]" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                {COLOR_LABEL[resultado.dominante]}
              </span>
            )}
          </>
        ) : (
          <span className="text-[9px] text-slate-700" style={{ fontFamily: "monospace" }}>escáner activo</span>
        )}
      </div>
    </div>
  );
}
