import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CreditCard, ArrowLeft, Shield, Check, Sparkles, Crown, Zap, Star, Lock, Smartphone, ExternalLink, MessageCircle, Heart, Eye, Brain, ListTodo } from "lucide-react";
import { Link, useLocation } from "wouter";
import { toast } from "sonner";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import yapeQrImage from "@assets/yape_qr_2026-02-17T22-11-48_1771384383841.png";

const GOLD = "#D4AF37";
const PURPLE = "#9333ea";
const BLUE = "#3b82f6";

const PAYPAL_LINK = "https://paypal.me/ElimanAte";
const WHATSAPP_NUMBER = "51918260514";

interface PlanFeature {
  name: string;
  locked: boolean;
  highlight?: boolean;
}

interface Plan {
  id: string;
  name: string;
  price: number;
  pricePEN: number;
  isOneTime?: boolean;
  features: PlanFeature[];
  icon: React.ElementType;
  color: string;
  popular?: boolean;
  badge?: string;
}

const plans: Plan[] = [
  { 
    id: "corazon-sabio", 
    name: "El Corazón Sabio™", 
    price: 17,
    pricePEN: 58.08,
    isOneTime: true,
    features: [
      { name: "Doctor IA que lee tu historial de conducta", locked: false },
      { name: "Detección de tu Interfaz de Dolor activa (M01–M10)", locked: false },
      { name: "Patrón de boicot identificado con datos reales", locked: false },
      { name: "Radiografía de tu brecha percepción/realidad", locked: false },
      { name: "10 créditos · ~2 diagnósticos completos", locked: false },
      { name: "7 días gratis — sin tarjeta", locked: false }
    ],
    icon: Heart,
    color: "#E8567F"
  },
  { 
    id: "arquitecto", 
    name: "Arquitecto", 
    price: 24.99,
    pricePEN: 92.00,
    features: [
      { name: "Todo de Soberanía Mental", locked: false },
      { name: "Umbral completo", locked: false },
      { name: "Planificación avanzada", locked: false },
      { name: "Radar IA completo", locked: false },
      { name: "Alquimia Mental", locked: false },
      { name: "Cierre de Jornada IA", locked: false }
    ],
    icon: Star,
    color: GOLD,
    popular: true
  },
  { 
    id: "soberano_operativo", 
    name: "Soberano Operativo", 
    price: 34.99,
    pricePEN: 129.00,
    features: [
      { name: "Todo de Arquitecto", locked: false },
      { name: "Reloj Desglosador ⚡", locked: false, highlight: true },
      { name: "Ciclos secuenciales de misión", locked: false },
      { name: "Auto-regulación de tiempo heredado", locked: false },
      { name: "Proyección de cierre en tiempo real", locked: false },
      { name: "Generador de dopamina para el trabajo", locked: false }
    ],
    icon: ListTodo,
    color: "#00C851",
    badge: "NUEVO"
  },
  { 
    id: "soberano", 
    name: "Soberano", 
    price: 49.99,
    pricePEN: 185.00,
    features: [
      { name: "Todo de Soberano Operativo", locked: false },
      { name: "Proyector de Realidad", locked: false },
      { name: "Manuales de Maestría", locked: false },
      { name: "Sistema de Alianzas", locked: false },
      { name: "Escáner de Creencias", locked: false },
      { name: "Soporte prioritario", locked: false }
    ],
    icon: Crown,
    color: PURPLE
  },
];

const LOCKED_MESSAGE = "El Umbral solo se abre para quienes deciden dejar de ser observadores. Sube al nivel Arquitecto para transmutar tu realidad.";

type PaymentMethod = "mercadopago" | "paypal" | "yape" | null;

const WARM_ROSE = "#E8567F";

const ESPEJO_BENEFITS = [
  { icon: Brain, text: "Doctor IA que lee tu historial de conducta", color: "#00FFC3" },
  { icon: Eye, text: "Detección de tu Interfaz de Dolor activa (M01–M10)", color: "#FF3131" },
  { icon: Heart, text: "Patrón de boicot identificado con datos reales", color: WARM_ROSE },
  { icon: Zap, text: "Radiografía de tu brecha percepción/realidad", color: GOLD },
  { icon: Shield, text: "10 créditos · ~2 diagnósticos completos", color: "#3b82f6" },
  { icon: Sparkles, text: "7 días gratis — sin tarjeta", color: "#F97316" },
];

