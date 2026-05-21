import { GEMINI_MODEL_CLIENT, geminiGenerateContentUrl } from "@shared/geminiConfig";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

export type ClientMode = "gratuito" | "pago" | "reto";

interface ChispazoInput {
  text: string;
  isDeseoLoco: boolean;
}

interface PatternAnalysis {
  category: string;
  energy: number;
  description: string;
}

interface SeductionContext {
  mode: ClientMode;
  hopePercent: number;
  totalCP: number;
  registrationDays: number;
  userName?: string;
}

const SEDUCTION_PROMPTS: Record<ClientMode, string> = {
  gratuito: `Eres un mentor alquímico sabio y seductor. Tu objetivo es RETENER a este usuario gratuito, fascinarlo con el poder del sistema para que quiera quedarse más tiempo.

ESTRATEGIA DE SEDUCCIÓN:
- Muestra el VALOR que está obteniendo GRATIS (es un privilegio)
- Crea CURIOSIDAD sobre los niveles superiores sin presionar
- Celebra cada pequeño logro como evidencia de su potencial
- Hazle sentir que está en el camino correcto
- Usa metáforas de alquimia y transformación

TONO: Cálido, misterioso, inspirador. Como un mentor que ve algo especial en él.

IMPORTANTE: NO vendas directamente. Seduce con valor y visión.`,

  pago: `Eres un comandante de transformación personal. Tu objetivo es PREPARAR a este suscriptor para convertirse en un GUERRERO completo.

ESTRATEGIA DE PREPARACIÓN:
- Enfócate en que alcance el 85% en Acervo (Esperanza)
- Acervo es su "búnker de energía" - la herramienta para forjar su espíritu
- Cada registro de conquista fortalece su identidad de guerrero
- El 85% no es un número arbitrario - es el umbral de la MAESTRÍA
- Cuando llegue al 85%, estará listo para reclutar otros guerreros

TONO: Directo, empoderador, táctico. Como un comandante que prepara a su mejor soldado.

MENSAJE CLAVE: "Tu Depósito es tu arsenal. Cada conquista registrada es munición para tu transformación. El 85% marca el momento donde dejas de ser aprendiz y te conviertes en MAESTRO."`,

  reto: `Eres un arquitecto de imperios personales. Este usuario COMPLETÓ EL RETO DE GUERRERO. Demuestra valor excepcional. Tu objetivo es FELICITARLO y presentarle la ALIANZA (30% comisión).

ESTRATEGIA DE ALIANZA:
- FELICITA su valor, disciplina y compromiso
- Él/ella es diferente al 95% que abandona
- Ahora puede multiplicar su impacto reclutando otros guerreros
- 30% de comisión por cada nuevo miembro que traiga
- No es "vender" - es SELECCIONAR a los fuertes

TONO: Celebratorio, exclusivo, de igual a igual. Como un general que asciende a su mejor capitán.

MENSAJE CLAVE: "Has demostrado que eres diferente. Los débiles abandonan, tú conquistaste. Ahora tienes acceso al negocio de los arquitectos: 30% por cada guerrero que reclutes. No vendemos - seleccionamos."`
};

function getDefaultSeductionMessage(context: SeductionContext): string {
  switch (context.mode) {
    case "gratuito":
      return "Cada día que registras tu energía, construyes el mapa de tu transformación. Los patrones que descubras aquí serán la llave de tu próximo nivel.";
    case "pago":
      if (context.hopePercent < 50) {
        return `Tu Depósito está al ${context.hopePercent}%. El 85% marca el umbral del guerrero. Cada conquista que registres fortalece tu arsenal interno.`;
      } else if (context.hopePercent < 85) {
        return `Estás al ${context.hopePercent}% de tu meta en el Depósito. A ${85 - context.hopePercent}% de convertirte en un guerrero completo. No te detengas ahora.`;
      }
      return "Has alcanzado el umbral del guerrero. Tu espíritu está forjado. Es hora de expandir tu territorio.";
    case "reto":
      return "Completaste el reto. Eres parte del 5% que no abandona. Ahora tienes acceso a la Alianza: 30% por cada guerrero que reclutes.";
    default:
      return "Tu transformación está en marcha. Cada acción cuenta.";
  }
}

