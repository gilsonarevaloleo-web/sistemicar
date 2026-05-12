import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation, useRoute } from "wouter";
import {
  ArrowLeft, Brain, Calendar, Edit3, Save, X, Plus,
  Trash2, Loader2, MessageSquare, Zap, ChevronDown, ChevronUp, AlertTriangle
} from "lucide-react";
import { useAuthContext } from "@/App";
import {
  getPaciente,
  updatePaciente,
  addNotaClinica,
  subscribeToNotasClinicas,
  deleteNotaClinica,
  subscribeToEspejoSessionsByPaciente,
  type Paciente,
  type NotaClinica,
  type EspejoSession
} from "@/lib/persistence";
import { toast } from "sonner";

const ADMIN_EMAIL = "gilsonarevalo.leo@gmail.com";
const GOLD = "#D4AF37";
const CYAN = "#00FFC3";
const DARK = "#0A0A0A";
const RED = "#FF3131";

const CODIGOS = ["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"];
const NIVELES = [".1",".2",".3",".4",".5",".6",".7",".8",".9",".10"];

const CODIGO_NOMBRE: Record<string, string> = {
  C1: "Cimiento / Territorio",
  C2: "Portador / Identidad",
  C3: "Trabajo / Producción",
  C4: "Estructura / Disciplina",
  C5: "Decisión / Voluntad",
  C6: "Convivencia / Relaciones",
  C7: "Visión / Propósito",
  C8: "Ciclos / Tiempo",
  C9: "Sistema / Arquitectura",
  C10: "Origen / Soberanía",
};

const NIVEL_NOMBRE: Record<string, string> = {
  ".1": "Ignorancia Total",
  ".2": "Conocimiento Vago",
  ".3": "Falta de Método",
  ".4": "Lucha Causal",
  ".5": "Estancamiento de Identidad",
  ".6": "Poder Reactivo",
  ".7": "Búsqueda de Soberanía",
  ".8": "Visión Sistémica",
  ".9": "Trascendencia de Forma",
  ".10": "El Origen",
};

