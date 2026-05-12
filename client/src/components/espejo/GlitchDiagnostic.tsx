import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface GlitchDiagnosticProps {
  codigoDiagnostico?: string;
  interfazPrimaria?: string;
  mensaje: string;
  active: boolean;
}

export default function GlitchDiagnostic({
  codigoDiagnostico,
  interfazPrimaria,
  mensaje,
  active,
}: GlitchDiagnosticProps) {
  const [glitchPhase, setGlitchPhase] = useState<"glitch" | "code" | "message" | "idle">("idle");

  useEffect(() => {
    if (active) {
      setGlitchPhase("glitch");
      const t1 = setTimeout(() => setGlitchPhase("code"), 1200);
      const t2 = setTimeout(() => setGlitchPhase("message"), 2400);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setGlitchPhase("idle");
    }
  }, [active]);

  if (!active && glitchPhase === "idle") return null;

  return (
    <div className="glitch-diagnostic-wrapper" data-testid="glitch-diagnostic">
      <style>{`
        @keyframes glitchClip {
          0% { clip-path: inset(40% 0 61% 0); transform: translateX(-2px); }
          10% { clip-path: inset(92% 0 1% 0); transform: translateX(2px); }
          20% { clip-path: inset(43% 0 1% 0); transform: translateX(-4px); }
          30% { clip-path: inset(25% 0 58% 0); transform: translateX(0px); }
          40% { clip-path: inset(54% 0 7% 0); transform: translateX(5px); }
          50% { clip-path: inset(58% 0 43% 0); transform: translateX(-3px); }
          60% { clip-path: inset(10% 0 85% 0); transform: translateX(3px); }
          70% { clip-path: inset(76% 0 1% 0); transform: translateX(-2px); }
          80% { clip-path: inset(13% 0 60% 0); transform: translateX(1px); }
          90% { clip-path: inset(1% 0 90% 0); transform: translateX(4px); }
          100% { clip-path: inset(40% 0 61% 0); transform: translateX(-1px); }
        }
        @keyframes glitchOverlay {
          0% { opacity: 0.8; }
          20% { opacity: 0.4; }
          40% { opacity: 0.9; }
          60% { opacity: 0.3; }
          80% { opacity: 0.7; }
          100% { opacity: 0.8; }
        }
        @keyframes scanline {
          0% { top: -10%; }
          100% { top: 110%; }
        }
        @keyframes alertPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        .glitch-diagnostic-wrapper {
          position: relative;
          width: 100%;
          overflow: hidden;
        }
        .glitch-overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 10;
          background: repeating-linear-gradient(
            0deg,
            transparent,
            transparent 2px,
            rgba(0, 255, 195, 0.03) 2px,
            rgba(0, 255, 195, 0.03) 4px
          );
          animation: glitchOverlay 0.15s infinite;
        }
        .glitch-scanline {
          position: absolute;
          left: 0;
          width: 100%;
          height: 4px;
          background: linear-gradient(to bottom, transparent, rgba(0, 255, 195, 0.15), transparent);
          z-index: 11;
          animation: scanline 0.8s linear infinite;
        }
        .glitch-text {
          position: relative;
        }
        .glitch-text::before,
        .glitch-text::after {
          content: attr(data-text);
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
        }
        .glitch-text::before {
          color: #FF3131;
          animation: glitchClip 0.3s infinite linear alternate-reverse;
          left: 2px;
        }
        .glitch-text::after {
          color: #00FFC3;
          animation: glitchClip 0.3s infinite linear alternate;
          left: -2px;
        }
        .alert-pulse {
          animation: alertPulse 0.6s ease-in-out infinite;
        }
      `}</style>

      <AnimatePresence mode="wait">
        {glitchPhase === "glitch" && (
          <motion.div
            key="glitch"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.1 }}
            style={{
              position: "relative",
              minHeight: "200px",
              background: "#0A0A0A",
              borderRadius: "8px",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
            data-testid="glitch-phase-interference"
          >
            <div className="glitch-overlay" />
            <div className="glitch-scanline" />
            <div
              className="glitch-text"
              data-text="INTERFERENCIA DETECTADA"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "1.5rem",
                fontWeight: "bold",
                color: "#FF3131",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              INTERFERENCIA DETECTADA
            </div>
          </motion.div>
        )}

        {glitchPhase === "code" && codigoDiagnostico && (
          <motion.div
            key="code"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              minHeight: "200px",
              background: "#0A0A0A",
              borderRadius: "8px",
              border: "1px solid rgba(255, 49, 49, 0.4)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              padding: "2rem",
            }}
            data-testid="glitch-phase-code"
          >
            <div
              className="alert-pulse"
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "3rem",
                fontWeight: "bold",
                color: "#FF3131",
                letterSpacing: "0.15em",
                textShadow: "0 0 20px rgba(255, 49, 49, 0.6)",
              }}
            >
              {codigoDiagnostico}
            </div>
            {interfazPrimaria && (
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "0.85rem",
                  color: "rgba(212, 175, 55, 0.8)",
                  marginTop: "0.75rem",
                  letterSpacing: "0.1em",
                }}
                data-testid="glitch-interfaz-primaria"
              >
                {interfazPrimaria}
              </div>
            )}
          </motion.div>
        )}

        {(glitchPhase === "message" || (glitchPhase === "code" && !codigoDiagnostico)) && (
          <motion.div
            key="message"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            style={{
              background: "#0A0A0A",
              borderRadius: "8px",
              border: "1px solid rgba(0, 255, 195, 0.2)",
              padding: "1.5rem",
            }}
            data-testid="glitch-phase-message"
          >
            {codigoDiagnostico && (
              <div
                style={{
                  fontFamily: "'Courier New', monospace",
                  fontSize: "1.1rem",
                  fontWeight: "bold",
                  color: "#FF3131",
                  marginBottom: "1rem",
                  letterSpacing: "0.1em",
                  textShadow: "0 0 10px rgba(255, 49, 49, 0.4)",
                }}
                data-testid="glitch-codigo-display"
              >
                ▸ {codigoDiagnostico}
              </div>
            )}
            <div
              style={{
                fontFamily: "'Courier New', monospace",
                fontSize: "0.95rem",
                color: "#00FFC3",
                lineHeight: "1.7",
                whiteSpace: "pre-wrap",
              }}
              data-testid="glitch-mensaje"
            >
              {mensaje}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
