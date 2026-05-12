import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, DollarSign, Copy, Eye, EyeOff, LogOut, TrendingUp, Calendar, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

interface Partner {
  id: string;
  name: string;
  referralCode: string;
  commissionBalance: string;
}

interface ReferredUser {
  id: string;
  username: string;
  subscriptionPlan: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
}

interface Payment {
  id: string;
  plan: string;
  amount: string;
  commissionAmount: string;
  status: string;
  commissionPaidOut: number;
  createdAt: string;
}

interface DashboardData {
  partner: Partner;
  referredUsers: ReferredUser[];
  payments: Payment[];
  totalReferrals: number;
  totalEarnings: number;
}

const DEMO_CREDENTIALS = { email: "socio@demo.com", password: "demo123" };

const DEMO_DASHBOARD: DashboardData = {
  partner: {
    id: "partner1",
    name: "Socio Demo",
    referralCode: "DEMO2025",
    commissionBalance: "45.00"
  },
  referredUsers: [
    { id: "1", username: "usuario_referido_1", subscriptionPlan: "arquitecto", subscriptionStatus: "active", createdAt: new Date().toISOString() },
    { id: "2", username: "usuario_referido_2", subscriptionPlan: null, subscriptionStatus: "free", createdAt: new Date().toISOString() },
  ],
  payments: [
    { id: "1", plan: "arquitecto", amount: "24.99", commissionAmount: "7.50", status: "completed", commissionPaidOut: 0, createdAt: new Date().toISOString() },
  ],
  totalReferrals: 2,
  totalEarnings: 45.00
};

export default function Socios() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));

    if (email === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
      setIsLoggedIn(true);
      setDashboardData(DEMO_DASHBOARD);
      localStorage.setItem("socioAuth", "true");
      toast.success(`Bienvenido, ${DEMO_DASHBOARD.partner.name}`);
    } else {
      toast.error("Email o contraseña incorrectos");
    }
    setLoading(false);
  };

  useEffect(() => {
    const saved = localStorage.getItem("socioAuth");
    if (saved === "true") {
      setIsLoggedIn(true);
      setDashboardData(DEMO_DASHBOARD);
    }
  }, []);

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDashboardData(null);
    localStorage.removeItem("socioAuth");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copiado al portapapeles");
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "active":
        return <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-400 text-[10px] font-bold">ACTIVO</span>;
      case "pending":
        return <span className="px-2 py-1 rounded-full bg-amber-500/20 text-amber-400 text-[10px] font-bold">PENDIENTE</span>;
      case "free":
        return <span className="px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold">GRATIS</span>;
      default:
        return <span className="px-2 py-1 rounded-full bg-slate-500/20 text-slate-400 text-[10px] font-bold">SIN PLAN</span>;
    }
  };

  const getPaymentStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="text-green-400" size={16} />;
      case "pending":
        return <Clock className="text-amber-400" size={16} />;
      default:
        return <XCircle className="text-red-400" size={16} />;
    }
  };

  if (!isLoggedIn) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: "#020202" }}
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 mx-auto mb-4 flex items-center justify-center">
              <Users className="text-primary" size={32} />
            </div>
            <h1 className="text-3xl font-black italic text-white mb-2">
              PORTAL DE <span className="text-primary">SOCIOS</span>
            </h1>
            <p className="text-sm text-slate-400">
              Accede a tu panel de afiliados
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500"
            />
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Contraseña"
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-500 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
            >
              {loading ? "Verificando..." : "Ingresar"}
            </button>
          </form>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-6 p-4 rounded-xl bg-primary/10 border border-primary/30"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="text-primary flex-shrink-0" size={20} />
              <div>
                <p className="text-xs text-primary font-bold mb-1">MODO DEMOSTRACIÓN</p>
                <p className="text-[11px] text-slate-400 mb-2">
                  Usa estas credenciales de prueba:
                </p>
                <p className="text-[11px] text-slate-300 font-mono">
                  Email: socio@demo.com<br/>
                  Contraseña: demo123
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen p-4 pb-24" style={{ backgroundColor: "#020202" }}>
      <div className="max-w-lg mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black text-white">Portal de Socios</h1>
            <p className="text-sm text-slate-500">{dashboardData?.partner.name}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 rounded-lg bg-red-500/20 text-red-400"
          >
            <LogOut size={20} />
          </button>
        </div>

        {dashboardData && (
          <>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30"
            >
              <p className="text-xs text-slate-400 mb-1">Tu código de referido</p>
              <div className="flex items-center justify-between">
                <span className="text-2xl font-black text-white">{dashboardData.partner.referralCode}</span>
                <button
                  onClick={() => copyToClipboard(`https://sistemicar.app/?ref=${dashboardData.partner.referralCode}`)}
                  className="p-2 rounded-lg bg-white/10 hover:bg-white/20"
                >
                  <Copy size={18} className="text-white" />
                </button>
              </div>
            </motion.div>

            <div className="grid grid-cols-2 gap-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <TrendingUp className="text-green-400 mb-2" size={24} />
                <p className="text-2xl font-black text-white">${dashboardData.totalEarnings.toFixed(2)}</p>
                <p className="text-xs text-slate-500">Ganancias Totales</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="p-4 rounded-xl bg-white/5 border border-white/10"
              >
                <Users className="text-primary mb-2" size={24} />
                <p className="text-2xl font-black text-white">{dashboardData.totalReferrals}</p>
                <p className="text-xs text-slate-500">Referidos</p>
              </motion.div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-3">Usuarios Referidos</h2>
              <div className="space-y-2">
                {dashboardData.referredUsers.map((user) => (
                  <motion.div
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-bold">{user.username}</p>
                      <p className="text-[10px] text-slate-500">
                        <Calendar size={10} className="inline mr-1" />
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    {getStatusBadge(user.subscriptionStatus)}
                  </motion.div>
                ))}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white mb-3">Historial de Pagos</h2>
              <div className="space-y-2">
                {dashboardData.payments.map((payment) => (
                  <motion.div
                    key={payment.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-3 rounded-xl bg-white/5 border border-white/10"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getPaymentStatusIcon(payment.status)}
                        <div>
                          <p className="text-white font-bold">${payment.commissionAmount}</p>
                          <p className="text-[10px] text-slate-500">{payment.plan.toUpperCase()}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-[10px] font-bold ${
                        payment.commissionPaidOut ? "bg-green-500/20 text-green-400" : "bg-amber-500/20 text-amber-400"
                      }`}>
                        {payment.commissionPaidOut ? "PAGADO" : "PENDIENTE"}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
