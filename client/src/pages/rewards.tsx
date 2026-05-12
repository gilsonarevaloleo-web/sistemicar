import { motion } from "framer-motion";
import { Eye, Target, Crown, ArrowRight } from "lucide-react";
import { Link } from "wouter";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const EMERALD = "#50C878";

const accessLevels = [
  { 
    id: "iniciado", 
    title: "INICIADO", 
    subtitle: "Gratis • 1 Vehículo",
    description: "Visualiza Esperanza, Manómetro básico",
    icon: Eye,
    route: "/espejo",
    color: "#888888",
    cta: "Comenzar",
    isFree: true
  },
  { 
    id: "operador", 
    title: "OPERADOR TÁCTICO", 
    subtitle: "$9.99/mes • Conquistable",
    description: "Paso Jefe, Registra Esperanza, Vehículos ilimitados",
    icon: Target,
    route: "/pagos",
    color: EMERALD,
    cta: "Ascender",
    isFree: false
  },
  { 
    id: "arquitecto", 
    title: "ARQUITECTO DE RED", 
    subtitle: "$24.99/mes • Maestro",
    description: "Radar IA, Análisis de Patrones, 30% Comisión",
    icon: Crown,
    route: "/pagos",
    color: GOLD,
    cta: "Dominar",
    isFree: false
  },
];

export default function Rewards() {
  return (
    <div className="min-h-screen p-4 md:p-6 pb-32" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8 pt-4"
        >
          <h1 className="text-2xl font-black tracking-tight text-white">
            NIVELES DE <span style={{ color: GOLD }}>ACCESO</span>
          </h1>
          <p className="text-xs uppercase tracking-widest mt-2" style={{ color: AZURE }}>
            No vendemos. Seleccionamos.
          </p>
        </motion.div>

        <div className="space-y-3">
          {accessLevels.map((level, i) => (
            <motion.div
              key={level.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link
                href={level.route}
                className="group relative p-5 rounded-2xl border flex items-center gap-4 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
                style={{ 
                  backgroundColor: "#0a0a0a",
                  borderColor: `${level.color}40`
                }}
                data-testid={`level-${level.id}`}
              >
                <div 
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ 
                    background: `linear-gradient(135deg, ${level.color}15 0%, transparent 50%)`
                  }}
                />
                
                <div 
                  className="relative z-10 p-3 rounded-xl shrink-0"
                  style={{ backgroundColor: `${level.color}20` }}
                >
                  <level.icon size={24} style={{ color: level.color }} />
                </div>

                <div className="relative z-10 flex-1 min-w-0">
                  <h3 
                    className="text-sm font-black tracking-wide"
                    style={{ color: level.color }}
                  >
                    {level.title}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {level.subtitle}
                  </p>
                  <p className="text-[10px] text-slate-600 mt-1 leading-tight">
                    {level.description}
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2 shrink-0">
                  <span 
                    className="text-xs font-bold"
                    style={{ color: level.color }}
                  >
                    {level.cta}
                  </span>
                  <ArrowRight size={16} style={{ color: level.color }} />
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 p-5 rounded-2xl border text-center"
          style={{ 
            backgroundColor: "#0a0a0a",
            borderColor: `${EMERALD}30`
          }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: EMERALD }}>
            EFECTO RETO
          </p>
          <p className="text-[11px] text-slate-400">
            Conquista Operador Táctico completando <strong className="text-white">3 misiones difíciles consecutivas</strong>. Sin pagar.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-3 p-5 rounded-2xl border text-center"
          style={{ 
            backgroundColor: "#0a0a0a",
            borderColor: `${GOLD}30`
          }}
        >
          <p className="text-xs font-bold mb-2" style={{ color: GOLD }}>
            MISIÓN DE EXPANSIÓN
          </p>
          <p className="text-[11px] text-slate-400">
            Arquitectos con <strong className="text-white">Esperanza ≥ 85%</strong> desbloquean 30% de comisión por referidos.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
