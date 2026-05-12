import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { 
  Sparkles, 
  LogIn, 
  Play,
  ArrowRight,
  Brain,
  Zap,
  Target,
  Shield,
  ChevronLeft,
  ChevronRight,
  Quote,
  X,
  Flame,
  Star,
  Heart,
  Scale,
  FileText
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuthContext } from "@/App";
import { signInWithGoogle, isFirebaseConfigured } from "@/lib/firebase";
import { sendWelcomeEmail } from "@/lib/emailApi";
import { clearMigrationPending } from "@/lib/persistence";
import logoSistemicar from "@/assets/logo-sistemicar.png";

const GOLD = "#D4AF37";
const COBALT = "#0047AB";

const testimonios = [
  {
    id: 1,
    titulo: "DEL ABANDONO A LA SOBERANÍA",
    dolor: "Soledad y scroll infinito",
    texto: "Lo que antes era 'soledad', hoy es 'oportunidad de fortalecimiento'. El scroll infinito ya no tiene poder sobre mí; mi espíritu guerrero ha despertado.",
    historiaCompleta: "Durante años, mi refugio fue el teléfono. Cada momento de soledad se convertía en horas perdidas scrolleando contenido vacío. El silencio me aterraba porque significaba enfrentar mis propios pensamientos.",
    transformacion: "Sistemicar me enseñó que el silencio no es vacío, es espacio. Cada vez que sentía el impulso de tomar el teléfono, registraba mi estado de energía en el Espejo. Poco a poco, entendí que la soledad era una oportunidad para fortalecer mi mente.",
    consejo: "Registra tu energía ANTES de abrir cualquier red social. Solo observar el patrón cambia todo.",
    diasTransformacion: 47
  },
  {
    id: 2,
    titulo: "LA CLARIDAD DEL GUERRERO",
    dolor: "Confusión mental",
    texto: "He aprendido una ley fundamental: cuando se busca teniendo claro lo que se quiere en el corazón, la solución siempre aparece en mucho menos tiempo del que imaginamos.",
    historiaCompleta: "Mi mente era un torbellino constante. Tenía mil ideas, mil proyectos, mil preocupaciones. Empezaba algo y a los 5 minutos ya estaba pensando en otra cosa. La confusión era mi estado natural.",
    transformacion: "El módulo de Planificación me obligó a definir UN solo objetivo por día. Al principio era frustrante, pero después de 3 semanas, mi mente empezó a funcionar diferente. La claridad llegó cuando dejé de perseguir todo a la vez.",
    consejo: "Un objetivo por día. Parece poco, pero es revolucionario para una mente dispersa.",
    diasTransformacion: 23
  },
  {
    id: 3,
    titulo: "LA MUERTE DE LA DOPAMINA BARATA",
    dolor: "Adicción al scroll",
    texto: "La dopamina temporal y barata que ofrece el internet dejó de tener poder sobre mí. Ahora, la única dopamina que realmente me atrae es la que fortalece mi alma.",
    historiaCompleta: "Era adicto a la gratificación instantánea. Videos cortos, likes, notificaciones. Mi cerebro estaba entrenado para buscar recompensas inmediatas. Cualquier tarea que requiriera esfuerzo me parecía imposible.",
    transformacion: "El sistema de Puntos de Soberanía reprogramó mi sistema de recompensas. Empecé a sentir satisfacción real al completar tareas difíciles. Los +20 puntos por un ALCANCE me daban más placer que cualquier video viral.",
    consejo: "Reemplaza la dopamina barata con dopamina de conquista. Tu cerebro se adaptará.",
    diasTransformacion: 35
  },
  {
    id: 4,
    titulo: "EL PUENTE SOBRE LA CULPA",
    dolor: "Parálisis por perfección",
    texto: "He descubierto que convertir la tarea pesada en un desafío personal hace que construir mi carácter sea, por fin, un proceso placentero y constante.",
    historiaCompleta: "El perfeccionismo me paralizaba. Si no podía hacer algo perfecto, prefería no hacerlo. La culpa por no avanzar se acumulaba, y esa culpa me paralizaba más. Un círculo vicioso interminable.",
    transformacion: "El concepto de RETO en Sistemicar cambió mi perspectiva. Entendí que el valor está en INTENTAR, no en el resultado perfecto. Ganar puntos por el esfuerzo, incluso sin completar la tarea, liberó mi mente de la tiranía del perfeccionismo.",
    consejo: "El coraje de intentar vale más que la perfección de no hacer nada.",
    diasTransformacion: 19
  },
  {
    id: 5,
    titulo: "EL ALIADO QUE BUSCABA",
    dolor: "Enfrentar problemas en soledad",
    texto: "En Sistemicar encontré ese aliado. No es una aplicación que me juzga; es una tecnología que me entiende desde el corazón, adaptándose a mi estado de energía sin reproches.",
    historiaCompleta: "Siempre sentí que tenía que resolver todo solo. Pedir ayuda era debilidad. Pero cargar con todo el peso mental me estaba destruyendo. No necesitaba un terapeuta ni un coach, necesitaba algo que estuviera disponible 24/7 sin juzgarme.",
    transformacion: "Sistemicar se convirtió en mi compañero de batalla. Cada mañana registro mi energía, y la plataforma se adapta. En días difíciles no me exige más de lo que puedo dar. En días fuertes me empuja al límite.",
    consejo: "No tienes que hacerlo solo. Un buen sistema es mejor que fuerza de voluntad.",
    diasTransformacion: 62
  }
];

