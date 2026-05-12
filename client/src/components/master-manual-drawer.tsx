import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BookOpen, Check, ChevronDown, ChevronUp, Award, Sparkles } from "lucide-react";
import { MasterManual, ManualType, getManualByType } from "@/lib/master-manuals";
import { useAuthContext } from "@/App";
import { 
  getManualProgress, 
  markChecklistItem, 
  markManualAsRead,
  markBenefitsAsRead,
  ManualProgress 
} from "@/lib/persistence";
import { toast } from "sonner";

interface MasterManualDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  manualType: ManualType;
  triggerSource?: "manual" | "ia";
}

export function MasterManualDrawer({ 
  isOpen, 
  onClose, 
  manualType,
  triggerSource = "manual" 
}: MasterManualDrawerProps) {
  const { user } = useAuthContext();
  const [manual, setManual] = useState<MasterManual | null>(null);
  const [progress, setProgress] = useState<ManualProgress | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [checkedItems, setCheckedItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (manualType) {
      setManual(getManualByType(manualType));
      const initialExpanded: Record<string, boolean> = {};
      getManualByType(manualType).sections.forEach((s, i) => {
        initialExpanded[s.title] = i === 0;
      });
      setExpandedSections(initialExpanded);
    }
  }, [manualType]);

  useEffect(() => {
    if (user && manualType && isOpen) {
      loadProgress();
      markManualAsRead(user.uid, manualType);
    }
  }, [user, manualType, isOpen]);

  const loadProgress = async () => {
    if (!user) return;
    const prog = await getManualProgress(user.uid, manualType);
    setProgress(prog);
    if (prog?.checkedItems) {
      setCheckedItems(prog.checkedItems);
    }
  };

  const toggleSection = (title: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [title]: !prev[title]
    }));
  };

  const handleCheckItem = async (key: string) => {
    if (!user) return;
    const newValue = !checkedItems[key];
    setCheckedItems(prev => ({ ...prev, [key]: newValue }));
    await markChecklistItem(user.uid, manualType, key, newValue);
  };

  const calculateCompletionPercent = (): number => {
    if (!manual) return 0;
    const totalItems = manual.sections.reduce((sum, s) => sum + s.checklist.length, 0);
    const checkedCount = Object.values(checkedItems).filter(Boolean).length;
    return Math.round((checkedCount / totalItems) * 100);
  };

  if (!manual) return null;

  const completionPercent = calculateCompletionPercent();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-hidden"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            <div 
              className="h-full flex flex-col overflow-hidden"
              style={{ 
                backgroundImage: `
                  radial-gradient(ellipse at top right, ${manual.color}08 0%, transparent 50%),
                  linear-gradient(180deg, #0a0a0a 0%, #050505 100%)
                `
              }}
            >
              <div 
                className="flex-shrink-0 p-5 border-b"
                style={{ borderColor: `${manual.color}20` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${manual.color}20` }}
                    >
                      <BookOpen size={20} style={{ color: manual.color }} />
                    </div>
                    <div>
                      <h2 
                        className="text-lg font-black"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          color: manual.color 
                        }}
                      >
                        {manual.title}
                      </h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">
                        {manual.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div 
                  className="p-3 rounded-xl mb-3"
                  style={{ 
                    backgroundColor: `${manual.color}10`,
                    border: `1px solid ${manual.color}20`
                  }}
                >
                  <p 
                    className="text-sm italic"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: manual.color 
                    }}
                  >
                    "{manual.principle}"
                  </p>
                </div>

                {triggerSource === "ia" && (
                  <div 
                    className="p-3 rounded-xl mb-3 flex items-center gap-2"
                    style={{ backgroundColor: "#D4AF3710", border: "1px solid #D4AF3720" }}
                  >
                    <Award size={16} style={{ color: "#D4AF37" }} />
                    <p className="text-xs text-slate-400">
                      La IA detectó que tu registro necesita más profundidad. Usa esta guía para elevar la pureza.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${completionPercent}%` }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: manual.color }}
                    />
                  </div>
                  <span 
                    className="text-xs font-bold"
                    style={{ color: manual.color }}
                  >
                    {completionPercent}%
                  </span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {manual.sections.map((section, idx) => (
                  <div 
                    key={section.title}
                    className="rounded-2xl overflow-hidden"
                    style={{ 
                      backgroundColor: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.05)"
                    }}
                  >
                    <button
                      onClick={() => toggleSection(section.title)}
                      className="w-full p-4 flex items-center justify-between text-left"
                    >
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span 
                            className="text-[10px] font-bold px-2 py-0.5 rounded"
                            style={{ 
                              backgroundColor: `${manual.color}20`,
                              color: manual.color 
                            }}
                          >
                            EJE {idx + 1}
                          </span>
                        </div>
                        <h3 
                          className="text-sm font-bold text-white"
                          style={{ fontFamily: "'Playfair Display', serif" }}
                        >
                          {section.title}
                        </h3>
                      </div>
                      {expandedSections[section.title] ? (
                        <ChevronUp size={18} className="text-slate-400" />
                      ) : (
                        <ChevronDown size={18} className="text-slate-400" />
                      )}
                    </button>

                    <AnimatePresence>
                      {expandedSections[section.title] && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 space-y-3">
                            <p 
                              className="text-sm text-slate-400 italic pb-3 border-b border-white/5"
                              style={{ fontFamily: "'Playfair Display', serif" }}
                            >
                              {section.instruction}
                            </p>

                            <div className="space-y-2">
                              {section.checklist.map((item) => (
                                <button
                                  key={item.key}
                                  onClick={() => handleCheckItem(item.key)}
                                  className="w-full flex items-start gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors text-left"
                                >
                                  <div 
                                    className={`w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center transition-all ${
                                      checkedItems[item.key] 
                                        ? "" 
                                        : "border border-white/20"
                                    }`}
                                    style={{ 
                                      backgroundColor: checkedItems[item.key] ? manual.color : "transparent"
                                    }}
                                  >
                                    {checkedItems[item.key] && (
                                      <Check size={12} className="text-black" />
                                    )}
                                  </div>
                                  <span 
                                    className={`text-sm ${
                                      checkedItems[item.key] 
                                        ? "text-slate-400 line-through" 
                                        : "text-white"
                                    }`}
                                  >
                                    {item.text}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ))}
              </div>

              <div 
                className="flex-shrink-0 p-4 border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ 
                    backgroundColor: `${manual.color}20`,
                    color: manual.color 
                  }}
                >
                  Cerrar Manual
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

interface ManualTriggerButtonProps {
  manualType: ManualType;
  className?: string;
}

export function ManualTriggerButton({ manualType, className = "" }: ManualTriggerButtonProps) {
  const [isManualOpen, setIsManualOpen] = useState(false);
  const [isBenefitsOpen, setIsBenefitsOpen] = useState(false);
  const manual = getManualByType(manualType);

  return (
    <>
      <div className={`flex items-center gap-1 ${className}`}>
        <button
          onClick={() => setIsManualOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 transition-all"
          title={`📖 Manual: ${manual.title}`}
          data-testid={`btn-manual-${manualType}`}
        >
          <BookOpen size={18} style={{ color: manual.color }} />
        </button>
        <button
          onClick={() => setIsBenefitsOpen(true)}
          className="p-2 rounded-xl hover:bg-white/10 transition-all"
          title={`✨ Beneficios: ${manual.title}`}
          data-testid={`btn-benefits-${manualType}`}
        >
          <Sparkles size={18} style={{ color: manual.color }} />
        </button>
      </div>
      <MasterManualDrawer
        isOpen={isManualOpen}
        onClose={() => setIsManualOpen(false)}
        manualType={manualType}
        triggerSource="manual"
      />
      <BenefitsDrawer
        isOpen={isBenefitsOpen}
        onClose={() => setIsBenefitsOpen(false)}
        manualType={manualType}
      />
    </>
  );
}

interface BenefitsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  manualType: ManualType;
}

export function BenefitsDrawer({ isOpen, onClose, manualType }: BenefitsDrawerProps) {
  const { user } = useAuthContext();
  const [manual, setManual] = useState<MasterManual | null>(null);
  const [hasAwarded, setHasAwarded] = useState(false);

  useEffect(() => {
    if (manualType) {
      setManual(getManualByType(manualType));
    }
  }, [manualType]);

  useEffect(() => {
    if (user && manualType && isOpen && !hasAwarded) {
      markBenefitsAsRead(user.uid, manualType).then((awarded) => {
        if (awarded) {
          setHasAwarded(true);
          toast.success("+3 PS por explorar beneficios", {
            description: `Primera lectura de beneficios: ${manual?.title || manualType}`,
            icon: "✨"
          });
        }
      });
    }
  }, [user, manualType, isOpen, hasAwarded, manual?.title]);

  if (!manual) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-hidden"
            style={{ backgroundColor: "#0a0a0a" }}
          >
            <div 
              className="h-full flex flex-col overflow-hidden"
              style={{ 
                backgroundImage: `
                  radial-gradient(ellipse at top right, ${manual.color}15 0%, transparent 50%),
                  linear-gradient(180deg, #0a0a0a 0%, #050505 100%)
                `
              }}
            >
              <div 
                className="flex-shrink-0 p-5 border-b"
                style={{ borderColor: `${manual.color}20` }}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div 
                      className="w-10 h-10 rounded-xl flex items-center justify-center"
                      style={{ backgroundColor: `${manual.color}20` }}
                    >
                      <Sparkles size={20} style={{ color: manual.color }} />
                    </div>
                    <div>
                      <h2 
                        className="text-lg font-black"
                        style={{ 
                          fontFamily: "'Playfair Display', serif",
                          color: manual.color 
                        }}
                      >
                        ✨ Beneficios
                      </h2>
                      <p className="text-xs text-slate-500 uppercase tracking-widest">
                        {manual.subtitle}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 rounded-full hover:bg-white/10 transition-colors"
                    data-testid="btn-close-benefits"
                  >
                    <X size={18} className="text-slate-400" />
                  </button>
                </div>

                <div 
                  className="p-3 rounded-xl"
                  style={{ 
                    backgroundColor: `${manual.color}10`,
                    border: `1px solid ${manual.color}30`
                  }}
                >
                  <p className="text-sm text-white/80 text-center font-medium">
                    ¿Por qué deberías dominar este módulo?
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-5">
                <div className="space-y-4">
                  {manual.benefits.map((benefit, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="p-4 rounded-2xl"
                      style={{ 
                        backgroundColor: "rgba(255,255,255,0.03)",
                        border: `1px solid ${manual.color}20`
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div 
                          className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          style={{ backgroundColor: `${manual.color}20` }}
                        >
                          <span 
                            className="text-sm font-black"
                            style={{ color: manual.color }}
                          >
                            {idx + 1}
                          </span>
                        </div>
                        <p className="text-white text-sm leading-relaxed pt-1">
                          {benefit}
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 p-4 rounded-2xl text-center"
                  style={{ 
                    background: `linear-gradient(135deg, ${manual.color}10 0%, ${manual.color}05 100%)`,
                    border: `1px solid ${manual.color}30`
                  }}
                >
                  <p 
                    className="text-lg font-bold mb-2"
                    style={{ 
                      fontFamily: "'Playfair Display', serif",
                      color: manual.color 
                    }}
                  >
                    "{manual.principle}"
                  </p>
                  <p className="text-xs text-slate-500 uppercase tracking-widest">
                    — Principio del {manual.subtitle}
                  </p>
                </motion.div>
              </div>

              <div 
                className="flex-shrink-0 p-4 border-t"
                style={{ borderColor: "rgba(255,255,255,0.05)" }}
              >
                <button
                  onClick={onClose}
                  className="w-full py-3 rounded-xl font-bold text-sm transition-all"
                  style={{ 
                    backgroundColor: `${manual.color}20`,
                    color: manual.color 
                  }}
                  data-testid="btn-close-benefits-footer"
                >
                  Entendido
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
