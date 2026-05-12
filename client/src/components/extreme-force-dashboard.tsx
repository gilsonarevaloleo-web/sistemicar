import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Target, TrendingUp, Heart, Camera, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuthContext } from "@/App";
import { subscribeToProgression, UserProgression } from "@/lib/persistence";

interface ExtremeForceProps {
  isOpen: boolean;
  onClose: () => void;
  triggerReason: "inactivity" | "sentiment" | null;
}

export function ExtremeForceDashboard({ isOpen, onClose, triggerReason }: ExtremeForceProps) {
  const { user } = useAuthContext();
  const [photoUrl, setPhotoUrl] = useState("");
  const [isEditingPhoto, setIsEditingPhoto] = useState(false);
  const [savedPhotoUrl, setSavedPhotoUrl] = useState("");
  const [progression, setProgression] = useState<UserProgression | null>(null);

  useEffect(() => {
    if (!user || !isOpen) return;
    const unsubscribe = subscribeToProgression(
      user.uid,
      (prog) => setProgression(prog),
      (error) => console.error(error)
    );
    return unsubscribe;
  }, [user, isOpen]);

  useEffect(() => {
    const saved = localStorage.getItem("motivation_photo_url");
    if (saved) {
      setSavedPhotoUrl(saved);
      setPhotoUrl(saved);
    }
  }, [isOpen]);

  const handleSavePhoto = () => {
    localStorage.setItem("motivation_photo_url", photoUrl);
    setSavedPhotoUrl(photoUrl);
    setIsEditingPhoto(false);
  };

  const referralCount = 0;
  const commissionGoal = 500;
  const currentCommission = progression?.totalCP ? (progression.totalCP * 0.1) : 0;
  const progress = Math.min((currentCommission / commissionGoal) * 100, 100);

  const getMessage = () => {
    if (triggerReason === "sentiment") {
      return "Detectamos que estás pasando por un momento difícil. Recuerda por qué empezaste.";
    }
    if (triggerReason === "inactivity") {
      return "Han pasado más de 48 horas desde tu última acción. Tu transformación te espera.";
    }
    return "Este es tu centro de comando. Recuerda tu propósito.";
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        data-testid="extreme-force-overlay"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="relative w-full max-w-md bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl border border-amber-500/30 p-6 shadow-2xl"
          data-testid="extreme-force-modal"
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
            data-testid="close-extreme-force"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/20 mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-500" />
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Protocolo de Fuerza Extrema</h2>
            <p className="text-sm text-white/60">{getMessage()}</p>
          </div>

          <div className="space-y-5">
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5 text-rose-400" />
                <span className="text-sm font-medium text-white">Tu Motivación Personal</span>
              </div>
              
              {savedPhotoUrl && !isEditingPhoto ? (
                <div className="relative">
                  <img
                    src={savedPhotoUrl}
                    alt="Tu motivación"
                    className="w-full h-40 object-cover rounded-lg"
                    data-testid="motivation-photo"
                  />
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute bottom-2 right-2"
                    onClick={() => setIsEditingPhoto(true)}
                    data-testid="edit-photo-button"
                  >
                    <Camera className="w-4 h-4 mr-1" />
                    Cambiar
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <Label htmlFor="photoUrl" className="text-xs text-white/60">
                    URL de tu foto de motivación
                  </Label>
                  <Input
                    id="photoUrl"
                    value={photoUrl}
                    onChange={(e) => setPhotoUrl(e.target.value)}
                    placeholder="https://example.com/tu-foto.jpg"
                    className="bg-white/5 border-white/10"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleSavePhoto} className="flex-1">
                      Guardar
                    </Button>
                    {savedPhotoUrl && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setIsEditingPhoto(false)}
                      >
                        Cancelar
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <Users className="w-5 h-5 text-primary" />
                <span className="text-sm font-medium text-white">Tu Responsabilidad</span>
              </div>
              <div className="text-3xl font-bold text-white">{referralCount}</div>
              <p className="text-xs text-white/40 mt-1">personas cuentan contigo</p>
            </div>

            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <div className="flex items-center gap-3 mb-3">
                <TrendingUp className="w-5 h-5 text-emerald-400" />
                <span className="text-sm font-medium text-white">Meta Financiera</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-white/60">${currentCommission.toFixed(0)}</span>
                  <span className="text-white/60">${commissionGoal}</span>
                </div>
                <Progress value={progress} className="h-2" />
                <p className="text-xs text-white/40">30% comisión por referidos</p>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full mt-6 bg-amber-500 hover:bg-amber-600"
            data-testid="reactivate-button"
          >
            <Target className="w-4 h-4 mr-2" />
            Reactivar mi transformación
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