export default function Bienvenida() {
  const [, navigate] = useLocation();
  const { user, login, loading } = useAuthContext();
  const [showTutorial, setShowTutorial] = useState(false);
  const [testimonioActual, setTestimonioActual] = useState(0);
  const [ctaLoading, setCtaLoading] = useState(false);
  const [ctaText, setCtaText] = useState("ORDENAR MI MENTE AHORA");
  const [googleLoading, setGoogleLoading] = useState(false);
  const [historiaExpandida, setHistoriaExpandida] = useState<number | null>(null);
  const [autoCycle, setAutoCycle] = useState(true);

  useEffect(() => {
    if (!autoCycle || historiaExpandida !== null) return;
    const interval = setInterval(() => {
      setTestimonioActual((prev) => (prev + 1) % testimonios.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoCycle, historiaExpandida]);

  useEffect(() => {
    if (user) {
      navigate("/menu");
    }
  }, [user, navigate]);

  if (user) {
    return null;
  }

  const handleLogin = async () => {
    setCtaLoading(true);
    setCtaText("Sincronizando Conciencia...");
    
    try {
      await new Promise(r => setTimeout(r, 800));
      setCtaText("Eje 1: ENFOQUE ✓");
      await new Promise(r => setTimeout(r, 400));
      setCtaText("Eje 2: CONFLICTO ✓");
      await new Promise(r => setTimeout(r, 400));
      setCtaText("Eje 3: PASOS ✓");
      await new Promise(r => setTimeout(r, 400));
      setCtaText("Eje 4: ALCANCE ✓");
      await new Promise(r => setTimeout(r, 500));
      setCtaText("¡Conciencia Activada!");
      
      await login();
      toast.success("Bienvenido a SISTEMICAR");
      navigate("/menu");
    } catch (error) {
      setCtaLoading(false);
      setCtaText("ORDENAR MI MENTE AHORA");
      toast.error("Error al iniciar sesión. Intenta de nuevo.");
    }
  };

  const closeTutorial = () => {
    setShowTutorial(false);
    navigate("/menu");
  };

  const handleGoogleLogin = async () => {
    if (!isFirebaseConfigured()) {
      toast.error("Firebase no está configurado");
      return;
    }
    setGoogleLoading(true);
    try {
      // Limpiar cualquier migración pendiente anterior
      clearMigrationPending();
      // Marcar que estamos en proceso de redirect de Google
      localStorage.setItem("sistemicar_google_redirect_pending", "true");
      const result = await signInWithGoogle();
      // En móvil, signInWithGoogle usa redirect y no llega aquí
      // En desktop, usa popup y sí llega aquí
      localStorage.removeItem("sistemicar_google_redirect_pending");
      
      // Verificar si es nuevo usuario y enviar correo de bienvenida
      const isNewUser = result?.user?.metadata?.creationTime === result?.user?.metadata?.lastSignInTime;
      if (isNewUser && result?.user?.email) {
        sendWelcomeEmail(result.user.email, result.user.displayName || undefined);
        toast.success("¡Bienvenido al Umbral! Revisa tu correo.");
      } else {
        toast.success("¡Bienvenido de vuelta!");
      }
      navigate("/menu");
    } catch (error: any) {
      console.error("Google login error:", error);
      localStorage.removeItem("sistemicar_google_redirect_pending");
      if (error.code === "auth/popup-closed-by-user") {
        toast.info("Inicio de sesión cancelado");
      } else {
        toast.error("Error al iniciar sesión con Google");
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden" style={{ backgroundColor: "#020202" }}>
      <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${GOLD}08 0%, transparent 50%, ${COBALT}08 100%)` }} />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full blur-[100px] pointer-events-none" style={{ backgroundColor: `${GOLD}15` }} />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full blur-[80px] pointer-events-none" style={{ backgroundColor: `${COBALT}15` }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="text-center space-y-8">
          <div className="space-y-4">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="w-28 h-28 mx-auto"
              style={{ 
                filter: `drop-shadow(0 0 30px ${GOLD}40)`
              }}
            >
              <img 
                src={logoSistemicar} 
                alt="SISTEMICAR Logo" 
                className="w-full h-full object-contain"
              />
            </motion.div>
            <p className="text-sm max-w-xs mx-auto" style={{ color: COBALT }}>
              Centro de Comando Personal
            </p>
          </div>

          <div className="grid grid-cols-3 gap-4 py-4">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                <Brain size={22} style={{ color: GOLD }} />
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Alquimia</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${COBALT}20`, border: `1px solid ${COBALT}40` }}>
                <Zap size={22} style={{ color: COBALT }} />
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Planificación</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center mb-2" style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}40` }}>
                <Target size={22} style={{ color: GOLD }} />
              </div>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest">Historia</p>
            </div>
          </div>

          <div className="py-4">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield size={14} style={{ color: GOLD }} />
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                Historias de Guerreros
              </span>
            </div>
            <div className="relative">
              <AnimatePresence mode="wait">
                <motion.div
                  key={testimonioActual}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-4 rounded-xl text-center cursor-pointer hover:bg-[rgba(212,175,55,0.12)] transition-colors"
                  style={{ backgroundColor: "rgba(212, 175, 55, 0.08)", border: "1px solid rgba(212, 175, 55, 0.2)" }}
                  onClick={() => {
                    setAutoCycle(false);
                    setHistoriaExpandida(testimonioActual);
                  }}
                >
                  <Quote size={16} className="mx-auto mb-2 opacity-40" style={{ color: GOLD }} />
                  <p className="text-xs text-slate-300 leading-relaxed mb-3 italic">
                    "{testimonios[testimonioActual].texto}"
                  </p>
                  <div className="text-[10px] mb-2">
                    <span className="font-bold" style={{ color: GOLD }}>{testimonios[testimonioActual].titulo}</span>
                    <span className="text-slate-500 ml-2">• {testimonios[testimonioActual].dolor}</span>
                  </div>
                  <div className="flex items-center justify-center gap-1 text-[9px] text-slate-500 hover:text-white transition-colors">
                    <ArrowRight size={10} />
                    <span>Toca para leer la historia completa</span>
                  </div>
                </motion.div>
              </AnimatePresence>
              <div className="flex justify-center gap-2 mt-3">
                {testimonios.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setTestimonioActual(idx);
                      setAutoCycle(false);
                    }}
                    className="w-2 h-2 rounded-full transition-all hover:scale-125"
                    style={{ 
                      backgroundColor: idx === testimonioActual ? GOLD : "rgba(255,255,255,0.2)"
                    }}
                  />
                ))}
              </div>
            </div>
          </div>

          <AnimatePresence>
            {historiaExpandida !== null && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 overflow-y-auto"
                onClick={() => {
                  setHistoriaExpandida(null);
                  setAutoCycle(true);
                }}
              >
                <motion.div
                  initial={{ scale: 0.9, y: 20 }}
                  animate={{ scale: 1, y: 0 }}
                  exit={{ scale: 0.9, y: 20 }}
                  className="w-full max-w-md rounded-2xl overflow-hidden my-8"
                  style={{ backgroundColor: "#0a0a0a", border: `1px solid ${GOLD}40` }}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div 
                    className="p-5 border-b"
                    style={{ 
                      borderColor: `${GOLD}20`,
                      background: `linear-gradient(135deg, ${GOLD}10 0%, transparent 100%)`
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <Shield size={14} style={{ color: GOLD }} />
                          <span className="text-[9px] uppercase tracking-widest text-slate-500">Historia de Guerrero</span>
                        </div>
                        <h3 className="text-lg font-black" style={{ color: GOLD }}>
                          {testimonios[historiaExpandida].titulo}
                        </h3>
                        <p className="text-xs text-slate-500 mt-1">
                          Dolor original: {testimonios[historiaExpandida].dolor}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setHistoriaExpandida(null);
                          setAutoCycle(true);
                        }}
                        className="p-2 rounded-full hover:bg-white/10 transition-colors"
                      >
                        <X size={18} className="text-slate-400" />
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-5 max-h-[60vh] overflow-y-auto">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Flame size={14} style={{ color: "#EF4444" }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">El Dolor</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {testimonios[historiaExpandida].historiaCompleta}
                      </p>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Star size={14} style={{ color: GOLD }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">La Transformación</span>
                      </div>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {testimonios[historiaExpandida].transformacion}
                      </p>
                    </div>

                    <div 
                      className="p-4 rounded-xl"
                      style={{ backgroundColor: `${COBALT}15`, border: `1px solid ${COBALT}30` }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Heart size={14} style={{ color: COBALT }} />
                        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: COBALT }}>Consejo del Guerrero</span>
                      </div>
                      <p className="text-sm text-white italic">
                        "{testimonios[historiaExpandida].consejo}"
                      </p>
                    </div>

                    <div className="text-center pt-2">
                      <div 
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-full"
                        style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
                      >
                        <Sparkles size={14} style={{ color: GOLD }} />
                        <span className="text-sm font-bold" style={{ color: GOLD }}>
                          {testimonios[historiaExpandida].diasTransformacion} días de transformación
                        </span>
                      </div>
                    </div>
                  </div>

                  <div 
                    className="p-4 border-t"
                    style={{ borderColor: `${GOLD}20` }}
                  >
                    <button
                      onClick={() => {
                        setHistoriaExpandida(null);
                        setAutoCycle(true);
                      }}
                      className="w-full py-3 rounded-xl font-bold text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                      style={{ 
                        background: `linear-gradient(135deg, ${GOLD} 0%, ${COBALT} 100%)`,
                        color: "white"
                      }}
                    >
                      Cerrar Historia
                    </button>
                  </div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="space-y-4">
            <button
              onClick={handleLogin}
              disabled={loading || ctaLoading}
              className="w-full py-5 rounded-full text-white font-bold flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-80"
              style={{ 
                background: ctaLoading 
                  ? `linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)`
                  : `linear-gradient(135deg, ${GOLD} 0%, ${COBALT} 100%)`,
                boxShadow: ctaLoading 
                  ? `0 4px 30px rgba(59, 130, 246, 0.5)`
                  : `0 4px 20px ${GOLD}40`,
                fontSize: "16px",
                letterSpacing: "0.05em"
              }}
              data-testid="button-google-login"
            >
              {!ctaLoading && <Sparkles size={22} />}
              {ctaLoading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {ctaText}
            </button>

            <p className="text-[11px] text-slate-600 text-center">
              Al continuar, aceptas que tus datos se almacenan de forma segura y privada
            </p>

            <div className="pt-4 border-t border-white/10">
              <p className="text-[10px] text-slate-500 text-center mb-3">¿Ya tienes cuenta?</p>
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className="w-full py-3 rounded-xl text-white font-medium flex items-center justify-center gap-2 transition-all hover:bg-white/10"
                style={{ 
                  backgroundColor: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)"
                }}
                data-testid="button-google-existing"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <LogIn size={16} />
                )}
                {googleLoading ? "Conectando..." : "Iniciar sesión con Google"}
              </button>
            </div>

            <button
              onClick={() => navigate("/acerca")}
              className="w-full py-3 text-slate-500 text-sm hover:text-white transition-colors flex items-center justify-center gap-1"
              data-testid="button-about"
            >
              Conocer más sobre SISTEMICAR
              <ArrowRight size={14} />
            </button>

            <div className="pt-6 border-t border-white/5">
              <div className="flex items-center justify-center gap-4 text-[10px] text-slate-600">
                <Link href="/terminos-condiciones">
                  <span className="flex items-center gap-1 hover:text-slate-400 transition-colors cursor-pointer">
                    <Scale size={10} />
                    Términos
                  </span>
                </Link>
                <span className="text-slate-700">•</span>
                <Link href="/libro-reclamaciones">
                  <span className="flex items-center gap-1 hover:text-slate-400 transition-colors cursor-pointer">
                    <FileText size={10} />
                    Reclamaciones
                  </span>
                </Link>
              </div>
              <p className="text-center text-[9px] text-slate-700 mt-2">
                © 2026 SISTEMICAR • Lima, Perú
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showTutorial && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-3xl"
            >
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2" style={{ color: GOLD }}>
                  <Sparkles size={20} />
                  <span className="text-xs font-bold uppercase tracking-widest">Bienvenido a SISTEMICAR</span>
                  <Sparkles size={20} />
                </div>
                <h2 className="text-2xl font-black text-white">Tutorial de Inicio</h2>
                <p className="text-slate-400 text-sm mt-1">Aprende a usar tu Centro de Comando</p>
              </div>

              <div className="relative rounded-2xl overflow-hidden border border-white/10 aspect-video" style={{ backgroundColor: "#0a0a0a" }}>
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${GOLD}20 0%, ${COBALT}20 100%)` }}>
                  <div className="text-center">
                    <div className="w-20 h-20 mx-auto rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-4 cursor-pointer hover:bg-white/20 transition-colors">
                      <Play size={32} className="text-white ml-1" />
                    </div>
                    <p className="text-slate-400 text-sm">Video tutorial disponible pronto</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 mt-6">
                <button
                  onClick={() => navigate("/tutorial")}
                  className="flex-1 py-4 rounded-xl border border-white/20 text-white font-bold hover:bg-white/5 transition-colors"
                >
                  Ver Manual
                </button>
                <button
                  onClick={closeTutorial}
                  className="flex-1 py-4 rounded-xl text-white font-bold transition-colors"
                  style={{ backgroundColor: GOLD }}
                  data-testid="button-start-app"
                >
                  Comenzar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
