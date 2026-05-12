import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import {
  Users, Plus, ChevronRight, Loader2, Search, Trash2,
  Brain, Calendar, FileText, X, AlertTriangle, Activity
} from "lucide-react";
import { useAuthContext } from "@/App";
import {
  subscribeToPacientes,
  subscribeToEspejoSessions,
  subscribeSelfExpediente,
  addPaciente,
  deletePaciente,
  type Paciente,
  type EspejoSession,
  type SelfExpediente
} from "@/lib/persistence";
import { toast } from "sonner";

const ADMIN_EMAIL = "gilsonarevalo.leo@gmail.com";
const GOLD = "#D4AF37";
const CYAN = "#00FFC3";
const DARK = "#0A0A0A";

const CODIGOS = ["C1","C2","C3","C4","C5","C6","C7","C8","C9","C10"];
const NIVELES = [".1",".2",".3",".4",".5",".6",".7",".8",".9",".10"];

export default function EspejoExpedientes() {
  const { user } = useAuthContext();
  const [, navigate] = useLocation();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busqueda, setBusqueda] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const [formNombre, setFormNombre] = useState("");
  const [formEmail, setFormEmail] = useState("");
  const [formTelefono, setFormTelefono] = useState("");
  const [formCodigo, setFormCodigo] = useState("");
  const [formNivel, setFormNivel] = useState("");
  const [formNotas, setFormNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const isAdmin = user?.email?.toLowerCase() === ADMIN_EMAIL;
  const [propiasSesiones, setPropiasSesiones] = useState<EspejoSession[]>([]);
  const [selfExpediente, setSelfExpediente] = useState<SelfExpediente | null>(null);

  useEffect(() => {
    if (!user) return;
    if (isAdmin) {
      const unsub = subscribeToPacientes(
        user.uid,
        (data) => { setPacientes(data); setLoading(false); },
        () => setLoading(false)
      );
      return unsub;
    } else {
      const unsubSelf = subscribeSelfExpediente(user.uid, (data) => { setSelfExpediente(data); }, () => {});
      const unsubSes = subscribeToEspejoSessions(
        user.uid,
        (data) => { setPropiasSesiones(data); setLoading(false); },
        () => setLoading(false)
      );
      return () => { unsubSelf(); unsubSes(); };
    }
  }, [user, isAdmin]);

  const handleCrear = async () => {
    if (!user || !formNombre.trim()) return;
    setSaving(true);
    try {
      const id = await addPaciente(user.uid, {
        nombre: formNombre.trim(),
        email: formEmail.trim() || undefined,
        telefono: formTelefono.trim() || undefined,
        codigoActual: formCodigo || undefined,
        nivelMadurez: formCodigo && formNivel ? `${formCodigo}${formNivel}` : undefined,
        notasGenerales: formNotas.trim() || undefined,
        sesionesCount: 0,
        ultimaSesion: null
      });
      setShowForm(false);
      setFormNombre(""); setFormEmail(""); setFormTelefono("");
      setFormCodigo(""); setFormNivel(""); setFormNotas("");
      toast.success("Paciente creado", {
        style: { background: DARK, border: `1px solid ${GOLD}`, color: GOLD }
      });
      navigate(`/espejo/expedientes/${id}`);
    } catch {
      toast.error("Error al crear paciente");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    setDeleting(id);
    try {
      await deletePaciente(user.uid, id);
      setConfirmDelete(null);
      toast.success("Expediente eliminado");
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = pacientes.filter(p =>
    p.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.email || "").toLowerCase().includes(busqueda.toLowerCase()) ||
    (p.nivelMadurez || "").toLowerCase().includes(busqueda.toLowerCase())
  );

  if (!user) return (
    <div style={{ minHeight: "100vh", background: DARK, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <p style={{ color: "rgba(255,255,255,0.4)", fontFamily: "monospace" }}>Inicia sesión para ver expedientes.</p>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: DARK, padding: "24px 16px", fontFamily: "monospace" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button
              onClick={() => navigate("/espejo")}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 6, padding: "6px 10px", color: "rgba(255,255,255,0.4)", cursor: "pointer", fontSize: 12 }}
              data-testid="btn-volver-espejo"
            >
              ← Espejo
            </button>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Users size={18} color={GOLD} />
                <h1 style={{ color: GOLD, fontSize: 18, fontWeight: 700, letterSpacing: "0.1em", margin: 0 }}>
                  EXPEDIENTES CLÍNICOS
                </h1>
              </div>
              <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, margin: "4px 0 0", letterSpacing: "0.05em" }}>
                {isAdmin ? "Vista completa — Doctor IA" : "Tu expediente clínico"}
              </p>
            </div>
          </div>
          {isAdmin && (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setShowForm(true)}
              style={{
                display: "flex", alignItems: "center", gap: 6,
                padding: "10px 16px", borderRadius: 8,
                background: `linear-gradient(135deg, ${GOLD}, #b8962e)`,
                color: DARK, border: "none", cursor: "pointer",
                fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                letterSpacing: "0.05em"
              }}
              data-testid="btn-nuevo-paciente"
            >
              <Plus size={15} /> NUEVO PACIENTE
            </motion.button>
          )}
        </div>

        {isAdmin && pacientes.length > 3 && (
          <div style={{ position: "relative", marginBottom: 20 }}>
            <Search size={14} color="rgba(255,255,255,0.3)" style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar paciente..."
              style={{
                width: "100%", padding: "10px 12px 10px 34px",
                background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: 8, color: "#fff", fontFamily: "monospace", fontSize: 13,
                outline: "none", boxSizing: "border-box"
              }}
              data-testid="input-buscar-paciente"
            />
          </div>
        )}

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: 40 }}>
            <Loader2 size={24} color={GOLD} style={{ animation: "spin 1s linear infinite" }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        ) : !isAdmin ? (
          <div>
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                background: "rgba(255,255,255,0.03)",
                border: `1px solid rgba(212,175,55,0.25)`,
                borderRadius: 12, padding: "20px 24px", marginBottom: 24
              }}
              data-testid="card-self-expediente"
            >
              <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 16 }}>
                <div style={{
                  width: 46, height: 46, borderRadius: "50%",
                  background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)",
                  display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                }}>
                  <span style={{ color: GOLD, fontSize: 18, fontWeight: 700 }}>
                    {(user?.email || "U").charAt(0).toUpperCase()}
                  </span>
                </div>
                <div>
                  <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 4 }}>Mi Expediente</div>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
                    {selfExpediente?.ultimoCodigo && (
                      <span style={{ fontSize: 10, color: "#FF3131", background: "rgba(255,49,49,0.08)", border: "1px solid rgba(255,49,49,0.2)", borderRadius: 4, padding: "2px 7px", letterSpacing: "0.08em" }}>
                        {selfExpediente.ultimoCodigo}
                      </span>
                    )}
                    {selfExpediente?.nivelMadurez && (
                      <span style={{ fontSize: 10, color: CYAN, background: "rgba(0,255,195,0.08)", border: "1px solid rgba(0,255,195,0.2)", borderRadius: 4, padding: "2px 7px" }}>
                        {selfExpediente.nivelMadurez}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 20 }}>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: GOLD, fontSize: 18, fontWeight: 700 }}>{selfExpediente?.sesionesCount || propiasSesiones.length}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>SESIONES</div>
                </div>
                <div style={{ textAlign: "center" }}>
                  <div style={{ color: GOLD, fontSize: 18, fontWeight: 700 }}>{selfExpediente?.puntosSoberania || propiasSesiones.reduce((a, s) => a + (s.puntos || 0), 0)}</div>
                  <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>PS ACUMULADOS</div>
                </div>
                {(selfExpediente?.ultimaSesion || propiasSesiones[0]?.fecha) && (
                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, fontWeight: 700 }}>
                      {(selfExpediente?.ultimaSesion || propiasSesiones[0]?.fecha)?.toLocaleDateString("es-PE")}
                    </div>
                    <div style={{ color: "rgba(255,255,255,0.3)", fontSize: 10, letterSpacing: "0.06em" }}>ÚLT. SESIÓN</div>
                  </div>
                )}
              </div>
            </motion.div>

            {propiasSesiones.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ textAlign: "center", padding: "40px 24px", border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12 }}
              >
                <Brain size={36} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 12px" }} />
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 6 }}>Sin sesiones registradas aún.</p>
                <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Completa una Ducha Mental o Diagnóstico Clínico para empezar.</p>
              </motion.div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 11, letterSpacing: "0.08em", marginBottom: 4 }}>
                  HISTORIAL CLÍNICO — {propiasSesiones.length} SESIÓN{propiasSesiones.length !== 1 ? "ES" : ""}
                </p>
                {propiasSesiones.map((s, i) => (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04 }}
                    style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "14px 18px" }}
                    data-testid={`card-sesion-propia-${s.id}`}
                  >
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Activity size={14} color={CYAN} />
                        <span style={{ color: GOLD, fontSize: 12, fontWeight: 700 }}>{s.fecha.toLocaleDateString("es-PE")}</span>
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                          {s.tipo_sesion === "ducha_mental" ? "Ducha Mental" : "Diagnóstico"}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {s.mapaVoltaje?.codigo_diagnostico && (
                          <span style={{ fontSize: 10, color: "#FF3131", background: "rgba(255,49,49,0.08)", border: "1px solid rgba(255,49,49,0.2)", borderRadius: 3, padding: "1px 6px" }}>
                            {s.mapaVoltaje.codigo_diagnostico}
                          </span>
                        )}
                        {s.puntos > 0 && <span style={{ fontSize: 10, color: GOLD }}>+{s.puntos} PS</span>}
                      </div>
                    </div>
                    {(s.contenido?.registro_carga || s.contenido?.percibo) && (
                      <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, margin: "4px 0 2px", lineHeight: 1.5 }}>
                        {((s.contenido.registro_carga || s.contenido.percibo) || "").slice(0, 150)}
                        {((s.contenido.registro_carga || s.contenido.percibo) || "").length > 150 ? "..." : ""}
                      </p>
                    )}
                    {s.contenido?.diagnostico_clinico && (
                      <p style={{ color: "rgba(212,175,55,0.5)", fontSize: 10, margin: "4px 0 0", lineHeight: 1.4 }}>
                        <strong style={{ color: "rgba(212,175,55,0.7)" }}>DIAGNÓSTICO:</strong>{" "}
                        {s.contenido.diagnostico_clinico.slice(0, 120)}{s.contenido.diagnostico_clinico.length > 120 ? "..." : ""}
                      </p>
                    )}
                    {s.contenido?.protocolo_calibracion && (
                      <p style={{ color: "rgba(0,255,195,0.4)", fontSize: 10, margin: "3px 0 0", lineHeight: 1.4 }}>
                        <strong style={{ color: "rgba(0,255,195,0.6)" }}>PROTOCOLO:</strong>{" "}
                        {s.contenido.protocolo_calibracion.slice(0, 100)}{s.contenido.protocolo_calibracion.length > 100 ? "..." : ""}
                      </p>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              textAlign: "center", padding: "60px 24px",
              border: "1px dashed rgba(255,255,255,0.1)", borderRadius: 12
            }}
          >
            <Brain size={40} color="rgba(255,255,255,0.15)" style={{ margin: "0 auto 16px" }} />
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 14, marginBottom: 8 }}>No hay pacientes registrados.</p>
            <p style={{ color: "rgba(255,255,255,0.2)", fontSize: 12 }}>Crea el primer expediente con el botón de arriba.</p>
          </motion.div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {filtered.map((pac, i) => (
              <motion.div
                key={pac.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.08)",
                  borderRadius: 10, padding: "16px 20px",
                  cursor: "pointer", position: "relative",
                  transition: "border-color 0.2s"
                }}
                whileHover={{ borderColor: "rgba(212,175,55,0.3)" }}
                onClick={() => navigate(`/espejo/expedientes/${pac.id}`)}
                data-testid={`card-paciente-${pac.id}`}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: "50%",
                      background: `rgba(212,175,55,0.1)`,
                      border: `1px solid rgba(212,175,55,0.3)`,
                      display: "flex", alignItems: "center", justifyContent: "center",
                      flexShrink: 0
                    }}>
                      <span style={{ color: GOLD, fontSize: 16, fontWeight: 700 }}>
                        {pac.nombre.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <div style={{ color: "#fff", fontSize: 15, fontWeight: 700, marginBottom: 3 }}>
                        {pac.nombre}
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {pac.nivelMadurez && (
                          <span style={{
                            fontSize: 10, color: CYAN,
                            background: "rgba(0,255,195,0.08)",
                            border: "1px solid rgba(0,255,195,0.2)",
                            borderRadius: 4, padding: "2px 7px", letterSpacing: "0.08em"
                          }}>
                            {pac.nivelMadurez}
                          </span>
                        )}
                        {pac.email && (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{pac.email}</span>
                        )}
                        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", gap: 3 }}>
                          <Calendar size={9} />
                          {pac.ultimaSesion
                            ? pac.ultimaSesion.toLocaleDateString("es-PE")
                            : "Sin sesiones"}
                        </span>
                        {(pac.sesionesCount || 0) > 0 && (
                          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.25)", display: "flex", alignItems: "center", gap: 3 }}>
                            <FileText size={9} /> {pac.sesionesCount} {pac.sesionesCount === 1 ? "sesión" : "sesiones"}
                          </span>
                        )}
                        {(pac.puntosSoberania || 0) > 0 && (
                          <span style={{ fontSize: 10, color: "rgba(212,175,55,0.5)", display: "flex", alignItems: "center", gap: 3 }}>
                            {pac.puntosSoberania} PS acumulados
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    {isAdmin && (
                      <button
                        onClick={e => { e.stopPropagation(); setConfirmDelete(pac.id); }}
                        style={{ background: "none", border: "1px solid rgba(255,49,49,0.2)", borderRadius: 6, padding: "6px", cursor: "pointer", color: "rgba(255,49,49,0.5)" }}
                        data-testid={`btn-delete-paciente-${pac.id}`}
                      >
                        <Trash2 size={13} />
                      </button>
                    )}
                    <ChevronRight size={16} color="rgba(255,255,255,0.2)" />
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 100, padding: 20
              }}
              onClick={e => { if (e.target === e.currentTarget) setShowForm(false); }}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                style={{
                  background: "#111", border: `1px solid rgba(212,175,55,0.3)`,
                  borderRadius: 12, padding: 28, width: "100%", maxWidth: 480,
                  maxHeight: "90vh", overflowY: "auto"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
                  <h2 style={{ color: GOLD, fontSize: 16, fontWeight: 700, margin: 0, letterSpacing: "0.08em" }}>
                    NUEVO PACIENTE
                  </h2>
                  <button onClick={() => setShowForm(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.4)" }}>
                    <X size={18} />
                  </button>
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  {[
                    { label: "Nombre *", value: formNombre, set: setFormNombre, placeholder: "Nombre del paciente", testId: "input-nombre-paciente" },
                    { label: "Email", value: formEmail, set: setFormEmail, placeholder: "correo@ejemplo.com", testId: "input-email-paciente" },
                    { label: "Teléfono", value: formTelefono, set: setFormTelefono, placeholder: "+51 999 999 999", testId: "input-tel-paciente" },
                  ].map(f => (
                    <div key={f.label}>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>{f.label}</label>
                      <input
                        value={f.value}
                        onChange={e => f.set(e.target.value)}
                        placeholder={f.placeholder}
                        data-testid={f.testId}
                        style={{
                          width: "100%", padding: "10px 12px",
                          background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13,
                          outline: "none", boxSizing: "border-box"
                        }}
                      />
                    </div>
                  ))}

                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Código</label>
                      <select
                        value={formCodigo}
                        onChange={e => setFormCodigo(e.target.value)}
                        data-testid="select-codigo-paciente"
                        style={{
                          width: "100%", padding: "10px 12px",
                          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13,
                          outline: "none"
                        }}
                      >
                        <option value="">—</option>
                        {CODIGOS.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Nivel</label>
                      <select
                        value={formNivel}
                        onChange={e => setFormNivel(e.target.value)}
                        data-testid="select-nivel-paciente"
                        style={{
                          width: "100%", padding: "10px 12px",
                          background: "#1a1a1a", border: "1px solid rgba(255,255,255,0.1)",
                          borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13,
                          outline: "none"
                        }}
                      >
                        <option value="">—</option>
                        {NIVELES.map(n => <option key={n} value={n}>{n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, letterSpacing: "0.06em", display: "block", marginBottom: 6 }}>Notas generales</label>
                    <textarea
                      value={formNotas}
                      onChange={e => setFormNotas(e.target.value)}
                      placeholder="Observaciones clínicas iniciales..."
                      rows={3}
                      data-testid="textarea-notas-paciente"
                      style={{
                        width: "100%", padding: "10px 12px",
                        background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
                        borderRadius: 6, color: "#fff", fontFamily: "monospace", fontSize: 13,
                        outline: "none", resize: "vertical", boxSizing: "border-box"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
                  <button
                    onClick={() => setShowForm(false)}
                    style={{
                      flex: 1, padding: "12px", background: "none",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                      color: "rgba(255,255,255,0.4)", cursor: "pointer",
                      fontFamily: "monospace", fontSize: 13
                    }}
                  >
                    Cancelar
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={handleCrear}
                    disabled={saving || !formNombre.trim()}
                    data-testid="btn-confirmar-crear-paciente"
                    style={{
                      flex: 2, padding: "12px",
                      background: formNombre.trim() ? `linear-gradient(135deg, ${GOLD}, #b8962e)` : "rgba(255,255,255,0.05)",
                      border: "none", borderRadius: 8,
                      color: formNombre.trim() ? DARK : "rgba(255,255,255,0.2)",
                      cursor: formNombre.trim() ? "pointer" : "default",
                      fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                      letterSpacing: "0.06em",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 8
                    }}
                  >
                    {saving ? <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} /> : "CREAR EXPEDIENTE"}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {confirmDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{
                position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)",
                display: "flex", alignItems: "center", justifyContent: "center",
                zIndex: 110, padding: 20
              }}
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                style={{
                  background: "#111", border: "1px solid rgba(255,49,49,0.3)",
                  borderRadius: 12, padding: 28, maxWidth: 380, textAlign: "center"
                }}
              >
                <AlertTriangle size={32} color="#FF3131" style={{ margin: "0 auto 16px" }} />
                <h3 style={{ color: "#fff", fontSize: 16, marginBottom: 12 }}>¿Eliminar expediente?</h3>
                <p style={{ color: "rgba(255,255,255,0.4)", fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
                  Esta acción eliminará el expediente del paciente. Las notas clínicas permanecerán en el sistema pero perderán su vínculo. Esta acción no se puede deshacer.
                </p>
                <div style={{ display: "flex", gap: 12 }}>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    style={{
                      flex: 1, padding: "11px", background: "none",
                      border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8,
                      color: "rgba(255,255,255,0.5)", cursor: "pointer", fontFamily: "monospace", fontSize: 13
                    }}
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => handleDelete(confirmDelete)}
                    disabled={!!deleting}
                    data-testid="btn-confirmar-delete-paciente"
                    style={{
                      flex: 1, padding: "11px",
                      background: "rgba(255,49,49,0.15)", border: "1px solid rgba(255,49,49,0.4)",
                      borderRadius: 8, color: "#FF3131", cursor: "pointer",
                      fontFamily: "monospace", fontSize: 13, fontWeight: 700,
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6
                    }}
                  >
                    {deleting ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "ELIMINAR"}
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