export default function Pagos() {
  const [selectedPlan, setSelectedPlan] = useState(plans[1]);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [loading, setLoading] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [location] = useLocation();
  const [isEspejoProduct, setIsEspejoProduct] = useState(false);
  const paymentSectionRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const producto = params.get("producto");
    if (producto === "espejo") {
      setIsEspejoProduct(true);
    }
    
    const status = params.get("status");
    const planParam = params.get("plan");
    
    if (planParam === "corazon-sabio") {
      const corazonPlan = plans.find(p => p.id === "corazon-sabio");
      if (corazonPlan) {
        setSelectedPlan(corazonPlan);
        setTimeout(() => {
          paymentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 300);
      }
    }

    if (status === "success") {
      toast.success(`¡Pago exitoso! Bienvenido al Plan ${planParam || "Premium"}`);
    } else if (status === "failure") {
      toast.error("El pago no se pudo completar. Intenta de nuevo.");
    } else if (status === "pending") {
      toast.info("Tu pago está pendiente de confirmación.");
    }
  }, [location]);

  const handleMercadoPago = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/mercadopago/create-preference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planId: selectedPlan.id,
          email: userEmail || localStorage.getItem("userEmail") || undefined,
          userName: localStorage.getItem("userName") || undefined
        })
      });

      const data = await response.json();
      
      if (data.initPoint) {
        window.location.href = data.initPoint;
      } else {
        throw new Error(data.error || "Error creando preferencia de pago");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Error al procesar el pago. Intenta de nuevo.");
    } finally {
      setLoading(false);
    }
  };

  const openPayPal = () => {
    window.open(`${PAYPAL_LINK}/${selectedPlan.price}USD`, "_blank");
  };

  const openWhatsApp = () => {
    if (!userEmail.trim()) {
      toast.error("Por favor ingresa tu correo electrónico");
      return;
    }
    const method = paymentMethod === "paypal" ? "PayPal" : "Yape";
    const amount = paymentMethod === "paypal" ? `$${selectedPlan.price} USD` : `S/ ${selectedPlan.pricePEN.toFixed(2)}`;
    const message = encodeURIComponent(
      `Hola Gilson, acabo de pagar mi suscripción a SISTEMICAR.\n\n` +
      `📧 Mi correo es: ${userEmail}\n` +
      `📦 Plan: ${selectedPlan.name}\n` +
      `💰 Monto: ${amount}\n` +
      `💳 Método: ${method}`
    );
    window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${message}`, "_blank");
  };

  return (
    <TooltipProvider>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen p-4 md:p-10 max-w-4xl mx-auto pb-32"
      >
        <Link href="/menu" className="inline-flex items-center gap-2 text-slate-400 hover:text-white mb-6 text-sm">
          <ArrowLeft size={16} />
          Volver al menú
        </Link>

        <header className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold uppercase tracking-widest mb-4">
            <Shield size={12} />
            Pago Seguro
          </div>
          {isEspejoProduct ? (
            <>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
                EL CORAZÓN <span style={{ color: WARM_ROSE }}>SABIO™</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Pago único · Sin suscripción · Acceso inmediato
              </p>
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter text-white mb-2">
                ELIGE TU <span className="text-primary">PLAN</span>
              </h1>
              <p className="text-slate-400 text-sm">
                Desbloquea todo el poder de SISTEMICAR
              </p>
            </>
          )}
        </header>

        {isEspejoProduct && (
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6 border-2 mb-6"
              style={{ backgroundColor: `${WARM_ROSE}08`, borderColor: `${WARM_ROSE}30` }}
            >
              <div className="text-center mb-6">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${WARM_ROSE} 0%, ${GOLD} 100%)` }}>
                  <Heart size={32} className="text-white" />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-slate-500 line-through text-lg">S/ 97.00</span>
                  <span className="text-4xl font-black" style={{ color: GOLD }}>$17</span>
                </div>
                <p className="text-xs text-slate-500">Equivalente a S/ 58.08 · Pago único</p>
              </div>

              <div className="space-y-3 mb-6">
                {ESPEJO_BENEFITS.map((benefit, i) => {
                  const Icon = benefit.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${benefit.color}15` }}>
                        <Icon size={16} style={{ color: benefit.color }} />
                      </div>
                      <span className="text-slate-300">{benefit.text}</span>
                    </div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="space-y-4 mb-6"
            >
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Elige tu método de pago</p>

              <div className="rounded-2xl p-5 border-2 text-center" style={{ backgroundColor: "rgba(96, 40, 143, 0.08)", borderColor: "rgba(96, 40, 143, 0.4)" }}>
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(96, 40, 143, 0.2)" }}>
                    <Smartphone size={20} style={{ color: "#60288F" }} />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-white text-sm">Yape</p>
                    <p className="text-[10px] text-slate-500">Perú · Pago instantáneo</p>
                  </div>
                </div>
                <img src={yapeQrImage} alt="QR Yape" className="w-44 h-44 mx-auto rounded-lg mb-3" />
                <p className="text-sm font-bold text-white">N° 918260514</p>
                <p className="text-xs text-slate-400 mb-3">Gilson Arevalo Pezo</p>
                <a
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent("Hola Gilson, acabo de pagar El Corazón Sabio ($17) por Yape. Mi correo es: ")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl font-bold text-white text-xs transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: "#25D366" }}
                >
                  <MessageCircle size={14} />
                  Confirmar pago por WhatsApp
                </a>
              </div>

              <a
                href={`${PAYPAL_LINK}/17USD`}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl p-5 border-2 transition-all hover:scale-[1.01]"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
                    <CreditCard size={20} className="text-blue-400" />
                  </div>
                  <div className="text-left flex-1">
                    <p className="font-bold text-white text-sm">PayPal</p>
                    <p className="text-[10px] text-slate-500">Internacional · $17 USD</p>
                  </div>
                  <ExternalLink size={16} className="text-slate-500" />
                </div>
              </a>

              <button
                onClick={async () => {
                  try {
                    const response = await fetch("/api/mercadopago/create-preference", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ planId: "corazon-sabio", email: localStorage.getItem("userEmail") || undefined })
                    });
                    const data = await response.json();
                    if (data.initPoint) {
                      window.location.href = data.initPoint;
                    } else {
                      toast.error("Error al conectar con MercadoPago");
                    }
                  } catch {
                    toast.error("Error al procesar. Intenta otro método.");
                  }
                }}
                className="w-full rounded-2xl p-5 border-2 transition-all hover:scale-[1.01] text-left"
                style={{ backgroundColor: "rgba(59, 130, 246, 0.05)", borderColor: "rgba(59, 130, 246, 0.3)" }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: "rgba(59, 130, 246, 0.2)" }}>
                    <CreditCard size={20} className="text-blue-300" />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-white text-sm">MercadoPago</p>
                    <p className="text-[10px] text-slate-500">Tarjetas, débito · S/ 58.08</p>
                  </div>
                  <ExternalLink size={16} className="text-slate-500" />
                </div>
              </button>

              <p className="text-[10px] text-slate-500 text-center">Después de pagar con Yape o PayPal, envía tu comprobante por WhatsApp para activar tu acceso</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center"
            >
              <Link href="/ventas-espejo" className="text-sm text-slate-500 hover:text-white transition-colors">
                ← Volver a la página del Espejo
              </Link>
            </motion.div>
          </div>
        )}

        {!isEspejoProduct && (<>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {plans.map((plan) => {
            const Icon = plan.icon;
            const isSelected = selectedPlan.id === plan.id;
            
            return (
              <motion.button
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                data-testid={`select-plan-${plan.id}`}
                className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                  isSelected
                    ? "border-primary bg-primary/10"
                    : "border-white/10 hover:border-white/20 bg-card"
                }`}
                style={{
                  borderColor: isSelected ? plan.color : undefined,
                  background: isSelected ? `${plan.color}15` : undefined
                }}
              >
                {plan.popular && (
                  <div 
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black"
                    style={{ background: plan.color }}
                  >
                    Más Popular
                  </div>
                )}
                {plan.badge && (
                  <div 
                    className="absolute -top-3 right-4 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-black"
                    style={{ background: plan.color }}
                  >
                    {plan.badge}
                  </div>
                )}
                
                <div className="flex items-center gap-3 mb-4">
                  <div 
                    className="p-2 rounded-xl"
                    style={{ background: `${plan.color}20` }}
                  >
                    <Icon size={24} style={{ color: plan.color }} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-lg">{plan.name}</h3>
                  </div>
                </div>
                
                <div className="mb-4">
                  <span className="text-3xl font-black text-white">${plan.price}</span>
                  <span className="text-slate-500 text-sm">{plan.isOneTime ? " pago único" : "/mes"}</span>
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm">
                      {feature.locked ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className="flex items-center gap-2 text-slate-500 cursor-help">
                              <Lock size={14} className="text-slate-600" />
                              <span className="line-through">{feature.name}</span>
                            </span>
                          </TooltipTrigger>
                          <TooltipContent 
                            side="top" 
                            className="max-w-xs bg-black/95 border border-amber-500/30 text-amber-200 p-4"
                          >
                            <p className="text-xs leading-relaxed">{LOCKED_MESSAGE}</p>
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        <span className="flex items-center gap-2" style={{ color: feature.highlight ? plan.color : "#cbd5e1", fontWeight: feature.highlight ? 700 : 400 }}>
                          <Check size={14} style={{ color: plan.color }} />
                          {feature.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
                
                {isSelected && (
                  <motion.div
                    layoutId="selected-indicator"
                    className="absolute inset-0 rounded-2xl border-2 pointer-events-none"
                    style={{ borderColor: plan.color }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Payment Method Selection */}
        <div ref={paymentSectionRef} className="p-6 rounded-2xl bg-card border border-white/10 mb-6">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4">
            Método de pago
          </h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setPaymentMethod("mercadopago")}
              data-testid="select-mercadopago"
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === "mercadopago"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <CreditCard className="text-blue-400" size={28} />
              <div className="text-center">
                <p className="font-bold text-white text-sm">Mercado Pago</p>
                <p className="text-[9px] text-slate-500">Tarjetas, débito</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("paypal")}
              data-testid="select-paypal"
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === "paypal"
                  ? "border-blue-500 bg-blue-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <CreditCard className="text-blue-300" size={28} />
              <div className="text-center">
                <p className="font-bold text-white text-sm">PayPal</p>
                <p className="text-[9px] text-slate-500">Internacional</p>
              </div>
            </button>

            <button
              onClick={() => setPaymentMethod("yape")}
              data-testid="select-yape"
              className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                paymentMethod === "yape"
                  ? "border-purple-500 bg-purple-500/10"
                  : "border-white/10 hover:border-white/20"
              }`}
            >
              <Smartphone className="text-purple-400" size={28} />
              <div className="text-center">
                <p className="font-bold text-white text-sm">Yape</p>
                <p className="text-[9px] text-slate-500">Perú</p>
              </div>
            </button>
          </div>
        </div>

        {/* Payment Details by Method */}
        <AnimatePresence mode="wait">
          {paymentMethod === "mercadopago" && (
            <motion.div
              key="mercadopago"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-900/50 border border-blue-500/30 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Plan {selectedPlan.name}</h3>
                  <p className="text-sm text-slate-400">Pago con Mercado Pago</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">${selectedPlan.price}</p>
                  <p className="text-xs text-slate-500">{selectedPlan.isOneTime ? "USD · pago único" : "USD/mes"}</p>
                </div>
              </div>

              <button
                onClick={handleMercadoPago}
                disabled={loading}
                data-testid="pay-mercadopago"
                className="w-full py-4 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-bold text-lg hover:from-blue-400 hover:to-cyan-400 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Sparkles size={20} />
                  </motion.div>
                ) : (
                  <>
                    <CreditCard size={20} />
                    Pagar ${selectedPlan.price} USD
                  </>
                )}
              </button>

              <p className="text-center text-xs text-slate-500 mt-4">
                Tarjetas de crédito, débito, efectivo en agentes
              </p>
            </motion.div>
          )}

          {paymentMethod === "paypal" && (
            <motion.div
              key="paypal"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-blue-900/30 to-slate-900/50 border border-blue-500/30 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Plan {selectedPlan.name}</h3>
                  <p className="text-sm text-slate-400">Pago con PayPal</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">${selectedPlan.price}</p>
                  <p className="text-xs text-slate-500">USD</p>
                </div>
              </div>

              <button
                onClick={openPayPal}
                data-testid="paypal-pay-button"
                className="w-full py-4 rounded-xl bg-blue-500 text-white font-bold hover:bg-blue-400 transition-colors flex items-center justify-center gap-2 mb-4"
              >
                <CreditCard size={20} />
                Pagar ${selectedPlan.price} USD con PayPal
                <ExternalLink size={16} />
              </button>

              <div className="border-t border-white/10 my-6 pt-6">
                <p className="text-sm text-white font-bold text-center mb-4">
                  ¿Ya realizaste el pago?
                </p>
                
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-2">
                    Tu correo electrónico (para activar tu cuenta):
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    data-testid="input-email-paypal"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={openWhatsApp}
                  data-testid="send-receipt-paypal"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle size={20} />
                  ENVIAR COMPROBANTE POR WHATSAPP
                </button>
              </div>
            </motion.div>
          )}

          {paymentMethod === "yape" && (
            <motion.div
              key="yape"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="p-6 rounded-2xl bg-gradient-to-br from-purple-900/30 to-slate-900/50 border border-purple-500/30 mb-8"
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-xl font-bold text-white">Plan {selectedPlan.name}</h3>
                  <p className="text-sm text-slate-400">Pago con Yape</p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-black text-white">S/ {selectedPlan.pricePEN.toFixed(2)}</p>
                  <p className="text-xs text-slate-500">Soles</p>
                </div>
              </div>

              <div className="bg-white rounded-2xl p-6 mb-6">
                <p className="text-center text-black font-bold mb-4">Yapea al número:</p>
                <p className="text-center text-3xl font-black text-purple-600 mb-2">918 260 514</p>
                <p className="text-center text-sm text-gray-500">Gilson Arevalo</p>
              </div>

              <div className="border-t border-white/10 my-6 pt-6">
                <p className="text-sm text-white font-bold text-center mb-4">
                  ¿Ya realizaste el Yape?
                </p>
                
                <div className="mb-4">
                  <label className="block text-xs text-slate-400 mb-2">
                    Tu correo electrónico (para activar tu cuenta):
                  </label>
                  <input
                    type="email"
                    value={userEmail}
                    onChange={(e) => setUserEmail(e.target.value)}
                    placeholder="tu@correo.com"
                    data-testid="input-email-yape"
                    className="w-full px-4 py-3 rounded-xl bg-black/50 border border-white/10 text-white placeholder-slate-500 focus:border-purple-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={openWhatsApp}
                  data-testid="send-receipt-yape"
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold hover:from-green-400 hover:to-emerald-500 transition-all flex items-center justify-center gap-3"
                >
                  <MessageCircle size={20} />
                  ENVIAR COMPROBANTE POR WHATSAPP
                </button>
              </div>
            </motion.div>
          )}

          {!paymentMethod && (
            <motion.div
              key="no-method"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-8 rounded-2xl border border-dashed border-white/20 text-center mb-8"
            >
              <p className="text-slate-500">Selecciona un método de pago arriba</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Manifiesto del Arquitecto */}
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl overflow-hidden mb-12"
          style={{
            background: 'linear-gradient(180deg, #0a0a0a 0%, #050505 100%)',
            border: '1px solid rgba(212, 175, 55, 0.2)'
          }}
        >
          <div className="p-8 md:p-12">
            <h2 
              className="text-2xl md:text-3xl font-bold text-center mb-2"
              style={{ 
                fontFamily: "'Playfair Display', serif",
                color: GOLD
              }}
            >
              El Manifiesto del Arquitecto
            </h2>
            <p className="text-center text-slate-500 text-sm mb-8 tracking-widest uppercase">
              El Fin de la Mente de Pato
            </p>

            <div className="space-y-6 text-slate-300 leading-relaxed">
              <p className="text-sm md:text-base">
                Durante décadas, nos han vendido la ilusión de la "autoayuda". <span className="text-white font-semibold">Nos mintieron.</span> El sistema tradicional solo pone parches a una mente que sigue siendo dependiente, frágil y olvidadiza.
              </p>
              
              <p className="text-sm md:text-base">
                Hoy, ese viejo paradigma ha muerto. Bienvenidos a la era de la <span style={{ color: GOLD }} className="font-bold">Ingeniería de la Identidad</span>. Bienvenidos a Sistemicar.
              </p>

              <div 
                className="my-8 p-6 rounded-xl"
                style={{ 
                  background: 'rgba(212, 175, 55, 0.05)',
                  borderLeft: `3px solid ${GOLD}`
                }}
              >
                <h3 className="font-bold text-white mb-3" style={{ fontFamily: "'Playfair Display', serif" }}>
                  No buscamos la paz, buscamos la Fricción
                </h3>
                <p className="text-sm text-slate-400">
                  Solo a través de la <span className="text-white">Fricción Neuronal</span> se transmuta la debilidad en Poder.
                </p>
              </div>

              <div className="text-center py-4">
                <p 
                  className="text-lg font-bold"
                  style={{ 
                    fontFamily: "'Playfair Display', serif",
                    color: GOLD
                  }}
                >
                  "Eres el Arquitecto de tu Alba."
                </p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Footer Legal */}
        <footer className="border-t border-white/10 pt-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-600">
            <p>
              Al suscribirte aceptas los{" "}
              <Link href="/terminos-condiciones" className="text-primary hover:underline">
                Términos y Condiciones
              </Link>
            </p>
            <div className="flex items-center gap-4">
              <Link href="/libro-reclamaciones" className="hover:text-slate-400 transition-colors">
                Libro de Reclamaciones
              </Link>
              <span>•</span>
              <a href="mailto:info@sistemicar.app" className="hover:text-slate-400 transition-colors">
                Soporte
              </a>
            </div>
          </div>
          <p className="text-center text-[10px] text-slate-700 mt-6">
            © 2025 SISTEMICAR. Todos los derechos reservados.
          </p>
        </footer>
        </>)}
      </motion.div>
    </TooltipProvider>
  );
}
