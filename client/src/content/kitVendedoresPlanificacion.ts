/** Contenido del kit vendedores — fuente compartida con `/vendedores-planificacion`. */
import { SISTEMICAR_CATEGORY, CATEGORY_FOOTER } from "@/lib/sistemicarCategory";

export const KIT_VERSION = "1.6";

export const KIT_ELEVATOR_PITCH = SISTEMICAR_CATEGORY.elevator;

export const KIT_RESUMEN_30S = [
  SISTEMICAR_CATEGORY.name + " — no calendario ni lista de tareas.",
  "Peldaño 1 Base — Escalera de Conciencia, anillo, segmentos, PS.",
  "Peldaño 2 Operativo — conquista medible (unidades, ritmo, récord) — primer upsell.",
  "Peldaño 3 Soberanía — orden mental avanzado (Imán, enfoque, proyectos).",
  "Espejo es otro producto. Comisión 30% recurrente mientras el cliente pague.",
];

export const ESCALERA_CAPAS = [
  {
    capa: 1,
    id: "presencia",
    titulo: "Presencia",
    pregunta: "¿En qué se me va el tiempo?",
    metrica: "Anillo de conciencia (conquista vs entropía)",
    color: "#8B5CF6",
    copyVenta:
      "Primera capa: dejar de ser víctima del reloj. El anillo muestra dónde fluye el día sin culpa — inconsciencia del tiempo.",
    demo: "Abrir Métricas → Capa 1 · ver conquista/entropía en vivo.",
  },
  {
    capa: 2,
    id: "entrada",
    titulo: "Entrada",
    pregunta: "¿Aparezco al trabajo consciente?",
    metrica: "Disciplina — vehículos en segmento",
    color: "#D4AF37",
    copyVenta:
      "Segunda capa: no basta ver el tiempo — hay que entrar. Disciplina mide cuándo montas vehículo consciente en cada segmento.",
    demo: "Capa 2 · índice disciplina + Δ al primer vehículo.",
  },
  {
    capa: 3,
    id: "produccion",
    titulo: "Producción",
    pregunta: "¿Convierto el tiempo en decisiones?",
    metrica: "Combustible de conciencia + pulso de decisiones",
    color: "#A855F7",
    copyVenta:
      "Tercera capa: la parálisis también quema tiempo. Decisiones cerradas = antientropía profunda. Conquista sin combustible = ilusión de progreso.",
    demo: "Capa 3 · pulso intradía + badge Puente si hay presencia sin decisiones.",
  },
] as const;

export const ESCALERA_INTEGRACION = CATEGORY_FOOTER;

export const PRODUCTOS = [
  {
    id: "planificacion_base",
    name: "Planificación Base",
    price: 19.99,
    stack: "Peldaño 1 · obligatorio",
    comision: 6.0,
    color: "#D4AF37",
  },
  {
    id: "operativo",
    name: "Operativo",
    price: 39.99,
    stack: "Peldaño 2 · Conquista medible",
    comision: 12.0,
    color: "#00C851",
  },
  {
    id: "soberania_dia",
    name: "Soberanía del día",
    price: 29.99,
    stack: "Peldaño 3 · Orden mental",
    comision: 9.0,
    color: "#38BDF8",
  },
] as const;

export const STACKS = [
  {
    title: "Conquista medible",
    peldao: "Peldaño 2 · primer upsell",
    modules: "Base + Operativo",
    total: 59.98,
    comisionEjemplo: 18.0,
    desc: "Unidades, ritmo, récord. Familiariza con cerrar y medir.",
  },
  {
    title: "Orden mental",
    peldao: "Peldaño 3 · avanzado",
    modules: "Base + Soberanía del día",
    total: 49.98,
    comisionEjemplo: 15.0,
    desc: "Imán, desglosador enfoque, proyectos y pasos de fe.",
  },
  {
    title: "Sistema completo",
    peldao: "Peldaños 2 + 3",
    modules: "Base + Operativo + Soberanía",
    total: 89.96,
    comisionEjemplo: 27.0,
    desc: "Mide producción y ordena pensamientos.",
  },
] as const;

