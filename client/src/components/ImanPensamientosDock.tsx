import { useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, FlaskConical, Plus, Trash2 } from "lucide-react";
import {
  RUTA_TACTICA_META,
  RUTA_TACTICA_ORDER,
  getDefaultReservaRuta,
  setDefaultReservaRuta,
  type ReservaTacticaRuta,
  type SituacionReservaItem,
} from "@/lib/situacionReserva";
import {
  CRISOL_MOS_HINT,
  CRISOL_TAGLINE,
  CRISOL_TITLE,
  NIDO_INBOX_ID,
  agruparImanPorNido,
  imanItemsParaDesglosador,
  type ImanProyectoOpcion,
} from "@/lib/imanPensamientos";

type Props = {
  items: SituacionReservaItem[];
  proyectos: ImanProyectoOpcion[];
  defaultProyectoId?: string;
  onQuickAdd: (
    texto: string,
    ruta: ReservaTacticaRuta,
    proyectoId?: string
  ) => void | Promise<void>;
  onAbrirNido: (nidoId: string) => void | Promise<void>;
  onDelete: (reservaId: string) => void | Promise<void>;
  onRutaChange: (reservaId: string, ruta: ReservaTacticaRuta) => void | Promise<void>;
  colors: {
    plata: string;
    cyan: string;
    gold: string;
  };
  dockBottomPx?: number;
};

