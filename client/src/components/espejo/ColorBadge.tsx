import { motion, AnimatePresence } from "framer-motion";

const COLOR_HEX: Record<string, string> = {
  ROJO: "#FF3131",
  NARANJA: "#F97316",
  AMARILLO: "#EAB308",
  VERDE: "#22C55E",
  AZUL: "#3B82F6",
  MORADO: "#8B5CF6",
  VIOLETA: "#A78BFA",
  NEUTRO: "#6B7280",
};

interface ColorBadgeProps {
  color: string | null;
}

export default function ColorBadge({ color }: ColorBadgeProps) {
  if (!color) return null;
  const hex = COLOR_HEX[color] ?? COLOR_HEX.NEUTRO;

  return (
    <AnimatePresence>
      {color && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
          className="flex items-center gap-1 flex-shrink-0 ml-1"
          data-testid="color-badge"
          title={`Color detectado: ${color}`}
        >
          <div
            className="rounded-full"
            style={{
              width: 8,
              height: 8,
              backgroundColor: hex,
              boxShadow: `0 0 8px ${hex}`,
            }}
          />
          <span
            className="text-[7px] font-bold tracking-widest uppercase"
            style={{ color: hex, fontFamily: "monospace" }}
          >
            {color}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
