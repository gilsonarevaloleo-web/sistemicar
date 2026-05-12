import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Shield, Sparkles, Brain, Users, Lock, Zap, Key } from "lucide-react";
import { useLocation } from "wouter";
import { toast } from "sonner";

const COBALT = "#0047AB";
const COBALT_LIGHT = "#1E90FF";

export default function Acerca() {
  const [, navigate] = useLocation();
  const [adminCode, setAdminCode] = useState("");
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [showAdminInput, setShowAdminInput] = useState(false);

  useEffect(() => {
    const savedCode = localStorage.getItem("sistemi_admin_code");
    if (savedCode === "GILSON2025") {
      setIsAdminUnlocked(true);
    }
  }, []);

  const handleAdminCode = () => {
    if (adminCode.toUpperCase() === "GILSON2025") {
      localStorage.setItem("sistemi_admin_code", "GILSON2025");
      setIsAdminUnlocked(true);
      toast.success("Modo Arquitecto Supremo activado");
    } else {
      toast.error("Código incorrecto");
    }
    setAdminCode("");
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen pb-32"
      style={{ backgroundColor: "#020202" }}
    >
      <div className="max-w-2xl mx-auto px-6 py-20">
        
        <header className="text-center mb-24">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="flex items-center justify-center gap-3 mb-8"
          >
            <div className="w-8 h-px" style={{ backgroundColor: COBALT }} />
            <span 
              className="text-[10px] uppercase tracking-[0.4em]"
              style={{ color: COBALT_LIGHT }}
            >
              Manifiesto de Soberanía
            </span>
            <div className="w-8 h-px" style={{ backgroundColor: COBALT }} />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-black tracking-tight text-white mb-10"
          >
            SISTEMICAR <span style={{ color: COBALT_LIGHT }}>v2.5</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-xl md:text-2xl italic font-light text-slate-500"
            style={{ fontFamily: "Georgia, serif" }}
          >
            "Donde la Disciplina se encuentra con la Intuición"
          </motion.p>
        </header>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mb-28"
        >
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: `${COBALT}30`, color: COBALT_LIGHT }}
            >
              1
            </div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-slate-500">
              La Visión: El Fin del Caos
            </h2>
          </div>
          <p className="text-slate-400 text-lg md:text-xl leading-relaxed">
            SISTEMICAR no es una herramienta de productividad; es un{" "}
            <span className="text-white font-medium">Protocolo de Recuperación de Voluntad</span>. 
            En un mundo diseñado para fragmentar tu atención, nosotros construimos la infraestructura para{" "}
            <span style={{ color: COBALT_LIGHT }} className="font-medium">blindarla</span>.
          </p>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-28"
        >
          <div className="flex items-center gap-4 mb-12">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: `${COBALT}30`, color: COBALT_LIGHT }}
            >
              2
            </div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Los Pilares del Poder
            </h2>
          </div>
          
          <p className="text-slate-500 text-sm mb-12">
            Este sistema se sostiene sobre tres tecnologías de desarrollo humano:
          </p>

          <div className="space-y-6">
            <div 
              className="p-8 rounded-2xl border"
              style={{ backgroundColor: "rgba(0,71,171,0.03)", borderColor: `${COBALT}20` }}
            >
              <div className="flex items-center gap-4 mb-5">
                <Sparkles size={22} style={{ color: COBALT_LIGHT }} />
                <h3 className="text-white font-bold text-lg">Ingeniería de la Esperanza</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                No medimos tareas, medimos tu capacidad de ver el futuro con claridad. 
                La <span style={{ color: COBALT_LIGHT }}>Esperanza</span> es el eje que desbloquea tu potencial de expansión.
              </p>
            </div>

            <div 
              className="p-8 rounded-2xl border"
              style={{ backgroundColor: "rgba(0,71,171,0.03)", borderColor: `${COBALT}20` }}
            >
              <div className="flex items-center gap-4 mb-5">
                <Brain size={22} style={{ color: COBALT_LIGHT }} />
                <h3 className="text-white font-bold text-lg">Apalancamiento Subconsciente</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                A través del <span style={{ color: COBALT_LIGHT }}>Radar de IA</span> (Gemini), capturamos tus "Deseos Locos" 
                y revelamos los patrones ocultos que tu mente consciente no puede ver.
              </p>
            </div>

            <div 
              className="p-8 rounded-2xl border"
              style={{ backgroundColor: "rgba(0,71,171,0.03)", borderColor: `${COBALT}20` }}
            >
              <div className="flex items-center gap-4 mb-5">
                <Zap size={22} style={{ color: COBALT_LIGHT }} />
                <h3 className="text-white font-bold text-lg">Meritocracia del Guerrero</h3>
              </div>
              <p className="text-slate-400 leading-relaxed">
                El acceso a las herramientas de élite <span className="text-white">no se compra, se conquista</span>. 
                Solo aquellos con disciplina probada a través del{" "}
                <span style={{ color: COBALT_LIGHT }}>"Efecto Reto"</span> acceden a la red de aliados.
              </p>
            </div>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mb-28"
        >
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: `${COBALT}30`, color: COBALT_LIGHT }}
            >
              3
            </div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-slate-500">
              La Red de Expansión (Alianza)
            </h2>
          </div>
          
          <div 
            className="p-8 rounded-2xl border"
            style={{ backgroundColor: "rgba(0,71,171,0.05)", borderColor: `${COBALT}30` }}
          >
            <Users size={28} className="mb-6" style={{ color: COBALT_LIGHT }} />
            <p className="text-slate-400 text-lg leading-relaxed">
              Creemos en la <span className="text-white">soberanía financiera</span> tanto como en la mental. 
              Por ello, el nivel de <span style={{ color: COBALT_LIGHT }}>Arquitecto de Red</span> permite a nuestros 
              guerreros más probados participar en la expansión del sistema, reteniendo el{" "}
              <span className="text-white font-bold">30%</span> de cada nueva voluntad incorporada a la red.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mb-28"
        >
          <div className="flex items-center gap-4 mb-10">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black"
              style={{ backgroundColor: `${COBALT}30`, color: COBALT_LIGHT }}
            >
              4
            </div>
            <h2 className="text-xs uppercase tracking-[0.25em] text-slate-500">
              Compromiso Técnico
            </h2>
          </div>

          <div className="grid gap-6">
            <div className="flex items-start gap-5 p-6 rounded-xl bg-white/[0.02]">
              <Lock size={20} style={{ color: COBALT_LIGHT }} className="mt-1 shrink-0" />
              <div>
                <h3 className="text-white font-bold mb-2">Privacidad Absoluta</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  Tus chispazos y misiones son tuyos. La IA analiza patrones, 
                  pero no almacena tu identidad fuera de tu bóveda.
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-5 p-6 rounded-xl bg-white/[0.02]">
              <Sparkles size={20} style={{ color: COBALT_LIGHT }} className="mt-1 shrink-0" />
              <div>
                <h3 className="text-white font-bold mb-2">Evolución Continua</h3>
                <p className="text-slate-500 text-sm leading-relaxed">
                  El sistema aprende de tu historial para ofrecerte "Alquimia" personalizada.
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pt-16 border-t border-white/5"
        >
          <div 
            className="w-16 h-16 rounded-2xl mx-auto mb-8 flex items-center justify-center"
            style={{ backgroundColor: `${COBALT}15` }}
          >
            <Shield size={28} style={{ color: COBALT_LIGHT }} />
          </div>
          
          <p className="text-xs uppercase tracking-[0.3em] text-slate-600 mb-4">
            SISTEMICAR v2.5
          </p>
          
          <p className="text-slate-400 text-sm mb-6">
            Diseñado para el <span style={{ color: COBALT_LIGHT }}>Arquitecto de Realidad</span>.
            <br />
            Ejecutado por la <span className="text-white">Voluntad</span>.
          </p>
          
          <p 
            className="text-lg italic mb-12 max-w-md mx-auto"
            style={{ fontFamily: "Georgia, serif", color: COBALT_LIGHT }}
          >
            "La disciplina es el puente entre el deseo loco y la realidad soberana."
          </p>

          <motion.button
            onClick={() => navigate("/espejo")}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-8 py-4 rounded-xl font-bold text-white transition-all mb-12"
            style={{ 
              background: `linear-gradient(135deg, ${COBALT} 0%, ${COBALT_LIGHT} 100%)`,
              boxShadow: `0 4px 20px ${COBALT}50`
            }}
            data-testid="button-begin-sovereignty"
          >
            COMENZAR FASE INICIADO
          </motion.button>

          <div className="pt-8 border-t border-white/5">
            <p className="text-[10px] text-slate-700 uppercase tracking-widest mb-2">
              Filosofía creada por
            </p>
            <p className="text-slate-500 text-sm font-medium">Gilson Arévalo</p>
            <p className="text-[10px] text-slate-700 mt-4">
              © {new Date().getFullYear()} SISTEMICAR - Todos los derechos reservados
            </p>
          </div>

          <div className="mt-12 pt-8 border-t border-white/5">
            {isAdminUnlocked ? (
              <div className="flex items-center justify-center gap-2 text-emerald-400">
                <Key size={16} />
                <span className="text-xs uppercase tracking-widest">Modo Arquitecto Supremo Activo</span>
              </div>
            ) : (
              <div className="text-center">
                <button
                  onClick={() => setShowAdminInput(!showAdminInput)}
                  className="text-[10px] text-slate-700 uppercase tracking-widest hover:text-slate-500 transition-colors"
                  data-testid="toggle-admin-input"
                >
                  {showAdminInput ? "Ocultar" : "Código de Arquitecto"}
                </button>
                
                {showAdminInput && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    className="mt-4 flex items-center justify-center gap-2"
                  >
                    <input
                      type="password"
                      value={adminCode}
                      onChange={(e) => setAdminCode(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAdminCode()}
                      placeholder="Ingresa código"
                      className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-sm w-40 focus:outline-none focus:border-blue-500"
                      data-testid="input-admin-code"
                    />
                    <button
                      onClick={handleAdminCode}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium"
                      data-testid="button-submit-admin-code"
                    >
                      Activar
                    </button>
                  </motion.div>
                )}
              </div>
            )}
          </div>
        </motion.footer>

      </div>
    </motion.div>
  );
}
