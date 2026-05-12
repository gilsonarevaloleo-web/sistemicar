import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, DollarSign, Rocket, Send, CheckCircle } from "lucide-react";
import { toast } from "sonner";

interface AffiliateProposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userCP: number;
}

export function AffiliateProposalModal({ isOpen, onClose, userCP }: AffiliateProposalModalProps) {
  const [step, setStep] = useState<"proposal" | "form" | "success">("proposal");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestAffiliate = async () => {
    if (!name.trim() || !email.trim()) {
      toast.error("Por favor completa todos los campos");
      return;
    }

    setLoading(true);
    await new Promise(r => setTimeout(r, 1000));
    
    const requests = JSON.parse(localStorage.getItem("affiliate_requests") || "[]");
    requests.push({
      name: name.trim(),
      email: email.trim(),
      currentCP: userCP,
      date: new Date().toISOString()
    });
    localStorage.setItem("affiliate_requests", JSON.stringify(requests));
    localStorage.setItem("sistemi_affiliate_requested", "true");
    
    setStep("success");
    setLoading(false);
  };

  const handleDecline = () => {
    localStorage.setItem("sistemi_affiliate_declined", "true");
    onClose();
  };

  const handleClose = () => {
    setStep("proposal");
    setName("");
    setEmail("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-[#0a0c14] border border-white/10 rounded-2xl max-w-md w-full p-6 relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X size={20} />
            </button>

            {step === "proposal" && (
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Rocket size={32} className="text-white" />
                </div>
                
                <h2 className="text-xl font-bold text-white mb-2">
                  ¡Tu progreso es impresionante!
                </h2>
                
                <p className="text-slate-400 text-sm mb-6">
                  Con <span className="text-primary font-bold">{userCP} CP</span> acumulados, 
                  has demostrado que entiendes el poder de SISTEMICAR para transformar tu día.
                </p>

                <div className="bg-gradient-to-br from-amber-500/10 to-orange-600/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <h3 className="text-amber-400 font-semibold mb-3 flex items-center justify-center gap-2">
                    <DollarSign size={18} />
                    Oportunidad de Negocio
                  </h3>
                  <p className="text-slate-300 text-sm mb-3">
                    ¿Te gustaría compartir SISTEMICAR con otros y ganar dinero haciéndolo?
                  </p>
                  <div className="flex items-center justify-center gap-2 text-white font-bold text-lg">
                    <Users size={20} className="text-amber-400" />
                    <span>30% de comisión</span>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Por cada persona que se suscriba con tu enlace
                  </p>
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={handleDecline}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition"
                  >
                    No, gracias
                  </button>
                  <button
                    onClick={() => setStep("form")}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold hover:opacity-90 transition"
                  >
                    ¡Me interesa!
                  </button>
                </div>
              </div>
            )}

            {step === "form" && (
              <div>
                <h2 className="text-xl font-bold text-white mb-2 text-center">
                  Solicitar ser Afiliado
                </h2>
                <p className="text-slate-400 text-sm mb-6 text-center">
                  Déjanos tus datos y te contactaremos pronto
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Nombre completo</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500"
                      placeholder="Tu nombre"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-slate-400 mb-2">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500"
                      placeholder="tu@email.com"
                    />
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setStep("proposal")}
                    className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 font-medium"
                  >
                    Atrás
                  </button>
                  <button
                    onClick={handleRequestAffiliate}
                    disabled={loading}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loading ? (
                      "Enviando..."
                    ) : (
                      <>
                        <Send size={16} />
                        Enviar solicitud
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {step === "success" && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-green-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={32} className="text-green-400" />
                </div>
                <h2 className="text-xl font-bold text-white mb-2">
                  ¡Solicitud Enviada!
                </h2>
                <p className="text-slate-400 text-sm mb-6">
                  Te contactaremos pronto para activar tu cuenta de afiliado.
                </p>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition"
                >
                  Cerrar
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
