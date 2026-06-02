import type { RutaCruzadaSnapshot } from "@/lib/rutaEnfoque";
import { RUTA_BANDA_META, type RutaBandaId } from "@/lib/rutaEnfoque";
import {
  RUTA_SEGUIMIENTO_PRESETS,
  bandasToPatron,
  type RutaSeguimientoPatron,
} from "@/lib/rutaSeguimiento";

export type RutaSeguimientoPickerProps = {
  tituloContexto?: string;
  cruzadaReferencia?: RutaCruzadaSnapshot | null;
  seleccion: Set<RutaBandaId>;
  sinUso: boolean;
  patronActivo: RutaSeguimientoPatron | null;
  onSeleccionChange: (bandas: Set<RutaBandaId>, patron: RutaSeguimientoPatron | null) => void;
  onSinUsoChange: (sinUso: boolean) => void;
};

export function RutaSeguimientoPicker({
  tituloContexto,
  cruzadaReferencia,
  seleccion,
  sinUso,
  patronActivo,
  onSeleccionChange,
  onSinUsoChange,
}: RutaSeguimientoPickerProps) {
  const applyPreset = (bandas: RutaBandaId[], patron: RutaSeguimientoPatron) => {
    onSinUsoChange(false);
    onSeleccionChange(new Set(bandas), patron);
  };

  return (
    <div className="space-y-3">
      <div className="text-center space-y-1">
        <p className="text-sm font-bold text-white">¿Qué ruta pudiste seguir o elegiste seguir?</p>
        {tituloContexto && (
          <p className="text-[9px] text-slate-500">Sub: «{tituloContexto}»</p>
        )}
        <p className="text-[8px] text-slate-500 leading-relaxed px-1">
          La voz sigue su curso (fluido → concentrado → límite); tú marcas lo que realmente viviste.
        </p>
      </div>

      {cruzadaReferencia && (
        <p className="text-[7px] text-center text-slate-600 font-mono">
          Referencia del contador:{" "}
          {(["fluido", "concentrado", "limite"] as const)
            .filter(b => cruzadaReferencia[b])
            .map(b => RUTA_BANDA_META[b].icon)
            .join(" ") || "—"}{" "}
          <span className="text-slate-700">(no pre-marca tu respuesta)</span>
        </p>
      )}

      <div className="space-y-1.5">
        {RUTA_SEGUIMIENTO_PRESETS.map(preset => {
          const active = patronActivo === preset.id;
          return (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyPreset(preset.bandas, preset.id)}
              className="w-full text-left px-2.5 py-2 rounded-lg border transition-all"
              style={{
                backgroundColor: active ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
                borderColor: active ? "rgba(56,189,248,0.4)" : "rgba(255,255,255,0.06)",
              }}
            >
              <p className="text-[10px] font-bold text-white">{preset.label}</p>
              <p className="text-[8px] text-slate-500 mt-0.5 leading-snug">{preset.hint}</p>
            </button>
          );
        })}
      </div>

      <p className="text-[8px] text-center text-slate-600 uppercase tracking-wider">o elige tramos concretos</p>

      <div className="space-y-1.5">
        {(["fluido", "concentrado", "limite"] as const).map(banda => (
          <label
            key={banda}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer"
            style={{
              backgroundColor: seleccion.has(banda) ? "rgba(139,92,246,0.12)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${seleccion.has(banda) ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.06)"}`,
            }}
          >
            <input
              type="checkbox"
              checked={seleccion.has(banda)}
              disabled={sinUso}
              onChange={() => {
                onSinUsoChange(false);
                const next = new Set(seleccion);
                if (next.has(banda)) next.delete(banda);
                else next.add(banda);
                const patron = bandasToPatron([...next]);
                onSeleccionChange(next, next.size ? patron : null);
              }}
              className="accent-violet-500"
            />
            <span className="text-[10px] text-white">
              {RUTA_BANDA_META[banda].icon} {RUTA_BANDA_META[banda].label}
            </span>
          </label>
        ))}
      </div>

      <button
        type="button"
        onClick={() => {
          onSinUsoChange(true);
          onSeleccionChange(new Set(), "sin_ruta");
        }}
        className="w-full py-2 rounded-lg text-[9px] font-bold text-slate-400"
        style={{
          backgroundColor: sinUso ? "rgba(139,92,246,0.15)" : "rgba(255,255,255,0.04)",
          border: `1px solid ${sinUso ? "rgba(139,92,246,0.35)" : "rgba(255,255,255,0.06)"}`,
        }}
      >
        No seguí la ruta / cerré a mi ritmo
      </button>
    </div>
  );
}

export function rutaSeguimientoPickerCanConfirm(sinUso: boolean, seleccion: Set<RutaBandaId>): boolean {
  return sinUso || seleccion.size > 0;
}
