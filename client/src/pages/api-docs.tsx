import { motion } from "framer-motion";
import { useLocation } from "wouter";
import {
  Zap, Shield, BarChart3, Code2, Users, TrendingUp, Brain, Target,
  CheckCircle2, ChevronDown, ChevronUp, ExternalLink, ArrowRight, Mail
} from "lucide-react";
import { useState } from "react";

const TEAL = "#00FFC3";
const GOLD = "#D4AF37";
const DARK_BG = "#050505";
const CARD_BG = "#0a0a0a";

const INTERFACES = [
  { code: "01", name: "Cimiento", desc: "Busca seguridad y estabilidad. Toma decisiones con cautela, necesita garantías concretas." },
  { code: "02", name: "Portador", desc: "Orientado al servicio y la responsabilidad. Cumple lo prometido, valora la lealtad." },
  { code: "03", name: "Operario", desc: "Ejecutor metódico. Aprecia instrucciones claras, procesos y resultados medibles." },
  { code: "04", name: "Estratega", desc: "Analiza antes de actuar. Necesita datos, lógica y argumentos bien estructurados." },
  { code: "05", name: "Socio", desc: "Construye relaciones de largo plazo. Decide por confianza y conexión emocional." },
  { code: "06", name: "Capital", desc: "Enfocado en retorno e inversión. Evalúa cada decisión en términos de costo-beneficio." },
  { code: "07", name: "Visionario", desc: "Motivado por ideas grandes. Responde a propuestas innovadoras y posibilidades futuras." },
  { code: "08", name: "Arquitecto", desc: "Diseña sistemas y estructuras. Busca orden, calidad y perfección en cada proceso." },
  { code: "09", name: "Patriarca", desc: "Lidera desde la autoridad y la experiencia. Valora el respeto, el legado y la jerarquía." },
  { code: "10", name: "Soberano", desc: "Opera desde la autonomía total. Toma decisiones independientes, sin necesidad de validación." },
];

const USE_CASES = [
  {
    icon: TrendingUp,
    title: "Ventas",
    desc: "Detecta el perfil de tu prospecto antes de la reunión. Adapta tu discurso al tipo de persona y cierra más.",
    example: "\"Controla cada proyecto y necesita datos\" → INTERFAZ_04 Estratega → presenta con métricas y casos reales.",
  },
  {
    icon: Users,
    title: "Reclutamiento",
    desc: "Analiza las respuestas de los candidatos durante la entrevista y detecta su estilo de trabajo real.",
    example: "Evalúa si el candidato es ejecutor metódico (Operario) o líder visionario (Visionario) en segundos.",
  },
  {
    icon: Brain,
    title: "Coaching",
    desc: "Personaliza cada sesión según la interfaz conductual del cliente. Habla exactamente en su lenguaje.",
    example: "Un coach que detecta INTERFAZ_01 Cimiento ajusta su enfoque a seguridad y pasos pequeños.",
  },
  {
    icon: Target,
    title: "CRM / Marketing",
    desc: "Segmenta tu base de clientes por interfaz y envía mensajes que conectan con cada tipo de mente.",
    example: "Campaña para INTERFAZ_06 Capital enfocada en ROI; para INTERFAZ_07 Visionario, en el futuro.",
  },
];

const FAQS = [
  {
    q: "¿La API funciona en español?",
    a: "Sí, está optimizada para español. También acepta texto en inglés y otros idiomas pasando el parámetro language.",
  },
  {
    q: "¿Cómo recibo mi clave API tras el pago?",
    a: "Inmediatamente después de confirmar el pago en MercadoPago, tu clave API llega a tu email. No hay espera ni trámite manual.",
  },
  {
    q: "¿Qué pasa si se me agotan las llamadas del mes?",
    a: "La API devuelve un error 429. Puedes adquirir un plan nuevo o escribirnos para un plan Enterprise sin límites.",
  },
  {
    q: "¿Puedo enviar audio además de texto?",
    a: "Sí. El plan Pro acepta audio en base64 (formatos webm, mp4, mpeg, wav). El plan Starter acepta texto.",
  },
  {
    q: "¿Los 10 códigos de interfaz son fijos o cambian?",
    a: "Son 10 interfaces conductuales definidas y estables (INTERFAZ_01 a INTERFAZ_10). El modelo devuelve siempre uno de estos códigos.",
  },
  {
    q: "¿Hay período de prueba antes de comprar?",
    a: "Escríbenos a info@sistemicar.app con asunto 'Clave de prueba API' y te enviamos una clave de demo con 10 llamadas gratuitas.",
  },
];

