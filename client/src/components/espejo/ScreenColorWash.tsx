import type { ReactNode } from "react";

type Fase = "AZUL" | "ESPEJO" | "POLO" | "PIO" | null;

const FASE_COLORS: Record<string, string> = {
  AZUL: "rgba(37,99,235,0.04)",
  ESPEJO: "rgba(212,175,55,0.035)",
  POLO: "rgba(0,255,195,0.04)",
  PIO: "rgba(255,49,49,0.04)",
};

interface ScreenColorWashProps {
  fase: Fase;
  children: ReactNode;
  className?: string;
}

export default function ScreenColorWash({ fase, children, className }: ScreenColorWashProps) {
  const bg = fase ? FASE_COLORS[fase] : "transparent";
  const gradient = fase
    ? `radial-gradient(ellipse at top center, ${bg} 0%, transparent 60%)`
    : "transparent";

  return (
    <div
      className={className}
      style={{
        background: gradient,
        transition: "background 1.2s ease",
        position: "relative",
      }}
      data-testid="screen-color-wash"
    >
      {children}
    </div>
  );
}
