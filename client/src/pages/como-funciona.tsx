import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { ArrowLeft, Eye, Lock, Sparkles, Trophy, Users, Lightbulb, Crown } from "lucide-react";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";

const areas = [
  { 
    name: "ESPEJO", 
    color: "#A855F7", 
    points: 5, 
    icon: Eye,
    desc: "La Consola de Auto-conocimiento",
    explanation: "Observa tu estado mental actual sin juicio. Registra lo que sientes, piensas o experimentas. El primer paso de toda transformación es la consciencia."
  },
  { 
    name: "ESPERANZA", 
    color: AZURE, 
    points: 10, 
    icon: Lock,
    desc: "Tu Bóveda de Motivación",
    explanation: "Guarda recuerdos, metas o experiencias que te dan fuerzas. Cuando vengan días difíciles, abrirás esta bóveda y encontrarás razones para seguir."
  },
  { 
    name: "ALQUIMIA", 
    color: GOLD, 
    points: 15, 
    icon: Sparkles,
    desc: "Destilador de Sabiduría",
    explanation: "Transforma experiencias cotidianas en aprendizaje. Cada situación tiene una lección oculta. Aquí la extraes y la cristalizas."
  }
];

const pointsTable = [
  { type: "Registrar en Espejo", points: "+5 CP", color: "#A855F7" },
  { type: "Guardar en Esperanza", points: "+10 CP", color: AZURE },
  { type: "Destilar en Alquimia", points: "+15 CP", color: GOLD }
];

export default function ComoFunciona() {
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-[#020202] text-white">
      <div className="max-w-2xl mx-auto p-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <button
            onClick={() => navigate("/menu")}
            className="p-2 rounded-full hover:bg-white/10 transition-colors"
            data-testid="button-back-menu"
          >
            <ArrowLeft size={24} style={{ color: GOLD }} />
          </button>
          <div>
            <h1 className="text-2xl font-bold" style={{ color: GOLD }}>¿Cómo Funciona?</h1>
            <p className="text-slate-400 text-sm">Guía de SISTEMICAR</p>
          </div>
        </motion.div>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Lightbulb size={20} style={{ color: GOLD }} />
            <h2 className="text-lg font-bold">La Filosofía</h2>
          </div>
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.2)" }}
          >
            <p className="text-slate-300 leading-relaxed mb-3">
              SISTEMICAR usa la misma mecánica que las redes sociales (puntos, rachas, recompensas), 
              pero para <strong className="text-white">enfocarte</strong> en lugar de distraerte.
            </p>
            <p className="text-slate-300 leading-relaxed">
              <strong style={{ color: GOLD }}>Alquimia mental:</strong> transformamos experiencias cotidianas en sabiduría y fuerza interior.
            </p>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles size={20} style={{ color: GOLD }} />
            <h2 className="text-lg font-bold">Las 3 Áreas de Transmutación</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Cada área te ayuda a transformar tu experiencia en poder interior.
          </p>
          <div className="space-y-3">
            {areas.map((area) => {
              const Icon = area.icon;
              return (
                <div
                  key={area.name}
                  className="p-4 rounded-xl"
                  style={{ backgroundColor: `${area.color}10`, border: `1px solid ${area.color}30` }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <Icon size={20} style={{ color: area.color }} />
                      <span className="font-bold text-white">{area.name}</span>
                    </div>
                    <span className="font-bold" style={{ color: area.color }}>+{area.points} CP</span>
                  </div>
                  <p className="text-xs text-slate-500 mb-1">{area.desc}</p>
                  <p className="text-sm text-slate-300">{area.explanation}</p>
                </div>
              );
            })}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={20} style={{ color: "#F59E0B" }} />
            <h2 className="text-lg font-bold">Sistema de Puntos (CP)</h2>
          </div>
          <p className="text-slate-400 text-sm mb-4">
            Gana puntos por cada acción consciente que realices.
          </p>
          
          <div className="space-y-2 mb-4">
            {pointsTable.map((row, idx) => (
              <div 
                key={idx}
                className="flex items-center justify-between p-3 rounded-lg"
                style={{ backgroundColor: `${row.color}10`, border: `1px solid ${row.color}30` }}
              >
                <span className="text-white text-sm">{row.type}</span>
                <span className="font-bold" style={{ color: row.color }}>{row.points}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} style={{ color: GOLD }} />
            <h2 className="text-lg font-bold">La Alianza (180 Soberanía)</h2>
          </div>
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: "rgba(212, 175, 55, 0.1)", border: "1px solid rgba(212, 175, 55, 0.2)" }}
          >
            <p className="text-slate-300 leading-relaxed mb-3">
              Al alcanzar 180 pts de Soberanía desbloqueas el <strong style={{ color: GOLD }}>Sistema de Alianza</strong>.
            </p>
            <ul className="text-slate-300 text-sm space-y-2">
              <li>• Obtienes tu código de referido único</li>
              <li>• Ganas <strong className="text-amber-400">30% de comisión</strong> por cada usuario que refieras</li>
              <li>• Panel exclusivo para ver tus ganancias</li>
            </ul>
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Crown size={20} style={{ color: "#7C3AED" }} />
            <h2 className="text-lg font-bold">Nivel Arquitecto ($24.99)</h2>
          </div>
          <div 
            className="p-4 rounded-xl"
            style={{ backgroundColor: "rgba(124, 58, 237, 0.1)", border: "1px solid rgba(124, 58, 237, 0.3)" }}
          >
            <p className="text-slate-300 leading-relaxed mb-3">
              Desbloquea el <strong className="text-violet-400">Motor de Planificación</strong> con los 4 Ejes del Subconsciente.
            </p>
            <ul className="text-slate-300 text-sm space-y-2">
              <li>• <strong className="text-violet-400">Vehículos:</strong> Tareas con propósito y análisis profundo</li>
              <li>• <strong className="text-violet-400">4 Ejes:</strong> ENFOQUE, CONFLICTO, PASOS, ALCANCE</li>
              <li>• <strong className="text-violet-400">Sistema Trifecta:</strong> Misiones difíciles con bonus de coraje</li>
              <li>• <strong className="text-violet-400">Radar IA:</strong> Análisis inteligente de tus patrones</li>
            </ul>
          </div>
        </motion.section>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center"
        >
          <button
            onClick={() => navigate("/esperanza")}
            className="px-8 py-4 rounded-xl font-bold text-black transition-all hover:scale-[1.02]"
            style={{ backgroundColor: AZURE }}
            data-testid="button-start-esperanza"
          >
            ¡Ir a ESPERANZA!
          </button>
        </motion.div>
      </div>
    </div>
  );
}
