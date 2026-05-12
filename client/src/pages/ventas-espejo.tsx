import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Activity,
  Brain,
  AlertTriangle,
  Crown,
  Shield,
  Zap,
  Star,
  Lock,
  Flame,
  Target,
  Eye,
  Clock,
  Terminal,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { getProspectoByEmail, activarRetoGuerrero, subscribeToEspejoSessions, type EspejoSession } from "@/lib/persistence";
import { useAuthContext } from "@/App";
import logoSistemicar from "@/assets/logo-sistemicar.png";
import yapeQrImage from "@assets/yape_qr_2026-02-17T22-11-48_1771384383841.png";

const GOLD = "#D4AF37";
const DARK_BG = "#020202";
const CYAN = "#00FFC3";
const RED = "#FF3131";
const ORANGE = "#F97316";

const BENEFICIOS = [
  {
    icon: AlertTriangle,
    color: RED,
    bgColor: "rgba(255,49,49,0.06)",
    borderColor: "rgba(255,49,49,0.2)",
    tag: "PATRÓN CONDUCTUAL",
    titulo: "Tu patrón de boicot, nombrado con datos",
    descripcion: "El Doctor IA cruza tu historial de vehículos cumplidos e incumplidos. No te dice que 'te falta constancia' — te dice exactamente qué tipo de tarea evitas sistemáticamente y en qué contexto ocurre."
  },
  {
    icon: Brain,
    color: CYAN,
    bgColor: "rgba(0,255,195,0.06)",
    borderColor: "rgba(0,255,195,0.2)",
    tag: "INTERFAZ ACTIVA",
    titulo: "Tu Interfaz de Dolor — M01 a M10",
    descripcion: "En 3 sesiones del Espejo, el Doctor IA identifica cuál de los 10 arquetipos del subconsciente te gobierna. Recibes un código exacto (ej: Código 14 — Interfaz M03) con la zona corporal iluminada."
  },
  {
    icon: Clock,
    color: GOLD,
    bgColor: "rgba(212,175,55,0.06)",
    borderColor: "rgba(212,175,55,0.2)",
    tag: "BRECHA REAL",
    titulo: "La distancia entre lo que crees y lo que tardas",
    descripcion: "Tu registro de vehículos revela la brecha entre tu estimación de tiempo y tu ejecución real. La IA nombra tu auto-engaño de capacidad con números — no con opiniones."
  },
  {
    icon: Zap,
    color: ORANGE,
    bgColor: "rgba(249,115,22,0.06)",
    borderColor: "rgba(249,115,22,0.2)",
    tag: "PREDICCIÓN DE ABANDONO",
    titulo: "Tu curva de soberanía en 30 días",
    descripcion: "La tendencia de tus Puntos de Soberanía en el último mes predice cuándo y cómo te rindes — antes de que tú lo decidas. El sistema te avisa mientras aún puedes actuar."
  }
];

const TESTIMONIOS = [
  {
    nombre: "Rodrigo M.",
    dias: 18,
    texto: "El Eje II me dio Código 09 — Interfaz M03. Llevaba años sin poder nombrar exactamente qué me bloqueaba en el trabajo. La zona VISIÓN iluminada en el cuerpo fue el momento más incómodo y más honesto que he tenido."
  },
  {
    nombre: "Valeria C.",
    dias: 34,
    texto: "Al tercer diagnóstico, el sistema detectó el bucle. Mismo código, tres veces. Me bloqueó el Eje III y me dijo que mi patrón tiene nombre. Pagué para desbloquearlo y el protocolo de 24h fue exactamente lo que no quería escuchar."
  },
  {
    nombre: "Diego P.",
    dias: 12,
    texto: "El Doctor IA detectó oxidación en mi Eje I. Me dijo que mi sistema estaba en neutro, no en dolor. Eso fue más preciso que 6 meses de terapia. El código diagnóstico lo guardo como referencia."
  }
];

const PRIMERA_SESION = [
  { icon: Activity, color: CYAN, texto: "Zona corporal de interferencia identificada (ESTABILIDAD / CONEXIÓN / VISIÓN / ORIGEN)" },
  { icon: Eye, color: RED, texto: "Nivel de señal medido: latente, activa, crítica o insuficiente" },
  { icon: Brain, color: RED, texto: "Código diagnóstico exacto + interfaz activa (M01–M10 de los 10 arquetipos)" },
  { icon: Zap, color: GOLD, texto: "Protocolo personalizado de 24h para tu interfaz específica (con 4 créditos)" },
  { icon: Shield, color: ORANGE, texto: "+58 Puntos de Soberanía al completar la sesión" }
];