export default function ImanPensamientosDock({
  items,
  proyectos,
  defaultProyectoId = "",
  onQuickAdd,
  onAbrirNido,
  onDelete,
  onRutaChange,
  colors,
  dockBottomPx = 84,
}: Props) {
  const [open, setOpen] = useState(true);
  const [draft, setDraft] = useState("");
  const [rutaDraft, setRutaDraft] = useState<ReservaTacticaRuta>(() => getDefaultReservaRuta());
  const [proyectoDraft, setProyectoDraft] = useState(defaultProyectoId);
  const [adding, setAdding] = useState(false);
  const [abriendoNido, setAbriendoNido] = useState<string | null>(null);

  useEffect(() => {
    if (defaultProyectoId) setProyectoDraft(defaultProyectoId);
  }, [defaultProyectoId]);

  const nidos = useMemo(() => agruparImanPorNido(items, proyectos), [items, proyectos]);

  const preview = useMemo(() => {
    if (nidos.length === 0) return null;
    const first = nidos[0].items[0];
    if (!first) return null;
    const ruta = first.ruta ?? "ejecucion";
    return {
      nido: nidos[0].titulo,
      texto: first.texto,
      short: RUTA_TACTICA_META[ruta].short,
    };
  }, [nidos]);

  const submitQuickAdd = async () => {
    const texto = draft.trim();
    if (!texto || adding) return;
    setAdding(true);
    setDefaultReservaRuta(rutaDraft);
    try {
      await onQuickAdd(texto, rutaDraft, proyectoDraft || undefined);
      setDraft("");
    } catch {
      // El padre muestra toast; mantener draft para reintentar
    } finally {
      setAdding(false);
    }
  };

  const handleAbrirNido = async (nidoId: string) => {
    if (abriendoNido) return;
    setAbriendoNido(nidoId);
    try {
      await onAbrirNido(nidoId);
    } finally {
      setAbriendoNido(null);
    }
  };

  return (
    <div
      className="fixed left-0 right-0 z-40 pointer-events-none"
      style={{ bottom: dockBottomPx }}
      data-testid="iman-pensamientos-dock"
    >
      <div className="max-w-lg mx-auto px-4 pointer-events-auto">
        <div
          className="rounded-2xl border overflow-hidden shadow-[0_0_18px_rgba(148,163,184,0.12)]"
          style={{ backgroundColor: "rgba(10,10,10,0.94)", borderColor: "rgba(148,163,184,0.28)" }}
        >
          <button
            type="button"
            onClick={() => setOpen(v => !v)}
            className="w-full px-3 py-2 flex items-center gap-2"
            data-testid="iman-pensamientos-toggle"
          >
            <FlaskConical size={14} style={{ color: colors.plata }} />
            <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: colors.plata }}>
              {CRISOL_TITLE}
            </span>
            <span
              className="text-[9px] font-black px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "rgba(148,163,184,0.14)", color: colors.plata }}
              data-testid="iman-pensamientos-count"
            >
              {items.length}
            </span>
            {preview && !open && (
              <span className="ml-1 text-[8px] text-slate-500 truncate min-w-0">
                {preview.nido} · [{preview.short}] {preview.texto}
              </span>
            )}
            <span className="ml-auto text-slate-500">
              {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
            </span>
          </button>

          {open && (
            <div className="border-t px-3 pb-3 pt-2 space-y-2" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
              <p className="text-[7px] text-slate-500 leading-relaxed">{CRISOL_TAGLINE}</p>
              <p className="text-[7px] text-slate-600 leading-relaxed">{CRISOL_MOS_HINT}</p>

              <select
                value={proyectoDraft}
                onChange={e => setProyectoDraft(e.target.value)}
                className="w-full px-2 py-1.5 rounded-lg bg-black/40 border border-white/10 text-[9px] text-slate-300 focus:outline-none focus:border-white/25"
                data-testid="iman-proyecto-pick"
              >
                <option value="">Aterrizaje pendiente (sin nido)</option>
                {proyectos.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.etiqueta === "centro" ? "Centro" : "Proyecto"} · {p.titulo}
                  </option>
                ))}
              </select>

              <div className="flex gap-1">
                {RUTA_TACTICA_ORDER.map(r => {
                  const meta = RUTA_TACTICA_META[r];
                  const active = rutaDraft === r;
                  return (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRutaDraft(r)}
                      className="flex-1 py-1 rounded-lg border text-[8px] font-black uppercase"
                      style={{
                        borderColor: active ? colors.plata : "rgba(255,255,255,0.08)",
                        backgroundColor: active ? "rgba(148,163,184,0.12)" : "rgba(0,0,0,0.2)",
                        color: active ? colors.plata : "#64748b",
                      }}
                      title={meta.hint}
                      data-testid={`iman-ruta-pick-${r}`}
                    >
                      {meta.short}
                    </button>
                  );
                })}
              </div>

              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === "Enter") void submitQuickAdd();
                  }}
                  placeholder="Capturar pensamiento en el Crisol…"
                  className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-black/40 border border-white/10 text-[10px] text-white placeholder:text-slate-600 focus:outline-none focus:border-white/25"
                  data-testid="iman-pensamiento-input"
                />
                <button
                  type="button"
                  disabled={!draft.trim() || adding}
                  onClick={() => void submitQuickAdd()}
                  className="px-2.5 py-2 rounded-lg border flex items-center justify-center gap-1 disabled:opacity-40 min-w-[4.5rem]"
                  style={{ borderColor: `${colors.plata}40`, backgroundColor: `${colors.plata}12`, color: colors.plata }}
                  data-testid="iman-pensamiento-add"
                  aria-label="Guardar pensamiento"
                >
                  <Plus size={14} />
                  <span className="text-[8px] font-black uppercase">{adding ? "…" : "Aterrizar"}</span>
                </button>
              </div>

              <div className="max-h-56 overflow-y-auto space-y-2">
                {nidos.length === 0 ? (
                  <div
                    className="rounded-lg p-2 text-center"
                    style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.15)" }}
                  >
                    <p className="text-[9px] text-slate-500">Vacío — ordena aquí antes del Taller y el Ring.</p>
                  </div>
                ) : (
                  nidos.map(grupo => {
                    const ejecutables = imanItemsParaDesglosador(grupo.items);
                    const abriendo = abriendoNido === grupo.nidoId;
                    return (
                      <div
                        key={grupo.nidoId}
                        className="rounded-lg overflow-hidden"
                        style={{ backgroundColor: "rgba(255,255,255,0.03)", border: "1px solid rgba(148,163,184,0.15)" }}
                        data-testid={`iman-nido-${grupo.nidoId}`}
                      >
                        <div className="px-2 py-1.5 flex items-center gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                          <span
                            className="w-1.5 h-1.5 rounded-full shrink-0"
                            style={{ backgroundColor: grupo.color ?? colors.cyan }}
                          />
                          <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 truncate flex-1">
                            {grupo.etiqueta === "centro" ? "Centro" : grupo.nidoId === NIDO_INBOX_ID ? "" : "Proyecto"} ·{" "}
                            {grupo.titulo}
                          </span>
                          <span className="text-[8px] font-mono text-slate-600">{grupo.items.length}</span>
                          {ejecutables.length > 0 && (
                            <button
                              type="button"
                              disabled={abriendo}
                              onClick={() => void handleAbrirNido(grupo.nidoId)}
                              className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase disabled:opacity-50"
                              style={{
                                backgroundColor: "rgba(212,175,55,0.12)",
                                color: colors.gold,
                                border: "1px solid rgba(212,175,55,0.35)",
                              }}
                              data-testid={`iman-abrir-nido-${grupo.nidoId}`}
                            >
                              {abriendo ? "…" : "Abrir nido"}
                            </button>
                          )}
                        </div>
                        <div className="p-1.5 space-y-1">
                          {grupo.items.map(item => {
                            const itemRuta = item.ruta ?? "ejecucion";
                            return (
                              <div
                                key={item.id}
                                className="rounded-lg p-2 flex flex-col gap-1.5"
                                style={{ backgroundColor: "rgba(0,0,0,0.25)", border: "1px solid rgba(255,255,255,0.04)" }}
                                data-testid={`iman-item-${item.id}`}
                              >
                                <div className="flex items-start gap-2">
                                  <span
                                    className="text-[8px] font-black px-1 py-0.5 rounded shrink-0"
                                    style={{ backgroundColor: "rgba(148,163,184,0.12)", color: colors.plata }}
                                  >
                                    {RUTA_TACTICA_META[itemRuta].short}
                                  </span>
                                  <span className="text-[10px] text-slate-300 flex-1 min-w-0 leading-tight">{item.texto}</span>
                                  {item.minutosCupo != null && item.minutosCupo > 0 && (
                                    <span className="text-[7px] font-mono font-bold flex-shrink-0 text-slate-500">
                                      {item.minutosCupo}′
                                    </span>
                                  )}
                                </div>
                                {(item.segmentoNombre || item.origenVehiculoTitulo) && (
                                  <p className="text-[7px] text-slate-600 truncate pl-5">
                                    {item.segmentoNombre ? `seg: ${item.segmentoNombre}` : ""}
                                    {item.segmentoNombre && item.origenVehiculoTitulo ? " · " : ""}
                                    {item.origenVehiculoTitulo ? `de: ${item.origenVehiculoTitulo}` : ""}
                                  </p>
                                )}
                                <div className="flex flex-wrap gap-1 pl-5">
                                  {RUTA_TACTICA_ORDER.map(r => (
                                    <button
                                      key={r}
                                      type="button"
                                      onClick={() => void onRutaChange(item.id, r)}
                                      className="px-1 py-0.5 rounded text-[6px] font-black uppercase"
                                      style={{
                                        opacity: itemRuta === r ? 1 : 0.45,
                                        backgroundColor: itemRuta === r ? "rgba(148,163,184,0.15)" : "transparent",
                                        color: colors.plata,
                                        border: `1px solid ${itemRuta === r ? "rgba(148,163,184,0.35)" : "rgba(255,255,255,0.06)"}`,
                                      }}
                                      data-testid={`iman-ruta-${item.id}-${r}`}
                                    >
                                      {RUTA_TACTICA_META[r].short}
                                    </button>
                                  ))}
                                </div>
                                <div className="flex flex-wrap gap-1 pl-5">
                                  <button
                                    type="button"
                                    onClick={() => void onDelete(item.id)}
                                    className="px-1.5 py-0.5 rounded text-[7px] font-black uppercase ml-auto"
                                    style={{
                                      backgroundColor: "rgba(239,68,68,0.08)",
                                      color: "#f87171",
                                      border: "1px solid rgba(239,68,68,0.2)",
                                    }}
                                    data-testid={`iman-delete-${item.id}`}
                                  >
                                    <Trash2 size={9} className="inline mr-0.5" />
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
