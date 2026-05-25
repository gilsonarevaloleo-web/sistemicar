import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation, useSearch } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import {
  Layers,
  Plus,
  ChevronDown,
  ChevronUp,
  Clock,
  Flag,
  ArrowLeft,
  Trash2,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthContext } from "@/App";
import {
  getProyectos,
  getProyectoById,
  getPeldanosByProyecto,
  addProyecto,
  updateProyecto,
  addPeldanoIdea,
  deletePeldanoIdea,
  reorderPeldano,
  computeProyectoStats,
  subscribeToProyectos,
  buildLaunchUrl,
  type Proyecto,
  type ProyectoPeldano,
  type ProyectoEtiqueta,
} from "@/lib/proyectos";
import { RUTA_BANDA_META } from "@/lib/rutaEnfoque";

const PIZARRA = "#0a0a0a";
const CYAN = "#00FFC3";
const GOLD = "#D4AF37";
const PLATA = "#C0C0C0";
const NARANJA = "#F97316";

const PROYECTO_COLORS = ["#38BDF8", "#A855F7", "#F97316", "#10b981", "#D4AF37", "#f87171"];

function formatFecha(ts?: number) {
  if (!ts) return "�";
  return new Date(ts).toLocaleDateString("es-PE", { day: "numeric", month: "short" });
}

