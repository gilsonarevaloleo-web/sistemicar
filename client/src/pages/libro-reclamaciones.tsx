import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  FileText, 
  User, 
  Mail, 
  Phone, 
  MessageSquare, 
  Send,
  ChevronLeft,
  Shield,
  CheckCircle,
  AlertCircle,
  Clock,
  Building,
  CreditCard
} from "lucide-react";
import { Link } from "wouter";
import { toast } from "sonner";
import { useAuthContext } from "@/App";

const BLUE = "#3b82f6";
const GOLD = "#D4AF37";

interface FormData {
  tipoDocumento: "DNI" | "CE" | "PASAPORTE";
  numeroDocumento: string;
  nombreCompleto: string;
  email: string;
  telefono: string;
  direccion: string;
  tipoReclamo: "RECLAMO" | "QUEJA";
  detalleReclamo: string;
  pedidoConcreto: string;
  aceptaTerminos: boolean;
}

export default function LibroReclamaciones() {
  const { user } = useAuthContext();
  const [formData, setFormData] = useState<FormData>({
    tipoDocumento: "DNI",
    numeroDocumento: "",
    nombreCompleto: "",
    email: user?.email || "",
    telefono: "",
    direccion: "",
    tipoReclamo: "RECLAMO",
    detalleReclamo: "",
    pedidoConcreto: "",
    aceptaTerminos: false
  });
  const [enviando, setEnviando] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [numeroReclamo, setNumeroReclamo] = useState("");

  const handleChange = (field: keyof FormData, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validarFormulario = (): boolean => {
    if (!formData.nombreCompleto.trim()) {
      toast.error("Ingrese su nombre completo");
      return false;
    }
    if (!formData.numeroDocumento.trim() || formData.numeroDocumento.length < 8) {
      toast.error("Ingrese un número de documento válido");
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes("@")) {
      toast.error("Ingrese un correo electrónico válido");
      return false;
    }
    if (!formData.telefono.trim() || formData.telefono.length < 9) {
      toast.error("Ingrese un número de teléfono válido");
      return false;
    }
    if (!formData.detalleReclamo.trim() || formData.detalleReclamo.length < 20) {
      toast.error("El detalle del reclamo debe tener al menos 20 caracteres");
      return false;
    }
    if (!formData.pedidoConcreto.trim()) {
      toast.error("Ingrese su pedido concreto");
      return false;
    }
    if (!formData.aceptaTerminos) {
      toast.error("Debe aceptar los términos para continuar");
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validarFormulario()) return;

    setEnviando(true);
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const numero = `REC-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setNumeroReclamo(numero);
    setEnviado(true);
    setEnviando(false);
  };

  if (enviado) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#050505" }}>
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="w-full max-w-md p-8 rounded-3xl text-center"
          style={{ 
            backgroundColor: "#0a0a0a",
            border: `1px solid ${BLUE}30`
          }}
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${BLUE}20` }}
          >
            <CheckCircle size={40} style={{ color: BLUE }} />
          </motion.div>

          <h2 className="text-2xl font-black text-white mb-2">
            Reclamación Registrada
          </h2>
          
          <div 
            className="inline-block px-4 py-2 rounded-xl mb-4"
            style={{ backgroundColor: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
          >
            <p className="text-xs text-slate-500 uppercase tracking-widest mb-1">Número de Reclamo</p>
            <p className="text-lg font-mono font-bold" style={{ color: GOLD }}>{numeroReclamo}</p>
          </div>

          <div 
            className="p-4 rounded-2xl mb-6 text-left"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", border: `1px solid ${BLUE}20` }}
          >
            <div className="flex items-start gap-3">
              <Clock size={18} style={{ color: BLUE }} className="mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Plazo de Respuesta</p>
                <p className="text-xs text-zinc-400">
                  De acuerdo con la normativa de INDECOPI, su reclamo será atendido en un plazo máximo de <strong className="text-white">15 días hábiles</strong> contados desde la fecha de registro.
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-3 text-sm text-zinc-400 mb-6">
            <p>Hemos enviado una copia a: <span className="text-white">{formData.email}</span></p>
            <p>Fecha de registro: <span className="text-white">{new Date().toLocaleDateString('es-PE')}</span></p>
          </div>

          <Link href="/menu">
            <button
              className="w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
              style={{ backgroundColor: BLUE }}
            >
              Volver al Inicio
            </button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: "#050505" }}>
      <div className="max-w-lg mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link href="/terminos-condiciones">
            <button className="flex items-center gap-2 text-slate-500 hover:text-white transition-colors mb-6">
              <ChevronLeft size={18} />
              <span className="text-sm">Volver</span>
            </button>
          </Link>

          <div className="flex items-center gap-4 mb-4">
            <div 
              className="w-14 h-14 rounded-3xl flex items-center justify-center"
              style={{ backgroundColor: `${BLUE}15`, border: `1px solid ${BLUE}30` }}
            >
              <FileText size={28} style={{ color: BLUE }} />
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">
                Libro de Reclamaciones
              </h1>
              <p className="text-xs text-slate-500 uppercase tracking-widest">
                Conforme a la normativa INDECOPI
              </p>
            </div>
          </div>

          <div 
            className="p-4 rounded-3xl mb-6"
            style={{ backgroundColor: "rgba(59, 130, 246, 0.08)", border: `1px solid ${BLUE}20` }}
          >
            <div className="flex items-start gap-3">
              <Shield size={18} style={{ color: BLUE }} className="mt-0.5" />
              <div>
                <p className="text-sm font-bold text-white mb-1">Proveedor del Servicio</p>
                <p className="text-xs text-zinc-400">
                  SISTEMICAR • Gilson Arevalo Pezo<br />
                  Correo: gilsonarevalo.leo@gmail.com<br />
                  Teléfono: +51 918 260 514<br />
                  Lima, Perú
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-5 rounded-3xl"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <User size={16} style={{ color: BLUE }} />
              Datos del Consumidor
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                  Nombre Completo *
                </label>
                <input
                  type="text"
                  value={formData.nombreCompleto}
                  onChange={(e) => handleChange("nombreCompleto", e.target.value)}
                  placeholder="Ingrese su nombre completo"
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  data-testid="input-nombre"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                    Tipo Doc.
                  </label>
                  <select
                    value={formData.tipoDocumento}
                    onChange={(e) => handleChange("tipoDocumento", e.target.value)}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    data-testid="select-tipo-doc"
                  >
                    <option value="DNI">DNI</option>
                    <option value="CE">CE</option>
                    <option value="PASAPORTE">Pasaporte</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                    Número de Documento *
                  </label>
                  <input
                    type="text"
                    value={formData.numeroDocumento}
                    onChange={(e) => handleChange("numeroDocumento", e.target.value.replace(/\D/g, ""))}
                    placeholder="Ej: 12345678"
                    maxLength={12}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    data-testid="input-documento"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="correo@ejemplo.com"
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    data-testid="input-email"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                    Teléfono *
                  </label>
                  <input
                    type="tel"
                    value={formData.telefono}
                    onChange={(e) => handleChange("telefono", e.target.value.replace(/\D/g, ""))}
                    placeholder="999999999"
                    maxLength={9}
                    className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                    data-testid="input-telefono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                  Dirección (opcional)
                </label>
                <input
                  type="text"
                  value={formData.direccion}
                  onChange={(e) => handleChange("direccion", e.target.value)}
                  placeholder="Av./Jr./Calle, Distrito, Provincia"
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors"
                  data-testid="input-direccion"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="p-5 rounded-3xl"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
              <MessageSquare size={16} style={{ color: BLUE }} />
              Detalle del Reclamo
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                  Tipo de Reclamo
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange("tipoReclamo", "RECLAMO")}
                    className={`p-3 rounded-2xl text-sm font-medium transition-all ${
                      formData.tipoReclamo === "RECLAMO"
                        ? "text-white"
                        : "bg-zinc-900 border border-zinc-700 text-zinc-400"
                    }`}
                    style={formData.tipoReclamo === "RECLAMO" ? { backgroundColor: BLUE } : {}}
                    data-testid="btn-reclamo"
                  >
                    Reclamo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange("tipoReclamo", "QUEJA")}
                    className={`p-3 rounded-2xl text-sm font-medium transition-all ${
                      formData.tipoReclamo === "QUEJA"
                        ? "text-white"
                        : "bg-zinc-900 border border-zinc-700 text-zinc-400"
                    }`}
                    style={formData.tipoReclamo === "QUEJA" ? { backgroundColor: BLUE } : {}}
                    data-testid="btn-queja"
                  >
                    Queja
                  </button>
                </div>
                <p className="text-[10px] text-zinc-500 mt-2">
                  <strong>Reclamo:</strong> Disconformidad con el servicio.<br />
                  <strong>Queja:</strong> Malestar respecto a la atención.
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                  Detalle del Reclamo *
                </label>
                <textarea
                  value={formData.detalleReclamo}
                  onChange={(e) => handleChange("detalleReclamo", e.target.value)}
                  placeholder="Describa con detalle su reclamo o queja..."
                  rows={4}
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  data-testid="textarea-detalle"
                />
                <p className="text-[10px] text-zinc-500 mt-1 text-right">
                  {formData.detalleReclamo.length} / 1000 caracteres
                </p>
              </div>

              <div>
                <label className="block text-xs text-slate-500 mb-2 uppercase tracking-widest">
                  Pedido Concreto *
                </label>
                <textarea
                  value={formData.pedidoConcreto}
                  onChange={(e) => handleChange("pedidoConcreto", e.target.value)}
                  placeholder="¿Qué solución espera recibir?"
                  rows={2}
                  className="w-full p-3 rounded-2xl bg-zinc-900 border border-zinc-700 text-white text-sm focus:border-blue-500 focus:outline-none transition-colors resize-none"
                  data-testid="textarea-pedido"
                />
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="p-5 rounded-3xl"
            style={{ 
              backgroundColor: "rgba(255,255,255,0.02)",
              border: "1px solid rgba(255,255,255,0.05)"
            }}
          >
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.aceptaTerminos}
                onChange={(e) => handleChange("aceptaTerminos", e.target.checked)}
                className="mt-1 w-5 h-5 rounded-lg border-zinc-700 bg-zinc-900 text-blue-500 focus:ring-blue-500"
                data-testid="checkbox-terminos"
              />
              <span className="text-xs text-zinc-400">
                Declaro que la información proporcionada es verídica y autorizo el tratamiento de mis datos personales conforme a la{" "}
                <Link href="/terminos-condiciones">
                  <span className="text-blue-400 hover:underline cursor-pointer">Política de Privacidad</span>
                </Link>{" "}
                y la Ley N° 29733, Ley de Protección de Datos Personales del Perú.
              </span>
            </label>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <button
              onClick={handleSubmit}
              disabled={enviando}
              className="w-full py-4 rounded-3xl font-bold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-3"
              style={{ backgroundColor: BLUE }}
              data-testid="btn-enviar-reclamo"
            >
              {enviando ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Registrando...
                </>
              ) : (
                <>
                  <Send size={20} />
                  Enviar Reclamación
                </>
              )}
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="p-4 rounded-2xl"
            style={{ backgroundColor: "rgba(212, 175, 55, 0.05)", border: `1px solid ${GOLD}20` }}
          >
            <div className="flex items-start gap-3">
              <AlertCircle size={16} style={{ color: GOLD }} className="mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-zinc-500">
                Conforme al Código de Protección y Defensa del Consumidor (Ley N° 29571) y el Reglamento del Libro de Reclamaciones (D.S. N° 011-2011-PCM), el proveedor tiene un plazo máximo de <strong className="text-white">15 días hábiles</strong> para dar respuesta a su reclamo.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
