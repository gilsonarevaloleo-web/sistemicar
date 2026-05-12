import { useState, useEffect } from "react";
import { Database, CheckCircle, AlertCircle, RefreshCw, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface DataStatus {
  energyLogs: number;
  vehicles: number;
  bossStep: boolean;
  progression: boolean;
  chispazos: number;
  backups: number;
}

function getDataStatus(): DataStatus {
  const getCount = (key: string): number => {
    try {
      const data = localStorage.getItem(key);
      if (!data) return 0;
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed.length : 1;
    } catch {
      return 0;
    }
  };

  const exists = (key: string): boolean => {
    try {
      return localStorage.getItem(key) !== null;
    } catch {
      return false;
    }
  };

  let backupCount = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith("sistemicar_backup_")) {
      backupCount++;
    }
  }

  return {
    energyLogs: getCount("sistemicar_energy_logs"),
    vehicles: getCount("sistemicar_vehicles"),
    bossStep: exists("sistemicar_boss_step"),
    progression: exists("sistemicar_progression"),
    chispazos: getCount("sistemicar_chispazos"),
    backups: backupCount
  };
}

export function DataStatusPanel({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [status, setStatus] = useState<DataStatus | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setStatus(getDataStatus());
      setRefreshing(false);
    }, 300);
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const clearData = () => {
    if (confirm("¿Estás seguro? Esto borrará TODOS tus datos locales.")) {
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith("sistemicar_")) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(key => localStorage.removeItem(key));
      toast.success("Datos locales borrados");
      refresh();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={onClose}>
      <div 
        className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 max-w-sm w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <Database className="text-amber-400" size={24} />
          <h2 className="text-lg font-bold text-white">Estado de Datos Locales</h2>
        </div>

        {status ? (
          <div className="space-y-3">
            <StatusRow label="Registros de Energía" value={status.energyLogs} />
            <StatusRow label="Vehículos/Misiones" value={status.vehicles} />
            <StatusRow label="Paso Jefe" value={status.bossStep ? "Activo" : "Ninguno"} isBoolean />
            <StatusRow label="Progresión" value={status.progression ? "Guardada" : "Nueva"} isBoolean />
            <StatusRow label="Chispazos" value={status.chispazos} />
            <StatusRow label="Backups" value={status.backups} />
          </div>
        ) : (
          <div className="text-center py-8 text-zinc-400">Cargando...</div>
        )}

        <div className="flex gap-2 mt-6">
          <button
            onClick={refresh}
            disabled={refreshing}
            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <RefreshCw size={16} className={cn(refreshing && "animate-spin")} />
            Actualizar
          </button>
          <button
            onClick={clearData}
            className="bg-red-900/50 hover:bg-red-900 text-red-300 py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Trash2 size={16} />
            Borrar
          </button>
        </div>

        <button 
          onClick={onClose}
          className="w-full mt-3 text-zinc-500 hover:text-zinc-300 text-sm py-2"
        >
          Cerrar
        </button>
      </div>
    </div>
  );
}

function StatusRow({ label, value, isBoolean = false }: { label: string; value: number | string; isBoolean?: boolean }) {
  const hasData = isBoolean ? value !== "Ninguno" && value !== "Nueva" : (typeof value === "number" ? value > 0 : true);
  
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800">
      <span className="text-zinc-400 text-sm">{label}</span>
      <div className="flex items-center gap-2">
        <span className={cn("font-mono font-bold", hasData ? "text-emerald-400" : "text-zinc-500")}>
          {value}
        </span>
        {hasData ? (
          <CheckCircle size={14} className="text-emerald-400" />
        ) : (
          <AlertCircle size={14} className="text-zinc-500" />
        )}
      </div>
    </div>
  );
}
