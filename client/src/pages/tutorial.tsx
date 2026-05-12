import { motion } from "framer-motion";

export default function Tutorial() {
  const steps = [
    {
      id: "01",
      title: "IDENTIFICACIÓN DE EJES",
      content:
        "Identifica los 4 ejes del subconsciente: <span class='text-[#A855F7] font-bold'>ENFOQUE</span> (+5 CP), <span class='text-[#EF4444] font-bold'>CONFLICTO</span> (+10 CP), <span class='text-[#3B82F6] font-bold'>PASOS</span> (+15 CP), <span class='text-[#7C3AED] font-bold'>ALCANCE</span> (+20 CP). Identificar cualquier eje es POSITIVO - ganas conciencia sobre tu futuro.",
    },
    {
      id: "02",
      title: "TRANSMUTACIÓN",
      content:
        "Al identificar un <span class='text-[#EF4444] font-bold'>CONFLICTO</span>, ganas conciencia (+10 CP). Define <span class='text-[#3B82F6] font-bold'>PASOS</span> para transmutarlo. Cada eje identificado te acerca a la claridad mental.",
    },
    {
      id: "03",
      title: "EL PASO JEFE",
      content:
        "Ancla el desafío más denso del momento (+50 CP). Una vez vencido, se guarda como trofeo en tu historial para recargar tu esperanza en momentos de debilidad.",
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="p-10 max-w-4xl mx-auto pt-20"
    >
      <header className="mb-20 space-y-4">
        <p className="text-[10px] tracking-[0.6em] text-primary font-black uppercase">
          Protocolo de Inicio
        </p>
        <h1 className="text-6xl md:text-7xl font-black tracking-tighter italic font-display text-white">
          MANUAL DE <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-500">
            OPERACIONES
          </span>
        </h1>
      </header>

      <div className="space-y-16 relative">
        <div className="absolute left-[11px] top-4 bottom-0 w-0.5 bg-gradient-to-b from-white/20 to-transparent" />
        
        {steps.map((step, index) => (
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 + 0.2 }}
            className="relative pl-12 group"
          >
            <div className="absolute left-0 top-0 w-6 h-6 bg-background border border-white/20 rounded-full flex items-center justify-center z-10 group-hover:border-primary transition-colors">
              <div className="w-2 h-2 bg-white/50 rounded-full group-hover:bg-primary transition-colors" />
            </div>
            
            <span className="text-xs font-mono text-primary/50 mb-2 block tracking-widest">
              STEP {step.id}
            </span>
            <h3 className="text-2xl font-black italic mb-4 font-display text-white group-hover:text-primary transition-colors duration-300">
              {step.title}
            </h3>
            <p
              className="text-slate-400 leading-relaxed text-sm md:text-base max-w-xl"
              dangerouslySetInnerHTML={{ __html: step.content }}
            />
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