export default function ProyectosPage() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const detailId = params.get("id");

  const [proyectos, setProyectos] = useState<Proyecto[]>([]);
  const [proyecto, setProyecto] = useState<Proyecto | null>(null);
  const [peldanos, setPeldanos] = useState<ProyectoPeldano[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newTitulo, setNewTitulo] = useState("");
  const [newEtiqueta, setNewEtiqueta] = useState<ProyectoEtiqueta>("proyecto");
  const [newNota, setNewNota] = useState("");
  const [newIdeaTitulo, setNewIdeaTitulo] = useState("");
  const [expandedConq, setExpandedConq] = useState<string | null>(null);
  const [notaEdit, setNotaEdit] = useState("");

  const reloadList = useCallback(async () => {
    if (!user) return;
    setProyectos(await getProyectos(user.uid));
  }, [user]);

  const reloadDetail = useCallback(async () => {
    if (!user || !detailId) return;
    const [p, pel] = await Promise.all([
      getProyectoById(user.uid, detailId),
      getPeldanosByProyecto(user.uid, detailId),
    ]);
    setProyecto(p);
    setPeldanos(pel);
    setNotaEdit(p?.nota ?? "");
  }, [user, detailId]);

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    void reloadList().finally(() => setLoading(false));
    const unsub = subscribeToProyectos(user.uid, () => {
      void reloadList();
      if (detailId) void reloadDetail();
    });
    return unsub;
  }, [user, reloadList, reloadDetail, detailId]);

  useEffect(() => {
    if (detailId) void reloadDetail();
    else {
      setProyecto(null);
      setPeldanos([]);
    }
  }, [detailId, reloadDetail]);

  const stats = useMemo(() => computeProyectoStats(peldanos), [peldanos]);
  const ideas = useMemo(() => peldanos.filter(p => p.estado === "idea"), [peldanos]);
  const conquistados = useMemo(
    () =>
      peldanos
        .filter(p => p.estado === "conquistado")
        .sort((a, b) => (b.cerradoAt ?? 0) - (a.cerradoAt ?? 0)),
    [peldanos]
  );

  const handleCreateProyecto = async () => {
    if (!user || !newTitulo.trim()) return;
    const color = PROYECTO_COLORS[proyectos.length % PROYECTO_COLORS.length];
    const p = await addProyecto(user.uid, {
      titulo: newTitulo.trim(),
      etiqueta: newEtiqueta,
      nota: newNota.trim() || undefined,
      color,
      icono: newEtiqueta === "centro" ? "?" : "??",
    });
    setShowNew(false);
    setNewTitulo("");
    setNewNota("");
    navigate(`/proyectos?id=${p.id}`);
  };

  const handleAddIdea = async () => {
    if (!user || !detailId || !newIdeaTitulo.trim()) return;
    await addPeldanoIdea(user.uid, detailId, newIdeaTitulo.trim());
    setNewIdeaTitulo("");
    void reloadDetail();
  };

  const handleSaveNota = async () => {
    if (!user || !detailId) return;
    await updateProyecto(user.uid, detailId, { nota: notaEdit.trim() || undefined });
    void reloadDetail();
  };

  if (!user) {
    return (
      <div className="p-6 text-center text-slate-500 text-sm min-h-screen" style={{ backgroundColor: "#020202" }}>
        Inicia sesi&oacute;n para ver tus proyectos.
      </div>
    );
  }

  if (detailId && proyecto) {
    return (
      <div className="p-4 md:p-6 max-w-lg mx-auto min-h-screen pb-32" style={{ backgroundColor: "#020202" }}>
        <button
          onClick={() => navigate("/proyectos")}
          className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-4"
        >
          <ArrowLeft size={14} /> Todos los proyectos
        </button>

        <div
          className="p-4 rounded-2xl border mb-4"
          style={{ backgroundColor: PIZARRA, borderColor: `${proyecto.color ?? CYAN}40` }}
        >
          <div className="flex items-start justify-between gap-2">
            <div>
              <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500">
                {proyecto.etiqueta}
              </span>
              <h1 className="text-xl font-black text-white mt-0.5">{proyecto.titulo}</h1>
            </div>
            <span className="text-2xl">{proyecto.icono ?? "??"}</span>
          </div>
          <p className="text-[9px] text-slate-500 mt-3 leading-relaxed">
            Tu escalera, no tu deuda � cada pelda&ntilde;o es un desglosador real, no una promesa en papel.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-lg font-black text-white">{stats.conquistados}</p>
            <p className="text-[7px] uppercase text-slate-500 tracking-wider">Pelda&ntilde;os</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-lg font-black" style={{ color: RUTA_BANDA_META[stats.profundidadMaxima].color }}>
              {RUTA_BANDA_META[stats.profundidadMaxima].label}
            </p>
            <p className="text-[7px] uppercase text-slate-500 tracking-wider">Profundidad</p>
          </div>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
            <p className="text-lg font-black text-white">{stats.minutosTotales}</p>
            <p className="text-[7px] uppercase text-slate-500 tracking-wider">Min reg.</p>
          </div>
        </div>

        <div className="p-3 rounded-xl border border-white/10 mb-4" style={{ backgroundColor: PIZARRA }}>
          <p className="text-[9px] font-bold uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: GOLD }}>
            <Sparkles size={12} /> Por qu&eacute; te emociona
          </p>
          <textarea
            value={notaEdit}
            onChange={e => setNotaEdit(e.target.value)}
            onBlur={() => void handleSaveNota()}
            placeholder="Ej: Cada bloque de costura me deja m&aacute;s tiempo libre al atardecer�"
            className="w-full bg-transparent text-[11px] text-slate-300 placeholder:text-slate-600 resize-none min-h-[60px] focus:outline-none"
          />
        </div>

        <div className="mb-4">
          <p className="text-[10px] font-black uppercase tracking-widest mb-2" style={{ color: CYAN }}>
            Desglosar ideas
          </p>
          <div className="flex gap-2 mb-3">
            <input
              value={newIdeaTitulo}
              onChange={e => setNewIdeaTitulo(e.target.value)}
              placeholder="Nueva idea / bloque�"
              className="flex-1 px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-sm text-white placeholder:text-slate-600 focus:outline-none"
              onKeyDown={e => e.key === "Enter" && void handleAddIdea()}
            />
            <button
              onClick={() => void handleAddIdea()}
              className="px-3 py-2 rounded-lg font-bold"
              style={{ backgroundColor: `${CYAN}20`, color: CYAN, border: `1px solid ${CYAN}40` }}
            >
              <Plus size={16} />
            </button>
          </div>

          <div className="space-y-2">
            {ideas.length === 0 && (
              <p className="text-[10px] text-slate-600 text-center py-4">
                A&ntilde;ade ideas opcionales � no son deuda, son pelda&ntilde;os posibles.
              </p>
            )}
            {ideas.map(pel => (
              <div
                key={pel.id}
                className="p-3 rounded-xl border border-white/10"
                style={{ backgroundColor: "rgba(255,255,255,0.03)" }}
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-sm font-bold text-white">{pel.titulo}</span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => void reorderPeldano(user!.uid, detailId, pel.id, "up")}
                      className="p-1 text-slate-500 hover:text-white"
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      onClick={() => void reorderPeldano(user!.uid, detailId, pel.id, "down")}
                      className="p-1 text-slate-500 hover:text-white"
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      onClick={() => void deletePeldanoIdea(user!.uid, pel.id).then(() => reloadDetail())}
                      className="p-1 text-slate-600 hover:text-red-400"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => navigate(buildLaunchUrl(detailId, pel.id, "desglosador_tiempo"))}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase"
                    style={{ backgroundColor: `${NARANJA}15`, color: NARANJA, border: `1px solid ${NARANJA}35` }}
                  >
                    <Clock size={12} /> Tiempo
                  </button>
                  <button
                    onClick={() => navigate(buildLaunchUrl(detailId, pel.id, "desglosador_situacion"))}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[9px] font-bold uppercase"
                    style={{ backgroundColor: `${PLATA}15`, color: PLATA, border: `1px solid ${PLATA}35` }}
                  >
                    <Flag size={12} /> Situaci&oacute;n
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-1.5" style={{ color: GOLD }}>
            <TrendingUp size={12} /> Tu escalera � conquistados
          </p>
          {conquistados.length === 0 ? (
            <p className="text-[10px] text-slate-600 text-center py-6 border border-dashed border-white/10 rounded-xl">
              Lanza un desglosador y ci&eacute;rralo � aqu&iacute; aparecer&aacute; tu progreso real.
            </p>
          ) : (
            <div className="space-y-2">
              {conquistados.map((pel, i) => (
                <div
                  key={pel.id}
                  className="rounded-xl border overflow-hidden"
                  style={{ borderColor: `${GOLD}25`, backgroundColor: PIZARRA }}
                >
                  <button
                    className="w-full p-3 flex items-center justify-between text-left"
                    onClick={() => setExpandedConq(expandedConq === pel.id ? null : pel.id)}
                  >
                    <div>
                      <p className="text-[8px] text-slate-500 uppercase">
                        Pelda&ntilde;o {conquistados.length - i} � {formatFecha(pel.cerradoAt)} � {pel.tipoOrigen ?? "�"}
                      </p>
                      <p className="text-sm font-bold text-white">{pel.titulo}</p>
                    </div>
                    {expandedConq === pel.id ? (
                      <ChevronUp size={14} className="text-slate-500 shrink-0" />
                    ) : (
                      <ChevronDown size={14} className="text-slate-500 shrink-0" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedConq === pel.id && pel.resumen && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden border-t border-white/5"
                      >
                        <div className="p-3 text-[10px] text-slate-400 space-y-1">
                          {pel.resumen.subsCumplidos != null && (
                            <p>
                              Bloques: {pel.resumen.subsCumplidos}/{pel.resumen.subsTotal} �{" "}
                              {pel.resumen.duracionMin ?? 0} min � {pel.resumen.psGanados ?? 0} PS
                            </p>
                          )}
                          {pel.resumen.subResumen?.map((s, j) => (
                            <p key={j} className="pl-2 text-slate-500">
                              ? {s.titulo} ({s.status})
                            </p>
                          ))}
                          {pel.resumen.subTareasResumen?.map((s, j) => (
                            <p key={j} className="pl-2 text-slate-500">
                              ? {s.texto} ({s.resultado ?? "�"})
                            </p>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 max-w-lg mx-auto min-h-screen pb-32" style={{ backgroundColor: "#020202" }}>
      <header className="mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Hub de Proyectos</p>
        <h1 className="text-2xl font-black text-white flex items-center gap-2">
          <Layers size={22} style={{ color: CYAN }} />
          Proyectos y Centros
        </h1>
        <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
          Construye tu futuro pelda&ntilde;o a pelda&ntilde;o. Sin calendario. Sin semana que traiciona.
        </p>
      </header>

      <button
        onClick={() => setShowNew(true)}
        className="w-full mb-4 py-3 rounded-xl font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-2"
        style={{ backgroundColor: `${CYAN}15`, color: CYAN, border: `1px solid ${CYAN}40` }}
      >
        <Plus size={16} /> Nuevo proyecto o centro
      </button>

      <AnimatePresence>
        {showNew && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="p-4 rounded-xl border border-white/10 mb-4 space-y-3"
            style={{ backgroundColor: PIZARRA }}
          >
            <input
              value={newTitulo}
              onChange={e => setNewTitulo(e.target.value)}
              placeholder="Nombre (ej: Costura, Salud�)"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-white text-sm focus:outline-none"
            />
            <div className="flex gap-2">
              {(["proyecto", "centro"] as const).map(e => (
                <button
                  key={e}
                  onClick={() => setNewEtiqueta(e)}
                  className={cn(
                    "flex-1 py-2 rounded-lg text-[9px] font-bold uppercase",
                    newEtiqueta === e ? "text-white" : "text-slate-500"
                  )}
                  style={
                    newEtiqueta === e
                      ? { backgroundColor: `${CYAN}25`, border: `1px solid ${CYAN}50` }
                      : { border: "1px solid rgba(255,255,255,0.08)" }
                  }
                >
                  {e}
                </button>
              ))}
            </div>
            <textarea
              value={newNota}
              onChange={e => setNewNota(e.target.value)}
              placeholder="Opcional: qu&eacute; tiempo te libera esto�"
              className="w-full px-3 py-2 rounded-lg bg-black/40 border border-white/10 text-slate-300 text-[11px] resize-none min-h-[50px] focus:outline-none"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowNew(false)} className="flex-1 py-2 text-[10px] font-bold text-slate-500">
                Cancelar
              </button>
              <button
                onClick={() => void handleCreateProyecto()}
                className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase"
                style={{ backgroundColor: CYAN, color: "#000" }}
              >
                Crear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <p className="text-center text-slate-600 text-sm py-8">Cargando�</p>
      ) : proyectos.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-white/10 rounded-xl">
          <Layers size={32} className="mx-auto mb-3 text-slate-600" />
          <p className="text-sm text-slate-500">Sin proyectos a&uacute;n</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proyectos.map(p => (
            <button
              key={p.id}
              onClick={() => navigate(`/proyectos?id=${p.id}`)}
              className="w-full p-4 rounded-xl border text-left transition-all hover:scale-[1.01]"
              style={{ backgroundColor: PIZARRA, borderColor: `${p.color ?? CYAN}30` }}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[8px] font-bold uppercase text-slate-500">{p.etiqueta}</span>
                  <p className="text-base font-black text-white">{p.titulo}</p>
                </div>
                <span className="text-xl">{p.icono ?? "??"}</span>
              </div>
              <div className="flex gap-4 mt-3 text-[9px] font-bold uppercase tracking-wider">
                <span style={{ color: GOLD }}>{p.peldanosConquistados} pelda&ntilde;os</span>
                {p.profundidadMaxima && (
                  <span style={{ color: RUTA_BANDA_META[p.profundidadMaxima].color }}>
                    {RUTA_BANDA_META[p.profundidadMaxima].label}
                  </span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
