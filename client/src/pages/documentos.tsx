import { motion } from "framer-motion";
import { FileText, Download, Eye, Target, ArrowLeft, Brain, Users } from "lucide-react";
import { useLocation } from "wouter";

const GOLD = "#D4AF37";
const VIOLET = "#7C3AED";
const ELECTRIC_BLUE = "#3b82f6";
const EMERALD = "#10B981";

const DOCUMENTOS = [
  {
    id: "vendedores",
    titulo: "KIT VENDEDORES — PLANIFICACIÓN",
    descripcion: "Playbook de beneficios, stacks, comisión 30% recurrente (mientras el cliente pague), links ref= y guion de venta.",
    archivo: "/vendedores-planificacion",
    icon: Users,
    color: EMERALD,
    version: "v1.0",
    isRoute: true
  },
  {
    titulo: "MÉTRICAS COGNITIVAS",
    descripcion: "Documento completo de métricas del sistema: lo que se mide, lo que falta medir, y el significado psicológico de cada dato.",
    archivo: "/metricas",
    icon: Brain,
    color: GOLD,
    version: "v1.0",
    isRoute: true
  },
  {
    id: "espejo",
    titulo: "ESPEJO - Inteligencia Emocional",
    descripcion: "Especificación técnica completa del módulo de inteligencia emocional. Incluye los 4 ejes, sistema de puntos, flujos y persistencia.",
    archivo: "/docs/ESPEJO_Especificacion_Tecnica.md",
    icon: Eye,
    color: ELECTRIC_BLUE,
    version: "v2.5"
  },
  {
    id: "proyector",
    titulo: "PROYECTOR - Arquitectura de Realidad",
    descripcion: "Especificación técnica completa del módulo de arquitectura de realidad futura. Incluye los 4 ejes × 5 niveles, integración con IA y sistema de puntos.",
    archivo: "/docs/PROYECTOR_Especificacion_Tecnica.md",
    icon: Target,
    color: VIOLET,
    version: "v2.5"
  }
];

export default function Documentos() {
  const [, navigate] = useLocation();

  const handleDownload = (archivo: string, titulo: string) => {
    const link = document.createElement("a");
    link.href = archivo;
    link.download = archivo.split("/").pop() || "documento.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleView = (archivo: string) => {
    window.open(archivo, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white p-4 pb-24">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <button
          onClick={() => navigate("/")}
          className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          data-testid="button-back"
        >
          <ArrowLeft className="w-4 h-4" />
          Volver
        </button>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4">
            <FileText className="w-8 h-8" style={{ color: GOLD }} />
          </div>
          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "Playfair Display" }}>
            Documentación Técnica
          </h1>
          <p className="text-slate-400 text-sm">
            Especificaciones para compartir con especialistas
          </p>
        </div>

        <div className="space-y-4">
          {DOCUMENTOS.map((doc, index) => {
            const Icon = doc.icon;
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="p-5 rounded-2xl border backdrop-blur-xl"
                style={{
                  background: "rgba(255,255,255,0.03)",
                  borderColor: "rgba(255,255,255,0.1)"
                }}
                data-testid={`card-documento-${doc.id}`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="p-3 rounded-xl"
                    style={{ background: `${doc.color}20` }}
                  >
                    <Icon className="w-6 h-6" style={{ color: doc.color }} />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="font-semibold text-white">{doc.titulo}</h2>
                      <span 
                        className="text-[10px] px-2 py-0.5 rounded-full"
                        style={{ background: `${GOLD}20`, color: GOLD }}
                      >
                        {doc.version}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mb-4">{doc.descripcion}</p>
                    
                    <div className="flex gap-2">
                      {(doc as any).isRoute ? (
                        <button
                          onClick={() => navigate(doc.archivo)}
                          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                          style={{ 
                            background: `${doc.color}20`,
                            border: `1px solid ${doc.color}40`,
                            color: doc.color
                          }}
                          data-testid={`button-view-${doc.id}`}
                        >
                          <Eye className="w-4 h-4" />
                          Ver y Descargar
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={() => handleView(doc.archivo)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                            style={{ 
                              background: "rgba(255,255,255,0.05)",
                              border: "1px solid rgba(255,255,255,0.1)"
                            }}
                            data-testid={`button-view-${doc.id}`}
                          >
                            <Eye className="w-4 h-4" />
                            Ver
                          </button>
                          <button
                            onClick={() => handleDownload(doc.archivo, doc.titulo)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:scale-105"
                            style={{ 
                              background: `${doc.color}20`,
                              border: `1px solid ${doc.color}40`,
                              color: doc.color
                            }}
                            data-testid={`button-download-${doc.id}`}
                          >
                            <Download className="w-4 h-4" />
                            Descargar
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div 
          className="mt-8 p-4 rounded-xl text-center"
          style={{ 
            background: "rgba(255,255,255,0.02)",
            border: "1px solid rgba(255,255,255,0.05)"
          }}
        >
          <p className="text-slate-500 text-xs">
            Formato: Markdown (.md) • Compatible con cualquier editor de texto
          </p>
        </div>
      </motion.div>
    </div>
  );
}
