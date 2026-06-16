export type AnilloViewMode = "mapa" | "horizonte";

const STORAGE_KEY = "sistemicar_anillo_view_mode";

export function readAnilloViewMode(): AnilloViewMode {
  try {
    const v = sessionStorage.getItem(STORAGE_KEY);
    if (v === "horizonte" || v === "mapa") return v;
  } catch {
    /* noop */
  }
  return "mapa";
}

export function writeAnilloViewMode(mode: AnilloViewMode): void {
  try {
    sessionStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* noop */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("sistemicar-anillo-view-mode", { detail: { mode } }));
  }
}

export function subscribeAnilloViewMode(listener: (mode: AnilloViewMode) => void): () => void {
  if (typeof window === "undefined") return () => {};
  const fn = (e: Event) => {
    const mode = (e as CustomEvent<{ mode: AnilloViewMode }>).detail?.mode;
    if (mode) listener(mode);
  };
  window.addEventListener("sistemicar-anillo-view-mode", fn);
  return () => window.removeEventListener("sistemicar-anillo-view-mode", fn);
}

export function resetAnilloViewModeStorage(): void {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    /* noop */
  }
}
