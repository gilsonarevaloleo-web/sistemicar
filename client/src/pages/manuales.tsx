import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  BookOpen,
  Eye,
  Sunrise,
  Wand2,
  Zap,
  Heart,
  Rocket,
  Lock,
  ChevronRight,
} from "lucide-react";
import { Link } from "wouter";
import { PageContainer } from "@/components/page-container";
import { MasterManualDrawer } from "@/components/master-manual-drawer";
import { getAllManuals, ManualType } from "@/lib/master-manuals";
import { useAuthContext } from "@/App";
import { subscribeToProgression, UserProgression } from "@/lib/persistence";
import { getUserEmail } from "@/lib/firebase";
import { isOwner } from "@/lib/owner";

const GOLD = "#D4AF37";

const MANUAL_ICONS: Record<ManualType, React.ElementType> = {
  espejo: Eye,
  deposito: Sunrise,
  alquimia: Wand2,
  umbral: Zap,
  planificacion: Heart,
  proyector: Rocket,
};

function isArquitecto(rank: string | undefined, email: string | null): boolean {
  if (email && isOwner(email)) return true;
  return rank === "arquitecto";
}

export default function Manuales() {
  const { user } = useAuthContext();
  const [progression, setProgression] = useState<UserProgression | null>(null);
  const [openManual, setOpenManual] = useState<ManualType | null>(null);
  const userEmail = getUserEmail();
  const esArquitecto = isArquitecto(progression?.rank, userEmail);
  const manuals = getAllManuals();

  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeToProgression(
      user.uid,
      (prog) => setProgression(prog),
      (e) => console.error("[Manuales] progression:", e)
    );
    return () => unsub();
  }, [user?.uid]);

  const canOpen = (id: ManualType) => id === "espejo" || esArquitecto;

  return (
    <div className="min-h-screen p-4 md:p-6 pb-24 md:pb-6" style={{ backgroundColor: "#050505" }}>
      <PageContainer>
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(212, 175, 55, 0.15)" }}
            >
              <BookOpen size={20} style={{ color: GOLD }} />
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-500">Biblioteca</p>
              <h1 className="text-lg font-bold text-white">Manuales SISTEMICAR</h1>
            </div>
          </div>
          <p className="text-sm text-slate-400">
            Gu�as de uso por m�dulo. Lee, completa el checklist y avanza en tu certificaci�n.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {manuals.map((manual, i) => {
            const Icon = MANUAL_ICONS[manual.id] || BookOpen;
            const locked = !canOpen(manual.id);

            return (
              <motion.button
                key={manual.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => {
                  if (!locked) setOpenManual(manual.id);
                }}
                className={`group relative p-5 rounded-2xl border text-left transition-all duration-300 ${
                  locked ? "opacity-60 cursor-default" : "hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                }`}
                style={{
                  backgroundColor: "#0a0a0a",
                  borderColor: `${manual.color}30`,
                  boxShadow: `0 0 24px ${manual.color}10`,
                }}
                data-testid={`manual-card-${manual.id}`}
              >
                {locked && (
                  <div className="absolute top-3 right-3">
                    <Lock size={14} className="text-slate-500" />
                  </div>
                )}
                <Icon size={24} style={{ color: manual.color }} className="mb-3" />
                <h2 className="text-sm font-bold mb-1" style={{ color: manual.color }}>
                  {manual.title}
                </h2>
                <p className="text-xs text-slate-500 mb-3">{manual.subtitle}</p>
                <p className="text-[11px] text-slate-400 leading-relaxed line-clamp-2">{manual.principle}</p>
                {!locked && (
                  <span
                    className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-wider"
                    style={{ color: manual.color }}
                  >
                    Abrir manual
                    <ChevronRight size={12} />
                  </span>
                )}
                {locked && (
                  <Link href="/pagos">
                    <span
                      className="inline-flex items-center gap-1 mt-3 text-[10px] font-bold uppercase tracking-wider text-amber-500 hover:text-amber-400"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Requiere Arquitecto
                      <ChevronRight size={12} />
                    </span>
                  </Link>
                )}
              </motion.button>
            );
          })}
        </div>

        {!esArquitecto && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-8 p-4 rounded-2xl border text-center"
            style={{
              backgroundColor: "rgba(212, 175, 55, 0.05)",
              borderColor: "rgba(212, 175, 55, 0.2)",
            }}
          >
            <p className="text-sm text-slate-300 mb-3">
              Desbloquea los 6 manuales con el plan Arquitecto
            </p>
            <Link href="/pagos">
              <span className="inline-block px-6 py-2 rounded-xl text-sm font-bold text-black" style={{ backgroundColor: GOLD }}>
                Ver planes
              </span>
            </Link>
          </motion.div>
        )}
      </PageContainer>

      {openManual && (
        <MasterManualDrawer
          isOpen={!!openManual}
          onClose={() => setOpenManual(null)}
          manualType={openManual}
          triggerSource="manual"
        />
      )}
    </div>
  );
}
