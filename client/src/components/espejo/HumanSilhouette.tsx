import React from "react";
import { motion } from "framer-motion";

interface HumanSilhouetteProps {
  activeZones: string[];
  alertZone?: string;
  activeColor?: string;
  zonaActiva?: string;
  colorDiagnostico?: string;
}

const ZONA_TO_SECTION: Record<string, string[]> = {
  BASE: ["ESTABILIDAD"],
  VIENTRE: ["ESTABILIDAD"],
  PLEXO: ["CONEXION"],
  CORAZON: ["CONEXION"],
  GARGANTA: ["CONEXION"],
  ENTRECEJO: ["VISION"],
  FRENTE: ["VISION"],
  CEREBRO: ["VISION"],
  CORONILLA: ["MANDO"],
  CAMPO: ["MANDO"],
  SISTEMA: ["ESTABILIDAD", "CONEXION", "VISION", "MANDO"],
};

const DEFAULT_ACTIVE = "#00FFC3";
const ALERT_COLOR = "#FF3131";
const INACTIVE_COLOR = "rgba(255,255,255,0.05)";

function getZoneFill(zone: string, activeZones: string[], alertZone?: string, activeColor?: string) {
  if (alertZone === zone) return ALERT_COLOR;
  if (activeZones.includes(zone)) return activeColor || DEFAULT_ACTIVE;
  return INACTIVE_COLOR;
}

function getZoneVariant(zone: string, activeZones: string[], alertZone?: string) {
  if (alertZone === zone) return "alert";
  if (activeZones.includes(zone)) return "active";
  return "inactive";
}

