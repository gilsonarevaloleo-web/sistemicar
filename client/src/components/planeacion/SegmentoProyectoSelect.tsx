import type { Proyecto } from "@/lib/proyectos";

type Props = {
  value: string;
  onChange: (proyectoId: string) => void;
  proyectos: Proyecto[];
  className?: string;
  testId?: string;
  compact?: boolean;
};

/** Selector tech-noir: vincular segmento a Proyecto o Centro del Hub. */
export function SegmentoProyectoSelect({
  value,
  onChange,
  proyectos,
  className = "",
  testId = "select-segmento-proyecto",
  compact = false,
}: Props) {
  return (
    <div className={className}>
      <label
        className={
          compact
            ? "text-[8px] text-gray-500 uppercase tracking-wider mb-1 block"
            : "text-[9px] text-gray-500 uppercase tracking-wider mb-1 block"
        }
      >
        Proyecto o Centro de Atención
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={
          compact
            ? "w-full p-2 rounded-lg bg-gray-900/60 border border-gray-800 text-gray-300 text-xs focus:outline-none focus:border-cyan-500/40"
            : "w-full p-2.5 rounded-xl bg-gray-900/60 border border-gray-800 text-gray-200 text-sm focus:outline-none focus:border-cyan-500/50"
        }
        data-testid={testId}
      >
        <option value="">Sin vincular</option>
        {proyectos.map((p) => (
          <option key={p.id} value={p.id}>
            {p.etiqueta === "centro" ? "Centro" : "Proyecto"} · {p.titulo}
          </option>
        ))}
      </select>
      {proyectos.length === 0 && (
        <p className="text-[8px] text-gray-600 mt-1">
          Crea proyectos en el Hub para vincular este bloque.
        </p>
      )}
    </div>
  );
}
