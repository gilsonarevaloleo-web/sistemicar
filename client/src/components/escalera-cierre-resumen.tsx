import {
  ESCALERA_NIVEL_LABEL,
  type EscaleraCierreSnapshot,
  type EscaleraConcienciaModel,
  type EscaleraNivel,
} from "@/lib/escaleraConcienciaEngine";

const CAPA_COLOR = {
  presencia: "#8B5CF6",
  entrada: "#D4AF37",
  produccion: "#A855F7",
} as const;

const NIVEL_COLOR: Record<EscaleraNivel, string> = {
  semilla: "#64748b",
  tallo: "#94a3b8",
  hoja: "#50C878",
  flor: "#00FFC3",
};

function CapaCierreRow({
  capa,
  titulo,
  subtitulo,
  valor,
  nivel,
  score,
  color,
}: {
  capa: number;
  titulo: string;
  subtitulo: string;
  valor: string;
  nivel: EscaleraNivel;
  score: number;
  color: string;
}) {
  return (
    <div
      className="flex items-center gap-2 p-2 rounded-lg border relative overflow-hidden"
      style={{ borderColor: `${color}25`, backgroundColor: `${color}06` }}
    >
      <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ backgroundColor: color }} />
      <span
        className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black"
        style={{ backgroundColor: `${color}20`, color }}
      >
        {capa}
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[8px] font-black uppercase tracking-wider" style={{ color }}>
          {titulo}
        </p>
        <p className="text-[7px] text-slate-500 truncate">{subtitulo}</p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[10px] font-black text-white tabular-nums">{valor}</p>
        <p className="text-[7px] font-bold" style={{ color: NIVEL_COLOR[nivel] }}>
          {ESCALERA_NIVEL_LABEL[nivel]}
        </p>
      </div>
      <div className="w-8 shrink-0">
        <div className="h-1 rounded-full overflow-hidden" style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full" style={{ width: `${score}%`, backgroundColor: color }} />
        </div>
      </div>
    </div>
  );
}

export function EscaleraCierreResumen({
  model,
  snapshot,
}: {
  model?: EscaleraConcienciaModel;
  snapshot?: EscaleraCierreSnapshot | null;
}) {
  const data = snapshot
    ? {
        brecha: snapshot.brechaPresenciaProduccion,
        integracion: snapshot.integracion,
        rows: [
          {
            capa: 1,
            id: "presencia" as const,
            titulo: "Presencia",
            subtitulo: "¿En qué se me va el tiempo?",
            valor: snapshot.presenciaValor,
            nivel: snapshot.presenciaNivel,
            score: snapshot.presenciaScore,
          },
          {
            capa: 2,
            id: "entrada" as const,
            titulo: "Entrada",
            subtitulo: "¿Aparezco al trabajo consciente?",
            valor: snapshot.entradaValor,
            nivel: snapshot.entradaNivel,
            score: snapshot.entradaScore,
          },
          {
            capa: 3,
            id: "produccion" as const,
            titulo: "Producción",
            subtitulo: "¿Convierto el tiempo en decisiones?",
            valor: snapshot.produccionValor,
            nivel: snapshot.produccionNivel,
            score: snapshot.produccionScore,
          },
        ],
      }
    : model
      ? {
          brecha: model.brechaPresenciaProduccion,
          integracion: model.integracion,
          rows: model.capas.map(c => ({
            capa: c.capa,
            id: c.id,
            titulo: c.titulo,
            subtitulo: c.subtitulo,
            valor: c.valorPrincipal,
            nivel: c.nivel,
            score: c.score,
          })),
        }
      : null;

  if (!data) return null;

  return (
    <div
      className="p-3 rounded-xl border space-y-2"
      style={{ backgroundColor: "rgba(168,85,247,0.06)", borderColor: "rgba(168,85,247,0.28)" }}
      data-testid="escalera-cierre-resumen"
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#A855F7" }}>
            Escalera de Conciencia
          </p>
          <p className="text-[7px] text-slate-500 mt-0.5 leading-snug">
            Tres capas de desarrollo — ninguna sustituye a la otra
          </p>
        </div>
        {data.brecha && (
          <span
            className="text-[7px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded border shrink-0"
            style={{ color: "#A855F7", borderColor: "rgba(168,85,247,0.35)" }}
          >
            Puente
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        {data.rows.map(row => (
          <CapaCierreRow
            key={row.id}
            capa={row.capa}
            titulo={row.titulo}
            subtitulo={row.subtitulo}
            valor={row.valor}
            nivel={row.nivel}
            score={row.score}
            color={CAPA_COLOR[row.id]}
          />
        ))}
      </div>

      <p className="text-[8px] text-slate-400 leading-relaxed italic border-t border-white/5 pt-2">
        {data.integracion}
      </p>
    </div>
  );
}