export default function HumanSilhouette({ activeZones, alertZone, activeColor, zonaActiva, colorDiagnostico }: HumanSilhouetteProps) {
  const isPIO = alertZone === "PIO";
  const extraZones = zonaActiva ? (ZONA_TO_SECTION[zonaActiva.toUpperCase()] ?? []) : [];
  const mergedZones = isPIO
    ? ["ESTABILIDAD", "CONEXION", "VISION", "MANDO"]
    : Array.from(new Set([...activeZones, ...extraZones]));
  const effectiveAlertZone = isPIO ? undefined : alertZone;
  const color = isPIO ? ALERT_COLOR : colorDiagnostico || activeColor || DEFAULT_ACTIVE;

  const pulseVariants = {
    active: {
      opacity: [0.6, 1, 0.6],
      filter: [
        `drop-shadow(0 0 4px ${color})`,
        `drop-shadow(0 0 14px ${color})`,
        `drop-shadow(0 0 4px ${color})`,
      ],
      transition: { duration: isPIO ? 0.5 : 2, repeat: Infinity, ease: "easeInOut" as const },
    },
    inactive: {
      opacity: 0.15,
      filter: "drop-shadow(0 0 0px transparent)",
    },
  };

  const alertVariants = {
    alert: {
      opacity: [0.3, 1, 0.3],
      filter: [
        `drop-shadow(0 0 4px ${ALERT_COLOR})`,
        `drop-shadow(0 0 16px ${ALERT_COLOR})`,
        `drop-shadow(0 0 4px ${ALERT_COLOR})`,
      ],
      transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" as const },
    },
  };

  return (
    <div data-testid="human-silhouette" className="relative flex items-center justify-center" style={{ width: 220, height: 400 }}>
      <svg viewBox="0 0 220 400" width="220" height="400" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* ZONA VISIÓN (M06-M07): cabeza superior y ojos */}
        <motion.g
          data-testid="zone-vision"
          variants={effectiveAlertZone === "VISION" ? alertVariants : pulseVariants}
          animate={getZoneVariant("VISION", mergedZones, effectiveAlertZone)}
        >
          <ellipse cx="110" cy="52" rx="28" ry="34" stroke={getZoneFill("VISION", mergedZones, effectiveAlertZone, color)} strokeWidth="1.5" fill="none" />
          <circle cx="100" cy="48" r="3" fill={getZoneFill("VISION", mergedZones, effectiveAlertZone, color)} opacity="0.7" />
          <circle cx="120" cy="48" r="3" fill={getZoneFill("VISION", mergedZones, effectiveAlertZone, color)} opacity="0.7" />
          <line x1="110" y1="18" x2="110" y2="6" stroke={getZoneFill("VISION", mergedZones, effectiveAlertZone, color)} strokeWidth="1" strokeDasharray="2 2" />
          <circle cx="110" cy="4" r="2" fill={getZoneFill("VISION", mergedZones, effectiveAlertZone, color)} opacity="0.5" />
        </motion.g>

        {/* ZONA MANDO (M08-M10): núcleo pulsante en pecho y coronilla */}
        <motion.g
          data-testid="zone-mando"
          variants={effectiveAlertZone === "MANDO" ? alertVariants : pulseVariants}
          animate={getZoneVariant("MANDO", mergedZones, effectiveAlertZone)}
        >
          <circle cx="110" cy="130" r="14" stroke={getZoneFill("MANDO", mergedZones, effectiveAlertZone, color)} strokeWidth="2" fill="none" />
          <circle cx="110" cy="130" r="6" fill={getZoneFill("MANDO", mergedZones, effectiveAlertZone, color)} opacity="0.4" />
          <line x1="110" y1="86" x2="110" y2="116" stroke={getZoneFill("MANDO", mergedZones, effectiveAlertZone, color)} strokeWidth="1" />
          <circle cx="110" cy="14" r="4" stroke={getZoneFill("MANDO", mergedZones, effectiveAlertZone, color)} strokeWidth="1" fill="none" opacity="0.6" />
        </motion.g>

        {/* ZONA CONEXIÓN (M04-M05): plexo y brazos */}
        <motion.g
          data-testid="zone-conexion"
          variants={effectiveAlertZone === "CONEXION" ? alertVariants : pulseVariants}
          animate={getZoneVariant("CONEXION", mergedZones, effectiveAlertZone)}
        >
          <line x1="82" y1="100" x2="40" y2="190" stroke={getZoneFill("CONEXION", mergedZones, effectiveAlertZone, color)} strokeWidth="1.5" />
          <line x1="138" y1="100" x2="180" y2="190" stroke={getZoneFill("CONEXION", mergedZones, effectiveAlertZone, color)} strokeWidth="1.5" />
          <circle cx="38" cy="194" r="4" stroke={getZoneFill("CONEXION", mergedZones, effectiveAlertZone, color)} strokeWidth="1" fill="none" />
          <circle cx="182" cy="194" r="4" stroke={getZoneFill("CONEXION", mergedZones, effectiveAlertZone, color)} strokeWidth="1" fill="none" />
          <ellipse cx="110" cy="160" rx="22" ry="8" stroke={getZoneFill("CONEXION", mergedZones, effectiveAlertZone, color)} strokeWidth="1" strokeDasharray="3 2" fill="none" />
        </motion.g>

        {/* Torso wireframe (structural, always visible) */}
        <line x1="90" y1="86" x2="82" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <line x1="130" y1="86" x2="138" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
        <path d="M 88 86 Q 110 92 132 86 L 138 100 L 134 210 Q 110 215 86 210 L 82 100 Z" stroke="rgba(255,255,255,0.08)" strokeWidth="1" fill="none" />

        {/* ZONA ESTABILIDAD (M01-M03): base y piernas */}
        <motion.g
          data-testid="zone-estabilidad"
          variants={effectiveAlertZone === "ESTABILIDAD" ? alertVariants : pulseVariants}
          animate={getZoneVariant("ESTABILIDAD", mergedZones, effectiveAlertZone)}
        >
          <line x1="96" y1="210" x2="80" y2="340" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1.5" />
          <line x1="124" y1="210" x2="140" y2="340" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1.5" />
          <rect x="70" y="340" width="22" height="8" rx="3" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1" fill="none" />
          <rect x="128" y="340" width="22" height="8" rx="3" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1" fill="none" />
          <line x1="80" y1="360" x2="140" y2="360" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1" strokeDasharray="4 3" opacity="0.4" />
          <line x1="90" y1="370" x2="130" y2="370" stroke={getZoneFill("ESTABILIDAD", mergedZones, effectiveAlertZone, color)} strokeWidth="1" strokeDasharray="4 3" opacity="0.3" />
        </motion.g>

        {/* Circuit detail lines */}
        <line x1="60" y1="130" x2="30" y2="130" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1="160" y1="130" x2="190" y2="130" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 4" />
        <line x1="110" y1="350" x2="110" y2="390" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" strokeDasharray="2 4" />
      </svg>
    </div>
  );
}