export const EMBUDO_PREGUNTAS = [
  { peldao: 1, pregunta: "¿Tu día cierra con estructura?", respuesta: "Planificación Base." },
  {
    peldao: 2,
    pregunta: "¿Necesitas unidades, ritmo y récord reales?",
    respuesta: "Añade Operativo — primer upsell.",
  },
  {
    peldao: 3,
    pregunta: "¿Ideas sueltas, imprevistos y proyectos grandes?",
    respuesta: "Añade Soberanía — Imán + enfoque + pasos de fe.",
  },
] as const;

export const CATALOGO_PELDAO = [
  {
    peldao: 1,
    titulo: "Planificación Base",
    frase: "Organiza el día y cierra segmentos con datos, no con culpa.",
    incluye: [
      "Anillo de conciencia — reloj del día (conquista vs entropía)",
      "Escalera de Conciencia — presencia · entrada · producción (Métricas)",
      "Segmentos del día y monitor de omisión/entropía",
      "La Flota — Conquista · Enfoque · Descanso · Verdad",
      "Puntos de Soberanía (PS) + economía de cierre",
      "Disciplina — vehículos conscientes en segmento",
      "Visión panorámica — entrenamiento amplitud/foco",
      "Termodinámica atencional y combustible de conciencia (lectura)",
      "Resumen Escalera de Conciencia al sellar jornada",
      "Vehículos conquista, enfoque, descanso y verdad",
    ],
    noIncluye: "Desglosador premium, hub proyectos, Imán completo.",
  },
  {
    peldao: 2,
    titulo: "Operativo",
    frase: "Si pierdes un día de producción al mes por mal ritmo, esto se paga solo.",
    incluye: [
      "Desglosador conquista (unidades, pitido, ritmo en vivo)",
      "Récord / bóveda + tiempo heredado",
      "Ruta fluido → concentrado → límite (voz guía)",
      "Producción de decisiones medibles a escala",
      "Termodinámica v2 al máximo con subs de tiempo",
    ],
    noIncluye: "Requiere Planificación Base.",
    demo: "Desglosador conquista → 2–3 subs → Escalera capa 3 + termo vs ayer.",
  },
  {
    peldao: 3,
    titulo: "Soberanía del día",
    frase: "Tres ideas, un bloque cerrado. Pasos numerados hacia sueños más grandes.",
    incluye: [
      "Imán de pensamientos (captura, nidos, ruta S)",
      "Desglosador enfoque (bloques 3+3, cupos, ring)",
      "Hub Proyectos y peldaños (pasos de fe)",
      "Bolsa de ganancia de tiempo",
    ],
    noIncluye: "Requiere Planificación Base. Ideal tras habituar cierre medible.",
    demo: "Imán → ring de enfoque → paso #N en proyecto.",
  },
] as const;

export const MATRIZ_BENEFICIOS = [
  {
    persona: "Día sin estructura",
    dolor: "Se me va el día",
    peldao: "1 Base",
    demo: "Segmento → flota → Escalera capa 1",
  },
  {
    persona: "Producción / unidades",
    dolor: "Autoengaño al cerrar",
    peldao: "2 Operativo",
    demo: "Desglosador conquista → Escalera capa 3",
  },
  {
    persona: "Mente acelerada",
    dolor: "Ideas que se pierden",
    peldao: "3 Soberanía",
    demo: "Imán → nido → cronómetro",
  },
  {
    persona: "Proyectos largos",
    dolor: "Poco avance visible",
    peldao: "3 Soberanía",
    demo: "Hub → paso #N al cumplir",
  },
] as const;

