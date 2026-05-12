import { motion } from "framer-motion";
import { 
  Shield, 
  Target, 
  Swords, 
  Crosshair, 
  Flame, 
  Brain, 
  Sparkles, 
  Rocket, 
  Users, 
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Star
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const GOLD = "#D4AF37";
const AZURE = "#1E90FF";
const EMERALD = "#10B981";
const VIOLET = "#8B5CF6";

interface SectionProps {
  title: string;
  number: string;
  icon: React.ElementType;
  color: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

function CollapsibleSection({ title, number, icon: Icon, color, children, defaultOpen = false }: SectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border overflow-hidden"
      style={{ 
        backgroundColor: "#0a0a0a",
        borderColor: `${color}33`
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full p-4 flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-3">
          <div 
            className="w-8 h-8 rounded-lg flex items-center justify-center text-sm font-black"
            style={{ backgroundColor: `${color}20`, color }}
          >
            {number}
          </div>
          <Icon size={20} style={{ color }} />
          <span className="font-bold text-white text-sm">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp size={18} className="text-slate-500" />
        ) : (
          <ChevronDown size={18} className="text-slate-500" />
        )}
      </button>
      
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          className="px-4 pb-4 space-y-3"
        >
          {children}
        </motion.div>
      )}
    </motion.div>
  );
}

function Bullet({ children, highlight }: { children: React.ReactNode; highlight?: boolean }) {
  return (
    <div className={cn(
      "flex gap-2 text-sm",
      highlight ? "text-amber-400 font-medium" : "text-slate-400"
    )}>
      <span className="text-slate-600">•</span>
      <span>{children}</span>
    </div>
  );
}

function HighlightBox({ children, color = EMERALD }: { children: React.ReactNode; color?: string }) {
  return (
    <div 
      className="p-3 rounded-xl border-l-4 text-sm"
      style={{ 
        backgroundColor: `${color}10`,
        borderLeftColor: color,
        color
      }}
    >
      {children}
    </div>
  );
}

