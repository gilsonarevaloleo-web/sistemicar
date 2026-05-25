import type { LucideIcon } from "lucide-react";

export interface ModuleCatalogEntry {
  id: string;
  nombre: string;
  desc: string;
  route?: string;
  /** true = sin precio, solo roadmap */
  enCamino: boolean;
  color?: string;
}

/** M�dulos del ecosistema � solo Planificaci�n y Espejo tienen precio hoy. */
export const MODULOS_EN_CAMINO: ModuleCatalogEntry[] = [
  { id: "alquimia", nombre: "Alquimia", desc: "Transformaci�n de estados internos", route: "/alquimia", enCamino: true, color: "#A855F7" },
  { id: "umbral", nombre: "Umbral", desc: "Expansi�n de l�mites", route: "/umbral", enCamino: true, color: "#3B82F6" },
  { id: "deposito", nombre: "Dep�sito", desc: "Bater�a de Certeza (Esperanza)", route: "/esperanza", enCamino: true, color: "#F97316" },
  { id: "proyector", nombre: "Proyector", desc: "Arquitectura de realidad futura", route: "/proyector", enCamino: true, color: "#6366F1" },
  { id: "mentor", nombre: "Mentor IA", desc: "Diagn�stico avanzado", route: "/mentor", enCamino: true, color: "#3B82F6" },
  { id: "alianza", nombre: "Alianza", desc: "Tu red de poder", route: "/socios", enCamino: true, color: "#7C3AED" },
  { id: "radar", nombre: "Radar IA", desc: "Detecci�n de tensiones con Gemini", route: "/radar", enCamino: true, color: "#3B82F6" },
  { id: "manuales", nombre: "Manuales y C�dice", desc: "Biblioteca de gu�as y leyes", route: "/manuales", enCamino: true, color: "#D4AF37" },
  { id: "proximo", nombre: "Pr�ximo m�dulo", desc: "En dise�o � venta independiente pr�ximamente", enCamino: true, color: "#64748b" },
];

export const BADGE_EN_CAMINO = "En camino de implementaci�n";
