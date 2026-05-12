import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, CheckCircle2, Loader2, ExternalLink, Code2, Shield, BarChart3, Mail } from "lucide-react";
import { toast } from "sonner";

const TEAL = "#00FFC3";
const DARK_BG = "#050505";
const CARD_BG = "#0a0a0a";

const API_PLANS = [
  {
    id: "api-starter",
    name: "API Starter",
    price: 29,
    priceLabel: "$29",
    period: "/mes",
    callLimit: 500,
    callLimitLabel: "500 llamadas/mes",
    color: TEAL,
    badge: null,
    features: [
      "500 detecciones de interfaz por mes",
      "Respuesta en < 2 segundos",
      "Acceso a JSON con código + confianza",
      "Soporte por email",
      "Válido por 30 días",
    ],
  },
  {
    id: "api-pro",
    name: "API Pro",
    price: 99,
    priceLabel: "$99",
    period: "/mes",
    callLimit: 5000,
    callLimitLabel: "5,000 llamadas/mes",
    color: "#D4AF37",
    badge: "Más popular",
    features: [
      "5,000 detecciones de interfaz por mes",
      "Respuesta en < 2 segundos",
      "Texto y audio (base64) como entrada",
      "Acceso prioritario a mejoras de modelo",
      "Soporte por email con SLA 48h",
      "Válido por 30 días",
    ],
  },
];

const EXAMPLE_RESPONSE = `{
  "code": "INTERFAZ_07",
  "name": "Visionario",
  "confidence": 0.8,
  "timestamp": "2025-04-24T13:00:00Z"
}`;

