import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";

interface VUMeterBarsProps {
  values: {
    estabilidad: number;
    conexion: number;
    vision: number;
    mando: number;
  };
}

const SECTIONS = [
  { key: "estabilidad" as const, label: "ESTABILIDAD" },
  { key: "conexion" as const, label: "CONEXIÓN" },
  { key: "vision" as const, label: "VISIÓN" },
  { key: "mando" as const, label: "MANDO" },
];

const SEGMENT_COUNT = 20;

function getSegmentColor(segmentIndex: number, totalSegments: number): string {
  const ratio = segmentIndex / totalSegments;
  if (ratio < 0.5) return "#00FFC3";
  if (ratio < 0.8) return "#D4AF37";
  return "#FF3131";
}

function VUBar({ value, label }: { value: number; label: string }) {
  const [jitter, setJitter] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setJitter(Math.random() * 6 - 3);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  const filledSegments = Math.round(((value + jitter) / 100) * SEGMENT_COUNT);
  const clamped = Math.max(0, Math.min(SEGMENT_COUNT, filledSegments));

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        width: "40px",
      }}
      data-testid={`vu-bar-${label.toLowerCase().replace("ó", "o").replace("é", "e")}`}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column-reverse",
          gap: "2px",
          height: "200px",
          width: "24px",
          background: "rgba(255,255,255,0.02)",
          borderRadius: "4px",
          padding: "2px",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {Array.from({ length: SEGMENT_COUNT }).map((_, i) => {
          const isActive = i < clamped;
          const color = getSegmentColor(i, SEGMENT_COUNT);
          return (
            <motion.div
              key={i}
              style={{
                flex: 1,
                borderRadius: "1px",
                backgroundColor: isActive ? color : "rgba(255,255,255,0.05)",
                opacity: isActive ? 1 : 0.3,
              }}
              animate={
                isActive
                  ? { opacity: [0.8, 1, 0.8] }
                  : {}
              }
              transition={
                isActive
                  ? { duration: 0.3, repeat: Infinity, ease: "easeInOut" }
                  : undefined
              }
            />
          );
        })}
      </div>
      <span
        style={{
          writingMode: "vertical-rl",
          textOrientation: "mixed",
          fontSize: "9px",
          fontFamily: "'Courier New', monospace",
          color: "rgba(255,255,255,0.5)",
          letterSpacing: "1px",
          textTransform: "uppercase",
          height: "80px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {label}
      </span>
    </div>
  );
}

export default function VUMeterBars({ values }: VUMeterBarsProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-end",
      }}
      data-testid="vu-meter-bars"
    >
      {SECTIONS.map((section) => (
        <VUBar
          key={section.key}
          value={values[section.key]}
          label={section.label}
        />
      ))}
    </div>
  );
}
