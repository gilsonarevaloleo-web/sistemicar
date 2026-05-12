import { motion } from "framer-motion";

const IDENTIDADES: Record<string, {
  label: string;
  subtitulo: string;
  icono: string;
  tipo: "M" | "F" | "PIO";
}> = {
  EL_TERRITORIO_M: { label: "EL TERRITORIO", subtitulo: "SUELO · AQUÍ Y AHORA", icono: "▶", tipo: "M" },
  EL_PODER_M: { label: "EL PODER", subtitulo: "MANDO ABSOLUTO", icono: "▶", tipo: "M" },
  EL_RIGOR_M: { label: "EL RIGOR", subtitulo: "DISCIPLINA · DATO", icono: "▶", tipo: "M" },
  LA_SEMILLA_F: { label: "LA SEMILLA", subtitulo: "POSIBILIDAD · GESTACIÓN", icono: "◈", tipo: "F" },
  LA_VISION_F: { label: "LA VISIÓN", subtitulo: "DESTINO · FUTURO", icono: "◈", tipo: "F" },
  LA_MISERICORDIA_F: { label: "LA MISERICORDIA", subtitulo: "DESCANSO ESTRATÉGICO", icono: "◈", tipo: "F" },
  PIO: { label: "ALERTA PIO", subtitulo: "OXIDACIÓN DETECTADA", icono: "⚠", tipo: "PIO" },
};

interface VoiceBannerProps {
  identidad: string | null;
}

export default function VoiceBanner({ identidad }: VoiceBannerProps) {
  if (!identidad) return null;
  const info = IDENTIDADES[identidad];
  if (!info) return null;

  const isM = info.tipo === "M";
  const isPIO = info.tipo === "PIO";

  const borderColor = isPIO ? "#FF3131" : isM ? "#D4AF37" : "#8B5CF6";
  const bgColor = isPIO
    ? "rgba(255,49,49,0.05)"
    : isM
    ? `rgba(212,175,55,${info.label === "EL PODER" ? "0.06" : info.label === "EL RIGOR" ? "0.03" : "0.04"})`
    : `rgba(139,92,246,${info.label === "LA VISIÓN" ? "0.06" : info.label === "LA MISERICORDIA" ? "0.03" : "0.04"})`;
  const borderRadius = info.label === "LA MISERICORDIA" ? "12px" : "8px";

  return (
    <div
      className="flex items-center gap-1.5 px-2 py-1 mb-2 rounded"
      style={{
        borderLeft: `3px solid ${borderColor}`,
        backgroundColor: bgColor,
        borderRadius,
        fontFamily: "monospace",
      }}
      data-testid="voice-banner"
    >
      {isPIO ? (
        <motion.span
          style={{ color: "#FF3131", fontSize: 10 }}
          animate={{ opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {info.icono}
        </motion.span>
      ) : (
        <span style={{ color: borderColor, fontSize: 9 }}>{info.icono}</span>
      )}
      <span
        className="text-[8px] font-bold tracking-widest uppercase"
        style={{ color: borderColor }}
      >
        {info.label}
      </span>
      <span className="text-[7px]" style={{ color: "rgba(255,255,255,0.3)" }}>·</span>
      <span
        className="text-[7px] tracking-wider uppercase"
        style={{ color: "rgba(255,255,255,0.35)" }}
      >
        {info.subtitulo}
      </span>
    </div>
  );
}