export default function ApiCheckout() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBuy = async (planId: string) => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Ingresa un email válido para recibir tu clave API.");
      return;
    }
    if (!name.trim() || name.trim().length < 2) {
      toast.error("Ingresa tu nombre para continuar.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId, email: email.trim(), userName: name.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error creando preferencia de pago");
      const url = data.initPoint || data.sandboxInitPoint;
      if (!url) throw new Error("No se recibió URL de pago");
      window.location.href = url;
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Error procesando el pago. Intenta de nuevo.");
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen py-12 px-4"
      style={{ backgroundColor: DARK_BG }}
    >
      <div className="max-w-4xl mx-auto">

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={20} style={{ color: TEAL }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: TEAL }}>
              SISTEMICAR API
            </span>
          </div>
          <h1
            className="text-3xl font-bold mb-4"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Detección de Interfaz Conductual
          </h1>
          <p className="text-slate-400 text-base max-w-xl mx-auto leading-relaxed">
            Integra la detección de interfaces conductuales en tu aplicación. Envía texto o audio y recibe el perfil psicológico del usuario en milisegundos.
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1"><Shield size={11} style={{ color: TEAL }} /> Key encriptada SHA-256</span>
            <span className="flex items-center gap-1"><BarChart3 size={11} style={{ color: TEAL }} /> Uso trackeado en tiempo real</span>
            <span className="flex items-center gap-1"><Code2 size={11} style={{ color: TEAL }} /> REST JSON API</span>
          </div>
        </motion.div>

        {/* Code Example */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 mb-10"
          style={{ backgroundColor: "#0a0a14", border: `1px solid ${TEAL}20` }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Code2 size={12} style={{ color: TEAL }} />
            <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: `${TEAL}80` }}>
              Ejemplo de uso
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <p className="text-[9px] text-slate-600 font-mono mb-1">Request</p>
              <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: "#050510", color: "#e2e8f0", border: `1px solid ${TEAL}15` }}>
{`POST /api/public/detect-interface
X-Api-Key: tu_clave_aqui

{
  "text": "Controlo cada proyecto...",
  "language": "es"
}`}
              </pre>
            </div>
            <div>
              <p className="text-[9px] text-slate-600 font-mono mb-1">Response</p>
              <pre className="text-[10px] font-mono rounded-lg p-3 overflow-x-auto" style={{ backgroundColor: "#050510", color: TEAL, border: `1px solid ${TEAL}15` }}>
                {EXAMPLE_RESPONSE}
              </pre>
            </div>
          </div>
          <a
            href="/api-docs"
            className="inline-flex items-center gap-1.5 mt-3 text-[10px] transition-colors"
            style={{ color: `${TEAL}80` }}
            data-testid="link-api-docs"
          >
            <ExternalLink size={10} />
            Ver documentación completa
          </a>
        </motion.div>

        {/* Email + Name fields */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-5 mb-8"
          style={{ backgroundColor: CARD_BG, border: `1px solid #1e293b` }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Mail size={13} style={{ color: TEAL }} />
            <span className="text-xs font-bold text-white">Tus datos para recibir la clave API</span>
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-slate-500 font-mono mb-1 block">Email *</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@empresa.com"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ backgroundColor: "#050510", border: `1px solid ${TEAL}25`, color: "#e2e8f0" }}
                data-testid="input-buyer-email"
              />
            </div>
            <div>
              <label className="text-[10px] text-slate-500 font-mono mb-1 block">Nombre / Empresa *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Tu nombre o empresa"
                className="w-full px-3 py-2 rounded-lg text-[12px] outline-none"
                style={{ backgroundColor: "#050510", border: `1px solid ${TEAL}25`, color: "#e2e8f0" }}
                data-testid="input-buyer-name"
              />
            </div>
          </div>
          <p className="text-[9px] text-slate-600 mt-2">
            Tu clave API será enviada a este email inmediatamente después de confirmar el pago.
          </p>
        </motion.div>

        {/* Plans */}
        <div className="grid md:grid-cols-2 gap-6 mb-10">
          {API_PLANS.map((plan, i) => (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="relative rounded-2xl p-6 flex flex-col"
              style={{
                backgroundColor: CARD_BG,
                border: `1px solid ${selectedPlan === plan.id ? plan.color : plan.color + "30"}`,
                boxShadow: selectedPlan === plan.id ? `0 0 30px ${plan.color}20` : "none",
                transition: "all 0.2s",
              }}
              data-testid={`card-plan-${plan.id}`}
            >
              {plan.badge && (
                <div
                  className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold"
                  style={{ backgroundColor: plan.color, color: "#050505" }}
                >
                  {plan.badge}
                </div>
              )}

              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={14} style={{ color: plan.color }} />
                  <span className="text-sm font-bold" style={{ color: plan.color }}>
                    {plan.name}
                  </span>
                </div>
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-bold text-white">{plan.priceLabel}</span>
                  <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                </div>
                <span
                  className="text-[11px] font-mono px-2 py-0.5 rounded mt-1 inline-block"
                  style={{ backgroundColor: `${plan.color}15`, color: plan.color }}
                  data-testid={`text-plan-limit-${plan.id}`}
                >
                  {plan.callLimitLabel}
                </span>
              </div>

              <ul className="space-y-2 mb-6 flex-1">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-[11px] text-slate-400">
                    <CheckCircle2 size={12} style={{ color: plan.color, marginTop: 2, flexShrink: 0 }} />
                    {f}
                  </li>
                ))}
              </ul>

              <button
                onClick={() => {
                  setSelectedPlan(plan.id);
                  handleBuy(plan.id);
                }}
                disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm transition-all disabled:opacity-40"
                style={{
                  backgroundColor: `${plan.color}20`,
                  border: `1px solid ${plan.color}60`,
                  color: plan.color,
                }}
                data-testid={`btn-buy-${plan.id}`}
              >
                {loading && selectedPlan === plan.id ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 size={14} className="animate-spin" />
                    Redirigiendo a pago...
                  </span>
                ) : (
                  `Contratar ${plan.name}`
                )}
              </button>
            </motion.div>
          ))}
        </div>

        {/* Enterprise */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-center rounded-2xl p-6"
          style={{ backgroundColor: CARD_BG, border: "1px solid #1e293b" }}
        >
          <p className="text-white font-bold mb-1">¿Necesitas más de 5,000 llamadas/mes?</p>
          <p className="text-slate-500 text-xs mb-4">Planes Enterprise con volumen ilimitado, webhooks personalizados y acuerdo de SLA.</p>
          <a
            href="mailto:info@sistemicar.app?subject=API%20Enterprise%20-%20Consulta"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold transition-all"
            style={{ backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
            data-testid="link-enterprise-contact"
          >
            <Mail size={12} />
            Contactar para Enterprise
          </a>
        </motion.div>

        {/* Footer note */}
        <p className="text-center text-slate-700 text-[10px] mt-8 font-mono">
          Pago seguro procesado por MercadoPago. La clave API llegará a tu email en segundos tras la confirmación.
        </p>
      </div>
    </div>
  );
}