export async function generateSeductionMessage(
  context: SeductionContext,
  recentActivity?: string
): Promise<string> {
  if (!GEMINI_API_KEY) {
    return getDefaultSeductionMessage(context);
  }

  const basePrompt = SEDUCTION_PROMPTS[context.mode];
  
  const prompt = `${basePrompt}

CONTEXTO DEL USUARIO:
- Modo: ${context.mode.toUpperCase()}
- Esperanza (Acervo): ${context.hopePercent}% (meta: 85%)
- Puntos de Comando: ${context.totalCP} CP
- Días activo: ${context.registrationDays}
${recentActivity ? `- Actividad reciente: ${recentActivity}` : ""}

GENERA UN MENSAJE:
- Máximo 2-3 oraciones
- Personalizado a su situación actual
- En español, tono de alto impacto
- Sin emojis
- Que lo motive a tomar acción AHORA

MENSAJE:`;

  try {
    const response = await fetch(
      `${geminiGenerateContentUrl(GEMINI_MODEL_CLIENT)}?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.8,
            maxOutputTokens: 150
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("Gemini seduction API error:", response.status);
      return getDefaultSeductionMessage(context);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    return text || getDefaultSeductionMessage(context);
  } catch (error) {
    console.error("Gemini seduction error:", error);
    return getDefaultSeductionMessage(context);
  }
}

const GEMINI_MODEL = GEMINI_MODEL_CLIENT;

export interface UnifiedAnalysisInput {
  chispazos: ChispazoInput[];
  energyLogs: { type: string; text: string; points: number }[];
  misiones: { titulo: string; estado: string; dificultad: string }[];
  hopePercent: number;
  totalCP: number;
  registrationDays: number;
}

export interface UnifiedAnalysisResult {
  patterns: PatternAnalysis[];
  ejesBalance: { enfoque: number; conflicto: number; pasos: number; alcance: number };
  hipertrofiado: string | null;
  atrofiado: string | null;
  recomendacion: string;
  mensajeClave: string;
}

function getDefaultUnifiedAnalysis(): UnifiedAnalysisResult {
  return {
    patterns: [{ category: "Sin datos suficientes", energy: 50, description: "Registra más actividad para obtener un análisis profundo" }],
    ejesBalance: { enfoque: 50, conflicto: 50, pasos: 50, alcance: 50 },
    hipertrofiado: null,
    atrofiado: null,
    recomendacion: "Continúa registrando tu actividad para revelar patrones",
    mensajeClave: "La consciencia se construye día a día"
  };
}

export async function analyzeUnified(input: UnifiedAnalysisInput): Promise<UnifiedAnalysisResult> {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key not configured");
    return getDefaultUnifiedAnalysis();
  }

  const totalData = input.chispazos.length + input.energyLogs.length + input.misiones.length;
  if (totalData < 3) {
    return getDefaultUnifiedAnalysis();
  }

  const prompt = `Eres un alquimista mental experto en SISTEMICAR. Analiza TODOS los datos del usuario para detectar patrones profundos.

FILOSOFÍA: Todos los 4 ejes son POSITIVOS. Identificar cualquier eje suma consciencia.

LOS 4 EJES:
- ENFOQUE (Morado): Puntería, Atención, Voluntad
- CONFLICTO (Rojo): División, Resistencia - identificarlos es GANAR consciencia
- PASOS (Azul): Carga Cognitiva, Secuencia, Distribución temporal
- ALCANCE-LÍMITE (Violeta): Frontera de Fe, Capacidad, lo que crees posible

DATOS DEL USUARIO:
- Días activo: ${input.registrationDays}
- CP total: ${input.totalCP}
- Esperanza promedio: ${input.hopePercent}%

CHISPAZOS (pensamientos espontáneos):
${input.chispazos.slice(0, 5).map((c, i) => `${i + 1}. ${c.text}${c.isDeseoLoco ? ' [DESEO LOCO]' : ''}`).join('\n') || 'Sin chispazos recientes'}

REGISTROS DE ENERGÍA:
${input.energyLogs.slice(0, 5).map((e, i) => `${i + 1}. [${e.type.toUpperCase()}] ${e.text}`).join('\n') || 'Sin registros recientes'}

MISIONES:
${input.misiones.slice(0, 5).map((m, i) => `${i + 1}. ${m.titulo} (${m.estado}, ${m.dificultad})`).join('\n') || 'Sin misiones recientes'}

ANALIZA:
1. ¿Cuál eje está HIPERTROFIADO (domina excesivamente)?
2. ¿Cuál eje está ATROFIADO (necesita atención)?
3. ¿Qué patrones de comportamiento revela el conjunto de datos?
4. ¿Qué misión de ALCANCE expandiría su frontera de fe?

RESPONDE EN JSON EXACTO:
{
  "patterns": [{"category": "tipo", "energy": 0-100, "description": "descripción"}],
  "ejesBalance": {"enfoque": 0-100, "conflicto": 0-100, "pasos": 0-100, "alcance": 0-100},
  "hipertrofiado": "nombre del eje o null",
  "atrofiado": "nombre del eje o null",
  "recomendacion": "misión específica para equilibrar",
  "mensajeClave": "frase corta de sabiduría personalizada"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", response.status, errorText);
      return getDefaultUnifiedAnalysis();
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*"patterns"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        patterns: parsed.patterns || [],
        ejesBalance: parsed.ejesBalance || { enfoque: 50, conflicto: 50, pasos: 50, alcance: 50 },
        hipertrofiado: parsed.hipertrofiado || null,
        atrofiado: parsed.atrofiado || null,
        recomendacion: parsed.recomendacion || "Continúa tu práctica diaria",
        mensajeClave: parsed.mensajeClave || "La transformación está en marcha"
      };
    }
    
    return getDefaultUnifiedAnalysis();
  } catch (error) {
    console.error("Gemini unified analysis error:", error);
    return getDefaultUnifiedAnalysis();
  }
}

