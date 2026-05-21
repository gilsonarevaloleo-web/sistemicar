import { useState, useEffect, useRef, Component, type ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Sprout,
  Wand2,
  Copy,
  Check,
  Loader2,
  BookOpen,
  Video,
  Search,
  ChevronDown,
  ArrowLeft,
  Sparkles,
  FileText,
  Hash,
  History,
  BarChart3,
  Eye,
  Download,
  BookMarked,
  AlertCircle,
  Factory,
  Zap,
  Youtube,
  Send,
  MessageSquare,
  Trash2,
  Library,
  Layers,
  Edit3,
  CheckCircle2,
  RefreshCw,
  Maximize2,
  X
} from "lucide-react";
import { toast } from "sonner";
import { useAuthContext } from "@/App";
import { auth } from "@/lib/firebase";
import { getIdToken } from "firebase/auth";
import { addSemilla, subscribeToSemillas, subscribeToEspejoSessions, subscribeToAllProspectos, addLoteFabrica, subscribeToLotesFabrica, addLoteMasterclass, subscribeToLotesMasterclass, addSingleMasterclass, subscribeToSingleMasterclasses, updateMasterclassVideoUrl, addSinglePieza, subscribeToSinglePiezas, saveSubInterfacesLibro, subscribeToSubInterfacesLibro, saveCapituloCarrilesLibro, saveCapituloStatusLibro, subscribeToCapitulosLibro, subscribeToAllSubInterfacesLibro, subscribeToAllCapitulosLibro, saveNotasEvolucionLibro, subscribeToNotasEvolucionLibro, type NotaEvolucion, type Semilla, type Prospecto, type LoteFabrica, type PiezaSensorial, type LoteMasterclass, type MasterclassYT, type SubInterfazLibro, type CapituloCarriles, type FichaAuditResult, type RouterMeta } from "@/lib/persistence";
import PreviewSensorial from "@/components/fabrica/PreviewSensorial";
import PreviewMasterclass from "@/components/fabrica/PreviewMasterclass";

const GOLD = "#D4AF37";
const DARK_BG = "#050505";
const CARD_BG = "#0a0a0a";
const BORDER_GOLD = `${GOLD}30`;

const INTERFACES = [
  { id: "M01", nombre: "El Suelo de Cristal", falla: "Falla de Territorio" },
  { id: "M02", nombre: "La Sequía Eterna", falla: "Falla de Flujo" },
  { id: "M03", nombre: "La Hormiga ante el Gigante", falla: "Falla de Poder" },
  { id: "M04", nombre: "El Latido de la Carencia", falla: "Falla de Resonancia" },
  { id: "M05", nombre: "El Nudo de la Invisibilidad", falla: "Falla de Emisión" },
  { id: "M06", nombre: "La Visión de Túnel", falla: "Falla de Estrategia" },
  { id: "M07", nombre: "El Abogado de la Pobreza", falla: "Falla de Procesamiento" },
  { id: "M08", nombre: "El Heredero Desposeído", falla: "Falla de Autoridad" },
  { id: "M09", nombre: "El Nodo Aislado", falla: "Falla de Resonancia Mórfica" },
  { id: "M10", nombre: "El Reboot del Soberano", falla: "Integración Total" },
];

const TITULOS_LIBROS: Record<string, string> = {
  M01: "El Espejo del Mendigo",
  M02: "El Espejo del Portador",
  M03: "El Espejo del Operario",
  M04: "El Espejo del Estratega",
  M05: "El Espejo del Socio",
  M06: "El Espejo del Capital",
  M07: "El Espejo del Visionario",
  M08: "El Espejo del Arquitecto",
  M09: "El Espejo del Patriarca",
  M10: "El Espejo del Soberano",
};

const ESCALERA_VOLTAJE_UI: Record<string, Record<string, number>> = {
  M01: { ARENA: 2,   MADERA: 4,   HIERRO: 6,   HORMIGON: 8   },
  M02: { ARENA: 2,   MADERA: 4,   HIERRO: 8,   HORMIGON: 16  },
  M03: { ARENA: 16,  MADERA: 32,  HIERRO: 48,  HORMIGON: 64  },
  M04: { ARENA: 64,  MADERA: 80,  HIERRO: 96,  HORMIGON: 112 },
  M05: { ARENA: 112, MADERA: 128, HIERRO: 144, HORMIGON: 160 },
  M06: { ARENA: 160, MADERA: 176, HIERRO: 192, HORMIGON: 208 },
  M07: { ARENA: 208, MADERA: 224, HIERRO: 240, HORMIGON: 256 },
  M08: { ARENA: 256, MADERA: 272, HIERRO: 288, HORMIGON: 304 },
  M09: { ARENA: 304, MADERA: 320, HIERRO: 336, HORMIGON: 352 },
  M10: { ARENA: 352, MADERA: 368, HIERRO: 384, HORMIGON: 400 },
};

function getGradoCapitulo(orden: number): { key: string; label: string; gNum: number; color: string } {
  if (orden <= 3)  return { key: "ARENA",    label: "Arena",    gNum: 1, color: "#00FFC3" };
  if (orden <= 6)  return { key: "MADERA",   label: "Madera",   gNum: 2, color: "#D4AF37" };
  if (orden <= 9)  return { key: "HIERRO",   label: "Hierro",   gNum: 3, color: "#F97316" };
  return              { key: "HORMIGON", label: "Hormigón", gNum: 4, color: "#FF3131" };
}

type TabType = "capitulo" | "guiones" | "keywords";

interface SemillaResult {
  capitulo: string;
  guiones: { titulo: string; hook: string; valor: string; cta: string }[];
  keywords_seo: string[];
}

class SemillasErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; errorMessage: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, errorMessage: "" };
  }
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, errorMessage: error?.message || "Error desconocido" };
  }
  componentDidCatch(error: Error, errorInfo: any) {
    console.error("AdminSemillas Error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#0a0a0f" }}>
          <div className="text-center space-y-4 max-w-sm px-4">
            <AlertCircle className="w-12 h-12 mx-auto" style={{ color: "#d4a017" }} />
            <p className="text-lg font-bold" style={{ color: "#d4a017" }} data-testid="text-error-boundary">
              Ocurrió un error inesperado
            </p>
            <p className="text-xs text-red-400 break-words" data-testid="text-error-detail">
              {this.state.errorMessage}
            </p>
            <button
              data-testid="button-error-back"
              onClick={() => window.history.back()}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: "#d4a017", color: "#0a0a0f" }}
            >
              Volver atrás
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function AdminSemillasInner() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);

  useEffect(() => {
    if (user) return;
    const timer = setTimeout(() => setLoadingTimedOut(true), 8000);
    return () => clearTimeout(timer);
  }, [user]);

  const [semilla, setSemilla] = useState("");
  const [interfazSeleccionada, setInterfazSeleccionada] = useState("M01");
  const [showDropdown, setShowDropdown] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<SemillaResult | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("capitulo");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [historial, setHistorial] = useState<Semilla[]>([]);
  const [showHistorial, setShowHistorial] = useState(false);
  const [showMetricas, setShowMetricas] = useState(false);
  const [espejoCount, setEspejoCount] = useState(0);
  const [viewingSemilla, setViewingSemilla] = useState<Semilla | null>(null);
  const [prospectos, setProspectos] = useState<Prospecto[]>([]);
  const [generatingPolos, setGeneratingPolos] = useState(false);
  const [generatingContraportada, setGeneratingContraportada] = useState(false);
  const [polosResult, setPolosResult] = useState<any[] | null>(null);
  const [contraportadasResult, setContraportadasResult] = useState<any[] | null>(null);
  const [showPolosSection, setShowPolosSection] = useState(false);
  const [showLibroPreview, setShowLibroPreview] = useState(false);
  const [generatingDiagnostico, setGeneratingDiagnostico] = useState(false);
  const [diagnosticoResult, setDiagnosticoResult] = useState<any[] | null>(null);
  const [showFabrica, setShowFabrica] = useState(false);
  const [generatingLote, setGeneratingLote] = useState(false);
  const [lotesFabrica, setLotesFabrica] = useState<LoteFabrica[]>([]);
  const [previewPieza, setPreviewPieza] = useState<PiezaSensorial | null>(null);
  const [showYouTube, setShowYouTube] = useState(false);
  const [generatingMasterclass, setGeneratingMasterclass] = useState(false);
  const [lotesMasterclass, setLotesMasterclass] = useState<LoteMasterclass[]>([]);
  const [previewMasterclass, setPreviewMasterclass] = useState<MasterclassYT | null>(null);
  const [generatingMcSingle, setGeneratingMcSingle] = useState<Record<string, boolean>>({});
  const [singleMasterclasses, setSingleMasterclasses] = useState<MasterclassYT[]>([]);
  const [generatingPiezaSingle, setGeneratingPiezaSingle] = useState<Record<string, boolean>>({});
  const [singlePiezas, setSinglePiezas] = useState<PiezaSensorial[]>([]);
  const [renderingVideo, setRenderingVideo] = useState<Record<string, string>>({});
  const [renderedVideos, setRenderedVideos] = useState<Record<string, { downloadUrl: string; filename: string }>>({});
  const [renderingMcYT, setRenderingMcYT] = useState<Record<string, boolean>>({});
  const [renderedMcYT, setRenderedMcYT] = useState<Record<string, { downloadUrl: string; filename: string }>>({});
  const [renderYTElapsed, setRenderYTElapsed] = useState<Record<string, number>>({});
  const pollIntervalsYT = useRef<Record<string, ReturnType<typeof setInterval>>>({});

  type ChatMsg = { role: "user" | "assistant"; content: string };
  const [showEstrategia, setShowEstrategia] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // === TALLER DE LIBROS STATE ===
  const [showTaller, setShowTaller] = useState(false);
  const [tallerInterfaz, setTallerInterfaz] = useState<string | null>(null);
  const [tallerSubInterfaces, setTallerSubInterfaces] = useState<SubInterfazLibro[]>([]);
  const [tallerCapitulos, setTallerCapitulos] = useState<Record<string, CapituloCarriles>>({});
  const [generandoSubInterfaces, setGenerandoSubInterfaces] = useState(false);
  const [generandoCapitulo, setGenerandoCapitulo] = useState<Record<string, boolean>>({});
  const [expandedCapitulo, setExpandedCapitulo] = useState<string | null>(null);
  const [editandoCarriles, setEditandoCarriles] = useState<Record<string, { c1: string; c2: string; c3: string }>>({});
  const [tallerAllSubs, setTallerAllSubs] = useState<Record<string, SubInterfazLibro[]>>({});
  const [tallerAllCaps, setTallerAllCaps] = useState<Record<string, CapituloCarriles>>({});
  const [instruccionesPrevias, setInstruccionesPrevias] = useState<Record<string, string>>({});
  const [criterioRegen, setCriterioRegen] = useState<Record<string, string>>({});
  const [mostrandoCriterio, setMostrandoCriterio] = useState<Record<string, boolean>>({});
  const [tallerNotas, setTallerNotas] = useState<Record<string, { coordenada: string; notas: NotaEvolucion[] }>>({});
  const [editingNota, setEditingNota] = useState<{ subId: string; noteIndex: number; titulo: string; cuerpo: string } | null>(null);
  const [tallerVista, setTallerVista] = useState<"capitulos" | "evolucion">("capitulos");
  const [showEvolucionCompleta, setShowEvolucionCompleta] = useState(false);
  const [expandedNotas, setExpandedNotas] = useState<Record<string, boolean>>({});
  const [inyectarNotasEvolucion, setInyectarNotasEvolucion] = useState(true);
  const [fichaAuditMap, setFichaAuditMap] = useState<Record<string, Record<string, { materialFound: boolean; ganchoFound: boolean; passed: boolean; retried: boolean }>>>({});
  const [notasInyectadasMap, setNotasInyectadasMap] = useState<Record<string, number>>({});
  const tallerAllCapsRef = useRef<Record<string, CapituloCarriles>>({});

  type ApiKeyRecord = {
    id: number;
    client_name: string;
    key_prefix: string;
    active: boolean;
    created_at: string;
    usage_count: number;
    buyer_email?: string | null;
    plan_id?: string | null;
    monthly_call_limit?: number | null;
    expires_at?: string | null;
    delivery_status?: string | null;
  };
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKeyRecord[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [revealedApiKey, setRevealedApiKey] = useState<{ key: string; clientName: string } | null>(null);
  const [revokingKeyId, setRevokingKeyId] = useState<number | null>(null);

  useEffect(() => {
    if (!user?.uid) return;
    const unsubs: (() => void)[] = [];
    try { unsubs.push(subscribeToSemillas(user.uid, (data) => setHistorial(data || []), console.error)); } catch (e) { console.error("Sub semillas error:", e); }
    try { unsubs.push(subscribeToEspejoSessions(user.uid, (sessions) => setEspejoCount((sessions || []).length), console.error)); } catch (e) { console.error("Sub espejo error:", e); }
    try { unsubs.push(subscribeToAllProspectos((data) => setProspectos(data || []), console.error)); } catch (e) { console.error("Sub prospectos error:", e); }
    try { unsubs.push(subscribeToLotesFabrica(user.uid, (data) => setLotesFabrica(data || []), console.error)); } catch (e) { console.error("Sub fabrica error:", e); }
    try { unsubs.push(subscribeToLotesMasterclass(user.uid, (data) => setLotesMasterclass(data || []), console.error)); } catch (e) { console.error("Sub masterclass error:", e); }
    try {
      unsubs.push(subscribeToSingleMasterclasses(user.uid, (data) => {
        setSingleMasterclasses(data || []);
        // Repopulate renderedMcYT from Firebase-stored permanent URLs
        const savedUrls: Record<string, { downloadUrl: string; filename: string }> = {};
        for (const mc of (data || [])) {
          if (mc.video_url?.startsWith("https://firebasestorage.googleapis.com")) {
            const filename = `Masterclass_YT_Sistemicar_${mc.interfaz}.mp4`;
            savedUrls[mc.interfaz] = { downloadUrl: mc.video_url, filename };
          }
        }
        if (Object.keys(savedUrls).length > 0) {
          setRenderedMcYT(prev => ({ ...savedUrls, ...prev }));
        }
        // Also check localStorage fallback
        try {
          const localUrls = JSON.parse(localStorage.getItem("sistemicar_mc_video_urls") || "{}");
          const localMapped: Record<string, { downloadUrl: string; filename: string }> = {};
          for (const [interfazId, url] of Object.entries(localUrls)) {
            if (typeof url === "string" && url.startsWith("https://firebasestorage.googleapis.com")) {
              localMapped[interfazId] = { downloadUrl: url, filename: `Masterclass_YT_Sistemicar_${interfazId}.mp4` };
            }
          }
          if (Object.keys(localMapped).length > 0) {
            setRenderedMcYT(prev => ({ ...localMapped, ...prev }));
          }
        } catch {}
      }, console.error));
    } catch (e) { console.error("Sub mc singles error:", e); }
    try { unsubs.push(subscribeToSinglePiezas(user.uid, (data) => setSinglePiezas(data || []), console.error)); } catch (e) { console.error("Sub pieza singles error:", e); }
    try { unsubs.push(subscribeToAllSubInterfacesLibro(user.uid, (data) => setTallerAllSubs(data || {}), console.error)); } catch (e) { console.error("Sub taller subs error:", e); }
    try {
      unsubs.push(subscribeToAllCapitulosLibro(user.uid, (data) => {
        tallerAllCapsRef.current = data || {};
        setTallerAllCaps(data || {});
      }, console.error));
    } catch (e) { console.error("Sub taller caps error:", e); }
    fetch("/api/fabrica-sensorial/rendered-videos")
      .then(r => r.json())
      .then(data => {
        const map: Record<string, { downloadUrl: string; filename: string }> = {};
        for (const v of (data.videos || [])) {
          if (v.interfaz) map[v.interfaz] = { downloadUrl: v.downloadUrl, filename: v.filename };
        }
        setRenderedVideos(map);
      })
      .catch(() => {});
    return () => { unsubs.forEach(fn => { try { fn(); } catch {} }); };
  }, [user?.uid]);

  // Subscribe to selected interface sub-interfaces, chapters, and notas de evolución
  useEffect(() => {
    if (!user?.uid || !tallerInterfaz) return;
    const preloaded: Record<string, Record<string, FichaAuditResult>> = {};
    for (const cap of Object.values(tallerAllCapsRef.current)) {
      if (cap.interfazId === tallerInterfaz && cap.fichaAudit && cap.subInterfazId) {
        preloaded[cap.subInterfazId] = cap.fichaAudit;
      }
    }
    setFichaAuditMap(preloaded);
    const unsubs: (() => void)[] = [];
    try {
      unsubs.push(subscribeToSubInterfacesLibro(user.uid, tallerInterfaz, (data) => setTallerSubInterfaces(data || []), console.error));
    } catch (e) { console.error("Sub taller interfaz subs:", e); }
    try {
      unsubs.push(subscribeToCapitulosLibro(user.uid, tallerInterfaz, (data) => {
        setTallerCapitulos(data || {});
        const restoredAudit: Record<string, Record<string, { materialFound: boolean; ganchoFound: boolean; passed: boolean; retried: boolean }>> = {};
        for (const [subId, cap] of Object.entries(data || {})) {
          if (cap.fichaAudit) restoredAudit[subId] = cap.fichaAudit;
        }
        if (Object.keys(restoredAudit).length > 0) {
          setFichaAuditMap(prev => ({ ...prev, ...restoredAudit }));
        }
      }, console.error));
    } catch (e) { console.error("Sub taller interfaz caps:", e); }
    try {
      unsubs.push(subscribeToNotasEvolucionLibro(user.uid, tallerInterfaz, (data) => setTallerNotas(data || {}), console.error));
    } catch (e) { console.error("Sub taller notas:", e); }
    return () => { unsubs.forEach(fn => { try { fn(); } catch {} }); };
  }, [user?.uid, tallerInterfaz]);

  const handleGenerarSubInterfaces = async () => {
    if (!tallerInterfaz || !user?.uid) return;
    setGenerandoSubInterfaces(true);
    try {
      let idToken = "";
      if (auth?.currentUser) idToken = await getIdToken(auth.currentUser, false).catch(() => "");
      const res = await fetch("/api/taller-libros/generar-subinterfaces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ interfazId: tallerInterfaz, tituloLibro: TITULOS_LIBROS[tallerInterfaz] || tallerInterfaz }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error generando sub-interfaces");
      }
      const data = await res.json();
      const subs: SubInterfazLibro[] = data.subInterfaces || [];
      await saveSubInterfacesLibro(user.uid, tallerInterfaz, subs);
      setTallerSubInterfaces(subs);
      toast.success(`10 capítulos para ${tallerInterfaz} generados`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch (e: any) {
      toast.error(e.message || "Error generando estructura del libro");
    } finally {
      setGenerandoSubInterfaces(false);
    }
  };

  const handleGenerarCapitulo = async (sub: SubInterfazLibro, criterio?: string) => {
    if (!tallerInterfaz || !user?.uid) return;
    setGenerandoCapitulo(prev => ({ ...prev, [sub.id]: true }));
    await saveCapituloStatusLibro(user.uid, tallerInterfaz, sub.id, "generando", sub.titulo).catch(() => {});
    const capActual = tallerCapitulos[sub.id];
    try {
      let idToken = "";
      if (auth?.currentUser) idToken = await getIdToken(auth.currentUser, false).catch(() => "");
      const res = await fetch("/api/taller-libros/generar-capitulo", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({
          interfazId: tallerInterfaz,
          tituloLibro: TITULOS_LIBROS[tallerInterfaz] || tallerInterfaz,
          subInterfazId: sub.id,
          subInterfazOrden: sub.orden,
          subInterfazTitulo: sub.titulo,
          subInterfazFalla: sub.falla,
          subInterfazDescripcion: sub.descripcion,
          instruccionesPrevias: instruccionesPrevias[sub.id] || "",
          criterioRegeneracion: criterio || "",
          contenidoActual: criterio && capActual ? {
            carril1: capActual.carril1,
            carril2: capActual.carril2,
            carril3: capActual.carril3,
          } : undefined,
          notasEvolucionPrevias: (() => {
            if (!inyectarNotasEvolucion) return [];
            const capOrden = typeof sub.orden === "number" ? sub.orden : parseInt(String(sub.orden || "1"), 10) || 1;
            const subsPrevias = tallerSubInterfaces.filter(s => {
              const o = typeof s.orden === "number" ? s.orden : parseInt(String(s.orden || "1"), 10) || 1;
              return o < capOrden;
            });
            const notas: { coordenada: string; tipo: string; titulo: string; cuerpo: string }[] = [];
            subsPrevias.forEach(s => {
              const entry = tallerNotas[s.id];
              if (entry) {
                entry.notas.forEach(n => notas.push({ coordenada: entry.coordenada, tipo: n.tipo, titulo: n.titulo, cuerpo: n.cuerpo }));
              }
            });
            return notas;
          })(),
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error generando capítulo");
      }
      const data = await res.json();
      const routerMeta: RouterMeta | undefined = data.cerebro_router
        ? {
            cerebro_router: true,
            promptTokens: data.promptTokens,
            contaminationAudit: data.contaminationAudit,
          }
        : undefined;
      await saveCapituloCarrilesLibro(user.uid, tallerInterfaz, sub.id, {
        subInterfazTitulo: sub.titulo,
        carril1: data.carril1,
        carril2: data.carril2,
        carril3: data.carril3,
      }, data.fichaAudit || undefined, data.cerebro_v2 || data.cerebro_router || false, routerMeta);
      if (data.notasEvolucion && data.notasEvolucion.length > 0) {
        saveNotasEvolucionLibro(user.uid, tallerInterfaz, sub.id, data.coordenada, data.notasEvolucion).catch(() => {});
      }
      if (data.fichaAudit) {
        setFichaAuditMap(prev => ({ ...prev, [sub.id]: data.fichaAudit }));
      }
      if (typeof data.notasEvolucionInyectadas === "number") {
        setNotasInyectadasMap(prev => {
          const next = { ...prev };
          if (data.notasEvolucionInyectadas > 0) {
            next[sub.id] = data.notasEvolucionInyectadas;
          } else {
            delete next[sub.id];
          }
          return next;
        });
      }
      if (criterio) {
        setCriterioRegen(prev => { const n = { ...prev }; delete n[sub.id]; return n; });
        setMostrandoCriterio(prev => ({ ...prev, [sub.id]: false }));
        toast.success(`Capítulo "${sub.titulo}" regenerado con criterio`, { style: { backgroundColor: CARD_BG, border: `1px solid #FF3131`, color: "#FF3131" } });
      } else {
        const pt = routerMeta?.promptTokens;
        const routerMsg = pt
          ? ` · Router C1 ~${pt.c1 >= 1000 ? `${(pt.c1 / 1000).toFixed(1)}k` : pt.c1} / C3 ~${pt.c3 >= 1000 ? `${(pt.c3 / 1000).toFixed(1)}k` : pt.c3} tok`
          : "";
        toast.success(`Capítulo "${sub.titulo}" generado${routerMsg}`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
      }
      setExpandedCapitulo(sub.id);
    } catch (e: any) {
      await saveCapituloStatusLibro(user.uid, tallerInterfaz, sub.id, "pendiente", sub.titulo).catch(() => {});
      toast.error(e.message || "Error generando capítulo");
    } finally {
      setGenerandoCapitulo(prev => ({ ...prev, [sub.id]: false }));
    }
  };

  const handleResetFichaAudit = async (subId: string, carrilKey?: "carril1" | "carril2" | "carril3") => {
    if (!user?.uid || !tallerInterfaz) return;
    const cap = tallerCapitulos[subId];
    if (!cap) return;
    let newAudit: Record<string, FichaAuditResult>;
    if (carrilKey) {
      newAudit = { ...(fichaAuditMap[subId] || {}) };
      delete newAudit[carrilKey];
    } else {
      newAudit = {};
    }
    setFichaAuditMap(prev => {
      const updated = { ...prev };
      if (Object.keys(newAudit).length === 0) {
        delete updated[subId];
      } else {
        updated[subId] = newAudit;
      }
      return updated;
    });
    try {
      await saveCapituloCarrilesLibro(user.uid, tallerInterfaz, subId, {
        subInterfazTitulo: cap.subInterfazTitulo,
        carril1: cap.carril1,
        carril2: cap.carril2,
        carril3: cap.carril3,
      }, Object.keys(newAudit).length > 0 ? newAudit : undefined);
      toast.success("Auditoría FICHA limpiada", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch {
      toast.error("Error limpiando auditoría");
    }
  };

  const getAdminHeaders = async (): Promise<Record<string, string>> => {
    const idToken = auth?.currentUser ? await getIdToken(auth.currentUser, false).catch(() => "") : "";
    return idToken ? { "Authorization": `Bearer ${idToken}` } : {};
  };

  const loadApiKeys = async () => {
    setApiKeysLoading(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/public-keys", { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error cargando claves");
      setApiKeys(data.keys || []);
    } catch (e: any) {
      toast.error(e.message || "Error cargando API keys");
    } finally {
      setApiKeysLoading(false);
    }
  };

  const handleCreateApiKey = async () => {
    if (!newClientName.trim()) return;
    setCreatingApiKey(true);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch("/api/admin/public-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify({ client_name: newClientName.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando clave");
      setRevealedApiKey({ key: data.key, clientName: newClientName.trim() });
      setNewClientName("");
      await loadApiKeys();
    } catch (e: any) {
      toast.error(e.message || "Error creando API key");
    } finally {
      setCreatingApiKey(false);
    }
  };

  const handleRevokeApiKey = async (id: number) => {
    if (!confirm("¿Revocar esta API key? Los clientes que la usen dejarán de tener acceso.")) return;
    setRevokingKeyId(id);
    try {
      const headers = await getAdminHeaders();
      const res = await fetch(`/api/admin/public-keys/${id}`, { method: "DELETE", headers });
      if (!res.ok) throw new Error("Error revocando clave");
      toast.success("API key revocada", { style: { backgroundColor: CARD_BG, border: `1px solid #FF3131`, color: "#FF3131" } });
      await loadApiKeys();
    } catch (e: any) {
      toast.error(e.message || "Error revocando API key");
    } finally {
      setRevokingKeyId(null);
    }
  };

  const handleForceApproveFichaAudit = async (subId: string, carrilKey: "carril1" | "carril2" | "carril3") => {
    if (!user?.uid || !tallerInterfaz) return;
    const cap = tallerCapitulos[subId];
    if (!cap) return;
    const prevAudit = fichaAuditMap[subId];
    const approvedResult: FichaAuditResult = { materialFound: true, ganchoFound: true, passed: true, retried: false };
    const newAudit: Record<string, FichaAuditResult> = { ...(prevAudit || {}), [carrilKey]: approvedResult };
    setFichaAuditMap(prev => ({ ...prev, [subId]: newAudit }));
    try {
      await saveCapituloCarrilesLibro(user.uid, tallerInterfaz, subId, {
        subInterfazTitulo: cap.subInterfazTitulo,
        carril1: cap.carril1,
        carril2: cap.carril2,
        carril3: cap.carril3,
      }, newAudit);
      toast.success("FICHA aprobada manualmente", { style: { backgroundColor: CARD_BG, border: `1px solid #00C851`, color: "#00C851" } });
    } catch {
      setFichaAuditMap(prev => {
        const updated = { ...prev };
        if (prevAudit && Object.keys(prevAudit).length > 0) {
          updated[subId] = prevAudit;
        } else {
          delete updated[subId];
        }
        return updated;
      });
      toast.error("Error aprobando auditoría");
    }
  };

  const compilarLibroTaller = () => {
    if (!tallerInterfaz) return;
    const interfazInfo = INTERFACES.find(i => i.id === tallerInterfaz);
    if (!interfazInfo) return;
    const interfazNum = INTERFACES.findIndex(i => i.id === tallerInterfaz) + 1;

    const capitulosListos = tallerSubInterfaces
      .filter(sub => tallerCapitulos[sub.id] && (tallerCapitulos[sub.id].status === "listo" || tallerCapitulos[sub.id].status === "revisado"))
      .map(sub => {
        const cap = tallerCapitulos[sub.id];
        const edits = editandoCarriles[sub.id];
        return {
          orden: sub.orden,
          titulo: sub.titulo,
          falla: sub.falla,
          carril1: edits ? edits.c1 : cap.carril1,
          carril2: edits ? edits.c2 : cap.carril2,
          carril3: edits ? edits.c3 : cap.carril3,
        };
      });

    const totalSubs = tallerSubInterfaces.length;
    if (capitulosListos.length === 0) {
      toast.error("Genera al menos un capítulo antes de compilar.");
      return;
    }
    if (totalSubs > 0 && capitulosListos.length < totalSubs) {
      toast.error(`Libro incompleto: ${capitulosListos.length}/${totalSubs} capítulos listos. Genera todos los capítulos antes de compilar el libro final.`);
      return;
    }

    const tocHTML = capitulosListos.map((ch, i) =>
      `<p style="margin:6px 0;font-size:14px;"><span style="color:#D4AF37;font-weight:bold;">${String(i + 1).padStart(2, "0")}</span> — ${ch.titulo} <span style="color:#aaa;font-size:12px;">${ch.falla}</span></p>`
    ).join("");

    const chaptersHTML = capitulosListos.map((ch) =>
      `<div style="page-break-before:always;margin-top:60px;">
        <div style="text-align:center;margin-bottom:40px;">
          <p style="font-size:12px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;margin-bottom:8px;">Capítulo ${String(ch.orden).padStart(2, "0")}</p>
          <h2 style="font-size:26px;font-weight:900;color:#1a1a1a;margin:0 0 8px 0;font-family:'Playfair Display',Georgia,serif;">${ch.titulo}</h2>
          <p style="font-size:13px;color:#888;font-style:italic;">${ch.falla}</p>
          <div style="width:60px;height:2px;background:#D4AF37;margin:20px auto;"></div>
        </div>
        <div style="margin-bottom:40px;">
          <p style="font-size:10px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid #D4AF3740;padding-bottom:8px;">Carril I — El Mensaje</p>
          <div style="font-size:14px;line-height:1.9;color:#2a2a2a;text-align:justify;padding-left:20px;border-left:2px solid #D4AF3740;">${ch.carril1.replace(/\n/g, "<br>")}</div>
        </div>
        <div style="margin-bottom:40px;">
          <p style="font-size:10px;letter-spacing:3px;color:#888;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid #88888840;padding-bottom:8px;">Carril II — El Lector / Hardware</p>
          <div style="font-size:14px;line-height:1.9;color:#2a2a2a;text-align:justify;padding-left:20px;border-left:2px solid #88888840;">${ch.carril2.replace(/\n/g, "<br>")}</div>
        </div>
        <div style="margin-bottom:20px;">
          <p style="font-size:10px;letter-spacing:3px;color:#8B5CF6;text-transform:uppercase;margin-bottom:16px;border-bottom:1px solid #8B5CF640;padding-bottom:8px;">Carril III — El Maestro</p>
          <div style="font-size:14px;line-height:1.9;color:#2a2a2a;text-align:justify;padding-left:20px;border-left:2px solid #8B5CF640;">${ch.carril3.replace(/\n/g, "<br>")}</div>
        </div>
        <div style="margin-top:40px;padding:20px;border:1px solid #D4AF37;border-radius:8px;text-align:center;background:#faf8f0;">
          <p style="font-size:10px;letter-spacing:2px;color:#D4AF37;text-transform:uppercase;margin-bottom:6px;">Terminal de Diagnóstico</p>
          <p style="font-size:13px;color:#555;">sistemicar.app/umbral-leads?src=libro&cap=${tallerInterfaz}</p>
        </div>
      </div>`
    ).join("");

    const tituloLibro = TITULOS_LIBROS[tallerInterfaz] || interfazInfo.nombre;
    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${tituloLibro} — Serie Espejo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px 30px; }
    @media print { body { padding: 0; max-width: 100%; } @page { margin: 2cm; size: A5; } }
  </style>
</head>
<body>
  <div style="min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;">
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:40px;"></div>
    <p style="font-size:12px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;margin-bottom:16px;">Serie Espejo — Libro ${interfazNum} de 10</p>
    <p style="font-size:11px;letter-spacing:2px;color:#888;text-transform:uppercase;margin-bottom:24px;">${tallerInterfaz} — ${interfazInfo.nombre}</p>
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:38px;font-weight:900;color:#1a1a1a;line-height:1.2;margin-bottom:16px;">${tituloLibro}</h1>
    <p style="font-size:13px;color:#888;font-style:italic;margin-bottom:40px;">${interfazInfo.falla}</p>
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:40px;"></div>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#555;font-style:italic;">Gilson Arévalo Pezo</p>
    <p style="font-size:11px;color:#aaa;margin-top:30px;letter-spacing:2px;">SISTEMICAR™</p>
  </div>
  <div style="min-height:40vh;display:flex;flex-direction:column;justify-content:end;text-align:center;page-break-after:always;padding-bottom:60px;">
    <p style="font-size:11px;color:#888;line-height:2;">${tituloLibro}<br>© 2025 Gilson Arévalo Pezo — SISTEMICAR™<br>Todos los derechos reservados<br><br>Serie Espejo, Libro ${interfazNum} de 10<br>sistemicar.app</p>
  </div>
  <div style="page-break-after:always;">
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:22px;font-weight:900;text-align:center;margin-bottom:30px;">Estructura de Capítulos</h2>
    <div style="width:60px;height:2px;background:#D4AF37;margin:0 auto 30px;"></div>
    ${tocHTML}
  </div>
  ${chaptersHTML}
  <div style="page-break-before:always;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:30px;"></div>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">Sobre el Autor</p>
    <p style="font-size:13px;color:#555;line-height:1.8;max-width:500px;"><strong>Gilson Arévalo Pezo</strong> es ingeniero de sistemas de conciencia y creador de SISTEMICAR™, la primera plataforma de desinstalación del virus de la pobreza basada en hardware biológico.</p>
    <div style="margin-top:30px;padding:16px 30px;border:1px solid #D4AF37;border-radius:8px;background:#faf8f0;">
      <p style="font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Portal de Descompresión</p>
      <p style="font-size:14px;color:#555;font-weight:500;">sistemicar.app/umbral-leads?src=libro&cap=${tallerInterfaz}</p>
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Espejo_${tallerInterfaz}_${tituloLibro.replace(/\s+/g, "_")}_KDP.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success(`Libro ${tallerInterfaz} compilado — ${capitulosListos.length} capítulos`, { duration: 6000, style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
  };

  const leadsPorInterfaz = (prospectos || []).reduce((acc, p) => {
    if (p?.interfaz_origen) acc[p.interfaz_origen] = (acc[p.interfaz_origen] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const leadsPorFuente = (prospectos || []).reduce((acc, p) => {
    const src = p?.source || "directo";
    acc[src] = (acc[src] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const handleGenerarPolos = async () => {
    setGeneratingPolos(true);
    setPolosResult(null);
    try {
      const res = await fetch("/api/semillas/generar-polos", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setPolosResult(data.guiones_polos || []);
      toast.success("3 guiones de polos generados", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch { toast.error("Error al generar guiones de polos"); }
    finally { setGeneratingPolos(false); }
  };

  const handleGenerarContraportada = async () => {
    setGeneratingContraportada(true);
    setContraportadasResult(null);
    try {
      const res = await fetch("/api/semillas/generar-contraportada", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setContraportadasResult(data.contraportadas || []);
      toast.success("3 contraportadas generadas", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch { toast.error("Error al generar contraportadas"); }
    finally { setGeneratingContraportada(false); }
  };

  const handleProducirLote = async () => {
    setGeneratingLote(true);
    try {
      const res = await fetch("/api/fabrica-sensorial/producir-lote", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error produciendo lote");
      }
      const data = await res.json();
      if (user?.uid && data.lote) {
        await addLoteFabrica(user.uid, {
          piezas: data.lote,
          total_piezas: data.total_piezas,
          fecha_generacion: data.fecha_generacion,
        });
      }
      toast.success(`Lote de ${data.total_piezas} piezas sensoriales producido`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch (e: any) {
      toast.error(e.message || "Error produciendo lote sensorial");
    } finally {
      setGeneratingLote(false);
    }
  };

  const handleGenerarMasterclasses = async () => {
    setGeneratingMasterclass(true);
    try {
      const res = await fetch("/api/youtube-educator/generar-masterclass", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error generando masterclasses");
      }
      const data = await res.json();
      if (user?.uid && data.masterclasses) {
        await addLoteMasterclass(user.uid, {
          masterclasses: data.masterclasses,
          total: data.total,
          fecha_generacion: data.fecha_generacion,
        });
      }
      toast.success(`${data.total} masterclasses generadas`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch (e: any) {
      toast.error(e.message || "Error generando masterclasses");
    } finally {
      setGeneratingMasterclass(false);
    }
  };

  const handleGenerarMasterclassSingle = async (interfazId: string) => {
    setGeneratingMcSingle(prev => ({ ...prev, [interfazId]: true }));
    try {
      const res = await fetch("/api/youtube-educator/generar-masterclass-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interfaz: interfazId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error generando masterclass ${interfazId}`);
      }
      const data = await res.json();
      if (user?.uid && data.masterclass) {
        await addSingleMasterclass(user.uid, data.masterclass);
      }
      toast.success(`Masterclass ${interfazId} generada`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch (e: any) {
      toast.error(e.message || `Error generando masterclass ${interfazId}`);
    } finally {
      setGeneratingMcSingle(prev => ({ ...prev, [interfazId]: false }));
    }
  };

  const handleGenerarPiezaSingle = async (interfazId: string) => {
    setGeneratingPiezaSingle(prev => ({ ...prev, [interfazId]: true }));
    try {
      const res = await fetch("/api/fabrica-sensorial/producir-pieza", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interfaz: interfazId }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error generando pieza ${interfazId}`);
      }
      const data = await res.json();
      if (user?.uid && data.pieza) {
        await addSinglePieza(user.uid, data.pieza);
      }
      toast.success(`Pieza sensorial ${interfazId} generada`, { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch (e: any) {
      toast.error(e.message || `Error generando pieza ${interfazId}`);
    } finally {
      setGeneratingPiezaSingle(prev => ({ ...prev, [interfazId]: false }));
    }
  };

  const getMcForInterfaz = (interfazId: string): MasterclassYT | undefined => {
    const fromSingles = (singleMasterclasses || []).find(mc => mc.interfaz === interfazId);
    if (fromSingles) return fromSingles;
    for (const lote of (lotesMasterclass || [])) {
      const found = (lote.masterclasses || []).find(mc => mc.interfaz === interfazId);
      if (found) return found;
    }
    return undefined;
  };

  const getPiezaForInterfaz = (interfazId: string): PiezaSensorial | undefined => {
    const fromSingles = (singlePiezas || []).find(p => p.interfaz === interfazId);
    if (fromSingles) return fromSingles;
    for (const lote of (lotesFabrica || [])) {
      const found = (lote.piezas || []).find(p => p.interfaz === interfazId);
      if (found) return found;
    }
    return undefined;
  };

  const handleRenderVideo = async (interfazId: string) => {
    const pieza = getPiezaForInterfaz(interfazId);
    if (!pieza) {
      toast.error(`Primero genera el contenido de texto para ${interfazId}`);
      return;
    }
    if (!pieza.guion_narrador || !pieza.image_prompt) {
      toast.error(`La pieza ${interfazId} no tiene guion o image_prompt`);
      return;
    }

    setRenderingVideo(prev => ({ ...prev, [interfazId]: "Generando voz con ElevenLabs..." }));
    try {
      const res = await fetch("/api/fabrica-sensorial/render-video", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interfaz: interfazId,
          guion_narrador: pieza.guion_narrador,
          image_prompt: pieza.image_prompt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error renderizando video ${interfazId}`);
      }
      const data = await res.json();
      setRenderedVideos(prev => ({
        ...prev,
        [interfazId]: { downloadUrl: data.downloadUrl, filename: data.filename },
      }));
      toast.success(`Video ${interfazId} renderizado con éxito`, {
        style: { backgroundColor: CARD_BG, border: `1px solid #00FFC3`, color: "#00FFC3" },
      });
    } catch (e: any) {
      toast.error(e.message || `Error renderizando video ${interfazId}`);
    } finally {
      setRenderingVideo(prev => {
        const next = { ...prev };
        delete next[interfazId];
        return next;
      });
    }
  };

  const stopPollingYT = (interfazId: string) => {
    if (pollIntervalsYT.current[interfazId]) {
      clearInterval(pollIntervalsYT.current[interfazId]);
      delete pollIntervalsYT.current[interfazId];
    }
  };

  const handleRenderMasterclassYT = async (interfazId: string) => {
    const mc = getMcForInterfaz(interfazId);
    if (!mc?.guion_extendido) {
      toast.error(`Primero genera el contenido de YouTube Educator para ${interfazId}`);
      return;
    }
    setRenderingMcYT(prev => ({ ...prev, [interfazId]: true }));
    setRenderYTElapsed(prev => ({ ...prev, [interfazId]: 0 }));

    let jobId: string;
    try {
      const res = await fetch("/api/youtube-educator/render-masterclass", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interfaz: interfazId,
          guion_extendido: mc.guion_extendido,
          thumbnail_prompt: mc.thumbnail_prompt,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Error iniciando render ${interfazId}`);
      }
      const data = await res.json();
      jobId = data.jobId;
    } catch (e: any) {
      toast.error(e.message || `Error iniciando render ${interfazId}`);
      setRenderingMcYT(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
      return;
    }

    // Polling every 10 seconds + elapsed counter every second
    const startTime = Date.now();
    const timerInterval = setInterval(() => {
      setRenderYTElapsed(prev => ({ ...prev, [interfazId]: Math.floor((Date.now() - startTime) / 1000) }));
    }, 1000);

    const pollInterval = setInterval(async () => {
      try {
        const statusRes = await fetch(`/api/youtube-educator/render-status/${jobId}`);
        if (!statusRes.ok) {
          if (statusRes.status === 404 || statusRes.status === 410) {
            clearInterval(timerInterval);
            stopPollingYT(interfazId);
            setRenderingMcYT(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
            setRenderYTElapsed(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
            toast.error(`Render ${interfazId} perdido — el servidor fue reiniciado. Vuelve a renderizar.`, {
              duration: 8000,
              style: { backgroundColor: CARD_BG, border: `1px solid #FF3131`, color: "#FF3131" },
            });
          }
          return;
        }
        const job = await statusRes.json();

        if (job.status === "complete" && job.bufferReady) {
          clearInterval(timerInterval);
          stopPollingYT(interfazId);
          setRenderYTElapsed(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
          // Keep renderingMcYT=true during upload so button stays in loading state
          toast.info(`Video listo — subiendo a almacenamiento permanente...`, {
            style: { backgroundColor: CARD_BG, border: `1px solid #D4AF37`, color: "#D4AF37" },
            duration: 8000,
          });
          try {
            let idToken = "";
            if (auth?.currentUser) {
              idToken = await getIdToken(auth.currentUser, false);
            }
            if (!idToken) throw new Error("Usuario no autenticado");

            const uploadRes = await fetch(`/api/youtube-educator/upload-video/${jobId}`, {
              method: "POST",
              headers: { "Authorization": `Bearer ${idToken}` },
            });
            const uploadData = await uploadRes.json();
            if (!uploadRes.ok) {
              throw new Error(uploadData.error || "Error subiendo a Firebase Storage");
            }
            const { downloadUrl } = uploadData;
            const filename = job.filename || `Masterclass_YT_Sistemicar_${interfazId}.mp4`;
            setRenderedMcYT(prev => ({ ...prev, [interfazId]: { downloadUrl, filename } }));
            setRenderingMcYT(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
            if (user?.uid) {
              updateMasterclassVideoUrl(user.uid, interfazId, downloadUrl).catch(e =>
                console.warn("[mc-upload] Firestore update failed:", e)
              );
            }
            toast.success(`Masterclass ${interfazId} lista para descargar`, {
              style: { backgroundColor: CARD_BG, border: `1px solid #00FFC3`, color: "#00FFC3" },
            });
          } catch (uploadErr: any) {
            console.error("[mc-upload] Error:", uploadErr);
            setRenderingMcYT(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
            toast.error(`Error subiendo video ${interfazId}: ${(uploadErr as Error).message || "desconocido"}. Intenta re-renderizar.`, { duration: 8000 });
          }
        } else if (job.status === "error") {
          clearInterval(timerInterval);
          stopPollingYT(interfazId);
          setRenderingMcYT(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
          setRenderYTElapsed(prev => { const n = { ...prev }; delete n[interfazId]; return n; });
          toast.error(`Error en render ${interfazId}: ${job.error}`);
        }
      } catch {
        // Network error — keep polling, server may be momentarily busy
      }
    }, 10000);

    pollIntervalsYT.current[interfazId] = pollInterval;
    // Clean up timer when poll completes (stored separately, tied to pollInterval lifecycle)
    (pollIntervalsYT.current as any)[`${interfazId}_timer`] = timerInterval;
  };

  const handleChatSend = async () => {
    const text = chatInput.trim();
    if (!text || chatLoading) return;
    const newMessages: ChatMsg[] = [...chatMessages, { role: "user", content: text }];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    const singlesCtx = (singleMasterclasses || []).map(mc => ({
      interfaz: mc.interfaz,
      titulo: mc.titulos?.miedo || mc.nombre_interfaz || mc.interfaz,
      fecha: mc.createdAt instanceof Date ? mc.createdAt.toLocaleDateString("es-PE") : undefined,
    }));
    const loteCtx = (lotesMasterclass || []).flatMap(lote =>
      (lote.masterclasses || []).map(mc => ({
        interfaz: mc.interfaz,
        titulo: mc.titulos?.miedo || mc.nombre_interfaz || mc.interfaz,
        fecha: lote.createdAt instanceof Date ? lote.createdAt.toLocaleDateString("es-PE") : undefined,
      }))
    );
    const seen = new Set<string>();
    const generatedInterfaces = [...singlesCtx, ...loteCtx].filter(g => {
      if (seen.has(g.interfaz)) return false;
      seen.add(g.interfaz);
      return true;
    });
    let idToken = "";
    try {
      if (auth?.currentUser) idToken = await getIdToken(auth.currentUser, false);
    } catch { /* sin token — el servidor rechazará */ }

    try {
      const res = await fetch("/api/video-estratega/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(idToken ? { "Authorization": `Bearer ${idToken}` } : {}),
        },
        body: JSON.stringify({ messages: newMessages, generatedInterfaces }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Error en Estratega IA");
      }
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    } catch (e: any) {
      toast.error(e.message || "Error conectando con Estratega IA");
    } finally {
      setChatLoading(false);
    }
  };

  const handleGenerarDiagnostico = async () => {
    setGeneratingDiagnostico(true);
    setDiagnosticoResult(null);
    try {
      const res = await fetch("/api/semillas/generar-diagnostico-soberano", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
      if (!res.ok) throw new Error("Error");
      const data = await res.json();
      setDiagnosticoResult(data.guiones_diagnostico || []);
      toast.success("3 guiones de diagnóstico generados", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch { toast.error("Error al generar guiones de diagnóstico"); }
    finally { setGeneratingDiagnostico(false); }
  };

  const safeHistorial = historial || [];
  const capitulosPorInterfaz = INTERFACES.map(iface => ({
    ...iface,
    capitulos: safeHistorial
      .filter(s => s?.interfaz === iface.id && s?.capitulo)
      .sort((a, b) => {
        const ta = a?.createdAt instanceof Date ? a.createdAt.getTime() : (typeof a?.createdAt?.toDate === 'function' ? a.createdAt.toDate().getTime() : 0);
        const tb = b?.createdAt instanceof Date ? b.createdAt.getTime() : (typeof b?.createdAt?.toDate === 'function' ? b.createdAt.toDate().getTime() : 0);
        return ta - tb;
      })
  }));

  const interfacesCubiertas = capitulosPorInterfaz.filter(i => (i.capitulos || []).length > 0).length;
  const totalCapitulos = capitulosPorInterfaz.reduce((acc, i) => acc + (i.capitulos || []).length, 0);

  const allKeywords = Array.from(new Set(safeHistorial.flatMap(s => s?.keywords_seo || [])));

  const compilarLibroHTML = () => {
    const chapters = capitulosPorInterfaz
      .filter(i => i.capitulos.length > 0)
      .map(iface => ({
        id: iface.id,
        nombre: iface.nombre,
        falla: iface.falla,
        contenido: iface.capitulos.map(s => s.capitulo).join("\n\n---\n\n")
      }));

    const tocHTML = chapters.map((ch, i) =>
      `<p style="margin:4px 0;font-size:14px;"><span style="color:#D4AF37;font-weight:bold;">Interfaz ${ch.id}</span> — ${ch.nombre} <span style="color:#888;">....... ${i + 1}</span></p>`
    ).join("");

    const chaptersHTML = chapters.map((ch, i) =>
      `<div style="page-break-before:always;margin-top:60px;">
        <div style="text-align:center;margin-bottom:40px;">
          <p style="font-size:12px;letter-spacing:3px;color:#D4AF37;text-transform:uppercase;margin-bottom:8px;">Interfaz ${ch.id}</p>
          <h2 style="font-size:28px;font-weight:900;color:#1a1a1a;margin:0 0 8px 0;font-family:'Playfair Display',Georgia,serif;">${ch.nombre}</h2>
          <p style="font-size:13px;color:#888;font-style:italic;">${ch.falla}</p>
          <div style="width:60px;height:2px;background:#D4AF37;margin:20px auto;"></div>
        </div>
        <div style="font-size:14px;line-height:1.8;color:#2a2a2a;text-align:justify;white-space:pre-wrap;">${ch.contenido}</div>
        <div style="margin-top:40px;padding:20px;border:1px solid #D4AF37;border-radius:8px;text-align:center;background:#faf8f0;">
          <p style="font-size:11px;letter-spacing:2px;color:#D4AF37;text-transform:uppercase;margin-bottom:8px;">Acceso al Terminal de Descompresión</p>
          <p style="font-size:13px;color:#555;">sistemicar.app/umbral-leads?src=libro&cap=${ch.id}</p>
        </div>
      </div>`
    ).join("");

    const keywordsHTML = allKeywords.length > 0
      ? `<div style="page-break-before:always;margin-top:60px;">
          <h2 style="font-size:22px;font-weight:900;color:#1a1a1a;text-align:center;font-family:'Playfair Display',Georgia,serif;">Keywords SEO — Amazon KDP</h2>
          <div style="width:60px;height:2px;background:#D4AF37;margin:20px auto 30px;"></div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;justify-content:center;">
            ${allKeywords.map(k => `<span style="padding:4px 12px;border-radius:20px;font-size:12px;background:#f5f0e0;color:#8B6914;border:1px solid #D4AF3740;">${k}</span>`).join("")}
          </div>
        </div>`
      : "";

    return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>El Espejo del Mendigo — Gilson Arévalo Pezo</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Inter:wght@300;400;500&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, sans-serif; background: #fff; color: #1a1a1a; max-width: 700px; margin: 0 auto; padding: 40px 30px; }
    @media print {
      body { padding: 0; max-width: 100%; }
      @page { margin: 2cm; size: A5; }
    }
  </style>
</head>
<body>
  <!-- PORTADA -->
  <div style="min-height:90vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;page-break-after:always;">
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:40px;"></div>
    <h1 style="font-family:'Playfair Display',Georgia,serif;font-size:42px;font-weight:900;color:#1a1a1a;line-height:1.2;margin-bottom:16px;">El Espejo<br>del Mendigo</h1>
    <p style="font-size:14px;color:#888;letter-spacing:3px;text-transform:uppercase;margin-bottom:40px;">Manual de Desinstalación del Virus de la Pobreza</p>
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:40px;"></div>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:18px;color:#555;font-style:italic;">Gilson Arévalo Pezo</p>
    <p style="font-size:11px;color:#aaa;margin-top:30px;letter-spacing:2px;">SISTEMICAR™</p>
  </div>

  <!-- PÁGINA DE DERECHOS -->
  <div style="min-height:40vh;display:flex;flex-direction:column;justify-content:end;text-align:center;page-break-after:always;padding-bottom:60px;">
    <p style="font-size:11px;color:#888;line-height:2;">
      El Espejo del Mendigo<br>
      © 2025 Gilson Arévalo Pezo<br>
      Todos los derechos reservados<br><br>
      SISTEMICAR™ — Plataforma de Ingeniería de Conciencia<br>
      sistemicar.app<br><br>
      Ninguna parte de este libro puede ser reproducida sin autorización<br>
      escrita del autor.
    </p>
  </div>

  <!-- TABLA DE CONTENIDOS -->
  <div style="page-break-after:always;">
    <h2 style="font-family:'Playfair Display',Georgia,serif;font-size:24px;font-weight:900;text-align:center;margin-bottom:30px;">Índice de Interfaces</h2>
    <div style="width:60px;height:2px;background:#D4AF37;margin:0 auto 30px;"></div>
    ${tocHTML}
  </div>

  <!-- CAPÍTULOS -->
  ${chaptersHTML}

  <!-- KEYWORDS SEO -->
  ${keywordsHTML}

  <!-- PÁGINA FINAL -->
  <div style="page-break-before:always;min-height:60vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
    <div style="width:80px;height:2px;background:#D4AF37;margin-bottom:30px;"></div>
    <p style="font-family:'Playfair Display',Georgia,serif;font-size:20px;font-weight:700;color:#1a1a1a;margin-bottom:12px;">Sobre el Autor</p>
    <p style="font-size:13px;color:#555;line-height:1.8;max-width:500px;">
      <strong>Gilson Arévalo Pezo</strong> es ingeniero de sistemas de conciencia y creador de SISTEMICAR™, 
      la primera plataforma de desinstalación del virus de la pobreza basada en hardware biológico. 
      Su trabajo combina neurociencia aplicada, ingeniería conductual y protocolos clínicos de soberanía personal.
    </p>
    <div style="margin-top:30px;padding:16px 30px;border:1px solid #D4AF37;border-radius:8px;background:#faf8f0;">
      <p style="font-size:11px;color:#D4AF37;letter-spacing:2px;text-transform:uppercase;margin-bottom:4px;">Portal de Descompresión</p>
      <p style="font-size:14px;color:#555;font-weight:500;">sistemicar.app/umbral-leads</p>
    </div>
  </div>
</body>
</html>`;
  };

  const [descargandoOriginal, setDescargandoOriginal] = useState(false);
  const [descargandoCerebro, setDescargandoCerebro] = useState(false);

  const descargarCerebroV6 = async () => {
    setDescargandoCerebro(true);
    try {
      const res = await fetch("/cerebro-doctor-ia-v6.html");
      if (!res.ok) throw new Error("Error del servidor");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "Cerebro_Doctor_IA_v6.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Cerebro Doctor IA v6 descargado. Ábrelo en el navegador y usa Ctrl+P → Guardar como PDF.", { duration: 7000, style: { backgroundColor: CARD_BG, border: "1px solid rgba(0,255,195,0.4)", color: "#00FFC3" } });
    } catch {
      toast.error("Error al descargar el documento. Intenta de nuevo.");
    } finally {
      setDescargandoCerebro(false);
    }
  };

  const descargarLibroOriginal = async () => {
    setDescargandoOriginal(true);
    try {
      const res = await fetch("/api/semillas/libro-original-html");
      if (!res.ok) throw new Error("Error del servidor");
      const html = await res.text();
      const blob = new Blob([html], { type: "text/html;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "El_Espejo_del_Mendigo_KDP.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("Libro completo descargado. Ábrelo en el navegador y usa Ctrl+P → Guardar como PDF.", { duration: 7000, style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
    } catch {
      toast.error("Error al descargar el libro. Intenta de nuevo.");
    } finally {
      setDescargandoOriginal(false);
    }
  };

  const descargarLibro = () => {
    if (totalCapitulos === 0) {
      toast.error("No hay capítulos generados aún. Genera semillas primero.");
      return;
    }
    const html = compilarLibroHTML();
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "El_Espejo_del_Mendigo_Semillas.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Capítulos generados descargados.", { duration: 5000, style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: DARK_BG }}>
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto" style={{ color: GOLD }} />
          {loadingTimedOut && (
            <>
              <p className="text-sm" style={{ color: GOLD }} data-testid="text-loading-timeout">
                La carga está tardando más de lo esperado.
              </p>
              <button
                data-testid="button-loading-back"
                onClick={() => navigate("/")}
                className="px-4 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: GOLD, color: DARK_BG }}
              >
                Volver al inicio
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  const selectedInterface = INTERFACES.find(i => i.id === interfazSeleccionada)!;

  const handleGenerar = async () => {
    if (semilla.trim().length < 10) {
      toast.error("La semilla debe tener al menos 10 caracteres");
      return;
    }

    setGenerating(true);
    setResult(null);

    try {
      const response = await fetch("/api/semillas/generar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          semilla: semilla.trim(),
          interfaz: interfazSeleccionada,
        }),
      });

      if (!response.ok) {
        throw new Error("Error al generar contenido");
      }

      const data: SemillaResult = await response.json();
      setResult(data);
      setActiveTab("capitulo");

      if (user?.uid) {
        try {
          await addSemilla(user.uid, {
            semilla: semilla.trim(),
            interfaz: interfazSeleccionada,
            capitulo: data.capitulo,
            guiones: data.guiones,
            keywords_seo: data.keywords_seo,
            fecha: new Date(),
          });
        } catch (e) {
          console.error("Error saving semilla:", e);
        }
      }

      toast.success("Contenido generado y guardado", {
        style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD },
      });
    } catch (error) {
      toast.error("Error al generar contenido. Intenta de nuevo.");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      toast.success("Copiado al portapapeles", {
        style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD },
      });
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      toast.error("No se pudo copiar");
    }
  };

  const tabs: { id: TabType; label: string; icon: typeof BookOpen }[] = [
    { id: "capitulo", label: "Capítulo", icon: BookOpen },
    { id: "guiones", label: "Guiones", icon: Video },
    { id: "keywords", label: "Keywords SEO", icon: Search },
  ];

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: DARK_BG }}>
      <div className="max-w-2xl mx-auto p-4">
        <div className="flex items-center gap-3 mb-6 pt-4">
          <button
            onClick={() => navigate("/admin-gilson")}
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${BORDER_GOLD}` }}
            data-testid="btn-back"
          >
            <ArrowLeft size={18} style={{ color: GOLD }} />
          </button>
          <div>
            <h1 className="text-xl font-black text-white" data-testid="text-title">
              Automatizador de Semillas
            </h1>
            <p className="text-xs" style={{ color: `${GOLD}80` }}>
              Genera contenido derivado del Espejo del Mendigo
            </p>
          </div>
          <Sprout size={24} style={{ color: GOLD }} className="ml-auto" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl p-5 mb-4"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
        >
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Semilla — Idea / Concepto
          </label>
          <textarea
            value={semilla}
            onChange={(e) => setSemilla(e.target.value)}
            placeholder="Escribe tu idea o concepto semilla aquí... Ej: 'El miedo a cobrar lo que vales como señal de M03 activa'"
            className="w-full h-32 bg-white/5 rounded-xl p-4 text-white text-sm resize-none focus:outline-none focus:ring-1 placeholder:text-slate-600"
            style={{ focusRingColor: GOLD } as any}
            data-testid="input-semilla"
          />
          <p className="text-[10px] text-slate-600 mt-1">{semilla.length} caracteres</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-4 relative"
          style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
        >
          <label className="block text-xs font-bold uppercase tracking-wider mb-2" style={{ color: GOLD }}>
            Interfaz Base
          </label>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="w-full flex items-center justify-between p-3 rounded-xl bg-white/5 text-left"
            data-testid="btn-select-interfaz"
          >
            <div>
              <span className="text-white text-sm font-bold">{selectedInterface.id}</span>
              <span className="text-slate-400 text-sm ml-2">— {selectedInterface.nombre}</span>
            </div>
            <ChevronDown
              size={16}
              className={`text-slate-400 transition-transform ${showDropdown ? "rotate-180" : ""}`}
            />
          </button>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute left-0 right-0 top-full mt-1 z-50 rounded-xl overflow-hidden max-h-64 overflow-y-auto"
                style={{ backgroundColor: "#111", border: `1px solid ${BORDER_GOLD}` }}
              >
                {INTERFACES.map((iface) => (
                  <button
                    key={iface.id}
                    onClick={() => {
                      setInterfazSeleccionada(iface.id);
                      setShowDropdown(false);
                    }}
                    className={`w-full text-left p-3 hover:bg-white/5 transition-colors ${
                      interfazSeleccionada === iface.id ? "bg-white/10" : ""
                    }`}
                    data-testid={`option-interfaz-${iface.id}`}
                  >
                    <span className="text-xs font-bold" style={{ color: GOLD }}>{iface.id}</span>
                    <span className="text-white text-xs ml-2">{iface.nombre}</span>
                    <span className="text-slate-500 text-[10px] block">{iface.falla}</span>
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleGenerar}
          disabled={generating || semilla.trim().length < 10}
          className="w-full p-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 mb-6 disabled:opacity-40"
          style={{
            background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`,
            color: "#000",
          }}
          data-testid="btn-generar"
        >
          {generating ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Generando con IA...
            </>
          ) : (
            <>
              <Wand2 size={18} />
              Generar Contenido desde Semilla
            </>
          )}
        </motion.button>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
            >
              <div className="flex gap-1 mb-4 rounded-xl overflow-hidden" style={{ backgroundColor: CARD_BG }}>
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="flex-1 flex items-center justify-center gap-1.5 p-3 text-xs font-bold transition-colors"
                    style={{
                      backgroundColor: activeTab === tab.id ? `${GOLD}20` : "transparent",
                      color: activeTab === tab.id ? GOLD : "#64748b",
                      borderBottom: activeTab === tab.id ? `2px solid ${GOLD}` : "2px solid transparent",
                    }}
                    data-testid={`tab-${tab.id}`}
                  >
                    <tab.icon size={14} />
                    {tab.label}
                  </button>
                ))}
              </div>

              {activeTab === "capitulo" && (
                <motion.div
                  key="capitulo"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <FileText size={16} style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                        Capítulo Generado
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.capitulo, "capitulo")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                      data-testid="btn-copy-capitulo"
                    >
                      {copiedField === "capitulo" ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === "capitulo" ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <div className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap" data-testid="text-capitulo">
                    {result.capitulo}
                  </div>
                </motion.div>
              )}

              {activeTab === "guiones" && (
                <motion.div
                  key="guiones"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-3"
                >
                  {(result.guiones || []).map((guion, idx) => {
                    const platforms = ["YouTube", "TikTok", "Facebook"];
                    const fieldKey = `guion-${idx}`;
                    const fullText = `${guion.titulo}\n\nHOOK:\n${guion.hook}\n\nVALOR:\n${guion.valor}\n\nCTA:\n${guion.cta}`;
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl p-5"
                        style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Video size={14} style={{ color: GOLD }} />
                            <span className="text-xs font-bold" style={{ color: GOLD }}>
                              Guión {idx + 1} — {platforms[idx] || "General"}
                            </span>
                          </div>
                          <button
                            onClick={() => copyToClipboard(fullText, fieldKey)}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                            style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                            data-testid={`btn-copy-guion-${idx}`}
                          >
                            {copiedField === fieldKey ? <Check size={12} /> : <Copy size={12} />}
                            {copiedField === fieldKey ? "Copiado" : "Copiar"}
                          </button>
                        </div>
                        <p className="text-white text-sm font-bold mb-2" data-testid={`text-guion-titulo-${idx}`}>
                          {guion.titulo}
                        </p>
                        <div className="space-y-2 text-sm">
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Hook</span>
                            <p className="text-slate-300" data-testid={`text-guion-hook-${idx}`}>{guion.hook}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Valor</span>
                            <p className="text-slate-300" data-testid={`text-guion-valor-${idx}`}>{guion.valor}</p>
                          </div>
                          <div>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">CTA</span>
                            <p className="text-slate-300" data-testid={`text-guion-cta-${idx}`}>{guion.cta}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </motion.div>
              )}

              {activeTab === "keywords" && (
                <motion.div
                  key="keywords"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="rounded-2xl p-5"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Hash size={16} style={{ color: GOLD }} />
                      <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                        Keywords SEO — Amazon
                      </span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(result.keywords_seo.join(", "), "keywords")}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold"
                      style={{ backgroundColor: `${GOLD}15`, color: GOLD }}
                      data-testid="btn-copy-keywords"
                    >
                      {copiedField === "keywords" ? <Check size={12} /> : <Copy size={12} />}
                      {copiedField === "keywords" ? "Copiado" : "Copiar"}
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2" data-testid="text-keywords">
                    {(result.keywords_seo || []).map((kw, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1.5 rounded-full text-xs font-bold"
                        style={{ backgroundColor: `${GOLD}15`, color: GOLD, border: `1px solid ${BORDER_GOLD}` }}
                      >
                        {kw}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {!result && !generating && !viewingSemilla && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-center py-12"
          >
            <Sparkles size={40} className="mx-auto mb-4" style={{ color: `${GOLD}40` }} />
            <p className="text-slate-600 text-sm">
              Escribe una idea semilla y selecciona la Interfaz base para generar contenido derivado del libro.
            </p>
          </motion.div>
        )}

        <AnimatePresence>
          {viewingSemilla && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                  Semilla: "{viewingSemilla.semilla.slice(0, 50)}..."
                </span>
                <button
                  onClick={() => setViewingSemilla(null)}
                  className="text-xs text-slate-500 hover:text-white"
                  data-testid="btn-close-viewing"
                >
                  Cerrar
                </button>
              </div>
              <div className="rounded-2xl p-5 mb-3" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: GOLD }}>Capítulo</span>
                  <button onClick={() => copyToClipboard(viewingSemilla.capitulo, "view-cap")} className="text-xs" style={{ color: GOLD }} data-testid="btn-copy-view-cap">
                    {copiedField === "view-cap" ? <Check size={12} /> : <Copy size={12} />}
                  </button>
                </div>
                <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">{viewingSemilla.capitulo}</p>
              </div>
              {viewingSemilla.guiones?.map((g, i) => (
                <div key={i} className="rounded-2xl p-4 mb-2" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                  <p className="text-white text-xs font-bold mb-1">{g.titulo}</p>
                  <p className="text-red-400 text-[10px] uppercase font-bold">Hook</p>
                  <p className="text-slate-400 text-xs mb-1">{g.hook}</p>
                  <p className="text-blue-400 text-[10px] uppercase font-bold">Valor</p>
                  <p className="text-slate-400 text-xs mb-1">{g.valor}</p>
                  <p className="text-emerald-400 text-[10px] uppercase font-bold">CTA</p>
                  <p className="text-slate-400 text-xs">{g.cta}</p>
                </div>
              ))}
              <div className="flex flex-wrap gap-1 mt-2">
                {viewingSemilla.keywords_seo?.map((kw, i) => (
                  <span key={i} className="px-2 py-1 rounded-full text-[10px] font-bold" style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                    {kw}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-2 mt-6 mb-4">
          <button
            onClick={() => { setShowHistorial(!showHistorial); setShowMetricas(false); }}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors"
            style={{
              backgroundColor: showHistorial ? `${GOLD}20` : CARD_BG,
              color: showHistorial ? GOLD : "#64748b",
              border: `1px solid ${showHistorial ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-historial"
          >
            <History size={14} />
            Historial ({(historial || []).length})
          </button>
          <button
            onClick={() => { setShowMetricas(!showMetricas); setShowHistorial(false); }}
            className="flex-1 flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors"
            style={{
              backgroundColor: showMetricas ? `${GOLD}20` : CARD_BG,
              color: showMetricas ? GOLD : "#64748b",
              border: `1px solid ${showMetricas ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-metricas"
          >
            <BarChart3 size={14} />
            Métricas
          </button>
        </div>

        <AnimatePresence>
          {showHistorial && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-2">
              {(historial || []).length === 0 ? (
                <p className="text-slate-600 text-xs text-center py-6">No hay semillas generadas aún.</p>
              ) : (historial || []).map((s) => (
                <div
                  key={s.id}
                  className="rounded-xl p-3 flex items-center justify-between cursor-pointer hover:bg-white/5 transition-colors"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}
                  onClick={() => { setViewingSemilla(s); setShowHistorial(false); }}
                  data-testid={`historial-item-${s.id}`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-bold truncate">{s.semilla}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                        {s.interfaz}
                      </span>
                      <span className="text-slate-600 text-[10px]">
                        {s.fecha instanceof Date ? s.fecha.toLocaleDateString() : new Date(s.fecha).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Eye size={14} className="text-slate-600 ml-2 flex-shrink-0" />
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showMetricas && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
              <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-4" style={{ color: GOLD }}>
                  Métricas del Sistema
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-2xl font-black" style={{ color: GOLD }} data-testid="metric-semillas">{(historial || []).length}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Semillas Generadas</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-2xl font-black" style={{ color: GOLD }} data-testid="metric-espejo">{espejoCount}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Sesiones Espejo</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-2xl font-black" style={{ color: GOLD }} data-testid="metric-leads">{(prospectos || []).length}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Leads Totales</p>
                  </div>
                  <div className="rounded-xl p-4 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-2xl font-black" style={{ color: GOLD }} data-testid="metric-guiones">
                      {(historial || []).reduce((acc, s) => acc + (s?.guiones?.length || 0), 0)}
                    </p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-1">Guiones Totales</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: GOLD }}>
                  Conversión por Interfaz — ¿Qué duele más?
                </h3>
                {Object.keys(leadsPorInterfaz).length === 0 ? (
                  <p className="text-slate-600 text-xs">Sin datos de interfaz aún. Los leads llegarán con tracking desde el libro y videos.</p>
                ) : (
                  <div className="space-y-1">
                    {INTERFACES.map((iface) => {
                      const count = leadsPorInterfaz[iface.id] || 0;
                      if (count === 0) return null;
                      const maxCount = Math.max(...Object.values(leadsPorInterfaz));
                      const pct = Math.round((count / maxCount) * 100);
                      return (
                        <div key={iface.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-8 font-bold">{iface.id}</span>
                          <div className="flex-1 h-3 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: pct === 100 ? "#ef4444" : GOLD }} />
                          </div>
                          <span className="text-[10px] font-bold w-6 text-right" style={{ color: GOLD }}>{count}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div className="mt-4 flex flex-wrap gap-2">
                  {Object.entries(leadsPorFuente).map(([src, count]) => (
                    <span key={src} className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: `${GOLD}15`, color: GOLD }}>
                      {src}: {count}
                    </span>
                  ))}
                </div>
              </div>

              {(historial || []).length > 0 && (
                <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Distribución de Semillas por Interfaz</p>
                  <div className="space-y-1">
                    {INTERFACES.map((iface) => {
                      const count = (historial || []).filter(s => s?.interfaz === iface.id).length;
                      if (count === 0) return null;
                      const pct = Math.round((count / (historial || []).length) * 100);
                      return (
                        <div key={iface.id} className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 w-8">{iface.id}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: GOLD }} />
                          </div>
                          <span className="text-[10px] text-slate-500 w-6 text-right">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 mb-3">
          <button
            type="button"
            onClick={descargarCerebroV6}
            disabled={descargandoCerebro}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors disabled:opacity-60"
            style={{
              backgroundColor: CARD_BG,
              color: "#00FFC3",
              border: "1px solid rgba(0,255,195,0.3)",
            }}
            data-testid="btn-cerebro-v6"
          >
            {descargandoCerebro ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
            {descargandoCerebro ? "Descargando..." : "Cerebro Doctor IA v6 — Descargar Documento"}
          </button>
        </div>

        <div className="mb-4">
          <button
            onClick={() => setShowLibroPreview(!showLibroPreview)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors"
            style={{
              backgroundColor: showLibroPreview ? `${GOLD}20` : CARD_BG,
              color: showLibroPreview ? GOLD : "#64748b",
              border: `1px solid ${showLibroPreview ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-libro"
          >
            <BookMarked size={14} />
            Compilar Libro para Amazon KDP
          </button>
        </div>

        <AnimatePresence>
          {showLibroPreview && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4 mb-6">
              <div className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-black" style={{ color: GOLD }}>El Espejo del Mendigo</h3>
                    <p className="text-[10px] text-slate-500 italic">Gilson Arévalo Pezo</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black" style={{ color: "#22C55E" }}>10/10</p>
                    <p className="text-[9px] text-slate-500 uppercase tracking-wider">Interfaces</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4">
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-xl font-black" style={{ color: "#22C55E" }}>10</p>
                    <p className="text-[9px] text-slate-500 uppercase">Capítulos</p>
                  </div>
                  <div className="rounded-xl p-3 text-center" style={{ backgroundColor: `${GOLD}08`, border: `1px solid ${BORDER_GOLD}` }}>
                    <p className="text-xl font-black" style={{ color: GOLD }}>Libro 1</p>
                    <p className="text-[9px] text-slate-500 uppercase">Original</p>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-2">Índice de Interfaces</p>
                  <div className="space-y-1">
                    {[
                      { id: "M01", nombre: "El Suelo de Cristal" },
                      { id: "M02", nombre: "La Sequía Eterna" },
                      { id: "M03", nombre: "La Hormiga ante el Gigante" },
                      { id: "M04", nombre: "El Latido de la Carencia" },
                      { id: "M05", nombre: "El Nudo de la Invisibilidad" },
                      { id: "M06", nombre: "La Visión de Túnel" },
                      { id: "M07", nombre: "El Abogado de la Pobreza" },
                      { id: "M08", nombre: "El Heredero Desposeído" },
                      { id: "M09", nombre: "El Nodo Aislado" },
                      { id: "M10", nombre: "El Reboot del Soberano" },
                    ].map((iface) => (
                      <div key={iface.id} className="flex items-center gap-2 py-1">
                        <div
                          className="w-5 h-5 rounded flex items-center justify-center"
                          style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}` }}
                        >
                          <Check size={10} style={{ color: GOLD }} />
                        </div>
                        <span className="text-xs text-white">
                          <span className="font-bold" style={{ color: GOLD }}>{iface.id}</span>
                          {" — "}{iface.nombre}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  onClick={descargarLibroOriginal}
                  disabled={descargandoOriginal}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60"
                  style={{ backgroundColor: GOLD, color: "#050505", border: `1px solid ${GOLD}` }}
                  data-testid="btn-descargar-libro-original"
                >
                  {descargandoOriginal ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                  {descargandoOriginal ? "Compilando..." : "Descargar Libro Completo (10 interfaces)"}
                </button>

                {totalCapitulos > 0 && (
                  <button
                    onClick={descargarLibro}
                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-all mt-2 hover:bg-white/5"
                    style={{ backgroundColor: "transparent", color: "#555", border: `1px solid rgba(255,255,255,0.06)` }}
                    data-testid="btn-descargar-libro"
                  >
                    <Download size={12} />
                    Descargar solo capítulos generados ({totalCapitulos})
                  </button>
                )}
                <p className="text-[10px] text-slate-600 text-center mt-2">
                  Se descarga como HTML. Ábrelo en el navegador → Ctrl+P → Guardar como PDF para Amazon KDP.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mb-4">
          <button
            onClick={() => setShowPolosSection(!showPolosSection)}
            className="w-full flex items-center justify-center gap-2 p-3 rounded-xl text-xs font-bold transition-colors"
            style={{
              backgroundColor: showPolosSection ? `${GOLD}20` : CARD_BG,
              color: showPolosSection ? GOLD : "#64748b",
              border: `1px solid ${showPolosSection ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-polos"
          >
            <Sparkles size={14} />
            Generador de Polos — Tensión Mendigo vs Soberano
          </button>
        </div>

        <AnimatePresence>
          {showPolosSection && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-4">
              <button
                onClick={handleGenerarDiagnostico}
                disabled={generatingDiagnostico}
                className="w-full p-4 rounded-xl text-xs font-bold flex items-center justify-center gap-3 disabled:opacity-40 transition-all hover:scale-[1.01]"
                style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}`, color: GOLD }}
                data-testid="btn-generar-diagnostico"
              >
                {generatingDiagnostico ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                {generatingDiagnostico ? "Ejecutando Protocolo de Intervención Clínica..." : "Comando de Producción: Diagnóstico Soberano"}
                <span className="text-[10px] text-slate-500 ml-1">M01 / M05 / M08</span>
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={handleGenerarPolos}
                  disabled={generatingPolos}
                  className="p-4 rounded-xl text-xs font-bold flex flex-col items-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}`, color: GOLD }}
                  data-testid="btn-generar-polos"
                >
                  {generatingPolos ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
                  {generatingPolos ? "Generando..." : "3 Guiones de Polos"}
                  <span className="text-[10px] text-slate-500">M01 / M03 / M05</span>
                </button>
                <button
                  onClick={handleGenerarContraportada}
                  disabled={generatingContraportada}
                  className="p-4 rounded-xl text-xs font-bold flex flex-col items-center gap-2 disabled:opacity-40"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}`, color: GOLD }}
                  data-testid="btn-generar-contraportada"
                >
                  {generatingContraportada ? <Loader2 size={18} className="animate-spin" /> : <BookOpen size={18} />}
                  {generatingContraportada ? "Generando..." : "3 Contraportadas"}
                  <span className="text-[10px] text-slate-500">Gilson Arévalo Pezo</span>
                </button>
              </div>

              {polosResult && polosResult.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Guiones de Polos Generados</h4>
                  {polosResult.map((g: any, idx: number) => {
                    const fk = `polo-${idx}`;
                    const fullText = `${g.titulo}\n\nPOLO NEGATIVO:\n${g.polo_negativo}\n\nPOLO POSITIVO:\n${g.polo_positivo}\n\nHOOK:\n${g.hook}\n\nVALOR:\n${g.valor}\n\nCTA:\n${g.cta}`;
                    return (
                      <div key={idx} className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>{g.interfaz}</span>
                            <span className="text-white text-xs font-bold">{g.titulo}</span>
                          </div>
                          <button onClick={() => copyToClipboard(fullText, fk)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}15`, color: GOLD }} data-testid={`btn-copy-polo-${idx}`}>
                            {copiedField === fk ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div><span className="text-[10px] font-bold uppercase tracking-wider text-red-400">Polo Negativo</span><p className="text-slate-400 text-xs">{g.polo_negativo}</p></div>
                          <div><span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Polo Positivo</span><p className="text-slate-400 text-xs">{g.polo_positivo}</p></div>
                          <div><span className="text-[10px] font-bold uppercase tracking-wider text-red-300">Hook</span><p className="text-slate-300 text-xs">{g.hook}</p></div>
                          <div><span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">Valor</span><p className="text-slate-300 text-xs">{g.valor}</p></div>
                          <div><span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>CTA</span><p className="text-slate-300 text-xs">{g.cta}</p></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {diagnosticoResult && diagnosticoResult.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Diagnóstico Soberano — Protocolo de Intervención Clínica</h4>
                  {diagnosticoResult.map((g: any, idx: number) => {
                    const fk = `diag-${idx}`;
                    const fullText = `${g.titulo_clickbait}\n\n--- GUION (60s) ---\n${g.guion}\n\n--- POLO NEGATIVO ---\n${g.polo_negativo}\n\n--- POLO POSITIVO ---\n${g.polo_positivo}\n\n--- CTA ---\n${g.cta}\n\n--- ETIQUETAS SEO ---\n${(g.etiquetas_seo || []).join(", ")}\n\n--- VISUAL DE FONDO ---\n${g.visual_fondo}`;
                    return (
                      <div key={idx} className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}20`, color: GOLD }}>{g.interfaz}</span>
                            <span className="text-white text-sm font-bold">{g.titulo_clickbait}</span>
                          </div>
                          <button onClick={() => copyToClipboard(fullText, fk)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}15`, color: GOLD }} data-testid={`btn-copy-diag-${idx}`}>
                            {copiedField === fk ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <div className="space-y-3 text-sm">
                          <div className="rounded-xl p-3" style={{ backgroundColor: "#050505", border: `1px solid ${BORDER_GOLD}` }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-white block mb-1">Guión (60s)</span>
                            <p className="text-slate-300 text-xs leading-relaxed whitespace-pre-wrap">{g.guion}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(239,68,68,0.05)", border: "1px solid rgba(239,68,68,0.2)" }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-red-400 block mb-1">Polo Negativo</span>
                              <p className="text-slate-400 text-xs">{g.polo_negativo}</p>
                            </div>
                            <div className="rounded-xl p-3" style={{ backgroundColor: "rgba(34,197,94,0.05)", border: "1px solid rgba(34,197,94,0.2)" }}>
                              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400 block mb-1">Polo Positivo</span>
                              <p className="text-slate-400 text-xs">{g.polo_positivo}</p>
                            </div>
                          </div>
                          <div className="rounded-xl p-3" style={{ backgroundColor: `${GOLD}05`, border: `1px solid ${BORDER_GOLD}` }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: GOLD }}>CTA</span>
                            <p className="text-slate-300 text-xs">{g.cta}</p>
                          </div>
                          <div className="rounded-xl p-3" style={{ backgroundColor: "#050505", border: `1px solid ${BORDER_GOLD}` }}>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400 block mb-1">Visual de Fondo</span>
                            <p className="text-slate-400 text-xs italic">{g.visual_fondo}</p>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {(g.etiquetas_seo || []).map((tag: string, ti: number) => (
                              <span key={ti} className="text-[9px] px-2 py-0.5 rounded-full" style={{ backgroundColor: `${GOLD}10`, color: `${GOLD}90`, border: `1px solid ${BORDER_GOLD}` }}>{tag}</span>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {contraportadasResult && contraportadasResult.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>Contraportadas Generadas — Gilson Arévalo Pezo</h4>
                  {contraportadasResult.map((c: any, idx: number) => {
                    const fk = `contra-${idx}`;
                    const fullText = `${c.titulo_gancho}\n\n${c.texto}\n\n${c.autor_bio}`;
                    return (
                      <div key={idx} className="rounded-2xl p-5" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <FileText size={14} style={{ color: GOLD }} />
                            <span className="text-xs font-bold" style={{ color: GOLD }}>Versión {c.version || idx + 1} — {c.enfoque}</span>
                          </div>
                          <button onClick={() => copyToClipboard(fullText, fk)} className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs" style={{ backgroundColor: `${GOLD}15`, color: GOLD }} data-testid={`btn-copy-contra-${idx}`}>
                            {copiedField === fk ? <Check size={12} /> : <Copy size={12} />}
                          </button>
                        </div>
                        <p className="text-white text-lg font-black mb-3" data-testid={`text-contra-gancho-${idx}`}>{c.titulo_gancho}</p>
                        <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap mb-3" data-testid={`text-contra-texto-${idx}`}>{c.texto}</p>
                        <p className="text-xs italic" style={{ color: `${GOLD}80` }}>{c.autor_bio}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 mb-4">
          <button
            onClick={() => setShowFabrica(!showFabrica)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: showFabrica ? `linear-gradient(135deg, ${GOLD}30 0%, #00FFC310 100%)` : CARD_BG,
              color: showFabrica ? GOLD : "#64748b",
              border: `1px solid ${showFabrica ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-fabrica"
          >
            <Factory size={16} />
            Fábrica Sensorial — Pipeline Audiovisual
            {(() => {
              const generatedCount = INTERFACES.filter(i => getPiezaForInterfaz(i.id)).length;
              return generatedCount > 0 ? (
                <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `#00FFC320`, color: "#00FFC3" }}>
                  {generatedCount}/10
                </span>
              ) : null;
            })()}
          </button>
        </div>

        <AnimatePresence>
          {showFabrica && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 mb-6">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Genera guiones con IA y renderiza video real (ElevenLabs + DALL-E 3 + FFmpeg).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTERFACES.map((iface) => {
                  const existingPieza = getPiezaForInterfaz(iface.id);
                  const isGenerating = generatingPiezaSingle[iface.id];
                  const isRendering = !!renderingVideo[iface.id];
                  const videoReady = renderedVideos[iface.id];
                  return (
                    <div
                      key={iface.id}
                      className="rounded-xl p-3 transition-all"
                      style={{
                        backgroundColor: videoReady ? `#00FFC310` : existingPieza ? `#00FFC308` : CARD_BG,
                        border: `1px solid ${videoReady ? "#00FFC350" : existingPieza ? "#00FFC330" : BORDER_GOLD}`,
                      }}
                      data-testid={`fabrica-card-${iface.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: `#00FFC315`, color: "#00FFC3" }}>
                            {iface.id}
                          </span>
                          <span className="text-[11px] text-white font-bold">{iface.nombre}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          {existingPieza && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `#00FFC315`, color: "#00FFC3" }}>TEXTO</span>
                          )}
                          {videoReady && (
                            <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `#FF313115`, color: "#FF3131" }}>VIDEO</span>
                          )}
                        </div>
                      </div>
                      <p className="text-[9px] text-slate-500 mb-2">{iface.falla}</p>
                      <div className="flex gap-2 mb-2">
                        {existingPieza ? (
                          <button
                            onClick={() => setPreviewPieza(existingPieza)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors hover:bg-white/5"
                            style={{ border: `1px solid #00FFC330`, color: "#00FFC3" }}
                            data-testid={`btn-preview-pieza-${iface.id}`}
                          >
                            <Eye size={12} />
                            Ver Guion
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleGenerarPiezaSingle(iface.id)}
                          disabled={isGenerating || isRendering}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-40"
                          style={{
                            background: isGenerating ? `${GOLD}20` : `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`,
                            color: isGenerating ? GOLD : "#000",
                            border: isGenerating ? `1px solid ${BORDER_GOLD}` : "none",
                          }}
                          data-testid={`btn-generar-pieza-${iface.id}`}
                        >
                          {isGenerating ? (
                            <><Loader2 size={12} className="animate-spin" /> Generando...</>
                          ) : (
                            <><Zap size={12} /> {existingPieza ? "Regenerar" : "Generar Texto"}</>
                          )}
                        </button>
                      </div>
                      {existingPieza && (
                        <div className="flex gap-2">
                          {videoReady ? (
                            <a
                              href={videoReady.downloadUrl}
                              download={videoReady.filename}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors hover:opacity-80"
                              style={{ background: "linear-gradient(135deg, #00FFC3 0%, #00B89C 100%)", color: "#000" }}
                              data-testid={`btn-download-video-${iface.id}`}
                            >
                              <Download size={12} />
                              Descargar MP4
                            </a>
                          ) : null}
                          <button
                            onClick={() => handleRenderVideo(iface.id)}
                            disabled={isRendering}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-60"
                            style={{
                              background: isRendering ? `#FF313120` : `linear-gradient(135deg, #FF3131 0%, #CC2020 100%)`,
                              color: isRendering ? "#FF3131" : "#fff",
                              border: isRendering ? `1px solid #FF313140` : "none",
                            }}
                            data-testid={`btn-render-video-${iface.id}`}
                          >
                            {isRendering ? (
                              <><Loader2 size={12} className="animate-spin" /> Renderizando...</>
                            ) : (
                              <><Video size={12} /> {videoReady ? "Re-renderizar" : "Renderizar Video"}</>
                            )}
                          </button>
                        </div>
                      )}
                      {isRendering && (
                        <p className="text-[9px] mt-1.5 font-mono animate-pulse" style={{ color: "#FF3131" }}>
                          Pipeline: ElevenLabs → DALL-E 3 → FFmpeg...
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {(lotesFabrica || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1 mb-2">Lotes anteriores (generados en batch)</p>
                  {(lotesFabrica || []).map((lote) => (
                    <div key={lote.id} className="rounded-2xl overflow-hidden mb-2" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                      <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER_GOLD}` }}>
                        <div>
                          <p className="text-xs font-bold text-white" data-testid={`lote-title-${lote.id}`}>Lote — {lote.total_piezas} piezas</p>
                          <p className="text-[10px] text-slate-500">
                            {lote.createdAt instanceof Date ? lote.createdAt.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : ""}
                          </p>
                        </div>
                        <span className="text-[10px] font-mono px-2 py-1 rounded" style={{ backgroundColor: `#00FFC315`, color: "#00FFC3", border: "1px solid #00FFC330" }}>
                          {lote.piezas?.length || 0} piezas
                        </span>
                      </div>
                      <div className="grid grid-cols-5 gap-0.5 p-1">
                        {(lote.piezas || []).map((pieza, idx) => (
                          <button key={idx} onClick={() => setPreviewPieza(pieza)} className="p-2 rounded-lg text-center transition-all hover:scale-[1.03]" style={{ backgroundColor: `${GOLD}06` }} data-testid={`pieza-${lote.id}-${pieza.interfaz}`}>
                            <span className="text-[9px] font-mono font-bold block" style={{ color: "#00FFC3" }}>{pieza.interfaz}</span>
                            <p className="text-[8px] text-white font-bold mt-0.5 line-clamp-1">{pieza.titulo_pieza}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="mt-6 mb-4">
          <button
            onClick={() => setShowYouTube(!showYouTube)}
            className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm font-bold transition-colors"
            style={{
              background: showYouTube ? `linear-gradient(135deg, #FF000030 0%, ${GOLD}20 100%)` : CARD_BG,
              color: showYouTube ? "#FF4444" : "#64748b",
              border: `1px solid ${showYouTube ? "#FF4444" : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-youtube"
          >
            <Youtube size={16} />
            YouTube Educator — 10 Masterclasses
            {(() => {
              const generatedCount = INTERFACES.filter(i => getMcForInterfaz(i.id)).length;
              return generatedCount > 0 ? (
                <span className="text-[10px] ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: "#FF444420", color: "#FF4444" }}>
                  {generatedCount}/10
                </span>
              ) : null;
            })()}
          </button>
        </div>

        <AnimatePresence>
          {showYouTube && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="space-y-3 mb-6">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1">Genera una masterclass por interfaz. Solo texto (guiones, títulos, SEO, shorts). Luego renderiza el video completo (~12 min).</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {INTERFACES.map((iface) => {
                  const existingMc = getMcForInterfaz(iface.id);
                  const isGenerating = generatingMcSingle[iface.id];
                  const isRenderingYT = !!renderingMcYT[iface.id];
                  const renderedYT = renderedMcYT[iface.id];
                  const elapsedYT = renderYTElapsed[iface.id] ?? 0;
                  const elapsedMin = Math.floor(elapsedYT / 60);
                  const elapsedSec = elapsedYT % 60;
                  const elapsedStr = `${elapsedMin}:${String(elapsedSec).padStart(2, "0")}`;
                  return (
                    <div
                      key={iface.id}
                      className="rounded-xl p-3 transition-all"
                      style={{
                        backgroundColor: existingMc ? `#FF444408` : CARD_BG,
                        border: `1px solid ${existingMc ? "#FF444430" : BORDER_GOLD}`,
                      }}
                      data-testid={`mc-card-${iface.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FF444415", color: "#FF4444" }}>
                            {iface.id}
                          </span>
                          <span className="text-[11px] text-white font-bold">{iface.nombre}</span>
                        </div>
                        {existingMc && (
                          <span className="text-[8px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#FF444415", color: "#FF4444" }}>GENERADA</span>
                        )}
                      </div>
                      <p className="text-[9px] text-slate-500 mb-1">{iface.falla}</p>
                      {existingMc && (
                        <p className="text-[9px] text-white/60 mb-2 line-clamp-1 italic">"{existingMc.titulos?.miedo || existingMc.nombre_interfaz}"</p>
                      )}
                      <div className="flex gap-2">
                        {existingMc ? (
                          <button
                            onClick={() => setPreviewMasterclass(existingMc)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors hover:bg-white/5"
                            style={{ border: `1px solid #FF444430`, color: "#FF4444" }}
                            data-testid={`btn-preview-mc-${iface.id}`}
                          >
                            <Eye size={12} />
                            Ver Masterclass
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleGenerarMasterclassSingle(iface.id)}
                          disabled={isGenerating}
                          className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-40"
                          style={{
                            background: isGenerating ? `#FF444420` : `linear-gradient(135deg, #FF0000 0%, #CC0000 100%)`,
                            color: isGenerating ? "#FF4444" : "#fff",
                            border: isGenerating ? `1px solid #FF444430` : "none",
                          }}
                          data-testid={`btn-generar-mc-${iface.id}`}
                        >
                          {isGenerating ? (
                            <><Loader2 size={12} className="animate-spin" /> Generando...</>
                          ) : (
                            <><Youtube size={12} /> {existingMc ? "Regenerar" : "Generar"}</>
                          )}
                        </button>
                      </div>
                      {existingMc && (
                        <div className="flex gap-2 mt-2">
                          {renderedYT ? (
                            <a
                              href={renderedYT.downloadUrl}
                              download={renderedYT.filename}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors"
                              style={{ background: `linear-gradient(135deg, #00C851 0%, #007E33 100%)`, color: "#fff" }}
                              data-testid={`btn-download-mc-yt-${iface.id}`}
                            >
                              <Download size={12} />
                              Descargar MP4 (~12 min)
                            </a>
                          ) : (
                            <button
                              onClick={() => handleRenderMasterclassYT(iface.id)}
                              disabled={isRenderingYT}
                              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[10px] font-bold transition-colors disabled:opacity-40"
                              style={{
                                background: isRenderingYT ? `#FF444420` : `linear-gradient(135deg, #D4AF37 0%, #B8960C 100%)`,
                                color: isRenderingYT ? "#FF4444" : "#000",
                                border: isRenderingYT ? `1px solid #FF444430` : "none",
                              }}
                              data-testid={`btn-render-mc-yt-${iface.id}`}
                            >
                              {isRenderingYT ? (
                                <><Loader2 size={12} className="animate-spin" /> Procesando... {elapsedStr} — no cierres esta pantalla</>
                              ) : existingMc.video_url ? (
                                <><Video size={12} /> Re-renderizar Masterclass</>
                              ) : (
                                <><Video size={12} /> Renderizar Masterclass (~12 min)</>
                              )}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {(lotesMasterclass || []).length > 0 && (
                <div className="mt-4">
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider px-1 mb-2">Lotes anteriores (generados en batch)</p>
                  {(lotesMasterclass || []).map((lote) => (
                    <div key={lote.id} className="rounded-2xl overflow-hidden mb-2" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                      <div className="p-3 flex items-center justify-between" style={{ borderBottom: `1px solid ${BORDER_GOLD}` }}>
                        <div>
                          <p className="text-xs font-bold text-white flex items-center gap-2" data-testid={`mc-lote-title-${lote.id}`}>
                            <Youtube size={14} style={{ color: "#FF4444" }} />
                            Lote — {lote.total} videos
                          </p>
                          <p className="text-[10px] text-slate-500">
                            {lote.createdAt instanceof Date ? lote.createdAt.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" }) : ""}
                          </p>
                        </div>
                      </div>
                      <div className="grid grid-cols-5 gap-0.5 p-1">
                        {(lote.masterclasses || []).map((mc, idx) => (
                          <button key={idx} onClick={() => setPreviewMasterclass(mc)} className="p-2 rounded-lg text-center transition-all hover:scale-[1.03]" style={{ backgroundColor: `${GOLD}06` }} data-testid={`mc-card-lote-${lote.id}-${mc.interfaz}`}>
                            <span className="text-[9px] font-mono font-bold block" style={{ color: "#FF4444" }}>{mc.interfaz}</span>
                            <p className="text-[8px] text-white font-bold mt-0.5 line-clamp-1">{mc.titulos?.miedo || mc.nombre_interfaz}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Estratega IA ─────────────────────────────────────── */}
        <button
          onClick={() => setShowEstrategia(!showEstrategia)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all mt-2"
          style={{
            backgroundColor: showEstrategia ? `#00FFC308` : CARD_BG,
            border: `1px solid ${showEstrategia ? "#00FFC330" : BORDER_GOLD}`,
          }}
          data-testid="btn-toggle-estrategia"
        >
          <div className="flex items-center gap-2">
            <MessageSquare size={14} style={{ color: "#00FFC3" }} />
            <span className="text-xs font-bold text-white">Estratega IA — Planificación de Videos</span>
            {chatMessages.length > 0 && (
              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#00FFC315", color: "#00FFC3" }}>
                {chatMessages.length} msgs
              </span>
            )}
          </div>
          <ChevronDown size={14} style={{ color: "#00FFC3", transform: showEstrategia ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
        </button>

        <AnimatePresence>
          {showEstrategia && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl mt-1 overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid #00FFC320` }}>
                <div className="px-3 pt-2 pb-1 flex items-center justify-between" style={{ borderBottom: `1px solid #00FFC315` }}>
                  <p className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">Asesor de estrategia • Contexto del libro completo</p>
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => setChatMessages([])}
                      className="flex items-center gap-1 text-[9px] px-2 py-0.5 rounded transition-colors hover:bg-white/5"
                      style={{ color: "#FF4444", border: `1px solid #FF444420` }}
                      data-testid="btn-clear-chat"
                    >
                      <Trash2 size={9} /> Limpiar
                    </button>
                  )}
                </div>

                {/* Messages area */}
                <div
                  className="p-3 space-y-3 overflow-y-auto"
                  style={{ minHeight: "120px", maxHeight: "420px" }}
                >
                  {chatMessages.length === 0 && !chatLoading && (
                    <div className="text-center py-6">
                      <MessageSquare size={24} className="mx-auto mb-2" style={{ color: "#00FFC330" }} />
                      <p className="text-[10px] text-slate-500 font-mono">Haz una pregunta sobre tu estrategia de video.</p>
                      <p className="text-[9px] text-slate-600 mt-1">Ej: "¿Qué interfaz publico primero?", "Mejora el gancho de M03"</p>
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed whitespace-pre-wrap ${msg.role === "assistant" ? "font-mono" : ""}`}
                        style={msg.role === "user"
                          ? { backgroundColor: `${GOLD}18`, color: "#fff", border: `1px solid ${GOLD}30` }
                          : { backgroundColor: "#00FFC308", color: "#00FFC3", border: `1px solid #00FFC320` }
                        }
                      >
                        {msg.role === "assistant" && (
                          <span className="text-[8px] font-mono text-slate-500 block mb-1">ESTRATEGA IA</span>
                        )}
                        {msg.content}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="px-3 py-2 rounded-xl" style={{ backgroundColor: "#00FFC308", border: `1px solid #00FFC320` }}>
                        <div className="flex items-center gap-1.5">
                          <Loader2 size={10} className="animate-spin" style={{ color: "#00FFC3" }} />
                          <span className="text-[10px] font-mono" style={{ color: "#00FFC3" }}>Procesando...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* Input area */}
                <div className="px-3 pb-3 pt-1" style={{ borderTop: `1px solid #00FFC315` }}>
                  <div className="flex gap-2 items-end">
                    <textarea
                      value={chatInput}
                      onChange={e => setChatInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleChatSend();
                        }
                      }}
                      placeholder="Escribe tu pregunta... (Enter para enviar, Shift+Enter para nueva línea)"
                      rows={2}
                      className="flex-1 resize-none rounded-xl px-3 py-2 text-[11px] placeholder-slate-600 outline-none"
                      style={{
                        backgroundColor: "#0a0a14",
                        border: `1px solid #00FFC320`,
                        color: "#fff",
                        fontFamily: "monospace",
                      }}
                      disabled={chatLoading}
                      data-testid="input-chat-estrategia"
                    />
                    <button
                      onClick={handleChatSend}
                      disabled={chatLoading || !chatInput.trim()}
                      className="flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30"
                      style={{ background: `linear-gradient(135deg, #00FFC3 0%, #00B890 100%)`, color: "#000" }}
                      data-testid="btn-send-chat"
                    >
                      {chatLoading ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewPieza && (
            <PreviewSensorial pieza={previewPieza} onClose={() => setPreviewPieza(null)} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {previewMasterclass && (
            <PreviewMasterclass masterclass={previewMasterclass} onClose={() => setPreviewMasterclass(null)} />
          )}
        </AnimatePresence>

        {/* ── API PÚBLICA ─────────────────────────────────────── */}
        <div className="mt-4">
          <button
            onClick={() => { setShowApiKeys(!showApiKeys); if (!showApiKeys) loadApiKeys(); }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
            style={{
              backgroundColor: showApiKeys ? `#00FFC308` : CARD_BG,
              border: `1px solid ${showApiKeys ? "#00FFC330" : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-api-keys"
          >
            <div className="flex items-center gap-2">
              <Zap size={14} style={{ color: "#00FFC3" }} />
              <span className="text-xs font-bold text-white">API Pública — Detección de Interfaz</span>
              {apiKeys.filter(k => k.active).length > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: "#00FFC315", color: "#00FFC3" }}>
                  {apiKeys.filter(k => k.active).length} activa{apiKeys.filter(k => k.active).length !== 1 ? "s" : ""}
                </span>
              )}
            </div>
            <ChevronDown size={14} style={{ color: "#00FFC3", transform: showApiKeys ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {showApiKeys && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="rounded-2xl mt-1 p-4 space-y-4" style={{ backgroundColor: CARD_BG, border: `1px solid #00FFC320` }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[9px] font-mono uppercase tracking-widest" style={{ color: "#00FFC380" }}>Endpoint</span>
                  <code className="text-[9px] font-mono px-2 py-0.5 rounded" style={{ backgroundColor: "#00FFC310", color: "#00FFC3" }}>
                    POST /api/public/detect-interface
                  </code>
                  <button
                    onClick={() => window.open("/api/public/docs", "_blank")}
                    className="text-[8px] px-2 py-0.5 rounded transition-colors"
                    style={{ backgroundColor: "#00FFC310", color: "#00FFC380", border: "1px solid #00FFC320" }}
                    data-testid="btn-api-docs"
                  >
                    Ver docs JSON
                  </button>
                </div>

                {/* Revealed key warning */}
                <AnimatePresence>
                  {revealedApiKey && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.98 }}
                      className="rounded-xl p-3 space-y-2"
                      style={{ backgroundColor: "#D4AF3712", border: "1px solid #D4AF3740" }}
                    >
                      <p className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>
                        ⚠ Copia esta clave ahora — no se mostrará de nuevo
                      </p>
                      <p className="text-[9px] text-slate-400 font-mono">Cliente: {revealedApiKey.clientName}</p>
                      <div className="flex items-center gap-2">
                        <code
                          className="flex-1 text-[10px] font-mono px-2 py-1.5 rounded break-all"
                          style={{ backgroundColor: "#00000060", color: "#00FFC3", border: "1px solid #00FFC320" }}
                          data-testid="text-revealed-api-key"
                        >
                          {revealedApiKey.key}
                        </code>
                        <button
                          onClick={() => { navigator.clipboard.writeText(revealedApiKey.key); toast.success("Clave copiada"); }}
                          className="px-2 py-1.5 rounded text-[9px] flex-shrink-0"
                          style={{ backgroundColor: "#00FFC320", color: "#00FFC3" }}
                          data-testid="btn-copy-revealed-key"
                        >
                          <Copy size={10} />
                        </button>
                      </div>
                      <button
                        onClick={() => setRevealedApiKey(null)}
                        className="text-[8px] text-slate-600 hover:text-slate-400 transition-colors"
                        data-testid="btn-dismiss-revealed-key"
                      >
                        Ya copié la clave ×
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Create new key */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newClientName}
                    onChange={e => setNewClientName(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleCreateApiKey()}
                    placeholder="Nombre del cliente (ej: AppXYZ, Cliente Empresa A)"
                    className="flex-1 px-3 py-2 rounded-lg text-[11px] outline-none"
                    style={{ backgroundColor: "#0a0a14", border: "1px solid #00FFC320", color: "#e2e8f0" }}
                    data-testid="input-new-client-name"
                  />
                  <button
                    onClick={handleCreateApiKey}
                    disabled={creatingApiKey || !newClientName.trim()}
                    className="px-4 py-2 rounded-lg text-[11px] font-bold transition-all disabled:opacity-40"
                    style={{ backgroundColor: "#00FFC320", color: "#00FFC3", border: "1px solid #00FFC340" }}
                    data-testid="btn-create-api-key"
                  >
                    {creatingApiKey ? <Loader2 size={12} className="animate-spin" /> : "Generar clave"}
                  </button>
                </div>

                {/* Keys list */}
                {apiKeysLoading ? (
                  <div className="flex justify-center py-4">
                    <Loader2 size={16} className="animate-spin text-slate-600" />
                  </div>
                ) : apiKeys.length === 0 ? (
                  <p className="text-[10px] text-slate-600 text-center py-3 font-mono">No hay API keys creadas aún.</p>
                ) : (
                  <div className="space-y-2">
                    {apiKeys.map(key => (
                      <div
                        key={key.id}
                        className="px-3 py-2.5 rounded-xl"
                        style={{
                          backgroundColor: key.active ? "#00FFC308" : "#0a0a0a",
                          border: `1px solid ${key.active ? "#00FFC320" : "#1e293b"}`,
                          opacity: key.active ? 1 : 0.5,
                        }}
                        data-testid={`row-api-key-${key.id}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className="w-2 h-2 rounded-full flex-shrink-0"
                              style={{ backgroundColor: key.active ? "#00FFC3" : "#64748b" }}
                            />
                            <div className="min-w-0">
                              <p className="text-[11px] font-bold text-white truncate" data-testid={`text-key-client-${key.id}`}>
                                {key.client_name}
                              </p>
                              <p className="text-[9px] font-mono" style={{ color: "#475569" }}>
                                {key.key_prefix}…{" "}
                                <span style={{ color: "#334155" }}>
                                  {new Date(key.created_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                                </span>
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span
                              className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                              style={{ backgroundColor: "#00FFC310", color: "#00FFC380" }}
                              data-testid={`text-key-usage-${key.id}`}
                            >
                              {key.usage_count}{key.monthly_call_limit ? `/${key.monthly_call_limit}` : ""} calls
                            </span>
                            {key.active && (
                              <button
                                onClick={() => handleRevokeApiKey(key.id)}
                                disabled={revokingKeyId === key.id}
                                className="text-[9px] px-2 py-1 rounded transition-colors"
                                style={{ backgroundColor: "#FF313110", color: "#FF3131", border: "1px solid #FF313120" }}
                                data-testid={`btn-revoke-key-${key.id}`}
                              >
                                {revokingKeyId === key.id ? <Loader2 size={9} className="animate-spin" /> : "Revocar"}
                              </button>
                            )}
                            {!key.active && (
                              <span className="text-[8px] font-mono text-slate-600">revocada</span>
                            )}
                          </div>
                        </div>
                        {/* Plan / buyer info row */}
                        <div className="flex flex-wrap gap-2 mt-1.5 ml-5">
                          {key.plan_id ? (
                            <span
                              className="text-[8px] font-mono px-1.5 py-0.5 rounded capitalize"
                              style={{ backgroundColor: "#D4AF3712", color: "#D4AF37" }}
                              data-testid={`text-key-plan-${key.id}`}
                            >
                              {key.plan_id === "api-starter" ? "Starter" : key.plan_id === "api-pro" ? "Pro" : key.plan_id}
                            </span>
                          ) : (
                            <span className="text-[8px] font-mono text-slate-700">Manual / Sin límite</span>
                          )}
                          {key.buyer_email && (
                            <span className="text-[8px] font-mono text-slate-600 truncate max-w-[140px]" data-testid={`text-key-email-${key.id}`}>
                              {key.buyer_email}
                            </span>
                          )}
                          {key.expires_at && (
                            <span className="text-[8px] font-mono" style={{ color: new Date(key.expires_at) < new Date() ? "#FF3131" : "#475569" }} data-testid={`text-key-expires-${key.id}`}>
                              vence {new Date(key.expires_at).toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}
                            </span>
                          )}
                          {key.delivery_status === "pending" && (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: "#FFA50015", color: "#FFA500" }} data-testid={`text-key-delivery-${key.id}`}>
                              email pendiente
                            </span>
                          )}
                          {key.delivery_status === "failed" && (
                            <span className="text-[8px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: "#FF313115", color: "#FF3131" }} data-testid={`text-key-delivery-${key.id}`}>
                              email fallido
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TALLER DE LIBROS ─────────────────────────────────── */}
        <div className="mt-4">
          <button
            onClick={() => setShowTaller(!showTaller)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all"
            style={{
              backgroundColor: showTaller ? `${GOLD}12` : CARD_BG,
              border: `1px solid ${showTaller ? GOLD : BORDER_GOLD}`,
            }}
            data-testid="btn-toggle-taller"
          >
            <div className="flex items-center gap-2">
              <Library size={14} style={{ color: GOLD }} />
              <span className="text-xs font-bold text-white">Taller de Libros — Serie Espejo</span>
              {(() => {
                const totalSubs = Object.values(tallerAllSubs).reduce((a, v) => a + (v?.length || 0), 0);
                const totalCaps = Object.values(tallerAllCaps).filter(c => c.status === "listo" || c.status === "revisado").length;
                return totalCaps > 0 ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOLD}18`, color: GOLD }}>
                    {totalCaps}/100 capítulos
                  </span>
                ) : totalSubs > 0 ? (
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded" style={{ backgroundColor: `${GOLD}18`, color: GOLD }}>
                    {Object.keys(tallerAllSubs).length}/10 libros
                  </span>
                ) : null;
              })()}
            </div>
            <ChevronDown size={14} style={{ color: GOLD, transform: showTaller ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }} />
          </button>
        </div>

        <AnimatePresence>
          {showTaller && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3"
            >
              {/* Grid selector de interfaces */}
              {!tallerInterfaz ? (
                <div className="rounded-2xl p-4" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                  <p className="text-[10px] uppercase tracking-wider font-bold mb-3" style={{ color: GOLD }}>Selecciona el Libro (Interfaz)</p>
                  <p className="text-[10px] text-slate-600 mb-4">Cada libro = 1 Interfaz × 10 Capítulos × 3 Carriles (El Mensaje / El Lector / El Maestro)</p>
                  <div className="grid grid-cols-2 gap-2">
                    {INTERFACES.map(iface => {
                      const subsCount = (tallerAllSubs[iface.id] || []).length;
                      const capsCount = Object.values(tallerAllCaps).filter(c => c.interfazId === iface.id && (c.status === "listo" || c.status === "revisado")).length;
                      const capsForBook = Object.values(tallerAllCaps).filter(c => c.interfazId === iface.id);
                      let fichaTotal = 0;
                      let fichaPassed = 0;
                      for (const cap of capsForBook) {
                        if (cap.fichaAudit) {
                          for (const result of Object.values(cap.fichaAudit)) {
                            fichaTotal++;
                            if (result.passed) fichaPassed++;
                          }
                        }
                      }
                      const fichaAllPassed = fichaTotal > 0 && fichaPassed === fichaTotal;
                      return (
                        <button
                          key={iface.id}
                          onClick={() => setTallerInterfaz(iface.id)}
                          className="flex flex-col items-start gap-1 p-3 rounded-xl transition-all text-left"
                          style={{ backgroundColor: subsCount > 0 ? `${GOLD}10` : "#0a0a14", border: `1px solid ${subsCount > 0 ? GOLD : BORDER_GOLD}` }}
                          data-testid={`btn-taller-select-${iface.id}`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className="text-xs font-black" style={{ color: GOLD }}>{iface.id}</span>
                            <div className="flex items-center gap-1">
                              {fichaTotal > 0 && (
                                <span
                                  className="text-[9px] font-mono px-1 py-0.5 rounded"
                                  style={{
                                    backgroundColor: fichaAllPassed ? "#00C85120" : "#FF313120",
                                    color: fichaAllPassed ? "#00C851" : "#FF3131",
                                    border: `1px solid ${fichaAllPassed ? "#00C85140" : "#FF313140"}`,
                                  }}
                                  title={`FICHA: ${fichaPassed} de ${fichaTotal} carriles aprobados`}
                                  data-testid={`ficha-score-${iface.id}`}
                                >
                                  {fichaPassed}/{fichaTotal} {fichaAllPassed ? "✓" : "✗"}
                                </span>
                              )}
                              {capsCount > 0 && (
                                <span className="text-[9px] font-mono px-1 py-0.5 rounded" style={{ backgroundColor: "#00FFC315", color: "#00FFC3" }}>
                                  {capsCount}/10
                                </span>
                              )}
                            </div>
                          </div>
                          <span className="text-[10px] font-bold leading-tight" style={{ color: GOLD }}>{TITULOS_LIBROS[iface.id] || iface.id}</span>
                          <span className="text-[9px] text-slate-500 leading-tight">{iface.nombre}</span>
                          <span className="text-[9px] text-slate-600 leading-tight">{iface.falla}</span>
                          {subsCount > 0 && capsCount === 0 && (
                            <span className="text-[8px] font-mono" style={{ color: `${GOLD}60` }}>10 capítulos sin generar</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: CARD_BG, border: `1px solid ${BORDER_GOLD}` }}>
                  {/* Header del libro seleccionado */}
                  <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${BORDER_GOLD}` }}>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => { setTallerInterfaz(null); setTallerSubInterfaces([]); setTallerCapitulos({}); setTallerNotas({}); setShowEvolucionCompleta(false); }}
                        className="w-7 h-7 rounded-lg flex items-center justify-center transition-colors hover:bg-white/10"
                        style={{ border: `1px solid ${BORDER_GOLD}` }}
                        data-testid="btn-taller-back"
                      >
                        <ArrowLeft size={12} style={{ color: GOLD }} />
                      </button>
                      <div>
                        <p className="text-[10px] font-mono uppercase tracking-widest" style={{ color: GOLD }}>{tallerInterfaz}</p>
                        <p className="text-sm font-bold" style={{ color: GOLD }}>{TITULOS_LIBROS[tallerInterfaz] || tallerInterfaz}</p>
                        <p className="text-[10px] text-slate-500 leading-tight">{INTERFACES.find(i => i.id === tallerInterfaz)?.nombre}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Toggle: Inyectar Notas de Evolución */}
                      {Object.values(tallerNotas).some(e => e.notas.length > 0) && (
                        <button
                          onClick={() => setInyectarNotasEvolucion(prev => !prev)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all"
                          style={{
                            backgroundColor: inyectarNotasEvolucion ? "#00FFC315" : "transparent",
                            border: `1px solid ${inyectarNotasEvolucion ? "#00FFC340" : "#ffffff20"}`,
                            color: inyectarNotasEvolucion ? "#00FFC3" : "#ffffff40",
                          }}
                          title={inyectarNotasEvolucion ? "Desactivar inyección de notas de evolución en el prompt" : "Activar inyección de notas de evolución en el prompt"}
                          data-testid="toggle-inyectar-notas-evolucion"
                        >
                          <div
                            className="w-2.5 h-2.5 rounded-full transition-colors"
                            style={{ backgroundColor: inyectarNotasEvolucion ? "#00FFC3" : "#ffffff30" }}
                          />
                          Evolución al prompt
                        </button>
                      )}
                      {/* Ver Evolución Completa */}
                      {Object.values(tallerNotas).some(e => e.notas.length > 0) && (
                        <button
                          onClick={() => setShowEvolucionCompleta(true)}
                          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[9px] font-bold uppercase tracking-widest transition-all"
                          style={{ backgroundColor: "#00FFC315", border: "1px solid #00FFC340", color: "#00FFC3" }}
                          title="Ver todas las notas de evolución del libro en pantalla completa"
                          data-testid="btn-ver-evolucion-completa"
                        >
                          <Maximize2 size={10} />
                          Ver Evolución Completa
                        </button>
                      )}
                      {/* Tabs de vista */}
                      <div className="flex items-center rounded-xl overflow-hidden" style={{ border: `1px solid ${BORDER_GOLD}` }}>
                        <button
                          onClick={() => setTallerVista("capitulos")}
                          className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all"
                          style={{ backgroundColor: tallerVista === "capitulos" ? `${GOLD}25` : "transparent", color: tallerVista === "capitulos" ? GOLD : "#ffffff50" }}
                          data-testid="btn-vista-capitulos"
                        >
                          Capítulos
                        </button>
                        <div style={{ width: "1px", backgroundColor: BORDER_GOLD, alignSelf: "stretch" }} />
                        <button
                          onClick={() => setTallerVista("evolucion")}
                          className="px-2.5 py-1.5 text-[9px] font-bold uppercase tracking-widest transition-all flex items-center gap-1"
                          style={{ backgroundColor: tallerVista === "evolucion" ? "#00FFC320" : "transparent", color: tallerVista === "evolucion" ? "#00FFC3" : "#ffffff50" }}
                          data-testid="btn-vista-evolucion"
                        >
                          Evolución
                          {Object.keys(tallerNotas).length > 0 && (() => {
                            const total = Object.values(tallerNotas).reduce((acc, e) => acc + e.notas.length, 0);
                            return total > 0 ? <span className="text-[7px] px-1 py-0.5 rounded font-mono" style={{ backgroundColor: "#00FFC325", color: "#00FFC3" }}>{total}</span> : null;
                          })()}
                        </button>
                      </div>
                      {tallerSubInterfaces.length > 0 && Object.keys(tallerCapitulos).length > 0 && (
                        <button
                          onClick={compilarLibroTaller}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[10px] font-bold transition-all"
                          style={{ backgroundColor: `${GOLD}20`, border: `1px solid ${GOLD}`, color: GOLD }}
                          data-testid="btn-compilar-libro-taller"
                        >
                          <Download size={11} />
                          Compilar KDP ({Object.keys(tallerCapitulos).length}/{tallerSubInterfaces.length})
                        </button>
                      )}
                    </div>
                  </div>

                  {/* ════ VISTA: EVOLUCIÓN DEL ALGORITMO ════ */}
                  {tallerVista === "evolucion" && (() => {
                    const todosLosPrincipios: { coordenada: string; subTitulo: string; subId: string; noteIndex: number; nota: NotaEvolucion }[] = [];
                    Object.entries(tallerNotas).forEach(([subId, entry]) => {
                      const subInfo = tallerSubInterfaces.find(s => s.id === subId);
                      entry.notas.forEach((n, ni) => todosLosPrincipios.push({ coordenada: entry.coordenada, subTitulo: subInfo?.titulo || subId, subId, noteIndex: ni, nota: n }));
                    });
                    const porCoordenada: Record<string, { subTitulo: string; notas: { nota: NotaEvolucion; subId: string; noteIndex: number }[] }> = {};
                    todosLosPrincipios.forEach(({ coordenada, subTitulo, subId, noteIndex, nota }) => {
                      if (!porCoordenada[coordenada]) porCoordenada[coordenada] = { subTitulo, notas: [] };
                      porCoordenada[coordenada].notas.push({ nota, subId, noteIndex });
                    });
                    const handleDeleteNota = async (subId: string, noteIndex: number) => {
                      if (!user || !tallerInterfaz) return;
                      const entry = tallerNotas[subId];
                      if (!entry) return;
                      const updatedNotas = entry.notas.filter((_, i) => i !== noteIndex);
                      try {
                        await saveNotasEvolucionLibro(user.uid, tallerInterfaz, subId, entry.coordenada, updatedNotas);
                        toast.success("Nota eliminada", { style: { backgroundColor: CARD_BG, border: "1px solid #FF3131", color: "#FF3131" } });
                      } catch {
                        toast.error("Error al eliminar la nota");
                      }
                    };
                    const handleSaveEditNota = async () => {
                      if (!user || !tallerInterfaz || !editingNota) return;
                      const entry = tallerNotas[editingNota.subId];
                      if (!entry) return;
                      const updatedNotas = entry.notas.map((n, i) =>
                        i === editingNota.noteIndex ? { ...n, titulo: editingNota.titulo, cuerpo: editingNota.cuerpo } : n
                      );
                      try {
                        await saveNotasEvolucionLibro(user.uid, tallerInterfaz, editingNota.subId, entry.coordenada, updatedNotas);
                        setEditingNota(null);
                        toast.success("Nota actualizada", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
                      } catch {
                        toast.error("Error al guardar la nota");
                      }
                    };
                    const coords = Object.keys(porCoordenada).sort();
                    return (
                      <div className="flex flex-col h-full" style={{ minHeight: "400px" }}>
                        {/* Encabezado del panel */}
                        <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #00FFC320", backgroundColor: "#00FFC305" }}>
                          <div>
                            <p className="text-xs font-bold uppercase tracking-widest font-mono" style={{ color: "#00FFC3" }}>
                              Evolución del Algoritmo — {tallerInterfaz}
                            </p>
                            <p className="text-[10px] font-mono mt-0.5" style={{ color: "#00FFC360" }}>
                              {todosLosPrincipios.length} principios emergentes descubiertos en {coords.length} capítulo{coords.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="px-2.5 py-1.5 rounded-xl flex items-center gap-1.5" style={{ backgroundColor: "#00FFC315", border: "1px solid #00FFC330" }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00FFC3" }} />
                              <span className="text-[9px] font-mono font-bold" style={{ color: "#00FFC3" }}>{todosLosPrincipios.length} principios</span>
                            </div>
                          </div>
                        </div>

                        {/* Contenido */}
                        {todosLosPrincipios.length === 0 ? (
                          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#00FFC310", border: "1px solid #00FFC330" }}>
                              <Sparkles size={20} style={{ color: "#00FFC360" }} />
                            </div>
                            <p className="text-sm font-bold mb-1" style={{ color: "#00FFC360" }}>Sin principios aún</p>
                            <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs">
                              Genera capítulos en la vista de Capítulos. Al terminar cada uno, el algoritmo descubrirá y registrará principios emergentes aquí.
                            </p>
                            <button
                              onClick={() => setTallerVista("capitulos")}
                              className="mt-4 px-4 py-2 rounded-xl text-[10px] font-bold transition-all"
                              style={{ border: "1px solid #00FFC330", color: "#00FFC3", backgroundColor: "#00FFC310" }}
                            >
                              Ir a Capítulos
                            </button>
                          </div>
                        ) : (
                          <div className="overflow-y-auto flex-1 p-4 space-y-4">
                            {coords.map(coord => {
                              const grupo = porCoordenada[coord];
                              return (
                                <div key={coord} className="rounded-2xl overflow-hidden" style={{ border: "1px solid #00FFC325", backgroundColor: "#00FFC305" }}>
                                  {/* Encabezado de grupo */}
                                  <div className="px-4 py-2.5 flex items-center gap-3" style={{ borderBottom: "1px solid #00FFC315", backgroundColor: "#00FFC310" }}>
                                    <span className="text-[9px] font-mono font-bold px-2 py-1 rounded-lg flex-shrink-0" style={{ backgroundColor: "#00FFC325", color: "#00FFC3" }}>
                                      {coord}
                                    </span>
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-bold truncate" style={{ color: "#00FFC3" }}>{grupo.subTitulo}</p>
                                      <p className="text-[8px] font-mono" style={{ color: "#00FFC360" }}>{grupo.notas.length} principio{grupo.notas.length !== 1 ? "s" : ""}</p>
                                    </div>
                                  </div>
                                  {/* Principios del grupo */}
                                  <div className="p-3 space-y-2.5">
                                    {grupo.notas.map(({ nota, subId, noteIndex }, ni) => {
                                      const isEditing = editingNota?.subId === subId && editingNota?.noteIndex === noteIndex;
                                      return (
                                        <div key={ni} className="rounded-xl p-3" style={{ backgroundColor: "#0A0A0A", border: `1px solid ${isEditing ? "#00FFC355" : "#00FFC318"}` }}>
                                          {isEditing ? (
                                            <div className="flex flex-col gap-2">
                                              <div className="flex items-center gap-2 mb-1">
                                                <span className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0" style={{ backgroundColor: "#00FFC312", color: "#00FFC380", border: "1px solid #00FFC320" }}>
                                                  {nota.tipo}
                                                </span>
                                                <span className="text-[8px] font-mono" style={{ color: "#00FFC360" }}>Editando</span>
                                              </div>
                                              <input
                                                value={editingNota.titulo}
                                                onChange={e => setEditingNota(prev => prev ? { ...prev, titulo: e.target.value } : null)}
                                                className="w-full rounded-lg px-2.5 py-1.5 text-[11px] font-bold outline-none"
                                                style={{ backgroundColor: "#00FFC308", border: "1px solid #00FFC340", color: "#00FFC3" }}
                                                placeholder="Título"
                                                data-testid={`input-nota-titulo-${subId}-${noteIndex}`}
                                              />
                                              <textarea
                                                value={editingNota.cuerpo}
                                                onChange={e => setEditingNota(prev => prev ? { ...prev, cuerpo: e.target.value } : null)}
                                                rows={3}
                                                className="w-full rounded-lg px-2.5 py-1.5 text-[10px] font-mono outline-none resize-none"
                                                style={{ backgroundColor: "#00FFC308", border: "1px solid #00FFC340", color: "#94a3b8" }}
                                                placeholder="Cuerpo"
                                                data-testid={`textarea-nota-cuerpo-${subId}-${noteIndex}`}
                                              />
                                              <div className="flex items-center gap-2 justify-end">
                                                <button
                                                  onClick={() => setEditingNota(null)}
                                                  className="px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                                                  style={{ border: "1px solid #ffffff20", color: "#ffffff50" }}
                                                  data-testid={`btn-cancel-edit-nota-${subId}-${noteIndex}`}
                                                >
                                                  Cancelar
                                                </button>
                                                <button
                                                  onClick={handleSaveEditNota}
                                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[9px] font-bold transition-all"
                                                  style={{ backgroundColor: "#00FFC320", border: "1px solid #00FFC340", color: "#00FFC3" }}
                                                  data-testid={`btn-save-edit-nota-${subId}-${noteIndex}`}
                                                >
                                                  <Check size={9} />
                                                  Guardar
                                                </button>
                                              </div>
                                            </div>
                                          ) : (
                                            <div className="flex items-start gap-2.5">
                                              <span className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5" style={{ backgroundColor: "#00FFC312", color: "#00FFC380", border: "1px solid #00FFC320" }}>
                                                {nota.tipo}
                                              </span>
                                              <div className="min-w-0 flex-1">
                                                <p className="text-[11px] font-bold leading-snug mb-1" style={{ color: "#00FFC3" }}>{nota.titulo}</p>
                                                <p className="text-[10px] leading-relaxed font-mono" style={{ color: "#94a3b8" }}>{nota.cuerpo}</p>
                                              </div>
                                              <div className="flex items-center gap-1 flex-shrink-0 ml-1">
                                                <button
                                                  onClick={() => setEditingNota({ subId, noteIndex, titulo: nota.titulo, cuerpo: nota.cuerpo })}
                                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-white/10"
                                                  style={{ border: "1px solid #00FFC325", color: "#00FFC360" }}
                                                  title="Editar nota"
                                                  data-testid={`btn-edit-nota-${subId}-${noteIndex}`}
                                                >
                                                  <Edit3 size={9} />
                                                </button>
                                                <button
                                                  onClick={() => handleDeleteNota(subId, noteIndex)}
                                                  className="w-6 h-6 rounded-lg flex items-center justify-center transition-all hover:bg-red-500/10"
                                                  style={{ border: "1px solid #FF313125", color: "#FF313160" }}
                                                  title="Eliminar nota"
                                                  data-testid={`btn-delete-nota-${subId}-${noteIndex}`}
                                                >
                                                  <Trash2 size={9} />
                                                </button>
                                              </div>
                                            </div>
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })()}

                  {/* ════ VISTA: CAPÍTULOS ════ */}
                  {tallerVista === "capitulos" && (tallerSubInterfaces.length === 0 ? (
                    <div className="p-5 text-center">
                      <Layers size={28} className="mx-auto mb-3" style={{ color: `${GOLD}40` }} />
                      <p className="text-xs text-slate-500 mb-4">No hay capítulos para este libro todavía. Genera la estructura de 10 capítulos con IA.</p>
                      <button
                        onClick={handleGenerarSubInterfaces}
                        disabled={generandoSubInterfaces}
                        className="px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 mx-auto disabled:opacity-40"
                        style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`, color: "#000" }}
                        data-testid="btn-generar-subinterfaces"
                      >
                        {generandoSubInterfaces ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                        {generandoSubInterfaces ? "Generando estructura del libro..." : "Generar 10 capítulos con IA"}
                      </button>
                    </div>
                  ) : (
                    <div className="divide-y" style={{ borderColor: `${BORDER_GOLD}` }}>
                      {/* Barra de progreso */}
                      <div className="px-4 py-2 flex items-center justify-between">
                        <div className="flex items-center gap-2 flex-1">
                          <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all"
                              style={{ width: `${(Object.keys(tallerCapitulos).length / tallerSubInterfaces.length) * 100}%`, background: `linear-gradient(90deg, ${GOLD} 0%, #00FFC3 100%)` }}
                            />
                          </div>
                          <span className="text-[10px] font-mono" style={{ color: GOLD }}>
                            {Object.keys(tallerCapitulos).length}/{tallerSubInterfaces.length}
                          </span>
                        </div>
                        <button
                          onClick={handleGenerarSubInterfaces}
                          disabled={generandoSubInterfaces}
                          className="ml-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all disabled:opacity-40"
                          style={{ backgroundColor: `${GOLD}10`, border: `1px solid ${GOLD}30`, color: `${GOLD}80` }}
                          data-testid="btn-regenerar-subinterfaces"
                          title="Regenerar estructura"
                        >
                          {generandoSubInterfaces ? <Loader2 size={10} className="animate-spin" /> : <Sparkles size={10} />}
                          Regenerar
                        </button>
                      </div>

                      {/* Lista de capítulos */}
                      {tallerSubInterfaces.sort((a, b) => a.orden - b.orden).map(sub => {
                        const isListo = !!tallerCapitulos[sub.id];
                        const isGenerando = !!generandoCapitulo[sub.id];
                        const isExpanded = expandedCapitulo === sub.id;
                        const cap = tallerCapitulos[sub.id];
                        const edits = editandoCarriles[sub.id];

                        const grado = getGradoCapitulo(sub.orden);
                        const creditosRef = ESCALERA_VOLTAJE_UI[tallerInterfaz || "M01"]?.[grado.key] ?? 2;

                        return (
                          <div key={sub.id} className="p-4" style={{ borderColor: BORDER_GOLD }}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-start gap-2 flex-1 min-w-0">
                                <div className="flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center mt-0.5"
                                  style={{ backgroundColor: isListo ? "#00FFC320" : `${GOLD}15`, border: `1px solid ${isListo ? "#00FFC340" : BORDER_GOLD}` }}>
                                  {isListo ? (
                                    <CheckCircle2 size={11} style={{ color: "#00FFC3" }} />
                                  ) : (
                                    <span className="text-[8px] font-mono font-bold" style={{ color: GOLD }}>{String(sub.orden).padStart(2, "0")}</span>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <p className="text-xs font-bold text-white truncate">{sub.titulo}</p>
                                    <span
                                      className="flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest"
                                      style={{ backgroundColor: `${grado.color}18`, border: `1px solid ${grado.color}40`, color: grado.color }}
                                    >
                                      G{grado.gNum} · {grado.label} · {creditosRef} cr
                                    </span>
                                    {(() => {
                                      const auditEntry = fichaAuditMap[sub.id];
                                      if (!isListo || !auditEntry) return null;
                                      const carriles = ["carril1", "carril2", "carril3"] as const;
                                      const audited = carriles.filter(c => auditEntry[c]);
                                      if (audited.length === 0) return null;
                                      const passedCount = audited.filter(c => auditEntry[c].passed).length;
                                      const allPassed = passedCount === audited.length;
                                      return (
                                        <span
                                          className="flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest"
                                          style={{
                                            backgroundColor: allPassed ? "#00C85118" : "#FF313118",
                                            border: `1px solid ${allPassed ? "#00C85140" : "#FF313140"}`,
                                            color: allPassed ? "#00C851" : "#FF3131",
                                          }}
                                          data-testid={`badge-ficha-summary-${sub.id}`}
                                          title={`Ficha: ${passedCount}/${audited.length} carriles aprobados`}
                                        >
                                          FICHA {passedCount}/{audited.length} {allPassed ? "✓" : "✗"}
                                        </span>
                                      );
                                    })()}
                                    {isListo && cap?.routerMeta?.cerebro_router && (
                                      <span
                                        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest"
                                        style={{ backgroundColor: "#00B4D818", border: "1px solid #00B4D850", color: "#48CAE4" }}
                                        data-testid={`badge-router-${sub.id}`}
                                        title="Generado con Cerebro Router — abre el capítulo para ver métricas"
                                      >
                                        ROUTER
                                      </span>
                                    )}
                                    {isListo && cap && !cap.cerebro_v2 && !cap.routerMeta?.cerebro_router && (
                                      <span
                                        className="flex-shrink-0 px-1.5 py-0.5 rounded text-[7px] font-black uppercase tracking-widest"
                                        style={{ backgroundColor: "#8B450018", border: "1px solid #8B450040", color: "#CD853F" }}
                                        data-testid={`badge-version-anterior-${sub.id}`}
                                        title="Generado con versión anterior — considera regenerar con el nuevo escritor"
                                      >
                                        v.anterior
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-[9px] text-slate-600 truncate">{sub.falla}</p>
                                  {sub.descripcion && <p className="text-[9px] text-slate-700 mt-0.5 line-clamp-1">{sub.descripcion}</p>}
                                  {isListo && notasInyectadasMap[sub.id] > 0 && (
                                    <span
                                      className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 rounded-md text-[8px] font-bold"
                                      style={{ backgroundColor: "#00FFC310", border: "1px solid #00FFC330", color: "#00FFC3" }}
                                      data-testid={`badge-notas-inyectadas-${sub.id}`}
                                      title="Notas de evolución de capítulos anteriores inyectadas en el prompt"
                                    >
                                      ↑ {notasInyectadasMap[sub.id]} nota{notasInyectadasMap[sub.id] !== 1 ? "s" : ""} de evolución aplicada{notasInyectadasMap[sub.id] !== 1 ? "s" : ""}
                                    </span>
                                  )}
                                  {!isListo && (
                                    <textarea
                                      rows={2}
                                      value={instruccionesPrevias[sub.id] || ""}
                                      onChange={e => setInstruccionesPrevias(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                      placeholder="Directriz opcional: énfasis, restricciones, ángulo específico para este capítulo..."
                                      className="mt-2 w-full resize-none rounded-lg px-2 py-1.5 text-[9px] font-mono leading-relaxed outline-none transition-colors"
                                      style={{ backgroundColor: "transparent", border: `1px solid ${GOLD}30`, color: "#94a3b8" }}
                                      data-testid={`input-directriz-${sub.id}`}
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 flex-shrink-0">
                                {isListo && (
                                  <button
                                    onClick={() => setExpandedCapitulo(isExpanded ? null : sub.id)}
                                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all"
                                    style={{ backgroundColor: isExpanded ? "#00FFC315" : "transparent", color: isExpanded ? "#00FFC3" : "#64748b", border: `1px solid ${isExpanded ? "#00FFC330" : BORDER_GOLD}` }}
                                    data-testid={`btn-toggle-cap-${sub.id}`}
                                  >
                                    <Eye size={10} />
                                    {isExpanded ? "Ocultar" : "Ver"}
                                  </button>
                                )}
                                <button
                                  onClick={() => handleGenerarCapitulo(sub)}
                                  disabled={isGenerando}
                                  className="flex items-center gap-1 px-2 py-1 rounded-lg text-[9px] font-bold transition-all disabled:opacity-40"
                                  style={{
                                    backgroundColor: isListo ? `${GOLD}08` : `${GOLD}20`,
                                    border: `1px solid ${GOLD}${isListo ? "20" : ""}`,
                                    color: GOLD
                                  }}
                                  data-testid={`btn-generar-cap-${sub.id}`}
                                >
                                  {isGenerando ? <Loader2 size={10} className="animate-spin" /> : <Wand2 size={10} />}
                                  {isGenerando ? "..." : isListo ? "Regen." : "Generar"}
                                </button>
                              </div>
                            </div>

                            {/* Carriles expandidos */}
                            <AnimatePresence>
                              {isExpanded && cap && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                  className="mt-3 space-y-3"
                                >
                                  {/* Panel Cerebro Router — métricas de la última generación */}
                                  {(() => {
                                    const rm = cap.routerMeta;
                                    if (!rm?.cerebro_router) {
                                      return (
                                        <motion.div
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          className="rounded-xl px-3 py-2.5 text-[9px] leading-relaxed text-slate-500"
                                          style={{ border: `1px dashed ${BORDER_GOLD}`, backgroundColor: `${GOLD}06` }}
                                          data-testid={`router-panel-missing-${sub.id}`}
                                        >
                                          <span className="font-bold uppercase tracking-wider" style={{ color: `${GOLD}99` }}>Cerebro Router</span>
                                          {" — "}Este capítulo se guardó antes del router o sin métricas. Pulsa <strong className="text-slate-400">Regen.</strong> para ver tokens del prompt y auditoría de contaminación.
                                        </motion.div>
                                      );
                                    }
                                    const pt = rm.promptTokens;
                                    const maxTok = pt ? Math.max(pt.c1, pt.c2, pt.c3, 1) : 1;
                                    const fmtTok = (n: number) => (n >= 1000 ? `~${(n / 1000).toFixed(1)}k` : `~${n}`);
                                    const bar = (label: string, val: number, color: string) => (
                                      <motion.div key={label} className="flex items-center gap-2" initial={{ width: 0 }} animate={{ width: "100%" }}>
                                        <span className="w-6 text-[8px] font-mono font-bold" style={{ color }}>{label}</span>
                                        <motion.div
                                          className="h-2 rounded-full flex-1 overflow-hidden"
                                          style={{ backgroundColor: `${color}15` }}
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.1 }}
                                        >
                                          <motion.div
                                            className="h-full rounded-full"
                                            style={{ backgroundColor: color }}
                                            initial={{ width: 0 }}
                                            animate={{ width: `${Math.round((val / maxTok) * 100)}%` }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                          />
                                        </motion.div>
                                        <span className="w-12 text-right text-[8px] font-mono text-slate-400">{fmtTok(val)}</span>
                                      </motion.div>
                                    );
                                    const contam = rm.contaminationAudit || {};
                                    const c1c = contam.carril1;
                                    const c2c = contam.carril2;
                                    const routerOk = (!c1c || c1c.passed) && (!c2c || c2c.passed);
                                    const fichaEntry = fichaAuditMap[sub.id];
                                    return (
                                      <motion.div
                                        initial={{ opacity: 0, y: -4 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="rounded-xl p-3 space-y-2.5"
                                        style={{ border: `1px solid #48CAE440`, backgroundColor: "#00B4D808" }}
                                        data-testid={`router-panel-${sub.id}`}
                                      >
                                        <motion.div
                                          className="flex items-center justify-between gap-2"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                        >
                                          <span className="text-[9px] font-black uppercase tracking-widest" style={{ color: "#48CAE4" }}>
                                            Cerebro Router — resultado
                                          </span>
                                          <span
                                            className="text-[7px] font-bold px-1.5 py-0.5 rounded"
                                            style={{
                                              backgroundColor: routerOk ? "#00C85120" : "#FF313120",
                                              color: routerOk ? "#00C851" : "#FF3131",
                                              border: `1px solid ${routerOk ? "#00C85140" : "#FF313140"}`,
                                            }}
                                          >
                                            {routerOk ? "SIN CONTAMINACIÓN" : "REVISAR CARRILES"}
                                          </span>
                                        </motion.div>
                                        {pt && (
                                          <motion.div className="space-y-1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }}>
                                            <p className="text-[8px] text-slate-500 uppercase tracking-wider mb-1">Tokens estimados del prompt (input)</p>
                                            {bar("C1", pt.c1, GOLD)}
                                            {bar("C2", pt.c2, "#48CAE4")}
                                            {bar("C3", pt.c3, "#9B5DE5")}
                                            {pt.c3 > 0 && pt.c1 < pt.c3 && (
                                              <p className="text-[8px] text-slate-600 mt-1">
                                                C1 usa ~{Math.round((1 - pt.c1 / pt.c3) * 100)}% menos contexto que C3 (conocimiento segregado).
                                              </p>
                                            )}
                                          </motion.div>
                                        )}
                                        <motion.div
                                          className="grid grid-cols-3 gap-1.5 text-[8px]"
                                          initial={{ opacity: 0 }}
                                          animate={{ opacity: 1 }}
                                          transition={{ delay: 0.15 }}
                                        >
                                          {(["carril1", "carril2", "carril3"] as const).map((key, i) => {
                                            const labels = ["Mensaje", "Lector", "Maestro"];
                                            const ficha = fichaEntry?.[key];
                                            const cont = key === "carril3" ? undefined : contam[key];
                                            return (
                                              <div
                                                key={key}
                                                className="rounded-lg p-1.5 text-center"
                                                style={{ backgroundColor: "#00000030", border: `1px solid ${BORDER_GOLD}` }}
                                              >
                                                <motion.div className="font-bold text-slate-400 mb-0.5">C{i + 1} {labels[i]}</motion.div>
                                                {ficha && (
                                                  <motion.div style={{ color: ficha.passed ? "#00C851" : "#FF3131" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 0.3 }}>
                                                    Ficha {ficha.passed ? "✓" : "✗"}
                                                  </motion.div>
                                                )}
                                                {cont !== undefined && (
                                                  <motion.div
                                                    style={{ color: cont.passed ? "#48CAE4" : "#FF3131" }}
                                                    title={cont.violations?.length ? cont.violations.join(", ") : "OK"}
                                                  >
                                                    Router {cont.passed ? "✓" : `✗ ${cont.violations?.join(", ") || ""}`}
                                                  </motion.div>
                                                )}
                                                {key === "carril3" && <motion.div className="text-slate-600">Doctor + fianza</motion.div>}
                                              </div>
                                            );
                                          })}
                                        </motion.div>
                                      </motion.div>
                                    );
                                  })()}
                                  {/* Carril 1 */}
                                  <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${GOLD}30` }}>
                                    <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: `${GOLD}10` }}>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: GOLD }}>Carril I — El Mensaje</span>
                                        {fichaAuditMap[sub.id]?.carril1 && (
                                          <span className="flex items-center gap-1">
                                            <span
                                              className="text-[7px] font-bold px-1 py-0.5 rounded"
                                              style={{
                                                backgroundColor: fichaAuditMap[sub.id].carril1.passed ? "#00C85120" : "#FF313120",
                                                color: fichaAuditMap[sub.id].carril1.passed ? "#00C851" : "#FF3131",
                                                border: `1px solid ${fichaAuditMap[sub.id].carril1.passed ? "#00C85140" : "#FF313140"}`,
                                              }}
                                              data-testid={`badge-ficha-c1-${sub.id}`}
                                              title={fichaAuditMap[sub.id].carril1.retried ? "Ficha: regenerado automáticamente" : "Ficha: verificado"}
                                            >
                                              FICHA {fichaAuditMap[sub.id].carril1.retried ? "↺" : ""}{fichaAuditMap[sub.id].carril1.passed ? "✓" : "✗"}
                                            </span>
                                            {edits && (
                                              <>
                                                <button
                                                  onClick={() => handleForceApproveFichaAudit(sub.id, "carril1")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-green-900/40"
                                                  style={{ color: "#00C851", lineHeight: 1 }}
                                                  title="Aprobar manualmente la auditoría FICHA de este carril"
                                                  data-testid={`btn-approve-ficha-c1-${sub.id}`}
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => handleResetFichaAudit(sub.id, "carril1")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-slate-700/40"
                                                  style={{ color: "#64748b", lineHeight: 1 }}
                                                  title="Limpiar auditoría FICHA de este carril"
                                                  data-testid={`btn-reset-ficha-c1-${sub.id}`}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-1">
                                        <button
                                          onClick={() => {
                                            if (edits) {
                                              setEditandoCarriles(prev => { const n = { ...prev }; delete n[sub.id]; return n; });
                                            } else {
                                              setEditandoCarriles(prev => ({ ...prev, [sub.id]: { c1: cap.carril1, c2: cap.carril2, c3: cap.carril3 } }));
                                            }
                                          }}
                                          className="px-1.5 py-0.5 rounded text-[8px] font-bold"
                                          style={{ backgroundColor: edits ? `${GOLD}30` : `${GOLD}10`, color: GOLD }}
                                          data-testid={`btn-edit-carriles-${sub.id}`}
                                        >
                                          <Edit3 size={8} />
                                        </button>
                                        <button
                                          onClick={() => copyToClipboard(edits ? edits.c1 : cap.carril1, `c1-${sub.id}`)}
                                          className="px-1.5 py-0.5 rounded text-[8px]"
                                          style={{ backgroundColor: `${GOLD}10`, color: GOLD }}
                                          data-testid={`btn-copy-c1-${sub.id}`}
                                        >
                                          {copiedField === `c1-${sub.id}` ? <Check size={8} /> : <Copy size={8} />}
                                        </button>
                                      </div>
                                    </div>
                                    {edits ? (
                                      <textarea
                                        value={edits.c1}
                                        onChange={e => setEditandoCarriles(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], c1: e.target.value } }))}
                                        className="w-full p-3 text-[11px] text-slate-300 leading-relaxed resize-none outline-none"
                                        style={{ backgroundColor: "#080808", minHeight: "120px", fontFamily: "inherit" }}
                                        rows={6}
                                        data-testid={`textarea-c1-${sub.id}`}
                                      />
                                    ) : (
                                      <p className="px-3 py-2 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{cap.carril1}</p>
                                    )}
                                  </div>

                                  {/* Carril 2 */}
                                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(148,163,184,0.15)" }}>
                                    <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: "rgba(148,163,184,0.06)" }}>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Carril II — El Lector / Hardware</span>
                                        {fichaAuditMap[sub.id]?.carril2 && (
                                          <span className="flex items-center gap-1">
                                            <span
                                              className="text-[7px] font-bold px-1 py-0.5 rounded"
                                              style={{
                                                backgroundColor: fichaAuditMap[sub.id].carril2.passed ? "#00C85120" : "#FF313120",
                                                color: fichaAuditMap[sub.id].carril2.passed ? "#00C851" : "#FF3131",
                                                border: `1px solid ${fichaAuditMap[sub.id].carril2.passed ? "#00C85140" : "#FF313140"}`,
                                              }}
                                              data-testid={`badge-ficha-c2-${sub.id}`}
                                              title={fichaAuditMap[sub.id].carril2.retried ? "Ficha: regenerado automáticamente" : "Ficha: verificado"}
                                            >
                                              FICHA {fichaAuditMap[sub.id].carril2.retried ? "↺" : ""}{fichaAuditMap[sub.id].carril2.passed ? "✓" : "✗"}
                                            </span>
                                            {edits && (
                                              <>
                                                <button
                                                  onClick={() => handleForceApproveFichaAudit(sub.id, "carril2")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-green-900/40"
                                                  style={{ color: "#00C851", lineHeight: 1 }}
                                                  title="Aprobar manualmente la auditoría FICHA de este carril"
                                                  data-testid={`btn-approve-ficha-c2-${sub.id}`}
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => handleResetFichaAudit(sub.id, "carril2")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-slate-700/40"
                                                  style={{ color: "#64748b", lineHeight: 1 }}
                                                  title="Limpiar auditoría FICHA de este carril"
                                                  data-testid={`btn-reset-ficha-c2-${sub.id}`}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(edits ? edits.c2 : cap.carril2, `c2-${sub.id}`)}
                                        className="px-1.5 py-0.5 rounded text-[8px] text-slate-500"
                                        style={{ backgroundColor: "rgba(148,163,184,0.08)" }}
                                        data-testid={`btn-copy-c2-${sub.id}`}
                                      >
                                        {copiedField === `c2-${sub.id}` ? <Check size={8} /> : <Copy size={8} />}
                                      </button>
                                    </div>
                                    {edits ? (
                                      <textarea
                                        value={edits.c2}
                                        onChange={e => setEditandoCarriles(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], c2: e.target.value } }))}
                                        className="w-full p-3 text-[11px] text-slate-300 leading-relaxed resize-none outline-none"
                                        style={{ backgroundColor: "#080808", minHeight: "120px", fontFamily: "inherit" }}
                                        rows={6}
                                        data-testid={`textarea-c2-${sub.id}`}
                                      />
                                    ) : (
                                      <p className="px-3 py-2 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{cap.carril2}</p>
                                    )}
                                  </div>

                                  {/* Carril 3 */}
                                  <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(139,92,246,0.25)" }}>
                                    <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: "rgba(139,92,246,0.08)" }}>
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[9px] font-bold uppercase tracking-widest" style={{ color: "#8B5CF6" }}>Carril III — El Maestro</span>
                                        {fichaAuditMap[sub.id]?.carril3 && (
                                          <span className="flex items-center gap-1">
                                            <span
                                              className="text-[7px] font-bold px-1 py-0.5 rounded"
                                              style={{
                                                backgroundColor: fichaAuditMap[sub.id].carril3.passed ? "#00C85120" : "#FF313120",
                                                color: fichaAuditMap[sub.id].carril3.passed ? "#00C851" : "#FF3131",
                                                border: `1px solid ${fichaAuditMap[sub.id].carril3.passed ? "#00C85140" : "#FF313140"}`,
                                              }}
                                              data-testid={`badge-ficha-c3-${sub.id}`}
                                              title={fichaAuditMap[sub.id].carril3.retried ? "Ficha: regenerado automáticamente" : "Ficha: verificado"}
                                            >
                                              FICHA {fichaAuditMap[sub.id].carril3.retried ? "↺" : ""}{fichaAuditMap[sub.id].carril3.passed ? "✓" : "✗"}
                                            </span>
                                            {edits && (
                                              <>
                                                <button
                                                  onClick={() => handleForceApproveFichaAudit(sub.id, "carril3")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-green-900/40"
                                                  style={{ color: "#00C851", lineHeight: 1 }}
                                                  title="Aprobar manualmente la auditoría FICHA de este carril"
                                                  data-testid={`btn-approve-ficha-c3-${sub.id}`}
                                                >
                                                  ✓
                                                </button>
                                                <button
                                                  onClick={() => handleResetFichaAudit(sub.id, "carril3")}
                                                  className="text-[8px] px-1 py-0.5 rounded transition-colors hover:bg-slate-700/40"
                                                  style={{ color: "#64748b", lineHeight: 1 }}
                                                  title="Limpiar auditoría FICHA de este carril"
                                                  data-testid={`btn-reset-ficha-c3-${sub.id}`}
                                                >
                                                  ×
                                                </button>
                                              </>
                                            )}
                                          </span>
                                        )}
                                      </div>
                                      <button
                                        onClick={() => copyToClipboard(edits ? edits.c3 : cap.carril3, `c3-${sub.id}`)}
                                        className="px-1.5 py-0.5 rounded text-[8px]"
                                        style={{ backgroundColor: "rgba(139,92,246,0.10)", color: "#8B5CF6" }}
                                        data-testid={`btn-copy-c3-${sub.id}`}
                                      >
                                        {copiedField === `c3-${sub.id}` ? <Check size={8} /> : <Copy size={8} />}
                                      </button>
                                    </div>
                                    {edits ? (
                                      <textarea
                                        value={edits.c3}
                                        onChange={e => setEditandoCarriles(prev => ({ ...prev, [sub.id]: { ...prev[sub.id], c3: e.target.value } }))}
                                        className="w-full p-3 text-[11px] text-slate-300 leading-relaxed resize-none outline-none"
                                        style={{ backgroundColor: "#080808", minHeight: "120px", fontFamily: "inherit" }}
                                        rows={6}
                                        data-testid={`textarea-c3-${sub.id}`}
                                      />
                                    ) : (
                                      <p className="px-3 py-2 text-[11px] text-slate-400 leading-relaxed whitespace-pre-wrap">{cap.carril3}</p>
                                    )}
                                  </div>

                                  {/* Guardar ediciones */}
                                  {edits && (
                                    <div className="flex gap-2">
                                      <button
                                        onClick={async () => {
                                          if (!user?.uid || !tallerInterfaz) return;
                                          try {
                                            await saveCapituloCarrilesLibro(user.uid, tallerInterfaz, sub.id, {
                                              subInterfazTitulo: sub.titulo,
                                              carril1: edits.c1,
                                              carril2: edits.c2,
                                              carril3: edits.c3,
                                            });
                                            setEditandoCarriles(prev => { const n = { ...prev }; delete n[sub.id]; return n; });
                                            setFichaAuditMap(prev => { const n = { ...prev }; delete n[sub.id]; return n; });
                                            toast.success("Carriles guardados", { style: { backgroundColor: CARD_BG, border: `1px solid ${GOLD}`, color: GOLD } });
                                          } catch { toast.error("Error guardando"); }
                                        }}
                                        className="flex-1 py-2 rounded-xl text-[10px] font-bold"
                                        style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`, color: "#000" }}
                                        data-testid={`btn-save-carriles-${sub.id}`}
                                      >
                                        Guardar cambios
                                      </button>
                                      <button
                                        onClick={() => setEditandoCarriles(prev => { const n = { ...prev }; delete n[sub.id]; return n; })}
                                        className="px-4 py-2 rounded-xl text-[10px] font-bold text-slate-500"
                                        style={{ border: "1px solid rgba(255,255,255,0.08)" }}
                                        data-testid={`btn-cancel-edit-${sub.id}`}
                                      >
                                        Cancelar
                                      </button>
                                    </div>
                                  )}

                                  {/* Regenerar con criterio (T003) */}
                                  {!edits && (
                                    <div className="mt-1">
                                      <button
                                        onClick={() => setMostrandoCriterio(prev => ({ ...prev, [sub.id]: !prev[sub.id] }))}
                                        className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-bold transition-all"
                                        style={{ backgroundColor: mostrandoCriterio[sub.id] ? "#FF313120" : "transparent", border: `1px solid #FF313130`, color: "#FF3131" }}
                                        data-testid={`btn-toggle-criterio-${sub.id}`}
                                      >
                                        <RefreshCw size={9} className={mostrandoCriterio[sub.id] ? "animate-spin" : ""} />
                                        Regenerar con criterio
                                      </button>
                                      <AnimatePresence>
                                        {mostrandoCriterio[sub.id] && (
                                          <motion.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: "auto" }}
                                            exit={{ opacity: 0, height: 0 }}
                                            className="mt-2 space-y-2"
                                          >
                                            <p className="text-[9px] text-slate-600 font-mono px-1">¿Qué debe corregir Gemini? Autarquía, color incorrecto, solución de otra interfaz...</p>
                                            <textarea
                                              rows={3}
                                              value={criterioRegen[sub.id] || ""}
                                              onChange={e => setCriterioRegen(prev => ({ ...prev, [sub.id]: e.target.value }))}
                                              placeholder={`Ej: El carril 1 menciona estrategia empresarial que corresponde a M06. Reescribir solo con el universo de ${tallerInterfaz}.`}
                                              className="w-full resize-none rounded-lg px-3 py-2 text-[9px] font-mono leading-relaxed outline-none"
                                              style={{ backgroundColor: "#FF313108", border: "1px solid #FF313130", color: "#94a3b8" }}
                                              data-testid={`input-criterio-${sub.id}`}
                                            />
                                            <button
                                              onClick={() => handleGenerarCapitulo(sub, criterioRegen[sub.id])}
                                              disabled={!criterioRegen[sub.id]?.trim() || !!generandoCapitulo[sub.id]}
                                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-bold transition-all disabled:opacity-30"
                                              style={{ backgroundColor: "#FF313120", border: "1px solid #FF313150", color: "#FF3131" }}
                                              data-testid={`btn-aplicar-criterio-${sub.id}`}
                                            >
                                              {generandoCapitulo[sub.id] ? <Loader2 size={9} className="animate-spin" /> : <Wand2 size={9} />}
                                              Aplicar y Regenerar
                                            </button>
                                          </motion.div>
                                        )}
                                      </AnimatePresence>
                                    </div>
                                  )}
                                  {/* Badge de Evolución — ver detalle en pestaña Evolución */}
                                  {tallerNotas[sub.id] && tallerNotas[sub.id].notas.length > 0 && (
                                    <button
                                      onClick={() => setTallerVista("evolucion")}
                                      className="mt-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl transition-all hover:opacity-80"
                                      style={{ border: "1px solid #00FFC325", backgroundColor: "#00FFC308" }}
                                      data-testid={`btn-ver-evolucion-${sub.id}`}
                                      title="Ver en panel Evolución"
                                    >
                                      <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: "#00FFC3" }} />
                                      <span className="text-[8px] font-mono font-bold" style={{ color: "#00FFC3" }}>
                                        {tallerNotas[sub.id].notas.length} principio{tallerNotas[sub.id].notas.length !== 1 ? "s" : ""} — {tallerNotas[sub.id].coordenada}
                                      </span>
                                      <span className="text-[7px] font-mono" style={{ color: "#00FFC360" }}>Ver →</span>
                                    </button>
                                  )}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}

                      {/* Acceso rápido al panel Evolución */}
                      {Object.keys(tallerNotas).length > 0 && (() => {
                        const total = Object.values(tallerNotas).reduce((acc, e) => acc + e.notas.length, 0);
                        if (total === 0) return null;
                        return (
                          <button
                            onClick={() => setTallerVista("evolucion")}
                            className="mx-4 mb-3 w-[calc(100%-2rem)] flex items-center justify-between px-4 py-3 rounded-2xl transition-all hover:opacity-80"
                            style={{ border: "1px solid #00FFC330", backgroundColor: "#00FFC308" }}
                            data-testid="btn-abrir-panel-evolucion"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: "#00FFC3" }} />
                              <div className="text-left">
                                <p className="text-[10px] font-bold uppercase tracking-widest font-mono" style={{ color: "#00FFC3" }}>
                                  Evolución del Algoritmo
                                </p>
                                <p className="text-[8px] font-mono" style={{ color: "#00FFC360" }}>
                                  {total} principio{total !== 1 ? "s" : ""} emergente{total !== 1 ? "s" : ""} registrado{total !== 1 ? "s" : ""}
                                </p>
                              </div>
                            </div>
                            <span className="text-[9px] font-mono font-bold" style={{ color: "#00FFC380" }}>Ver panel →</span>
                          </button>
                        );
                      })()}

                      {/* Footer: compilar + stats */}
                      <div className="p-4 flex items-center justify-between" style={{ borderTop: `1px solid ${BORDER_GOLD}` }}>
                        <p className="text-[9px] font-mono text-slate-600">
                          {Object.keys(tallerCapitulos).length} de {tallerSubInterfaces.length} capítulos listos
                        </p>
                        <button
                          onClick={compilarLibroTaller}
                          disabled={Object.keys(tallerCapitulos).length === 0}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-bold transition-all disabled:opacity-30"
                          style={{ background: `linear-gradient(135deg, ${GOLD} 0%, #B8860B 100%)`, color: "#000" }}
                          data-testid="btn-compilar-libro-footer"
                        >
                          <Download size={11} />
                          Compilar Libro KDP
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ════ MODAL: VER EVOLUCIÓN COMPLETA ════ */}
      <AnimatePresence>
        {showEvolucionCompleta && (() => {
          const allPrincipios: { coordenada: string; subTitulo: string; subId: string; noteIndex: number; nota: NotaEvolucion }[] = [];
          Object.entries(tallerNotas).forEach(([subId, entry]) => {
            const subInfo = tallerSubInterfaces.find(s => s.id === subId);
            entry.notas.forEach((n, ni) =>
              allPrincipios.push({ coordenada: entry.coordenada, subTitulo: subInfo?.titulo || subId, subId, noteIndex: ni, nota: n })
            );
          });
          const porSubId: Record<string, { coordenada: string; subTitulo: string; notas: { nota: NotaEvolucion; subId: string; noteIndex: number }[] }> = {};
          allPrincipios.forEach(({ coordenada, subTitulo, subId, noteIndex, nota }) => {
            if (!porSubId[subId]) porSubId[subId] = { coordenada, subTitulo, notas: [] };
            porSubId[subId].notas.push({ nota, subId, noteIndex });
          });
          const subIds = Object.keys(porSubId).sort((a, b) => porSubId[a].coordenada.localeCompare(porSubId[b].coordenada));
          return (
            <motion.div
              key="evolucion-completa-modal"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col"
              style={{ backgroundColor: "#050510" }}
              data-testid="modal-evolucion-completa"
            >
              {/* Header */}
              <div
                className="flex-shrink-0 flex items-center justify-between px-6 py-4"
                style={{ borderBottom: "1px solid #00FFC325", backgroundColor: "#00FFC308" }}
              >
                <div>
                  <p className="text-xs font-mono font-bold uppercase tracking-widest" style={{ color: "#00FFC3" }}>
                    Evolución Completa — {tallerInterfaz}
                  </p>
                  <p className="text-[10px] font-mono mt-0.5" style={{ color: "#00FFC360" }}>
                    {allPrincipios.length} principio{allPrincipios.length !== 1 ? "s" : ""} emergente{allPrincipios.length !== 1 ? "s" : ""} en {subIds.length} capítulo{subIds.length !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 rounded-xl flex items-center gap-1.5" style={{ backgroundColor: "#00FFC315", border: "1px solid #00FFC330" }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: "#00FFC3" }} />
                    <span className="text-[9px] font-mono font-bold" style={{ color: "#00FFC3" }}>{allPrincipios.length} notas</span>
                  </div>
                  <button
                    onClick={() => setShowEvolucionCompleta(false)}
                    className="w-8 h-8 rounded-xl flex items-center justify-center transition-all hover:bg-white/10"
                    style={{ border: "1px solid #00FFC330", color: "#00FFC3" }}
                    data-testid="btn-close-evolucion-completa"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* Body */}
              <div className="flex-1 overflow-y-auto p-6">
                {coords.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: "#00FFC310", border: "1px solid #00FFC330" }}>
                      <Sparkles size={24} style={{ color: "#00FFC360" }} />
                    </div>
                    <p className="text-sm font-bold mb-1" style={{ color: "#00FFC360" }}>Sin notas de evolución</p>
                    <p className="text-[11px] text-slate-600 leading-relaxed max-w-xs">
                      Genera capítulos para que el algoritmo descubra principios emergentes.
                    </p>
                  </div>
                ) : (
                  <div className="max-w-4xl mx-auto space-y-6">
                    {subIds.map(subId => {
                      const grupo = porSubId[subId];
                      return (
                        <div
                          key={subId}
                          className="rounded-2xl overflow-hidden"
                          style={{ border: "1px solid #00FFC325", backgroundColor: "#00FFC305" }}
                          data-testid={`evolucion-group-${subId}`}
                        >
                          {/* Encabezado de capítulo */}
                          <div
                            className="px-5 py-3 flex items-center gap-3"
                            style={{ borderBottom: "1px solid #00FFC318", backgroundColor: "#00FFC310" }}
                          >
                            <span
                              className="text-[9px] font-mono font-bold px-2.5 py-1 rounded-lg flex-shrink-0"
                              style={{ backgroundColor: "#00FFC325", color: "#00FFC3" }}
                              data-testid={`evolucion-coord-${subId}`}
                            >
                              {grupo.coordenada}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-bold truncate" style={{ color: "#00FFC3" }} data-testid={`evolucion-titulo-${subId}`}>
                                {grupo.subTitulo}
                              </p>
                            </div>
                            <span
                              className="text-[9px] font-mono flex-shrink-0 px-2 py-0.5 rounded"
                              style={{ backgroundColor: "#00FFC318", color: "#00FFC380" }}
                            >
                              {grupo.notas.length} nota{grupo.notas.length !== 1 ? "s" : ""}
                            </span>
                          </div>

                          {/* Notas del capítulo */}
                          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
                            {grupo.notas.map(({ nota, subId, noteIndex }, ni) => (
                              <div
                                key={ni}
                                className="rounded-xl p-3.5"
                                style={{ backgroundColor: "#0A0A14", border: "1px solid #00FFC318" }}
                                data-testid={`evolucion-nota-${subId}-${noteIndex}`}
                              >
                                <div className="flex items-start gap-2.5">
                                  <span
                                    className="text-[7px] font-mono uppercase tracking-widest px-1.5 py-0.5 rounded flex-shrink-0 mt-0.5"
                                    style={{ backgroundColor: "#00FFC312", color: "#00FFC380", border: "1px solid #00FFC320" }}
                                    data-testid={`evolucion-nota-tipo-${subId}-${noteIndex}`}
                                  >
                                    {nota.tipo}
                                  </span>
                                  <div className="min-w-0 flex-1">
                                    <p
                                      className="text-[11px] font-bold leading-snug mb-1.5"
                                      style={{ color: "#00FFC3" }}
                                      data-testid={`evolucion-nota-titulo-${subId}-${noteIndex}`}
                                    >
                                      {nota.titulo}
                                    </p>
                                    <p
                                      className="text-[10px] leading-relaxed font-mono"
                                      style={{ color: "#94a3b8" }}
                                      data-testid={`evolucion-nota-cuerpo-${subId}-${noteIndex}`}
                                    >
                                      {nota.cuerpo}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}

export default function AdminSemillas() {
  return (
    <SemillasErrorBoundary>
      <AdminSemillasInner />
    </SemillasErrorBoundary>
  );
}
