import { Component, type ErrorInfo, type ReactNode } from "react";
import { emergencyPruneStorage } from "@/lib/storageHygiene";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error?.message || "Error inesperado",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AppErrorBoundary]", error, info.componentStack);
  }

  handleRecover = () => {
    try {
      emergencyPruneStorage({ aggressive: true });
    } catch {
      // ignore
    }
    this.setState({ hasError: false, message: "" });
    window.location.href = "/menu";
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
            Suele pasar cuando el navegador se queda sin espacio local. Puedes liberar caché
            interna y volver al menú.
          </p>
          {this.state.message && (
            <p className="text-[10px] text-slate-600 font-mono break-all">{this.state.message}</p>
          )}
          <button
            type="button"
            onClick={this.handleRecover}
            className="w-full py-3 rounded-xl text-sm font-bold uppercase tracking-wider"
            style={{ backgroundColor: "#D4AF37", color: "#000" }}
          >
            Liberar espacio y volver al menú
          </button>
        </div>
      </div>
    );
  }
}