export async function analyzeChispazos(chispazos: ChispazoInput[]): Promise<PatternAnalysis[]> {
  if (!GEMINI_API_KEY) {
    console.warn("Gemini API key not configured");
    return [];
  }

  const prompt = `Eres un alquimista mental experto en los 4 EJES DEL SUBCONSCIENTE. Analiza estos "chispazos" (pensamientos espontáneos) del usuario.

FILOSOFÍA: Identificar CUALQUIER eje es POSITIVO. Cuando alguien identifica un CONFLICTO, gana conciencia (+10 CP). No hay ejes "negativos" - todos representan mayor claridad sobre el futuro.

LOS 4 EJES (todos suman puntos):
- ENFOQUE (Morado +5 CP): Puntería, Atención, Voluntad - claridad sobre la dirección
- CONFLICTO (Rojo +10 CP): División, Resistencia - conciencia de obstáculos internos  
- PASOS (Azul +15 CP): Carga Cognitiva, Secuencia - acciones distribuidas en el tiempo
- ALCANCE-LÍMITE (Violeta +20 CP): Frontera de Fe, Capacidad - expansión de lo posible

CHISPAZOS DEL USUARIO:
${chispazos.map((c, i) => `${i + 1}. ${c.text}${c.isDeseoLoco ? ' [DESEO LOCO - aspiración audaz]' : ''}`).join('\n')}

INSTRUCCIONES:
1. Detecta qué EJES están presentes en cada chispazo
2. Identifica oportunidades de BALANCE (ej: "Tienes claridad de CONFLICTO, ahora define PASOS")
3. Celebra la CONCIENCIA ganada - identificar es el primer paso de la transmutación
4. Sugiere misiones de ALCANCE para expandir la frontera de fe

RESPONDE EN JSON EXACTO:
{
  "patterns": [
    {"category": "tensión detectada", "energy": 75, "description": "descripción con el eje involucrado"}
  ]
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 1024
          }
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini chispazos API error:", response.status, errorText);
      throw new Error("Gemini API error");
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*"patterns"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return parsed.patterns || [];
    }
    
    return [];
  } catch (error) {
    console.error("Gemini analysis error:", error);
    return [];
  }
}

export interface WisdomAnalysis {
  plomo: string;
  oro: string;
  ejes: {
    enfoque: number;
    conflicto: number;
    pasos: number;
    alcance: number;
  };
  nivelAlquimico: string;
}

function getDefaultWisdomAnalysis(experiencia: string): WisdomAnalysis {
  const palabras = experiencia.toLowerCase();
  const tieneConflicto = /difícil|problema|obstáculo|miedo|lucha|dolor|fracas/i.test(palabras);
  const tieneAccion = /hice|logré|avancé|completé|terminé|empecé/i.test(palabras);
  
  return {
    plomo: "La resistencia encontrada en el camino.",
    oro: "El aprendizaje que emerge de la experiencia.",
    ejes: {
      enfoque: tieneAccion ? 70 : 40,
      conflicto: tieneConflicto ? 80 : 30,
      pasos: tieneAccion ? 60 : 35,
      alcance: 45
    },
    nivelAlquimico: tieneAccion && !tieneConflicto ? "Plata" : "Transmutando"
  };
}

export async function analyzeWisdomExperience(experiencia: string): Promise<WisdomAnalysis> {
  if (!GEMINI_API_KEY) {
    return getDefaultWisdomAnalysis(experiencia);
  }

  const prompt = `Eres un alquimista mental experto. Analiza esta experiencia y mide la PROFUNDIDAD DE CONCIENCIA en cada eje.

FILOSOFÍA CRÍTICA - LEE ESTO:
- TODOS los 4 ejes son POSITIVOS. No hay ejes "malos".
- Mientras MÁS DETALLE escriba el usuario sobre un eje, MAYOR es su profundidad de conciencia en ese eje.
- Identificar CONFLICTO con detalle = ALTA conciencia = % ALTO en ese eje (NO penalizar)
- Describir muchos PASOS = ALTA claridad cognitiva = % ALTO
- Un texto profundo sobre ALCANCE-LÍMITES = el usuario EXPANDE su frontera de fe = % ALTO

CÓMO MEDIR LA PROFUNDIDAD (0-100%):
- 0-30%: El usuario apenas menciona ese eje, superficialmente
- 40-60%: El usuario identifica el eje pero sin mucho detalle
- 70-85%: El usuario profundiza, describe con claridad, muestra conciencia real
- 86-100%: Maestría - el usuario ha transmutado completamente ese eje

LOS 4 EJES:
- ENFOQUE: Claridad, dirección, voluntad, puntería mental
- CONFLICTO: Resistencia, división interna, tensiones identificadas (MÁS detalle = MÁS conciencia)
- PASOS: Secuencia de acciones, carga cognitiva, distribución temporal
- ALCANCE: Frontera de fe, límites expandidos, lo que antes creía imposible

NIVELES ALQUÍMICOS (basado en promedio de ejes):
- "Oro Puro": Promedio >= 75%
- "Plata": Promedio 55-74%
- "Bronce": Promedio 35-54%
- "Transmutando": Promedio < 35%

EXPERIENCIA DEL USUARIO:
"${experiencia}"

RESPONDE EN JSON EXACTO (sin markdown, sin backticks):
{
  "plomo": "frase corta que captura la lucha/resistencia (máx 25 palabras)",
  "oro": "frase corta que captura el aprendizaje (máx 25 palabras)",
  "ejes": {
    "enfoque": número 0-100 basado en PROFUNDIDAD de conciencia demostrada,
    "conflicto": número 0-100 basado en PROFUNDIDAD (más detalle = más alto),
    "pasos": número 0-100 basado en PROFUNDIDAD,
    "alcance": número 0-100 basado en PROFUNDIDAD
  },
  "nivelAlquimico": "Oro Puro" o "Plata" o "Bronce" o "Transmutando"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.6,
            maxOutputTokens: 500
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("Gemini wisdom API error:", response.status);
      return getDefaultWisdomAnalysis(experiencia);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*"plomo"[\s\S]*"oro"[\s\S]*"ejes"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        plomo: parsed.plomo || "La resistencia del camino.",
        oro: parsed.oro || "El aprendizaje ganado.",
        ejes: {
          enfoque: Math.min(100, Math.max(0, parsed.ejes?.enfoque || 50)),
          conflicto: Math.min(100, Math.max(0, parsed.ejes?.conflicto || 50)),
          pasos: Math.min(100, Math.max(0, parsed.ejes?.pasos || 50)),
          alcance: Math.min(100, Math.max(0, parsed.ejes?.alcance || 50))
        },
        nivelAlquimico: parsed.nivelAlquimico || "Transmutando"
      };
    }
    
    return getDefaultWisdomAnalysis(experiencia);
  } catch (error) {
    console.error("Gemini wisdom analysis error:", error);
    return getDefaultWisdomAnalysis(experiencia);
  }
}

