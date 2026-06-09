/** Modo operativo del protocolo Punto Cero v4. */
export type ModoPuntoCero = "dia" | "noche";

/** Fases temporales del protocolo (orquestación v4). */
export type FasePuntoCero = "preparacion" | "activa" | "pasiva" | "completada";

export interface EtapasPuntoCero {
  etapa1: boolean;
  etapa2: boolean;
  etapa3: boolean;
  etapa4: boolean;
}

/** Sesión persistida en el vehículo descanso tipo punto_cero. */
export interface PuntoCeroSession {
  modo: ModoPuntoCero;
  fase: FasePuntoCero;
  /** Inicio de la fase actual (ms). */
  faseInicioAt: number;
  /** Ancla del bloque (= aperturaAt al lanzar). */
  sesionInicioAt: number;
  /** Duración total configurada (min). */
  duracionTotalMin: number;
  /** Progreso de los 7 colores (Raíz → Corona). */
  coloresConfirmados: boolean[];
  /** Último susurro nocturno (ms). */
  ultimoSusurroAt?: number;
  /** Marca cierre automático ya disparado. */
  autoCierreDisparado?: boolean;
}

export const PUNTO_CERO_COLOR_COUNT = 7;

export const PUNTO_CERO_ARCOIRIS = [
  { color: "#FF3131", zona: "Raíz", solfeggioHz: 396 },
  { color: "#FF8C00", zona: "Sacro", solfeggioHz: 417 },
  { color: "#FFD700", zona: "Plexo Solar", solfeggioHz: 528 },
  { color: "#22C55E", zona: "Corazón", solfeggioHz: 639 },
  { color: "#3B82F6", zona: "Garganta", solfeggioHz: 741 },
  { color: "#6366F1", zona: "Tercer Ojo", solfeggioHz: 852 },
  { color: "#8B5CF6", zona: "Corona", solfeggioHz: 963 },
] as const;

export function etapasPuntoCeroVacias(): EtapasPuntoCero {
  return { etapa1: false, etapa2: false, etapa3: false, etapa4: false };
}

export function coloresConfirmadosVacios(): boolean[] {
  return Array(PUNTO_CERO_COLOR_COUNT).fill(false);
}
