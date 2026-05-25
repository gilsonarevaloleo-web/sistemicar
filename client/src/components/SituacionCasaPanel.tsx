import { ChevronDown, ChevronUp, Home, Plus } from "lucide-react";
import type { DetalleSubTarea } from "@/lib/persistence";
import {
  CASA_SITUACION_PRESETS,
  countCasaHechas,
  groupCasaByTexto,
} from "@/lib/situacionCasa";

const PLATA = "#94a3b8";
const VERDE = "#22c55e";
const GOLD = "#d4af37";

type SituacionCasaPanelProps = {
  vehicleId: string;
  subTareaId: string;
  casaItems: DetalleSubTarea[];
  expanded: boolean;
  onToggleExpand: () => void;
  draft: string;
  onDraftChange: (value: string) => void;
  onAdd: (texto: string) => void;
  onToggleHecho: (detalleId: string) => void;
  readOnly?: boolean;
};

export function SituacionCasaPanel({
  subTareaId,
  casaItems,
  expanded,
  onToggleExpand,
  draft,
  onDraftChange,
  onAdd,
  onToggleHecho,
  readOnly = false,
}: SituacionCasaPanelProps) {
  const hechas = countCasaHechas(casaItems);
  const total = casaItems.length;
  const porTexto = groupCasaByTexto(casaItems);
  const conResultado = porTexto.filter(g => g.hechas > 0);

  const hechasDe = (texto: string) => porTexto.find(g => g.texto === texto)?.hechas ?? 0;

  const submitDraft = () => {
    const t = draft.trim();
    if (!t) return;
    onAdd(t);
    onDraftChange("");
  };

  return (
    <div className="flex flex-col items-stretch flex-shrink-0 min-w-0 w-full sm:w-auto">
      <div className="flex justify-end sm:justify-start">
        <button
          type="button"
          onClick={e => {
            e.stopPropagation();
            onToggleExpand();
          }}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[8px] font-bold flex-shrink-0 transition-all"
          style={{
            backgroundColor: hechas > 0 ? "rgba(34,197,94,0.1)" : total > 0 ? "rgba(148,163,184,0.12)" : "rgba(255,255,255,0.04)",
            color: hechas > 0 ? VERDE : total > 0 ? PLATA : "rgba(148,163,184,0.7)",
            border: `1px solid ${hechas > 0 ? "rgba(34,197,94,0.35)" : total > 0 ? "rgba(148,163,184,0.35)" : "rgba(148,163,184,0.15)"}`,
          }}
          title="Casa: ideas y acciones repetitivas (sin medir tiempo)"
          data-testid={`button-toggle-casa-${subTareaId}`}
        >
          <Home size={9} />
          Casa
          {hechas > 0 ? (
            <span className="font-mono tabular-nums" style={{ color: VERDE }}>
              ×{hechas}
            </span>
          ) : total > 0 ? (
            <span className="font-mono tabular-nums opacity-70">{total} pend.</span>
          ) : null}
          {expanded ? <ChevronUp size={8} /> : <ChevronDown size={8} />}
        </button>
      </div>

      {expanded && (
        <div
          className="px-2 pb-2 mt-1 rounded-lg"
          style={{ borderTop: "1px solid rgba(148,163,184,0.12)", backgroundColor: "rgba(255,255,255,0.02)" }}
          onClick={e => e.stopPropagation()}
        >
          <p className="text-[7px] text-slate-500 leading-snug pt-2 mb-1.5 px-0.5">
            Ideas y acciones repetitivas — sin cronómetro ni minutos. La cantidad hecha te motiva a seguir con lo mismo.
          </p>

          {conResultado.length > 0 && (
            <div
              className="mb-2 p-2 rounded-lg"
              style={{ backgroundColor: "rgba(34,197,94,0.06)", border: "1px solid rgba(34,197,94,0.2)" }}
              data-testid={`casa-resultado-${subTareaId}`}
            >
              <div className="flex items-baseline justify-between gap-2 mb-1.5">
                <span className="text-[7px] font-black uppercase tracking-wider" style={{ color: VERDE }}>
                  Tu resultado
                </span>
                <span className="text-[10px] font-black font-mono tabular-nums" style={{ color: GOLD }}>
                  {hechas} hecha{hechas === 1 ? "" : "s"}
                </span>
              </div>
              <div className="flex flex-wrap gap-1">
                {conResultado.map(g => (
                  <span
                    key={g.texto}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold"
                    style={{
                      backgroundColor: "rgba(34,197,94,0.12)",
                      color: VERDE,
                      border: "1px solid rgba(34,197,94,0.25)",
                    }}
                    title={`${g.hechas} de ${g.total} · ${g.texto}`}
                    data-testid={`casa-count-${subTareaId}-${g.texto.replace(/\s+/g, "-")}`}
                  >
                    <span className="truncate max-w-[120px]">{g.texto}</span>
                    <span className="font-mono tabular-nums" style={{ color: GOLD }}>
                      ×{g.hechas}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {!readOnly && (
            <>
              <div className="flex flex-wrap gap-1 mb-1.5">
                {CASA_SITUACION_PRESETS.map(preset => {
                  const n = hechasDe(preset);
                  return (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => onAdd(preset)}
                      className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[7px] font-bold uppercase tracking-wide transition-all hover:opacity-90"
                      style={{
                        backgroundColor: n > 0 ? "rgba(34,197,94,0.1)" : "rgba(148,163,184,0.1)",
                        color: n > 0 ? VERDE : PLATA,
                        border: `1px solid ${n > 0 ? "rgba(34,197,94,0.3)" : "rgba(148,163,184,0.25)"}`,
                      }}
                      data-testid={`casa-preset-${subTareaId}-${preset.replace(/\s+/g, "-")}`}
                    >
                      + {preset}
                      {n > 0 && (
                        <span className="font-mono tabular-nums normal-case" style={{ color: GOLD }}>
                          ×{n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-1.5 mb-1.5">
                <input
                  value={draft}
                  onChange={e => onDraftChange(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") submitDraft();
                  }}
                  placeholder="Idea o acción propia…"
                  className="flex-1 px-2 py-1 rounded bg-black/40 border text-white text-[9px] placeholder:text-slate-700 focus:outline-none"
                  style={{ borderColor: "rgba(148,163,184,0.25)", fontFamily: "JetBrains Mono, monospace" }}
                  data-testid={`input-casa-${subTareaId}`}
                />
                <button
                  type="button"
                  onClick={submitDraft}
                  disabled={!draft.trim()}
                  className="px-1.5 rounded transition-all disabled:opacity-30"
                  style={{ backgroundColor: "rgba(148,163,184,0.15)", color: PLATA }}
                  data-testid={`button-add-casa-${subTareaId}`}
                >
                  <Plus size={11} />
                </button>
              </div>
            </>
          )}

          {casaItems.length > 0 ? (
            <div className="space-y-1">
              {casaItems.map((d, dIdx) => {
                const rep = porTexto.find(g => g.texto === d.texto.trim());
                const repLabel = rep && rep.total > 1 ? `#${casaItems.slice(0, dIdx + 1).filter(x => x.texto.trim() === d.texto.trim()).length}` : null;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => !readOnly && !d.entregado && onToggleHecho(d.id)}
                    disabled={readOnly || d.entregado}
                    className="w-full flex items-center gap-2 p-1 rounded text-left transition-all"
                    style={{
                      backgroundColor: d.entregado ? "rgba(34,197,94,0.06)" : "rgba(255,255,255,0.03)",
                      cursor: d.entregado || readOnly ? "default" : "pointer",
                    }}
                    data-testid={`casa-item-${d.id}`}
                  >
                    <span
                      className="w-3 h-3 rounded border flex items-center justify-center flex-shrink-0"
                      style={{
                        borderColor: d.entregado ? VERDE : "rgba(148,163,184,0.4)",
                        backgroundColor: d.entregado ? `${VERDE}20` : "transparent",
                      }}
                    >
                      {d.entregado && <span className="text-[8px]" style={{ color: VERDE }}>?</span>}
                    </span>
                    <span className="text-[9px] w-3 flex-shrink-0 tabular-nums" style={{ color: PLATA }}>
                      {dIdx + 1}.
                    </span>
                    <span
                      className={`text-[9px] flex-1 min-w-0 leading-tight ${d.entregado ? "line-through text-slate-600" : "text-slate-300"}`}
                      style={{ fontFamily: "JetBrains Mono, monospace" }}
                    >
                      {d.texto}
                      {repLabel && (
                        <span className="ml-1 text-[7px] no-underline" style={{ color: "rgba(148,163,184,0.6)" }}>
                          {repLabel}
                        </span>
                      )}
                    </span>
                    {!d.entregado && !readOnly && (
                      <span className="text-[7px] flex-shrink-0" style={{ color: PLATA }}>
                        listo
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            !readOnly && (
              <p
                className="text-[8px] text-center py-1"
                style={{ color: "rgba(148,163,184,0.35)", fontFamily: "JetBrains Mono, monospace" }}
              >
                — sin ideas en la Casa —
              </p>
            )
          )}
        </div>
      )}
    </div>
  );
}