export default function Codice() {
  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center pt-4 pb-2"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full mb-3" style={{ backgroundColor: `${GOLD}15` }}>
            <Shield size={16} style={{ color: GOLD }} />
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
              Códice de Soberanía
            </span>
          </div>
          <h1 className="text-2xl font-black text-white mb-2">SISTEMICAR v2.5</h1>
          <p className="text-xs text-slate-500 italic max-w-xs mx-auto">
            "La infraestructura para el dominio del subconsciente y la expansión de la voluntad"
          </p>
        </motion.div>

        <CollapsibleSection
          number="1"
          title="LOS CUATRO EJES (EL MANÓMETRO)"
          icon={Target}
          color={AZURE}
          defaultOpen={true}
        >
          <p className="text-xs text-slate-500 mb-3">
            La base de tu poder se mide en cuatro dimensiones. Ignorar una es fugar energía.
          </p>
          <Bullet><strong className="text-white">ENFOQUE:</strong> Tu capacidad de ignorar el ruido y sostener la mirada en el objetivo.</Bullet>
          <Bullet><strong className="text-white">CONFLICTO:</strong> El reconocimiento de la resistencia interna y externa. No se evita, se gestiona.</Bullet>
          <Bullet><strong className="text-white">PASOS:</strong> La fragmentación táctica. Una visión sin pasos es una alucinación.</Bullet>
          <Bullet highlight><strong>ESPERANZA:</strong> Tu activo más valioso. Es la certeza de la victoria futura y el motor que desbloquea la Alianza.</Bullet>
        </CollapsibleSection>

        <CollapsibleSection
          number="2"
          title="LOS VEHÍCULOS DE ACCIÓN"
          icon={Rocket}
          color={EMERALD}
        >
          <p className="text-xs text-slate-500 mb-3">
            Tus misiones no son tareas, son vehículos que transportan tu voluntad.
          </p>
          <Bullet><strong className="text-white">Modo Reto:</strong> Misiones de alta intensidad que, al ser superadas, demuestran tu rango de Guerrero.</Bullet>
          <Bullet><strong className="text-white">Modo Blando:</strong> Misiones de mantenimiento y flujo.</Bullet>
          <HighlightBox color={EMERALD}>
            <strong>El Paso Jefe:</strong> La tarea única que, de no cumplirse, invalida el día. Es el ancla de tu disciplina.
          </HighlightBox>
        </CollapsibleSection>

        <CollapsibleSection
          number="3"
          title="EL RADAR DEL SUBCONSCIENTE"
          icon={Brain}
          color={VIOLET}
        >
          <p className="text-xs text-slate-500 mb-3">
            Tu mente suelta verdades cuando no estás mirando. El Radar captura los "Chispazos" y "Deseos Locos".
          </p>
          <Bullet><strong className="text-white">Captura sin Juicio:</strong> Registra ideas que parecen imposibles.</Bullet>
          <Bullet><strong className="text-white">Análisis de Patrones (IA):</strong> Gemini analiza tus registros para revelarte los "Hilos Invisibles".</Bullet>
          <HighlightBox color={VIOLET}>
            Si tus deseos locos siempre apuntan a un lugar, ese es tu destino real.
          </HighlightBox>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 text-xs text-slate-500 mt-2">
            <Star size={14} className="text-violet-400" />
            Nivel Arquitecto requerido
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          number="4"
          title="LA ESCALA DE ASCENSO (FILTROS)"
          icon={Swords}
          color={GOLD}
        >
          <HighlightBox color={GOLD}>
            <strong>SISTEMICAR no se compra, se conquista.</strong>
          </HighlightBox>
          
          <div className="space-y-3 mt-3">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center">
                  <span className="text-xs font-bold text-slate-300">I</span>
                </div>
                <span className="font-bold text-white text-sm">Fase Iniciado</span>
                <span className="text-xs text-slate-500">(Gratis)</span>
              </div>
              <p className="text-xs text-slate-400">
                Demuestra 5 días de registro constante. Es el filtro para los curiosos.
              </p>
            </div>

            <div className="p-3 rounded-xl border" style={{ backgroundColor: `${GOLD}10`, borderColor: `${GOLD}30` }}>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={16} style={{ color: GOLD }} />
                <span className="font-bold text-sm" style={{ color: GOLD }}>La Prueba de Fuerza</span>
              </div>
              <p className="text-xs text-slate-400">
                Supera <strong className="text-white">3 Vehículos en modo Reto</strong> para ganar tu rango de Guerrero.
              </p>
              <p className="text-xs mt-2 italic" style={{ color: GOLD }}>
                El rango se gana con disciplina, no con dinero.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-emerald-900/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-emerald-400">G</span>
                </div>
                <span className="font-bold text-white text-sm">Fase Guerrero</span>
                <span className="text-xs text-emerald-400">(Operador)</span>
              </div>
              <p className="text-xs text-slate-400">
                Acceso a flotas ilimitadas y al Monitor de Esperanza.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-6 h-6 rounded-full bg-violet-900/50 flex items-center justify-center">
                  <span className="text-xs font-bold text-violet-400">A</span>
                </div>
                <span className="font-bold text-white text-sm">Fase Arquitecto de Red</span>
              </div>
              <p className="text-xs text-slate-400">
                Acceso al Radar IA y a la Misión de Expansión.
              </p>
            </div>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          number="5"
          title="LA MISIÓN DE EXPANSIÓN (EL NEGOCIO)"
          icon={Users}
          color={EMERALD}
        >
          <HighlightBox color={EMERALD}>
            Cuando tu eje de <strong>Esperanza cruza el 85%</strong>, dejas de ser un usuario para ser un aliado.
          </HighlightBox>
          
          <div className="mt-3 space-y-2">
            <Bullet>
              <strong className="text-emerald-400">Retribución del 30%:</strong> Por cada nuevo guerrero que reclutes, retienes el 30% como sustento para tu soberanía financiera.
            </Bullet>
            <Bullet>
              <strong className="text-amber-400">Condición de Autoridad:</strong> Si tu Esperanza cae por debajo del umbral, la misión se pausa. No puedes liderar si tu visión está nublada.
            </Bullet>
          </div>

          <div className="mt-4 p-3 rounded-xl border-2 border-dashed" style={{ borderColor: `${EMERALD}50` }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div 
                  className="h-full rounded-full" 
                  style={{ 
                    width: "85%", 
                    background: `linear-gradient(90deg, ${AZURE}, ${EMERALD})` 
                  }} 
                />
              </div>
              <span className="text-xs font-bold" style={{ color: EMERALD }}>85%</span>
            </div>
            <p className="text-xs text-center text-slate-500">
              Umbral de Esperanza para la Alianza
            </p>
          </div>
        </CollapsibleSection>

        <CollapsibleSection
          number="∞"
          title="PROTOCOLO DE ALQUIMIA"
          icon={RotateCcw}
          color={AZURE}
        >
          <p className="text-xs text-slate-500 mb-3">
            Al final de cada ciclo, lo que no se cumplió no es un fallo, es materia prima.
          </p>
          <div className="space-y-2">
            <Bullet><strong className="text-white">1.</strong> Revisa tus misiones archivadas.</Bullet>
            <Bullet><strong className="text-white">2.</strong> Extrae la lección (El Oro).</Bullet>
            <Bullet><strong className="text-white">3.</strong> Inyéctala en tu próximo Vehículo.</Bullet>
          </div>
          
          <div className="mt-4 p-4 rounded-xl text-center" style={{ backgroundColor: `${GOLD}10` }}>
            <p className="text-sm italic font-medium" style={{ color: GOLD }}>
              "La disciplina es la forma más alta de amor propio."
            </p>
          </div>
        </CollapsibleSection>
      </div>
    </div>
  );
}
