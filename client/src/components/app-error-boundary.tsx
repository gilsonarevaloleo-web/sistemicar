import { Component, type ErrorInfo, type ReactNode } from "react";
import { resetAnilloViewModeStorage } from "@/lib/anilloViewMode";
import { emergencyPruneStorage } from "@/lib/storageHygiene";
import {
  bumpPlaneacionCrashCount,
  clearPlaneacionCrashCount,
  forceArchiveSituacionActivos,
  getPlaneacionCrashCount,
  repairStuckSituacionVehicles,
} from "@/lib/situacionRepair";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string; crashCount: number };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "", crashCount: 0 };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      message: error?.message || "Error inesperado",
      crashCount: bumpPlaneacionCrashCount(),
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  private reloadTo(path: string) {
    this.setState({ hasError: false, message: "", crashCount: 0 });
    window.location.href = path;
  }

  private runPlaneacionRecovery(archiveSituacion: boolean) {
    try {
      repairStuckSituacionVehicles();
      emergencyPruneStorage({ aggressive: true });
      resetAnilloViewModeStorage();
    } catch {
      // ignore
    }
    if (archiveSituacion) {
      try {
        forceArchiveSituacionActivos();
      } catch {
        // ignore
      }
    }
    try {
      clearPlaneacionCrashCount();
    } catch {
      // ignore
    }
  }

  handleRecover = () => {
    const crashes = getPlaneacionCrashCount();
    this.runPlaneacionRecovery(crashes >= 2);
    this.reloadTo("/planeacion");
  };

  handleForceSituacion = () => {
    this.runPlaneacionRecovery(true);
    this.reloadTo("/planeacion");
  };

  handleGoMenu = () => {
    try {
      repairStuckSituacionVehicles();
      clearPlaneacionCrashCount();
    } catch {
      // ignore
    }
    this.reloadTo("/menu");
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ backgroundColor: "#020202" }}
      >
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-xs uppercase tracking-widest text-slate-500">SISTEMICAR</p>
          <h1 className="text-lg font-bold text-white">Algo bloqueó la interfaz</h1>
          <p className="text-sm text-slate-400 leading-relaxed">
            Un vehículo de enfoque atascado puede provocar este bucle. Prueba la reparación
            automática o cierra el desglosador en emergencia.
          </p>
          {this.state.message && (
            <p className="text-[10px] text-slate-600 font-mono break-all px-2">{this.state.message}</p>
          )}
          {this.state.crashCount >= 2 && (
            <p className="text-[10px] text-amber-400/90 leading-snug">
              Falló {this.state.crashCount} veces — al reparar se archivarán vehículos situación activos.
            </p>
          )}
          <button
            type="button"
            onClick={this.handleRecover}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ backgroundColor: "#D4AF37", color: "#000" }}
          >
            Reparar y abrir Planificación
          </button>
          <button
            type="button"
            onClick={this.handleForceSituacion}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ backgroundColor: "rgba(239,68,68,0.2)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.45)" }}
          >
            Cerrar ring de enfoque (emergencia)
          </button>
          <button
            type="button"
            onClick={this.handleGoMenu}
            className="w-full py-2 rounded-xl text-xs text-slate-500 hover:text-slate-300"
          >
            Solo volver al menú
          </button>
        </div>
      </div>
    );
  }
}
