import { addEventoToSegmento, getPlanillaHoy, EventoLog } from "./persistence";

let _activeSegmentoId: string | null = null;
let _activeUserId: string | null = null;

export function setActiveSegmento(userId: string, segmentoId: string | null) {
  _activeUserId = userId;
  _activeSegmentoId = segmentoId;
}

export function getActiveSegmentoId(): string | null {
  return _activeSegmentoId;
}

export async function registrarEvento(componente: string): Promise<void> {
  if (!_activeSegmentoId || !_activeUserId) return;
  
  const now = new Date();
  const hora = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  
  const evento: EventoLog = {
    componente,
    hora,
    timestamp: Date.now()
  };
  
  try {
    await addEventoToSegmento(_activeUserId, _activeSegmentoId, evento);
  } catch (error) {
    console.error("Error registrando evento universal:", error);
  }
}

export const COMPONENTES = {
  ESPEJO: "espejo",
  DEPOSITO: "deposito",
  ACELERADOR: "acelerador",
  DOCTOR_IA: "doctor-ia",
  PLANIFICACION: "planificacion",
  HISTORIAL: "historial",
  ALQUIMIA: "alquimia",
  LABORATORIO: "laboratorio"
} as const;