export default function EspejoExpedienteDetalle() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [match, params] = useRoute("/espejo/expedientes/:id");
  const pacienteId = params?.id || "";

  const [paciente, setPaciente] = useState<Paciente | null>(null);
  const [notas, setNotas] = useState<NotaClinica[]>([]);
  const [sesiones, setSesiones] = useState<EspejoSession[]>([]);
  const [loading, setLoading] = useState(true);

  const [editMode, setEditMode] = useState(false);
  const [editNombre, setEditNombre] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editTelefono, setEditTelefono] = useState("");
  const [editCodigo, setEditCodigo] = useState("");
  const [editNivel, setEditNivel] = useState("");
  const [editNotasGen, setEditNotasGen] = useState("");
  const [saving, setSaving] = useState(false);

  const [nuevaNota, setNuevaNota] = useState("");
  const [savingNota, setSavingNota] = useState(false);
  const [deletingNota, setDeletingNota] = useState<string | null>(null);
  const [expandedSesion, setExpandedSesion] = useState<string | null>(null);

  const notaRef = useRef<HTMLTextAreaElement>(null);
  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;

  useEffect(() => {
    if (!user || !pacienteId) return;
    setLoading(true);
    getPaciente(user.uid, pacienteId).then(p => {
      setPaciente(p);
      if (p) {
        setEditNombre(p.nombre);
        setEditEmail(p.email || "");
        setEditTelefono(p.telefono || "");
        const match = (p.nivelMadurez || "").match(/^(C\d+)(\.?\d+)?$/);
        setEditCodigo(match ? match[1] : p.codigoActual || "");
        setEditNivel(match ? (match[2] || "") : "");
        setEditNotasGen(p.notasGenerales || "");
      }
      setLoading(false);
    });

    const unsubNotas = subscribeToNotasClinicas(user.uid, pacienteId, setNotas, () => {});
    const unsubSesiones = subscribeToEspejoSessionsByPaciente(user.uid, pacienteId, setSesiones, () => {});
    return () => { unsubNotas(); unsubSesiones(); };
  }, [user, pacienteId]);

  const handleSaveEdit = async () => {
    if (!user || !paciente) return;
    setSaving(true);
    try {
      const nivelMadurez = editCodigo && editNivel ? `${editCodigo}${editNivel}` : editCodigo || undefined;
      await updatePaciente(user.uid, pacienteId, {
        nombre: editNombre.trim() || paciente.nombre,
        email: editEmail.trim() || undefined,
        telefono: editTelefono.trim() || undefined,
        codigoActual: editCodigo || undefined,
        nivelMadurez,
        notasGenerales: editNotasGen.trim() || undefined
      });
      setPaciente(prev => prev ? {
        ...prev,
        nombre: editNombre.trim() || prev.nombre,
        email: editEmail.trim() || undefined,
        telefono: editTelefono.trim() || undefined,
        codigoActual: editCodigo || undefined,
        nivelMadurez,
        notasGenerales: editNotasGen.trim() || undefined
      } : prev);
      setEditMode(false);
      toast.success("Expediente actualizado", {
        style: { background: DARK, border: `1px solid ${GOLD}`, color: GOLD }
      });
    } catch {
      toast.error("Error al guardar cambios");
    } finally {
      setSaving(false);
    }
  };

  const handleAddNota = async () => {
    if (!user || !nuevaNota.trim()) return;
    setSavingNota(true);
    try {
      await addNotaClinica(user.uid, pacienteId, nuevaNota.trim());
      setNuevaNota("");
      toast.success("Nota registrada", {
        style: { background: DARK, border: `1px solid ${CYAN}`, color: CYAN }
      });
    } catch {
      toast.error("Error al guardar la nota");
    } finally {
      setSavingNota(false);
    }
  };

  const handleDeleteNota = async (notaId: string) => {
    if (!user) return;
    setDeletingNota(notaId);
    try {
      await deleteNotaClinica(user.uid, pacienteId, notaId);
    } catch {
      toast.error("Error al eliminar nota");
    } finally {
      setDeletingNota(null);
    }
  };

  if (!user) return null;

  if (loading) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <Loader2 size={24} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!paciente) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 16 }}>
      <AlertTriangle size={32} color={RED} />
      <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>Expediente no encontrado.</p>
      <button onClick={() => navigate("/espejo/expedientes")} style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "8px 16px", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "monospace", fontSize: 12 }}>
        ← Volver
      </button>
    </div>
  );

  const codigoCode = (paciente.nivelMadurez || "").match(/^(C\d+)/)?.[1] || paciente.codigoActual || "";
  const nivelCode = (paciente.nivelMadurez || "").match(/(\.?\d+)$/)?.[1] || "";

  return (
    <div style={{ minHeight: "100vh", background: DARK, padding: "24px 16px", fontFamily: "monospace" }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      <div style={{ maxWidth: 780, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 28 }}>
          <button
            onClick={() => navigate("/espejo/expedientes")}
            style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}
            data-testid="btn-volver-expedientes"
          >
            <ArrowLeft size={14} style={{ display: "inline", marginRight: 4 }} />
            Expedientes
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            background: "rgba(255,255,255,0.03)",
            border: `1px solid rgba(212,175,55,0.25)`,
            borderRadius: 12, padding: "24px 24px 20px",
            marginBottom: 24, position: "relative"
          }}
        >
          {!editMode ? (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: "50%",
                    background: "rgba(212,175,55,0.1)",
                    border: "1px solid rgba(212,175,55,0.3)",
                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                  }}>
                    <span style={{ color: GOLD, fontSize: 20, fontWeight: 700 }}>{paciente.nombre.charAt(0).toUpperCase()}</span>
                  </div>
                  <div>
                    <h1 style={{ color: "#fff", fontSize: 20, fontWeight: 700, margin: "0 0 6px" }}>{paciente.nombre}</h1>
                    <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
                      {paciente.nivelMadurez && (
                        <span style={{
                          fontSize: 11, color: CYAN,
                          background: "rgba(0,255,195,0.08)",
                          border: "1px solid rgba(0,255,195,0.25)",
                          borderRadius: 5, padding: "3px 9px", letterSpacing: "0.08em", fontWeight: 700
                        }}>{paciente.nivelMadurez}</span>
                      )}
                      {codigoCode && CODIGO_NOMBRE[codigoCode] && (
                        <span style={{ fontSize: 11, color: "rgba(212,175,55,0.6)" }}>{CODIGO_NOMBRE[codigoCode]}</span>
                      )}
                      {nivelCode && NIVEL_NOMBRE[nivelCode] && (
                        <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>— {NIVEL_NOMBRE[nivelCode]}</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: 12, marginTop: 6 }}>
                      {paciente.email && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{paciente.email}</span>}
                      {paciente.telefono && <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{paciente.telefono}</span>}
                    </div>
                  </div>
                </div>
                {isAdmin && (
                  <button
                    onClick={() => setEditMode(true)}
                    style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 7, padding: "7px 12px", cursor: "pointer", color: GOLD, display: "flex", alignItems: "center", gap: 5, fontSize: 12 }}
                    data-testid="btn-editar-paciente"
                  >
                    <Edit3 size={13} /> Editar
                  </button>
                )}
              </div>
              {paciente.notasGenerales && (
                <div style={{ marginTop: 16, padding: "12px 14px", background: "rgba(255,255,255,0.02)", borderRadius: 8, borderLeft: "2px solid rgba(212,175,55,0.3)" }}>
                  <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 13, lineHeight: 1.6, margin: 0 }}>{paciente.notasGenerales}</p>
                </div>
              )}
              <div style={{ display: "flex", gap: 20, marginTop: 16 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: GOLD, fontSize: 20, fontWeight: 700 }}>{sesiones.length}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>SESIONES</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: CYAN, fontSize: 20, fontWeight: 700 }}>{notas.length}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>NOTAS</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: GOLD, fontSize: 20, fontWeight: 700 }}>
                    {sesiones.reduce((acc, s) => acc + (s.puntos || 0), 0)}
                  </div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>PS ACUMULADOS</div>
                </div>
                {paciente.ultimaSesion && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, fontWeight: 700 }}>
                      {paciente.ultimaSesion.toLocaleDateString("es-PE")}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>ÚLT. SESIÓN</div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div>
              <h2 style={{ color: GOLD, fontSize: 14, letterSpacing: "0.08em", marginBottom: 20 }}>EDITAR EXPEDIENTE</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { label: "Nombre", value: editNombre, set: setEditNombre, placeholder: "Nombre", id: "edit-nombre" },
                  { label: "Email", value: editEmail, set: setEditEmail, placeholder: "correo@ejemplo.com", id: "edit-email" },
                  { label: "Teléfono", value: editTelefono, set: setEditTelefono, placeholder: "+51 999 999 999", id: "edit-tel" },
                ].map(f => (
                  <div key={f.label}>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>{f.label}</label>
                    <input
                      value={f.value}
                      onChange={e => f.set(e.target.value)}
                      placeholder={f.placeholder}
                      data-testid={f.id}
                      style={{ width: "100%", padding: "9px 11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none", boxSizing: "border-box" }}
                    />
                  </div>
                ))}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Código</label>
                    <select value={editCodigo} onChange={e => setEditCodigo(e.target.value)} data-testid="edit-codigo"
                      style={{ width: "100%", padding: "9px 11px", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
                      <option value="">—</option>
                      {CODIGOS.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Nivel</label>
                    <select value={editNivel} onChange={e => setEditNivel(e.target.value)} data-testid="edit-nivel"
                      style={{ width: "100%", padding: "9px 11px", background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none" }}>
                      <option value="">—</option>
                      {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 5 }}>Notas generales</label>
                  <textarea
                    value={editNotasGen}
                    onChange={e => setEditNotasGen(e.target.value)}
                    rows={3}
                    data-testid="edit-notas-gen"
                    style={{ width: "100%", padding: "9px 11px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13, outline: "none", resize: "vertical", boxSizing: "border-box" }}
                  />
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
                <button
                  onClick={() => { setEditMode(false); }}
                  style={{ flex: 1, padding: "10px", background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 7, color: "rgba(255,255,255,0.4)", cursor: "pointer", fontFamily: "monospace", fontSize: 13 }}
                >
                  Cancelar
                </button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSaveEdit}
                  disabled={saving}
                  data-testid="btn-guardar-edicion"
                  style={{
                    flex: 2, padding: "10px",
                    background: `linear-gradient(135deg, ${GOLD}, #b8962e)`,
                    border: "none", borderRadius: 7, color: DARK,
                    cursor: "pointer", fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                    letterSpacing: "0.06em",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                  }}
                >
                  {saving ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : <><Save size={14} /> GUARDAR</>}
                </motion.button>
              </div>
            </div>
          )}
        </motion.div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 24 }}>
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <MessageSquare size={14} color={CYAN} />
              <h3 style={{ color: CYAN, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", margin: 0 }}>NOTAS CLÍNICAS</h3>
            </div>

            <div style={{ marginBottom: 14 }}>
              <textarea
                ref={notaRef}
                value={nuevaNota}
                onChange={e => setNuevaNota(e.target.value)}
                placeholder="Escribe una nota clínica..."
                rows={3}
                data-testid="textarea-nueva-nota"
                style={{
                  width: "100%", padding: "9px 11px",
                  background: "rgba(0,255,195,0.03)", border: "1px solid rgba(0,255,195,0.15)",
                  borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 12,
                  outline: "none", resize: "none", boxSizing: "border-box"
                }}
              />
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleAddNota}
                disabled={savingNota || !nuevaNota.trim()}
                data-testid="btn-guardar-nota"
                style={{
                  width: "100%", marginTop: 8, padding: "8px",
                  background: nuevaNota.trim() ? "rgba(0,255,195,0.1)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${nuevaNota.trim() ? "rgba(0,255,195,0.3)" : "rgba(255,255,255,0.07)"}`,
                  borderRadius: 6, color: nuevaNota.trim() ? CYAN : "rgba(255,255,255,0.2)",
                  cursor: nuevaNota.trim() ? "pointer" : "default",
                  fontFamily: "monospace", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 5
                }}
              >
                {savingNota ? <Loader2 size={12} style={{ animation: "spin 1s linear infinite" }} /> : <><Plus size={12} /> AÑADIR NOTA</>}
              </motion.button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 320, overflowY: "auto" }}>
              {notas.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "16px 0" }}>Sin notas clínicas.</p>
              ) : notas.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  style={{
                    padding: "10px 12px",
                    background: "rgba(0,255,195,0.03)",
                    border: "1px solid rgba(0,255,195,0.1)",
                    borderRadius: 7, position: "relative"
                  }}
                  data-testid={`nota-${n.id}`}
                >
                  <p style={{ color: "rgba(255,255,255,0.75)", fontSize: 12, lineHeight: 1.6, margin: "0 0 5px", paddingRight: 20, whiteSpace: "pre-wrap" }}>{n.texto}</p>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 10, color: "rgba(0,255,195,0.35)", display: "flex", alignItems: "center", gap: 3 }}>
                      <Calendar size={9} /> {n.fecha.toLocaleDateString("es-PE")}
                    </span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDeleteNota(n.id)}
                        disabled={deletingNota === n.id}
                        style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,49,49,0.4)", padding: 2 }}
                        data-testid={`btn-delete-nota-${n.id}`}
                      >
                        {deletingNota === n.id ? <Loader2 size={11} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={11} />}
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 20 }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
              <Zap size={14} color={GOLD} />
              <h3 style={{ color: GOLD, fontSize: 13, fontWeight: 700, letterSpacing: "0.08em", margin: 0 }}>TIMELINE DE SESIONES</h3>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 400, overflowY: "auto" }}>
              {sesiones.length === 0 ? (
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12, textAlign: "center", padding: "20px 0" }}>Sin sesiones vinculadas a este paciente.</p>
              ) : sesiones.map(s => (
                <div
                  key={s.id}
                  style={{ border: "1px solid rgba(212,175,55,0.15)", borderRadius: 7, overflow: "hidden" }}
                  data-testid={`sesion-${s.id}`}
                >
                  <button
                    onClick={() => setExpandedSesion(expandedSesion === s.id ? null : s.id)}
                    style={{
                      width: "100%", padding: "10px 12px",
                      background: "rgba(212,175,55,0.04)", border: "none", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      color: "#fff", fontFamily: "monospace", fontSize: 12
                    }}
                  >
                    <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                      <span style={{ color: GOLD, fontWeight: 700 }}>
                        {s.fecha.toLocaleDateString("es-PE")}
                      </span>
                      <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                        {s.tipo_sesion === "ducha_mental" ? "Ducha Mental" : "Diagnóstico Clínico"}
                      </span>
                      {s.mapaVoltaje?.codigo_diagnostico && (
                        <span style={{
                          fontSize: 10, color: "#FF3131",
                          background: "rgba(255,49,49,0.08)",
                          border: "1px solid rgba(255,49,49,0.2)",
                          borderRadius: 3, padding: "1px 6px"
                        }}>
                          {s.mapaVoltaje.codigo_diagnostico}
                        </span>
                      )}
                    </div>
                    {expandedSesion === s.id ? <ChevronUp size={13} color="rgba(255,255,255,0.3)" /> : <ChevronDown size={13} color="rgba(255,255,255,0.3)" />}
                  </button>

                  <AnimatePresence>
                    {expandedSesion === s.id && (
                      <motion.div
                        initial={{ height: 0 }}
                        animate={{ height: "auto" }}
                        exit={{ height: 0 }}
                        style={{ overflow: "hidden" }}
                      >
                        <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(212,175,55,0.1)", display: "flex", flexDirection: "column", gap: 8 }}>
                          {s.contenido?.registro_carga && (
                            <div>
                              <span style={{ fontSize: 10, color: "rgba(0,255,195,0.5)", letterSpacing: "0.06em", fontWeight: 700 }}>DUCHA MENTAL — REGISTRO DE CARGA</span>
                              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.6 }}>
                                {s.contenido.registro_carga}
                              </p>
                            </div>
                          )}
                          {s.contenido?.percibo && (
                            <div>
                              <span style={{ fontSize: 10, color: "rgba(212,175,55,0.5)", letterSpacing: "0.06em", fontWeight: 700 }}>PERCIBO</span>
                              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.6 }}>{s.contenido.percibo}</p>
                            </div>
                          )}
                          {s.contenido?.diagnostico_clinico && (
                            <div style={{ paddingTop: 4, borderTop: "1px solid rgba(212,175,55,0.08)" }}>
                              <span style={{ fontSize: 10, color: "rgba(212,175,55,0.7)", letterSpacing: "0.06em", fontWeight: 700 }}>DIAGNÓSTICO CLÍNICO GENERADO</span>
                              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.6 }}>
                                {s.contenido.diagnostico_clinico.slice(0, 400)}
                                {s.contenido.diagnostico_clinico.length > 400 ? "..." : ""}
                              </p>
                            </div>
                          )}
                          {s.contenido?.protocolo_calibracion && (
                            <div style={{ paddingTop: 4, borderTop: "1px solid rgba(0,255,195,0.08)" }}>
                              <span style={{ fontSize: 10, color: "rgba(0,255,195,0.7)", letterSpacing: "0.06em", fontWeight: 700 }}>PROTOCOLO DE CALIBRACIÓN</span>
                              <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 11, margin: "3px 0 0", lineHeight: 1.6 }}>
                                {s.contenido.protocolo_calibracion.slice(0, 400)}
                                {s.contenido.protocolo_calibracion.length > 400 ? "..." : ""}
                              </p>
                            </div>
                          )}
                          {s.mapaVoltaje?.diagnostico && (
                            <div style={{ paddingTop: 4, borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", letterSpacing: "0.06em" }}>MAPA DE VOLTAJE</span>
                              <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 10, margin: "3px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>
                                {s.mapaVoltaje.diagnostico}
                              </p>
                            </div>
                          )}
                          {s.puntos > 0 && (
                            <span style={{ fontSize: 10, color: "rgba(212,175,55,0.5)", paddingTop: 4 }}>+{s.puntos} PS obtenidos</span>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