function derivarAreaDominante(sesiones: EspejoSession[]): string | null {
  const frecuencias = sesiones
    .map(s => s.mapaVoltaje?.frecuencia_dominante)
    .filter((f): f is string => typeof f === "string" && f.length > 0);
  if (!frecuencias.length) return null;
  const conteo: Record<string, number> = {};
  frecuencias.forEach(f => { conteo[f] = (conteo[f] || 0) + 1; });
  return Object.entries(conteo).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

function detectarBucleVentas(sesiones: EspejoSession[]): { codigo: string; veces: number } | null {
  const ultimas5 = sesiones.slice(0, 5);
  const codigos = ultimas5
    .map(s => s.mapaVoltaje?.diagnostico)
    .filter((d): d is string => typeof d === "string" && d.length > 0);
  const conteo: Record<string, number> = {};
  codigos.forEach(c => { conteo[c] = (conteo[c] || 0) + 1; });
  const entrada = Object.entries(conteo).find(([, n]) => n >= 2);
  return entrada ? { codigo: entrada[0], veces: entrada[1] } : null;
}

export default function VentasEspejo() {
  const [, navigate] = useLocation();
  const { user } = useAuthContext();
  const [prospectoEmail, setProspectoEmail] = useState<string | null>(null);
  const [prospectoNombre, setProspectoNombre] = useState<string | null>(null);
  const [activandoReto, setActivandoReto] = useState(false);
  const [sesionesEspejo, setSesionesEspejo] = useState<EspejoSession[]>([]);
  const [cargandoDatos, setCargandoDatos] = useState(true);

  useEffect(() => {
    const email = localStorage.getItem("sistemicar_prospecto_email");
    const nombre = localStorage.getItem("sistemicar_prospecto_nombre");
    if (email) {
      setProspectoEmail(email);
      setProspectoNombre(nombre);
      const checkProspecto = async () => {
        try {
          const prospecto = await getProspectoByEmail(email);
          if (prospecto) {
            if (prospecto.pagoConfirmado || prospecto.retoGuerreroActivo) {
              navigate("/bienvenida");
            }
          }
        } catch (error) {
          console.error("Error checking prospecto:", error);
        }
      };
      checkProspecto();
    }
  }, [navigate]);

  useEffect(() => {
    if (!user) {
      setSesionesEspejo([]);
      setCargandoDatos(false);
      return;
    }
    const unsub = subscribeToEspejoSessions(
      user.uid,
      (sessions) => {
        setSesionesEspejo(sessions);
        setCargandoDatos(false);
      },
      () => setCargandoDatos(false)
    );
    return unsub;
  }, [user]);

  const handleActivarReto = async () => {
    if (!prospectoEmail) {
      navigate("/umbral");
      return;
    }
    setActivandoReto(true);
    try {
      await activarRetoGuerrero(prospectoEmail);
      toast.success("Reto Guerrero activado — 7 días de acceso");
      navigate("/bienvenida");
    } catch (error) {
      console.error("Error activando reto:", error);
      toast.error("Error al activar el reto. Intenta de nuevo.");
    } finally {
      setActivandoReto(false);
    }
  };

  const handlePagar = () => {
    navigate("/pagos?producto=espejo&precio=58.08");
  };

  const tieneDatos = !cargandoDatos && sesionesEspejo.length > 0;
  const numSesiones = sesionesEspejo.length;
  const areaDominante = derivarAreaDominante(sesionesEspejo);
  const bucle = detectarBucleVentas(sesionesEspejo);

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK_BG }}>
      <div className="max-w-3xl mx-auto px-4 py-8">

        {/* HERO — Estado A (sin datos) o Estado B (con datos) */}
        <AnimatePresence mode="wait">
          {tieneDatos ? (
            /* ─── ESTADO B: USUARIO CON SESIONES ─── */
            <motion.div
              key="estado-b"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="text-center mb-6">
                <img src={logoSistemicar} alt="SISTEMICAR" className="w-12 h-12 mx-auto mb-4" />
                {prospectoNombre && (
                  <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                    OPERADOR: {prospectoNombre.split(" ")[0].toUpperCase()}
                  </p>
                )}
                <div className="inline-block mb-3 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest"
                  style={{ backgroundColor: `${CYAN}10`, color: CYAN, border: `1px solid ${CYAN}30`, fontFamily: "monospace" }}
                >
                  ESPEJO SOBERANO v5.0
                </div>
              </div>

              {/* Terminal de análisis parcial */}
              <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="rounded-2xl p-5 border mb-4"
                style={{
                  backgroundColor: "rgba(255,49,49,0.04)",
                  borderColor: "rgba(255,49,49,0.4)",
                  boxShadow: "0 0 40px rgba(255,49,49,0.06)"
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Terminal size={14} style={{ color: RED }} />
                  <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: "monospace" }}>
                    ANÁLISIS PARCIAL — SISTEMA ACTIVO
                  </span>
                </div>
                <div className="space-y-1 font-mono text-xs mb-4" style={{ fontFamily: "monospace" }}>
                  <p style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: CYAN }}>{">"}</span>{" "}
                    <span style={{ color: GOLD }}>{numSesiones}</span> registro{numSesiones !== 1 ? "s" : ""} analizados
                  </p>
                  {areaDominante ? (
                    <p style={{ color: "rgba(255,255,255,0.7)" }}>
                      <span style={{ color: CYAN }}>{">"}</span>{" "}
                      patrón emergente en área{" "}
                      <span style={{ color: RED }}>{areaDominante.toUpperCase()}</span>
                    </p>
                  ) : (
                    <p style={{ color: "rgba(255,255,255,0.4)" }}>
                      <span style={{ color: CYAN }}>{">"}</span> área dominante: calculando...
                    </p>
                  )}
                  <p style={{ color: "rgba(255,255,255,0.7)" }}>
                    <span style={{ color: CYAN }}>{">"}</span>{" "}
                    análisis completo:{" "}
                    <span style={{ color: RED, fontWeight: "bold" }}>BLOQUEADO</span>
                  </p>
                </div>

                {bucle && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="rounded-xl p-3 mb-4"
                    style={{ backgroundColor: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.3)" }}
                  >
                    <div className="flex items-center gap-2">
                      <AlertTriangle size={12} style={{ color: ORANGE }} />
                      <span className="text-[10px] font-bold" style={{ color: ORANGE, fontFamily: "monospace" }}>
                        BUCLE DETECTADO — mismo patrón en {bucle.veces} sesiones · Protocolo de desbloqueo disponible
                      </span>
                    </div>
                  </motion.div>
                )}

                <button
                  onClick={handlePagar}
                  data-testid="btn-desbloquear-analisis"
                  className="w-full py-4 rounded-xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: `linear-gradient(135deg, ${RED} 0%, ${GOLD} 100%)`,
                    color: "#fff",
                    fontFamily: "monospace"
                  }}
                >
                  <ChevronRight size={16} />
                  DESBLOQUEAR ANÁLISIS — S/ 58.08 (10 créditos)
                </button>

                <p className="text-center text-[10px] mt-2" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
                  ~$17 USD · Pack de Inicio · 2 diagnósticos completos · no es suscripción
                </p>
              </motion.div>

              {/* Reto Guerrero como alternativa secundaria */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="rounded-xl p-4 border text-center"
                style={{ backgroundColor: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
              >
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
                  ¿Prefieres probarlo primero?
                </p>
                <button
                  onClick={handleActivarReto}
                  disabled={activandoReto}
                  data-testid="btn-activar-reto"
                  className="text-xs font-bold flex items-center justify-center gap-1 mx-auto transition-all hover:opacity-80 disabled:opacity-40"
                  style={{ color: RED, fontFamily: "monospace" }}
                >
                  <Flame size={12} />
                  {activandoReto ? "Activando..." : "Reto Guerrero — 7 días gratis"}
                </button>
              </motion.div>
            </motion.div>
          ) : (
            /* ─── ESTADO A: SIN DATOS (nuevo o no autenticado) ─── */
            <motion.div
              key="estado-a"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <div className="text-center mb-10">
                <img src={logoSistemicar} alt="SISTEMICAR" className="w-14 h-14 mx-auto mb-5" />
                {prospectoNombre && (
                  <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                    OPERADOR: {prospectoNombre.split(" ")[0].toUpperCase()}
                  </p>
                )}
                <div className="inline-block mb-4 px-3 py-1 rounded-full text-[10px] font-bold tracking-widest uppercase"
                  style={{ backgroundColor: `${CYAN}10`, color: CYAN, border: `1px solid ${CYAN}30`, fontFamily: "monospace" }}
                >
                  ESPEJO SOBERANO v5.0
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-white mb-3 leading-tight" style={{ fontFamily: "monospace" }}>
                  TU CÓDIGO DIAGNÓSTICO
                  <br />
                  <span style={{ color: GOLD }}>EN 10 MINUTOS</span>
                </h1>
                <p className="text-sm max-w-lg mx-auto leading-relaxed" style={{ color: "rgba(255,255,255,0.45)", fontFamily: "monospace" }}>
                  El Doctor IA analiza tu interferencia activa y entrega un código clínico exacto — más la interfaz (M01–M10) que gobierna tu sistema. No es introspección. Es diagnóstico con datos.
                </p>
              </div>

              {/* RETO GUERRERO — CTA principal para Estado A */}
              <div
                className="rounded-2xl p-6 border mb-8"
                style={{
                  backgroundColor: "rgba(255,49,49,0.04)",
                  borderColor: "rgba(255,49,49,0.35)",
                  boxShadow: "0 0 40px rgba(255,49,49,0.05)"
                }}
              >
                <div className="flex items-start gap-4 mb-4">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "rgba(255,49,49,0.15)" }}
                  >
                    <Flame size={22} style={{ color: RED }} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-bold uppercase tracking-widest" style={{ color: RED, fontFamily: "monospace" }}>
                        RETO GUERRERO
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                        style={{ backgroundColor: `${RED}15`, color: RED, border: `1px solid ${RED}30` }}
                      >
                        7 DÍAS GRATIS
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-white leading-tight">
                      Accede gratis — con condición de soberanía
                    </h3>
                  </div>
                </div>

                <p className="text-sm leading-relaxed mb-4" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "monospace" }}>
                  Accede al Espejo Soberano durante 7 días completos sin pagar. La condición: registrar tu sesión <strong className="text-white">todos los días</strong>. Si fallas un día, el acceso se cierra. Si usas los 7 días, el sistema habrá leído tu patrón de interferencia con datos reales.
                </p>

                <div className="flex items-start gap-2 text-xs mb-5" style={{ color: "rgba(255,255,255,0.35)", fontFamily: "monospace" }}>
                  <Target size={12} className="mt-0.5 shrink-0" />
                  <span>Condición: completar Eje I cada día · Si la IA no detecta un patrón tuyo en 7 días, no pagas nada</span>
                </div>

                <button
                  onClick={handleActivarReto}
                  disabled={activandoReto}
                  data-testid="btn-activar-reto"
                  className="w-full py-4 rounded-xl font-black text-sm tracking-wider flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
                  style={{
                    background: `linear-gradient(135deg, ${RED} 0%, #cc0000 100%)`,
                    color: "#fff",
                    fontFamily: "monospace"
                  }}
                >
                  {activandoReto ? (
                    "ACTIVANDO..."
                  ) : (
                    <>
                      <Flame size={16} />
                      PROBAR 7 DÍAS GRATIS — CON CONDICIÓN DE SOBERANÍA
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* LO QUE LA IA DETECTA DE TI — visible en ambos estados */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase tracking-widest text-center mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            LO QUE LA IA DETECTA DE TI
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            {BENEFICIOS.map((b, idx) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.25 + idx * 0.08 }}
                  className="p-5 rounded-xl border"
                  style={{ backgroundColor: b.bgColor, borderColor: b.borderColor }}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={16} style={{ color: b.color }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: b.color, fontFamily: "monospace" }}>
                      {b.tag}
                    </span>
                  </div>
                  <h3 className="font-black text-white mb-1 text-sm">{b.titulo}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>{b.descripcion}</p>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* LO QUE LA IA REVELARÁ EN 7 DÍAS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl p-6 border mb-8"
          style={{
            backgroundColor: `rgba(212,175,55,0.03)`,
            borderColor: `rgba(212,175,55,0.2)`
          }}
        >
          <p className="text-[10px] uppercase tracking-widest mb-1 font-bold" style={{ color: GOLD, fontFamily: "monospace" }}>
            LO QUE LA IA REVELARÁ DE TI EN LOS PRIMEROS 7 DÍAS
          </p>
          <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
            Si en 7 días no has recibido un diagnóstico sobre tu conducta que no sabías — no pagas nada.
          </p>
          <div className="space-y-3">
            {PRIMERA_SESION.map((item, idx) => {
              const Icon = item.icon;
              return (
                <div key={idx} className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: `${item.color}15` }}
                  >
                    <Icon size={12} style={{ color: item.color }} />
                  </div>
                  <p className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>{item.texto}</p>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* PRECIO — solo visible en Estado A o cuando hay datos pero se muestra opción de compra */}
        {!tieneDatos && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="rounded-2xl p-6 border text-center mb-8"
            style={{
              backgroundColor: "rgba(212,175,55,0.04)",
              borderColor: "rgba(212,175,55,0.35)"
            }}
          >
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown size={16} style={{ color: GOLD }} />
              <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD, fontFamily: "monospace" }}>
                PACK DE INICIO
              </span>
            </div>

            <div className="flex items-center justify-center gap-3 mb-1">
              <span className="text-slate-600 line-through text-base">S/ 97.00</span>
              <span className="text-5xl font-black" style={{ color: GOLD }}>S/ 58.08</span>
            </div>

            <p className="text-xs mb-1" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "monospace" }}>
              ~$17 USD · 10 créditos incluidos · 2 sesiones diagnósticas completas
            </p>
            <p className="text-[10px] mb-6" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
              Pago único — no es suscripción
            </p>

            <div className="p-4 rounded-xl text-center mx-auto mb-4"
              style={{ backgroundColor: "rgba(96,40,143,0.1)", border: "2px solid rgba(96,40,143,0.4)" }}
            >
              <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: "#60288F" }}>Paga con Yape</p>
              <img src={yapeQrImage} alt="QR Yape" className="w-48 h-48 mx-auto rounded-lg mb-3" />
              <p className="text-sm font-bold text-white">N° 918260514</p>
              <p className="text-xs text-slate-400">Gilson Arevalo Pezo</p>
            </div>

            <button
              onClick={handlePagar}
              className="w-full md:w-auto px-10 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 mx-auto transition-all hover:scale-[1.02]"
              style={{
                backgroundColor: "rgba(255,255,255,0.04)",
                color: "rgba(255,255,255,0.4)",
                border: "1px solid rgba(255,255,255,0.1)",
                fontFamily: "monospace"
              }}
              data-testid="btn-pagar-espejo"
            >
              <Zap size={14} />
              Otras formas de pago
            </button>

            <div className="flex items-center justify-center gap-4 mt-4 text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
              <div className="flex items-center gap-1">
                <Shield size={11} />
                <span>Pago seguro</span>
              </div>
              <div className="flex items-center gap-1">
                <Lock size={11} />
                <span>Datos encriptados</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* TESTIMONIOS */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="mb-8"
        >
          <p className="text-[10px] uppercase tracking-widest text-center mb-4" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "monospace" }}>
            REGISTROS DE CAMPO
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {TESTIMONIOS.map((t, idx) => (
              <div
                key={idx}
                className="rounded-xl p-4 border"
                style={{
                  backgroundColor: "rgba(255,255,255,0.02)",
                  borderColor: "rgba(255,255,255,0.08)"
                }}
              >
                <div className="flex items-center gap-2 mb-3">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} size={10} fill={GOLD} style={{ color: GOLD }} />
                  ))}
                  <span className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                    día {t.dias}
                  </span>
                </div>
                <p className="text-xs leading-relaxed mb-3" style={{ color: "rgba(255,255,255,0.55)" }}>
                  "{t.texto}"
                </p>
                <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.25)", fontFamily: "monospace" }}>
                  — {t.nombre}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <p className="text-[10px]" style={{ color: "rgba(255,255,255,0.15)", fontFamily: "monospace" }}>
            Yape · Plin · Mercado Pago · PayPal &nbsp;·&nbsp; ¿Dudas? soporte@sistemicar.app
          </p>
        </motion.div>

      </div>
    </div>
  );
}
