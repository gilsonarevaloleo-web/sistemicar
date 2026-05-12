export type NivelFatiga = 'Optimo' | 'Distraccion' | 'Confusion' | 'Aburrimiento' | 'Cansancio';

export interface MetricasAnillo {
  planificacionPct: number;
  conquistaPct: number;
}

export const evaluarCapaFatiga = (
  tiempoTranscurrido: number,
  tiempoEstimado: number,
  cambiosDeEstadoRecientes: number,
  horaActual: number
): NivelFatiga => {
  if (tiempoTranscurrido > 7200) return 'Cansancio';
  if (cambiosDeEstadoRecientes > 3 && tiempoTranscurrido < 300) return 'Confusion';
  if (tiempoEstimado > 0 && tiempoTranscurrido > tiempoEstimado * 1.3) return 'Distraccion';
  if (tiempoTranscurrido > 3600 && horaActual >= 14 && horaActual <= 16) return 'Aburrimiento';
  return 'Optimo';
};

function parseSegMinutes(t: string): number {
  if (!t) return 0;
  const parts = t.split(":").map(Number);
  return (parts[0] || 0) * 60 + (parts[1] || 0);
}

export const calcularAnilloSoberania = (
  segmentos: any[],
  vehiculos: any[]
): MetricasAnillo => {
  const minutosPlaneados = segmentos.reduce((acc, s) => {
    const ini = parseSegMinutes(s.horaInicio);
    const fin = parseSegMinutes(s.horaFin);
    const dur = fin >= ini ? fin - ini : fin + 1440 - ini;
    return acc + Math.max(0, dur);
  }, 0);
  const planificacionPct = Math.min(100, (minutosPlaneados / 1440) * 100);

  const segmentosConActividad = new Set(vehiculos.map((v: any) => v.segmentoId));
  const conquistaPct =
    segmentos.length > 0
      ? (segmentosConActividad.size / segmentos.length) * 100
      : 0;

  return { planificacionPct, conquistaPct };
};

export const getJuicioMensaje = (segundos: number): string => {
  if (segundos < 150)
    return 'A. CONEXIÓN NIÑO: El tiempo es el lienzo de tu destino. ¿Cómo eliges pintar tu historia hoy?';
  if (segundos < 300)
    return 'B. IDENTIDAD SOCIAL: En cómo usas tu tiempo se decide si eres como los demás o superior. ¿Quién eres?';
  if (segundos < 450)
    return 'C. RESISTENCIA: Conoce tu límite de hoy para decidir dónde estar mañana. ¿Quieres montar un peldaño más?';
  return 'D. IDENTIDAD DE JUEZ: Tienes dos caminos: a) La excusa y debilidad, b) El valor y la dignidad. ¿Cuál eliges?';
};

export const calcularVoltajeResistencia = (segundos: number): number => {
  return segundos >= 300 ? 15 : 10;
};

export const getResistenciaColor = (segundos: number): string => {
  const progreso = (segundos % 300) / 300;
  const hue = 120 - progreso * 120;
  return `hsl(${hue}, 100%, 50%)`;
};

export const debeEstarAbierto = (horaInicio: number): boolean => {
  const horaActual = new Date().getHours();
  return horaActual === horaInicio;
};

export interface SugerenciaConciencia {
  tiempoRecord: number;
  esDesafio: boolean;
  mensaje: string;
}

export const generarSugerencia = (
  nombreTarea: string,
  historial: any[]
): SugerenciaConciencia | null => {
  const record = historial
    .filter(h => h.nombre.toLowerCase() === nombreTarea.toLowerCase())
    .sort((a, b) => a.tiempo - b.tiempo)[0];
  if (!record) return null;
  return {
    tiempoRecord: record.tiempo,
    esDesafio: true,
    mensaje: `Tu victoria pasada fue de ${record.tiempo} min. ¿Lograrás superarlo o ajustarás por energía?`
  };
};
