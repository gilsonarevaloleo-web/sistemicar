import { useEffect, useMemo, useRef, useState } from "react";
import type { Vehicle } from "@/lib/persistence";
import type { SegmentoAnilloLite } from "@/engines/ConcienciaEngine";
import {
  buildEntropyDebugSnapshot,
  type EntropyDebugSnapshot,
} from "@/engines/ConcienciaEngine";

const LOG_KEY = "sistemicar_entropy_debug_log";
const MAX_LOG = 120;

export function isEntropyDebugEnabled(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const q = new URLSearchParams(window.location.search).get("debug");
    return q === "entropia" || localStorage.getItem("sistemicar_debug_entropia") === "1";
  } catch {
    return false;
  }
}

function appendEntropyLog(entry: EntropyDebugSnapshot): void {
  try {
    const prev = JSON.parse(localStorage.getItem(LOG_KEY) || "[]") as EntropyDebugSnapshot[];
    const next = [...prev.slice(-(MAX_LOG - 1)), entry];
    localStorage.setItem(LOG_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / parse */
  }
}

function exportEntropyLog(): string {
  try {
    return localStorage.getItem(LOG_KEY) || "[]";
  } catch {
    return "[]";
  }
}

interface EntropiaDebugPanelProps {
  segmentos: SegmentoAnilloLite[];
  vehicles: Vehicle[];
  tick: number;
}

export function EntropiaDebugPanel({ segmentos, vehicles, tick }: EntropiaDebugPanelProps) {
  const [expanded, setExpanded] = useState(true);
  const prevEntropiaRef = useRef<number | null>(null);
  const snapshot = useMemo(
    () =>
      buildEntropyDebugSnapshot({
        segmentos,
        vehiculos: vehicles,
        now: Date.now(),
      }),
    [segmentos, vehicles, tick]
  );

  useEffect(() => {
    appendEntropyLog(snapshot);
    prevEntropiaRef.current = snapshot.entropiaMinRounded;
  }, [snapshot]);

  const dropAlert =
    prevEntropiaRef.current != null &&
    snapshot.entropiaMinRounded < prevEntropiaRef.current - 0.05;

  const handleExport = () => {
    const blob = new Blob([exportEntropyLog()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `entropia-debug-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    localStorage.removeItem(LOG_KEY);
  };

  if (!expanded) {
    return (
      <button
        type="button"
        className="fixed bottom-2 left-2 z-[9999] text-[9px] px-2 py-1 rounded border bg-black/90 text-amber-300 border-amber-500/40"
        onClick={() => setExpanded(true)}
      >
        debug entropía
      </button>
    );
  }

  return (
    <div
      className="fixed bottom-2 left-2 z-[9999] w-[min(420px,calc(100vw-16px))] max-h-[50vh] overflow-auto rounded-lg border text-[9px] font-mono p-2 space-y-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.92)",
        borderColor: dropAlert ? "#ef4444" : "rgba(251,191,36,0.35)",
        color: "#e2e8f0",
      }}
      data-testid="entropia-debug-panel"
    >
      <div className="flex items-center justify-between gap-2 sticky top-0 bg-black/95 pb-1">
        <span className="font-bold text-amber-300 uppercase tracking-wider">Debug entropía</span>
        <div className="flex gap-1">
          <button type="button" className="px-1.5 py-0.5 rounded border border-slate-600" onClick={handleExport}>
            Export
          </button>
          <button type="button" className="px-1.5 py-0.5 rounded border border-slate-600" onClick={handleClear}>
            Clear
          </button>
          <button type="button" className="px-1.5 py-0.5 rounded border border-slate-600" onClick={() => setExpanded(false)}>
            −
          </button>
        </div>
      </div>

      {dropAlert && (
        <p className="text-red-400 font-bold">↓ entropiaMin cayó vs tick anterior</p>
      )}

      <p>
        <span className="text-slate-500">now</span> {snapshot.nowIso}
      </p>
      <p>
        <span className="text-slate-500">reloj</span> {snapshot.clockIntervalHint}
      </p>
      <p>
        <span className="text-slate-500">entropiaMin</span> raw={snapshot.entropiaMinRaw.toFixed(2)} rounded=
        {snapshot.entropiaMinRounded} display={snapshot.entropiaMinDisplay}
      </p>
      <p>
        <span className="text-slate-500">desglose</span> seg={snapshot.segmentEntropyMin.toFixed(2)} centNet=
        {snapshot.centinelaNetMin.toFixed(2)} centMerged={snapshot.centinelaMergedMin.toFixed(2)} cover=
        {snapshot.coverMergedMin.toFixed(2)}
      </p>
      <p>
        <span className="text-slate-500">puntero</span> {snapshot.pointerMode} · centinela activos=
        {snapshot.centinelaActiveCount} · coverNow={snapshot.consciousCoverNow ? "sí" : "no"}
      </p>
      <p>
        <span className="text-slate-500">NO_VEHICLE</span>{" "}
        {snapshot.noVehicleSinceMs
          ? `${snapshot.noVehicleSinceAgeSec}s (${new Date(snapshot.noVehicleSinceMs).toISOString()})`
          : "—"}
      </p>
      <p>
        <span className="text-slate-500">vehículos</span> raw={snapshot.rawVehicleCount} filtered=
        {snapshot.filteredVehicleCount}
      </p>

      {snapshot.coverVehicles.length > 0 && (
        <div>
          <p className="text-slate-500 mb-0.5">activos / centinela:</p>
          <ul className="space-y-0.5 pl-2">
            {snapshot.coverVehicles.map(v => (
              <li key={v.id ?? v.titulo} className={v.ghost ? "text-orange-400" : undefined}>
                {v.inFilteredList ? "✓" : "✗"} {v.id?.slice(0, 8)} {v.titulo?.slice(0, 24)} ghost=
                {v.ghost ? "Y" : "N"} coverNow={v.coversNow ? "Y" : "N"} [{v.status}]
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