export const OBJECIONES = [
  {
    q: "¿Por qué no uso Notion / Google Calendar?",
    a: "Porque aquí pagas por cierre medido y ritmo, no por almacenar notas.",
  },
  {
    q: "¿Es muy complicado?",
    a: "Empieza con Conquista (unidades) o Enfoque (decisiones). Los desglosadores son para quien ya cierra bloques (add-ons Operativo o Soberanía).",
  },
  {
    q: "¿Por qué capturar en el Imán si luego escribo en el desglosador?",
    a: "Con nido + proyecto + paso al cumplir, la captura ordena antes de ejecutar. El cronómetro sostiene el foco (~60%).",
  },
  {
    q: "¿Y si no renuevo?",
    a: "El cliente pierde acceso; tú dejas de ganar comisión ese mes.",
  },
  {
    q: "¿Incluye todo SISTEMICAR?",
    a: "No. Solo Planificación según catálogo de /pagos.",
  },
] as const;

export const LISTA_ROJA = [
  "Módulos en desarrollo (Alquimia, Umbral, Radar, Mentor, etc.)",
  '"Todo incluido" o precios que no aparecen en /pagos',
  "Que la app planifica sola sin que el usuario cierre vehículos/subs",
  "Resultados garantizados — vende medición y método",
  "Comisión infinita si el cliente cancela",
] as const;

export const GUION_VENTA = [
  "¿Tu día cierra con estructura? → Base.",
  "¿Necesitas unidades y ritmo reales? → Operativo (primer upsell). Demo desglosador conquista.",
  "¿Ideas sueltas e imprevistos? → Soberanía (avanzado). Demo Imán → ring de enfoque.",
  "¿Comparas con Notion? → Ritmo, cierre y decisiones medidas — no listas.",
  'Cierre: "Empieza con Base; si produces por unidades, el peldaño 2 se paga solo. Cuando domines el cierre medible, el peldaño 3 ordena tus pensamientos hacia proyectos."',
] as const;

export const IMAN_FLUJO = [
  "Mente → Imán (captura + nido/proyecto)",
  "Desglosador enfoque (ring ~60% con cronómetro)",
  "[no alcanza el bloque] → Imán otra vez (ruta S)",
  "Cumplido → paso ejecutado en proyecto",
] as const;

export const IMAN_OBJECIONES = [
  {
    q: "¿Por qué escribo dos veces: aquí y donde resuelvo?",
    a: "Con Imán + proyecto, la primera escritura es aterrizaje con destino; la segunda es ejecución medida en tiempo.",
  },
  {
    q: "Prefiero anotar directo donde trabajo",
    a: "Directo = foco bajo si no acotas tiempo. Desglosador + cronómetro sube el foco ~60%.",
  },
  {
    q: "Es otra bandeja de notas",
    a: "Es imán de ordenamiento: nido (proyecto o inbox), ruta S/E/M, y vuelve al desglosador sin perderse.",
  },
] as const;

export const IMAN_FRASES = [
  "No es escribir dos veces al vacío: es capturar con nido y cerrar con paso en tu proyecto.",
  "El Imán ordena; el desglosador enfoca; el proyecto te da fe para soñar más grande.",
  "Prácticamente el primer sistema que ordena pensamientos hacia acción medida.",
] as const;

export const INVENTARIO_PRODUCTO = [
  { area: "Segmentos + La Flota (4 tipos)", estado: "Producción", nota: "Core — peldaño 1" },
  { area: "Escalera de Conciencia (Métricas)", estado: "Producción", nota: "Capas presencia/entrada/producción" },
  { area: "Desglosador conquista + récord", estado: "Producción", nota: "Peldaño 2 — vender primero" },
  { area: "Desglosador enfoque + Imán + proyectos", estado: "Producción", nota: "Peldaño 3 — avanzado" },
  { area: "Termodinámica v2 + combustible", estado: "Producción", nota: "Ledger de decisiones + pulso" },
  { area: "Pagos recurrentes MP + ref vendedor", estado: "Producción", nota: "Verificar dominio producción" },
] as const;

export const KIT_MD_PATH = "/docs/KIT_Vendedores_Planificacion.md";