const EXAMPLE_REQUEST = `POST /api/public/detect-interface
Host: sistemicar.app
X-Api-Key: sk_live_xxxxxxxxxxxx
Content-Type: application/json

{
  "text": "Necesito revisar cada detalle antes de tomar una decisión.",
  "language": "es"
}`;

const EXAMPLE_RESPONSE = `{
  "code": "INTERFAZ_04",
  "name": "Estratega",
  "confidence": 0.87,
  "timestamp": "2026-04-24T13:00:00Z"
}`;

export default function ApiDocs() {
  const [, navigate] = useLocation();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen" style={{ backgroundColor: DARK_BG }}>

      {/* ── HERO ── */}
      <div className="py-20 px-4 text-center" style={{ borderBottom: `1px solid ${TEAL}15` }}>
        <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex items-center justify-center gap-2 mb-4">
            <Zap size={18} style={{ color: TEAL }} />
            <span className="text-[11px] font-mono tracking-widest uppercase" style={{ color: TEAL }}>
              SISTEMICAR API · Documentación
            </span>
          </div>
          <h1
            className="text-4xl md:text-5xl font-bold mb-5 leading-tight"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Detecta la mente de cada persona<br />
            <span style={{ color: TEAL }}>en milisegundos</span>
          </h1>
          <p className="text-slate-400 text-base max-w-2xl mx-auto leading-relaxed mb-8">
            Envía texto o audio de cualquier persona y recibe al instante su perfil conductual:
            quién es, cómo decide y qué necesita escuchar para actuar.
            Integra con 3 líneas de código en cualquier plataforma.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 text-[11px] text-slate-500 mb-10">
            <span className="flex items-center gap-1.5"><Shield size={11} style={{ color: TEAL }} /> Clave encriptada SHA-256</span>
            <span className="flex items-center gap-1.5"><BarChart3 size={11} style={{ color: TEAL }} /> Uso trackeado en tiempo real</span>
            <span className="flex items-center gap-1.5"><Code2 size={11} style={{ color: TEAL }} /> REST JSON · respuesta &lt; 2 seg</span>
            <span className="flex items-center gap-1.5"><Zap size={11} style={{ color: TEAL }} /> 10 perfiles conductuales</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/api-checkout")}
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all"
              style={{ backgroundColor: `${TEAL}20`, border: `1px solid ${TEAL}60`, color: TEAL }}
              data-testid="btn-hero-cta"
            >
              Obtener clave API →
            </button>
            <a
              href="mailto:info@sistemicar.app?subject=Clave%20de%20prueba%20API"
              className="px-8 py-3 rounded-xl font-bold text-sm transition-all text-center"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e293b", color: "#94a3b8" }}
              data-testid="btn-hero-demo"
            >
              Pedir clave de prueba gratuita
            </a>
          </div>
        </motion.div>
      </div>

      {/* ── CASOS DE USO ── */}
      <div className="py-16 px-4 max-w-5xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-center mb-2" style={{ color: `${TEAL}80` }}>
            ¿Para qué sirve?
          </p>
          <h2
            className="text-2xl font-bold text-center mb-10"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Aplicaciones en negocios reales
          </h2>
          <div className="grid sm:grid-cols-2 gap-5">
            {USE_CASES.map((uc, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="rounded-2xl p-5"
                style={{ backgroundColor: CARD_BG, border: `1px solid ${TEAL}15` }}
                data-testid={`card-usecase-${i}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <uc.icon size={15} style={{ color: TEAL }} />
                  <span className="text-sm font-bold text-white">{uc.title}</span>
                </div>
                <p className="text-slate-400 text-[12px] leading-relaxed mb-3">{uc.desc}</p>
                <div
                  className="rounded-lg px-3 py-2 text-[10px] font-mono leading-relaxed"
                  style={{ backgroundColor: `${TEAL}08`, color: `${TEAL}90`, border: `1px solid ${TEAL}15` }}
                >
                  {uc.example}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── LAS 10 INTERFACES ── */}
      <div className="py-16 px-4" style={{ borderTop: `1px solid ${TEAL}10`, borderBottom: `1px solid ${TEAL}10` }}>
        <div className="max-w-5xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-[10px] font-mono tracking-widest uppercase text-center mb-2" style={{ color: `${TEAL}80` }}>
              El sistema
            </p>
            <h2
              className="text-2xl font-bold text-center mb-3"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
            >
              Las 10 Interfaces Conductuales
            </h2>
            <p className="text-slate-500 text-sm text-center mb-10 max-w-xl mx-auto">
              Cada persona opera desde una de estas 10 interfaces. La API detecta cuál es a partir de su lenguaje.
            </p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {INTERFACES.map((iface, i) => (
                <motion.div
                  key={iface.code}
                  initial={{ opacity: 0, scale: 0.97 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="rounded-xl p-4"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${TEAL}12` }}
                  data-testid={`card-interface-${iface.code}`}
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <span
                      className="text-[9px] font-mono px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: `${TEAL}12`, color: `${TEAL}90` }}
                    >
                      INTERFAZ_{iface.code}
                    </span>
                    <span className="text-sm font-bold text-white">{iface.name}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{iface.desc}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── CÓMO FUNCIONA ── */}
      <div className="py-16 px-4 max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-center mb-2" style={{ color: `${TEAL}80` }}>
            Integración
          </p>
          <h2
            className="text-2xl font-bold text-center mb-10"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Listo en 3 pasos
          </h2>
          <div className="grid sm:grid-cols-3 gap-6 mb-12">
            {[
              { n: "1", title: "Compra tu plan", desc: "Elige Starter o Pro, paga por MercadoPago y recibes tu clave API en el email en segundos." },
              { n: "2", title: "Integra en tu app", desc: "Un POST con tu clave en el header y el texto de tu usuario en el body. Sin SDKs, sin configuración." },
              { n: "3", title: "Recibe el perfil", desc: "La respuesta llega en menos de 2 segundos: código de interfaz, nombre y nivel de confianza." },
            ].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
                data-testid={`card-step-${i + 1}`}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold mx-auto mb-3"
                  style={{ backgroundColor: `${TEAL}15`, color: TEAL, border: `1px solid ${TEAL}40` }}
                >
                  {step.n}
                </div>
                <p className="font-bold text-white text-sm mb-1">{step.title}</p>
                <p className="text-slate-500 text-[12px] leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Ejemplo de código */}
          <div
            className="rounded-2xl p-5"
            style={{ backgroundColor: "#0a0a14", border: `1px solid ${TEAL}20` }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Code2 size={12} style={{ color: TEAL }} />
              <span className="text-[10px] font-mono uppercase tracking-widest" style={{ color: `${TEAL}80` }}>
                Ejemplo completo
              </span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-slate-600 font-mono mb-1.5">Request</p>
                <pre
                  className="text-[10px] font-mono rounded-xl p-4 overflow-x-auto whitespace-pre-wrap"
                  style={{ backgroundColor: "#050510", color: "#e2e8f0", border: `1px solid ${TEAL}12` }}
                >
                  {EXAMPLE_REQUEST}
                </pre>
              </div>
              <div>
                <p className="text-[9px] text-slate-600 font-mono mb-1.5">Response</p>
                <pre
                  className="text-[10px] font-mono rounded-xl p-4 overflow-x-auto"
                  style={{ backgroundColor: "#050510", color: TEAL, border: `1px solid ${TEAL}12` }}
                >
                  {EXAMPLE_RESPONSE}
                </pre>
                <div className="mt-3 rounded-lg px-3 py-2 text-[10px] text-slate-500" style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e293b" }}>
                  <p className="mb-1"><span style={{ color: `${TEAL}80` }}>code</span> → código INTERFAZ_01..10</p>
                  <p className="mb-1"><span style={{ color: `${TEAL}80` }}>name</span> → nombre legible de la interfaz</p>
                  <p><span style={{ color: `${TEAL}80` }}>confidence</span> → confianza 0.0 – 1.0</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── PRECIOS ── */}
      <div className="py-16 px-4" style={{ borderTop: `1px solid ${TEAL}10` }}>
        <div className="max-w-3xl mx-auto">
          <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            <p className="text-[10px] font-mono tracking-widest uppercase text-center mb-2" style={{ color: `${TEAL}80` }}>
              Planes
            </p>
            <h2
              className="text-2xl font-bold text-center mb-10"
              style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
            >
              Elige tu plan
            </h2>
            <div className="grid sm:grid-cols-2 gap-6 mb-8">
              {[
                {
                  id: "api-starter",
                  name: "Starter",
                  price: "$29",
                  period: "/mes",
                  calls: "500 llamadas/mes",
                  color: TEAL,
                  badge: null,
                  features: [
                    "500 detecciones por mes",
                    "Entrada de texto",
                    "Respuesta en < 2 seg",
                    "Clave activa 30 días",
                    "Soporte por email",
                  ],
                },
                {
                  id: "api-pro",
                  name: "Pro",
                  price: "$99",
                  period: "/mes",
                  calls: "5,000 llamadas/mes",
                  color: GOLD,
                  badge: "Más popular",
                  features: [
                    "5,000 detecciones por mes",
                    "Texto + audio (base64)",
                    "Respuesta en < 2 seg",
                    "Acceso prioritario a mejoras",
                    "Soporte con SLA 48h",
                    "Clave activa 30 días",
                  ],
                },
              ].map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="relative rounded-2xl p-6 flex flex-col"
                  style={{ backgroundColor: CARD_BG, border: `1px solid ${plan.color}35` }}
                  data-testid={`card-pricing-${plan.id}`}
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
                    <span className="text-sm font-bold" style={{ color: plan.color }}>{plan.name}</span>
                    <div className="flex items-end gap-1 mt-1">
                      <span className="text-3xl font-bold text-white">{plan.price}</span>
                      <span className="text-slate-500 text-sm mb-1">{plan.period}</span>
                    </div>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded mt-1 inline-block"
                      style={{ backgroundColor: `${plan.color}12`, color: plan.color }}
                    >
                      {plan.calls}
                    </span>
                  </div>
                  <ul className="space-y-2 mb-6 flex-1">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-[11px] text-slate-400">
                        <CheckCircle2 size={11} style={{ color: plan.color, marginTop: 2, flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => navigate("/api-checkout")}
                    className="w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
                    style={{ backgroundColor: `${plan.color}18`, border: `1px solid ${plan.color}50`, color: plan.color }}
                    data-testid={`btn-pricing-${plan.id}`}
                  >
                    Contratar {plan.name}
                    <ArrowRight size={14} />
                  </button>
                </motion.div>
              ))}
            </div>

            {/* Enterprise */}
            <div
              className="rounded-2xl p-5 text-center"
              style={{ backgroundColor: CARD_BG, border: "1px solid #1e293b" }}
            >
              <p className="text-white font-bold text-sm mb-1">¿Más de 5,000 llamadas/mes?</p>
              <p className="text-slate-500 text-xs mb-4">Planes Enterprise con volumen ilimitado, webhooks y SLA garantizado.</p>
              <a
                href="mailto:info@sistemicar.app?subject=API%20Enterprise"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-bold"
                style={{ backgroundColor: "#1e293b", color: "#94a3b8", border: "1px solid #334155" }}
                data-testid="btn-enterprise"
              >
                <Mail size={12} />
                Escribir para Enterprise
              </a>
            </div>
          </motion.div>
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="py-16 px-4 max-w-2xl mx-auto">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <p className="text-[10px] font-mono tracking-widest uppercase text-center mb-2" style={{ color: `${TEAL}80` }}>
            Preguntas frecuentes
          </p>
          <h2
            className="text-2xl font-bold text-center mb-8"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Resuelve tus dudas
          </h2>
          <div className="space-y-2">
            {FAQS.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.05 }}
                className="rounded-xl overflow-hidden"
                style={{ backgroundColor: CARD_BG, border: `1px solid ${openFaq === i ? TEAL + "30" : "#1e293b"}` }}
                data-testid={`faq-item-${i}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left"
                  data-testid={`btn-faq-${i}`}
                >
                  <span className="text-sm font-semibold text-white pr-4">{faq.q}</span>
                  {openFaq === i
                    ? <ChevronUp size={14} style={{ color: TEAL, flexShrink: 0 }} />
                    : <ChevronDown size={14} style={{ color: "#475569", flexShrink: 0 }} />
                  }
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-slate-400 text-[12px] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── CTA FINAL ── */}
      <div className="py-16 px-4" style={{ borderTop: `1px solid ${TEAL}10` }}>
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-xl mx-auto text-center"
        >
          <Zap size={28} style={{ color: TEAL, margin: "0 auto 16px" }} />
          <h2
            className="text-2xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: "#f0f0f0" }}
          >
            Empieza hoy
          </h2>
          <p className="text-slate-500 text-sm mb-8">
            Tu clave API llega a tu email en segundos. Sin contratos, sin trámites.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => navigate("/api-checkout")}
              className="px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all"
              style={{ backgroundColor: `${TEAL}20`, border: `1px solid ${TEAL}60`, color: TEAL }}
              data-testid="btn-final-cta"
            >
              Ver planes y precios
              <ArrowRight size={14} />
            </button>
            <a
              href="mailto:info@sistemicar.app?subject=Clave%20de%20prueba%20API"
              className="px-8 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2"
              style={{ backgroundColor: "#0a0a0a", border: "1px solid #1e293b", color: "#94a3b8" }}
              data-testid="btn-final-demo"
            >
              <Mail size={13} />
              Pedir demo gratuita
            </a>
          </div>
        </motion.div>
      </div>

      {/* ── FOOTER ── */}
      <div className="py-6 px-4 text-center" style={{ borderTop: "1px solid #0f172a" }}>
        <p className="text-slate-700 text-[10px] font-mono">
          SISTEMICAR API · sistemicar.app · info@sistemicar.app
        </p>
      </div>

    </div>
  );
}