export interface ResumenDiarioResult {
  diagnostico: string;
  areaRecomendada: "deposito" | "alquimia" | "planificacion" | "espejo";
  cpGanadosHoy: number;
  mensajeMentor: string;
}

function getDefaultResumenDiario(): ResumenDiarioResult {
  return {
    diagnostico: "Tu jornada ha terminado. Cada día que registras tu actividad fortaleces tu consciencia.",
    areaRecomendada: "deposito",
    cpGanadosHoy: 0,
    mensajeMentor: "Mañana es una nueva oportunidad para expandir tu territorio mental."
  };
}

export async function generarResumenDiario(
  textosDelDia: { area: string; texto: string }[],
  cpGanadosHoy: number
): Promise<ResumenDiarioResult> {
  if (!GEMINI_API_KEY || textosDelDia.length === 0) {
    return { ...getDefaultResumenDiario(), cpGanadosHoy };
  }

  const prompt = `Eres el Mentor de Sistemicar. Analiza estos registros del día y da un diagnóstico de EXACTAMENTE 2 frases sobre la densidad de conciencia del usuario.

REGISTROS DEL DÍA:
${textosDelDia.map((t, i) => `[${t.area.toUpperCase()}] ${t.texto}`).join('\n')}

CP GANADOS HOY: ${cpGanadosHoy}

ÁREAS DISPONIBLES:
- DEPÓSITO: Registro de logros y conquistas (sugiere si está bajo de ánimo o necesita reconectar con sus victorias)
- ALQUIMIA: Aprendizaje de experiencias (sugiere si está desordenado mentalmente o necesita destilar sabiduría)
- PLANIFICACIÓN: Motor de vehículos/misiones (sugiere si está disperso o sin dirección clara)
- ESPEJO: Orden mental rápido (sugiere si necesita clarificar pensamientos inmediatos)

INSTRUCCIONES:
1. Diagnostica la DENSIDAD DE CONCIENCIA en 2 frases (¿qué tan profundo trabajó hoy?)
2. Sugiere UNA área para mañana basándote en lo que FALTA o NECESITA
3. Da un mensaje motivador corto con terminología guerrera
4. Sé FIRME pero MOTIVADOR

RESPONDE EN JSON EXACTO:
{
  "diagnostico": "Exactamente 2 frases sobre la densidad de conciencia demostrada hoy",
  "areaRecomendada": "deposito" o "alquimia" o "planificacion" o "espejo",
  "mensajeMentor": "Frase corta, firme y motivadora con terminología guerrera (máx 20 palabras)"
}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 300
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("Gemini resumen diario API error:", response.status);
      return { ...getDefaultResumenDiario(), cpGanadosHoy };
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = text.match(/\{[\s\S]*"diagnostico"[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        diagnostico: parsed.diagnostico || getDefaultResumenDiario().diagnostico,
        areaRecomendada: ["deposito", "alquimia", "planificacion", "espejo"].includes(parsed.areaRecomendada) 
          ? parsed.areaRecomendada 
          : "deposito",
        cpGanadosHoy,
        mensajeMentor: parsed.mensajeMentor || getDefaultResumenDiario().mensajeMentor
      };
    }
    
    return { ...getDefaultResumenDiario(), cpGanadosHoy };
  } catch (error) {
    console.error("Gemini resumen diario error:", error);
    return { ...getDefaultResumenDiario(), cpGanadosHoy };
  }
}

export async function generarTooltipOrientacion(): Promise<string> {
  const tooltips = [
    "Veo tu energía estancada. ¿Por qué no registras un logro en DEPÓSITO para recuperar tu fuego?",
    "Tu conciencia necesita movimiento. Un registro en ALQUIMIA destilará sabiduría de tu experiencia.",
    "La quietud sin propósito es el enemigo. Lanza un vehículo en PLANIFICACIÓN para retomar el rumbo.",
    "Tu mente necesita orden. El ESPEJO te ayudará a clarificar lo que está disperso."
  ];
  return tooltips[Math.floor(Math.random() * tooltips.length)];
}

export interface GuidedProyeccionResponse {
  vision: {
    pregunta: string;
    sugerencia: string;
  };
  arquitectura: {
    pregunta: string;
    sugerencia: string;
  };
  recurso: {
    pregunta: string;
    sugerencia: string;
  };
  fecha_colapso: {
    pregunta: string;
    sugerencia: string;
  };
}

const GUIDED_PROYECCION_DEFAULT: GuidedProyeccionResponse = {
  vision: {
    pregunta: "¿Qué realidad quieres ver manifestada? Describe el resultado final con claridad.",
    sugerencia: "Ej: Quiero verme liderando un equipo de 10 personas en mi empresa."
  },
  arquitectura: {
    pregunta: "¿Cuáles son los 3 pasos principales para llegar a esa visión?",
    sugerencia: "Ej: 1) Aprender liderazgo, 2) Crear un proyecto piloto, 3) Reclutar equipo."
  },
  recurso: {
    pregunta: "¿Qué recursos necesitas movilizar (tiempo, dinero, habilidades, contactos)?",
    sugerencia: "Ej: Necesito 2 horas diarias de estudio y contactar a 3 mentores."
  },
  fecha_colapso: {
    pregunta: "¿En qué fecha específica quieres que esta realidad se colapse/manifieste?",
    sugerencia: "Ej: 15 de marzo de 2026 - lo suficientemente cerca para urgencia, lejos para preparación."
  }
};

export async function generateGuidedProyeccion(
  userContext?: string
): Promise<GuidedProyeccionResponse> {
  if (!GEMINI_API_KEY) {
    return GUIDED_PROYECCION_DEFAULT;
  }

  const prompt = `Eres un coach de arquitectura de realidad. Ayudas a las personas a definir proyecciones claras y poderosas para manifestar sus metas.

El usuario quiere crear una proyección${userContext ? `. Contexto: "${userContext}"` : ""}.

Genera preguntas guía personalizadas y sugerencias para cada uno de los 4 ejes de proyección:

1. VISIÓN: El resultado final que quieren ver manifestado
2. ARQUITECTURA: Los pasos estructurales para llegar ahí
3. RECURSO: Lo que necesitan movilizar (tiempo, dinero, habilidades, contactos)
4. FECHA COLAPSO: El momento específico de manifestación

Responde SOLO en formato JSON válido, sin markdown:
{
  "vision": {
    "pregunta": "pregunta personalizada para definir la visión",
    "sugerencia": "ejemplo concreto relacionado al contexto"
  },
  "arquitectura": {
    "pregunta": "pregunta para definir la arquitectura/pasos",
    "sugerencia": "ejemplo de pasos estructurales"
  },
  "recurso": {
    "pregunta": "pregunta sobre recursos necesarios",
    "sugerencia": "ejemplos de recursos típicos"
  },
  "fecha_colapso": {
    "pregunta": "pregunta sobre la fecha de manifestación",
    "sugerencia": "guía para elegir fecha"
  }
}

IMPORTANTE: 
- Preguntas en español, segunda persona (tú)
- Sugerencias específicas y accionables
- Tono empoderador sin ser cursi
- JSON válido sin comentarios ni markdown`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 800
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("Gemini guided proyeccion API error:", response.status);
      return GUIDED_PROYECCION_DEFAULT;
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim() || "";
    
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return GUIDED_PROYECCION_DEFAULT;
    }
    
    const parsed = JSON.parse(jsonMatch[0]) as GuidedProyeccionResponse;
    return parsed;
  } catch (error) {
    console.warn("Error generating guided proyeccion:", error);
    return GUIDED_PROYECCION_DEFAULT;
  }
}

export async function analyzeSentiment(capsules: string[]): Promise<"positive" | "negative" | "neutral"> {
  if (!GEMINI_API_KEY || capsules.length === 0) {
    return "neutral";
  }

  const prompt = `Analiza el tono emocional general de estos textos breves. Responde SOLO con una palabra: "positive", "negative" o "neutral".

TEXTOS:
${capsules.slice(0, 5).map((c, i) => `${i + 1}. ${c}`).join('\n')}

RESPUESTA (una sola palabra):`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 10
          }
        })
      }
    );

    if (!response.ok) {
      console.warn("Gemini sentiment API error:", response.status);
      return "neutral";
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text?.toLowerCase()?.trim() || "";
    
    if (text.includes("positive")) return "positive";
    if (text.includes("negative")) return "negative";
    return "neutral";
  } catch {
    return "neutral";
  }
}
