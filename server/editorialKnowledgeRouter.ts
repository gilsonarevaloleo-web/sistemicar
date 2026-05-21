/**
 * Cerebro Router � inyecci�n de conocimiento editorial por carril.
 * Evita el contextoBase monol�tico que saturaba prompts y mezclaba carriles.
 */

import { TABLA_OBSTRUCCION } from "./knowledge/cerebro-doctor-ia-v5";
import {
  IDENTIDAD_CODIGO_2,
  AVERIADO_CODIGO_2,
  CONQUISTA_TERRITORIOS_M02,
  REGLAS_ORO_PORTADOR,
  FICHA_ACABADO_CODIGO_2,
} from "./knowledge/libro-espejo-portador";
import {
  IDENTIDAD_CODIGO_1,
  AVERIADO_CODIGO_1,
  REGLAS_ORO_CIMIENTO,
  FICHA_ACABADO_CODIGO_1,
} from "./knowledge/codigo-1-cimiento";
import {
  IDENTIDAD_CODIGO_3,
  AVERIADO_CODIGO_3,
  REGLAS_ORO_TRABAJO,
  FICHA_ACABADO_CODIGO_3,
} from "./knowledge/codigo-3-trabajo";
import {
  IDENTIDAD_CODIGO_4,
  AVERIADO_CODIGO_4,
  REGLAS_ORO_ESTRUCTURA,
  FICHA_ACABADO_CODIGO_4,
} from "./knowledge/codigo-4-estructura";
import {
  IDENTIDAD_CODIGO_5,
  AVERIADO_CODIGO_5,
  REGLAS_ORO_DECISION,
  FICHA_ACABADO_CODIGO_5,
} from "./knowledge/codigo-5-decision";
import {
  IDENTIDAD_CODIGO_6,
  AVERIADO_CODIGO_6,
  REGLAS_ORO_CONVIVENCIA,
  FICHA_ACABADO_CODIGO_6,
} from "./knowledge/codigo-6-convivencia";
import {
  IDENTIDAD_CODIGO_7,
  AVERIADO_CODIGO_7,
  REGLAS_ORO_VISION,
  FICHA_ACABADO_CODIGO_7,
} from "./knowledge/codigo-7-vision";
import {
  IDENTIDAD_CODIGO_8,
  AVERIADO_CODIGO_8,
  REGLAS_ORO_CICLOS,
  FICHA_ACABADO_CODIGO_8,
} from "./knowledge/codigo-8-ciclos";
import {
  IDENTIDAD_CODIGO_9,
  AVERIADO_CODIGO_9,
  REGLAS_ORO_SISTEMA,
  FICHA_ACABADO_CODIGO_9,
} from "./knowledge/codigo-9-sistema";
import {
  IDENTIDAD_CODIGO_10,
  AVERIADO_CODIGO_10,
  REGLAS_ORO_ORIGEN,
  FICHA_ACABADO_CODIGO_10,
} from "./knowledge/codigo-10-origen";
import { HERRAMIENTA_10X10_CARRIL_MENSAJE } from "./knowledge/herramienta-10x10-carril-mensaje";
import { LEY_RESISTENCIA_CASCADA } from "./knowledge/ley-resistencia-cascada";
import { MATRIZ_SEDUCCION_10X10 } from "./knowledge/matriz-seduccion-10x10";
import { LEY_REDACCION_ESCRITOR } from "./knowledge/ley-redaccion-escritor";
import { PSICOLOGIA_MADUREZ_SEDUCCION } from "./knowledge/psicologia-madurez-seduccion";

export type EditorialCarril = 1 | 2 | 3;

const SECTION_LINE = "\u2550\u2550"; // ??

export const INTERFAZ_COLORES: Record<string, string> = {
  M01: "Rojo tierra � supervivencia biol�gica",
  M02: "Naranja � fluidez y caudal",
  M03: "Amarillo dorado � fuego y potencia",
  M04: "Verde esmeralda � resonancia del coraz�n",
  M05: "Azul cielo � emisi�n y comando vocal",
  M06: "�ndigo � visi�n y estrategia",
  M07: "Violeta � l�gica y procesamiento",
  M08: "Blanco puro � corona y autoridad soberana",
  M09: "Dorado electromagn�tico � campo y conexi�n",
  M10: "Espectro completo � integraci�n total del Pasajero",
};

export const DOMINIOS_PROHIBIDOS: Record<string, string> = {
  M01: "flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M02: "territorio/hogar/ra�ces (M01), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M03: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M04: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M05: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M06: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M07: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), autoridad/corona soberana (M08), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M08: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), campo/red colectiva (M09), integraci�n total del sistema (M10)",
  M09: "territorio/hogar/ra�ces (M01), flujo/caudal vital (M02), poder/fuerza muscular (M03), amor/v�nculo emocional (M04), voz/emisi�n p�blica (M05), estrategia/visi�n empresarial (M06), l�gica/procesamiento mental (M07), autoridad/corona soberana (M08), integraci�n total del sistema (M10)",
  M10: "territorio aislado (M01), flujo sin integraci�n (M02), fuerza sin direcci�n (M03), v�nculo sin red (M04), voz sin sistema (M05), estrategia parcial (M06), procesamiento sin s�ntesis (M07), autoridad sin campo (M08), red sin soberan�a (M09)",
};

export const VOCABULARIO_INTERFAZ: Record<string, string> = {
  M01: "territorio, cimiento, suelo, base, ra�z, grieta, fractura, anclaje, peso, fundamento, sost�n, l�mite, frontera, aplastamiento, estructura s�lida, suelo prestado",
  M02: "cauce, caudal, flujo, portador, presi�n, canal, corriente, estancamiento, sequ�a, filtraci�n, vaciamiento, vertiente, aridez, obstrucci�n, drenaje, purga",
  M03: "ignici�n, tensi�n, fuego, combusti�n, potencia, motor, chispa, calor, expansi�n, resistencia, densidad de carga, vector, plexo, arquitectura de valor, escala, output",
  M04: "estructura, protocolo, c�digo, sistema operativo, arquitectura, norma, ley propia, dise�o, instalaci�n, firmware, software averiado, reemplazo de sistema, autogobierno, marco, soberan�a estructural",
  M05: "v�rtice, vector, voltaje, compresi�n, disparo, segregaci�n energ�tica, direcci�n, punto de inflexi�n, trayectoria, detonaci�n, energ�a comprimida, campo de influencia, ejecuci�n, corte de est�tica",
  M06: "resonancia, sincron�a, frecuencia, campo, interferencia, nodo, red, drenaje de campo, calibraci�n, presi�n de contacto, densidad relacional, aislante energ�tico, v�nculo estructural, flujo compartido, ecosistema",
  M07: "visi�n, patr�n, campo estrat�gico, mapa, distancia focal, punto ciego, perspectiva, niebla de campo, se�al, ruido, ciclo, causalidad, lectura de patrones, desorientaci�n espacial, acoplamiento con la realidad",
  M08: "ciclo, retorno, ROI energ�tico, bucle, etapa, inversi�n, apertura, cierre, inter�s compuesto, plataforma de lanzamiento, termodin�mica de la realidad, bucle de perdici�n, sincron�a temporal, acumulaci�n de lastre",
  M09: "sistema, arquitectura, infraestructura, protocolo, proceso, escala, nodo, red, ecosistema, flujo aut�nomo, c�digo espagueti, motor del territorio, parche, colapso estructural, integraci�n de sistemas, dise�o de sistema",
  M10: "vac�o creativo, campo de posibilidad, fuente, origen, totalidad, emisi�n, autor�a, responsabilidad de crear, pizarra en blanco, voltaje de existencia, activaci�n del centro, miedo a la autor�a, integraci�n sist�mica, espectro completo",
};

const FICHA_BY_INTERFAZ: Record<string, string> = {
  M01: FICHA_ACABADO_CODIGO_1,
  M02: FICHA_ACABADO_CODIGO_2,
  M03: FICHA_ACABADO_CODIGO_3,
  M04: FICHA_ACABADO_CODIGO_4,
  M05: FICHA_ACABADO_CODIGO_5,
  M06: FICHA_ACABADO_CODIGO_6,
  M07: FICHA_ACABADO_CODIGO_7,
  M08: FICHA_ACABADO_CODIGO_8,
  M09: FICHA_ACABADO_CODIGO_9,
  M10: FICHA_ACABADO_CODIGO_10,
};

const CODE_BLOCKS: Record<
  string,
  { identidad: string; averiado: string; reglas: string; ficha: string; nombre: string }
> = {
  M01: {
    identidad: IDENTIDAD_CODIGO_1,
    averiado: AVERIADO_CODIGO_1,
    reglas: REGLAS_ORO_CIMIENTO,
    ficha: FICHA_ACABADO_CODIGO_1,
    nombre: "C�DIGO 1 (EL HOGAR/CIMIENTO)",
  },
  M03: {
    identidad: IDENTIDAD_CODIGO_3,
    averiado: AVERIADO_CODIGO_3,
    reglas: REGLAS_ORO_TRABAJO,
    ficha: FICHA_ACABADO_CODIGO_3,
    nombre: "C�DIGO 3 (EL TRABAJO/LABOR)",
  },
  M04: {
    identidad: IDENTIDAD_CODIGO_4,
    averiado: AVERIADO_CODIGO_4,
    reglas: REGLAS_ORO_ESTRUCTURA,
    ficha: FICHA_ACABADO_CODIGO_4,
    nombre: "C�DIGO 4 (LA ESTRUCTURA/LEY)",
  },
  M05: {
    identidad: IDENTIDAD_CODIGO_5,
    averiado: AVERIADO_CODIGO_5,
    reglas: REGLAS_ORO_DECISION,
    ficha: FICHA_ACABADO_CODIGO_5,
    nombre: "C�DIGO 5 (LA DECISI�N/V�RTICE)",
  },
  M06: {
    identidad: IDENTIDAD_CODIGO_6,
    averiado: AVERIADO_CODIGO_6,
    reglas: REGLAS_ORO_CONVIVENCIA,
    ficha: FICHA_ACABADO_CODIGO_6,
    nombre: "C�DIGO 6 (LA CONVIVENCIA/SINCRON�A)",
  },
  M07: {
    identidad: IDENTIDAD_CODIGO_7,
    averiado: AVERIADO_CODIGO_7,
    reglas: REGLAS_ORO_VISION,
    ficha: FICHA_ACABADO_CODIGO_7,
    nombre: "C�DIGO 7 (LA VISI�N/PERCEPCI�N)",
  },
  M08: {
    identidad: IDENTIDAD_CODIGO_8,
    averiado: AVERIADO_CODIGO_8,
    reglas: REGLAS_ORO_CICLOS,
    ficha: FICHA_ACABADO_CODIGO_8,
    nombre: "C�DIGO 8 (LOS CICLOS/TIEMPO)",
  },
  M09: {
    identidad: IDENTIDAD_CODIGO_9,
    averiado: AVERIADO_CODIGO_9,
    reglas: REGLAS_ORO_SISTEMA,
    ficha: FICHA_ACABADO_CODIGO_9,
    nombre: "C�DIGO 9 (EL SISTEMA/ARQUITECTURA)",
  },
  M10: {
    identidad: IDENTIDAD_CODIGO_10,
    averiado: AVERIADO_CODIGO_10,
    reglas: REGLAS_ORO_ORIGEN,
    ficha: FICHA_ACABADO_CODIGO_10,
    nombre: "C�DIGO 10 (EL ORIGEN/TOTALIDAD)",
  },
};

/** Corta texto desde un label hasta el primer stopLabel encontrado (sin RegExp fr�giles). */
function sliceFichaSection(text: string, startLabel: string, stopLabels: string[]): string {
  const start = text.indexOf(startLabel);
  if (start === -1) return "";
  let end = text.length;
  const searchFrom = start + startLabel.length;
  for (const label of stopLabels) {
    const idx = text.indexOf(label, searchFrom);
    if (idx !== -1 && idx < end) end = idx;
  }
  return text.slice(start, end).trim();
}

function sliceFichaByRegex(text: string, startPattern: RegExp, stopLabels: string[]): string {
  const m = text.match(startPattern);
  if (!m || m.index === undefined) return "";
  let end = text.length;
  const searchFrom = m.index + m[0].length;
  for (const label of stopLabels) {
    const idx = text.indexOf(label, searchFrom);
    if (idx !== -1 && idx < end) end = idx;
  }
  return text.slice(m.index, end).trim();
}

// ?? Extracci�n por secci�n ???????????????????????????????????????????????

export function extractCode10x10(codeNum: number): string {
  const startMarker = `??? C�DIGO ${codeNum}:`;
  const nextMarker = `??? C�DIGO ${codeNum + 1}:`;
  const start = HERRAMIENTA_10X10_CARRIL_MENSAJE.indexOf(startMarker);
  if (start === -1) return HERRAMIENTA_10X10_CARRIL_MENSAJE;
  const nextStart = HERRAMIENTA_10X10_CARRIL_MENSAJE.indexOf(nextMarker, start);
  const section =
    nextStart > 0
      ? HERRAMIENTA_10X10_CARRIL_MENSAJE.substring(start, nextStart)
      : HERRAMIENTA_10X10_CARRIL_MENSAJE.substring(start);
  const headerEnd = HERRAMIENTA_10X10_CARRIL_MENSAJE.indexOf("??? C�DIGO 1:");
  const header = headerEnd > 0 ? HERRAMIENTA_10X10_CARRIL_MENSAJE.substring(0, headerEnd) : "";
  return header + section;
}

export function extractMatrizSeduccion(codeNum: number): string {
  const startMarker = `??? C�DIGO ${codeNum}:`;
  const nextMarker = `??? C�DIGO ${codeNum + 1}:`;
  const start = MATRIZ_SEDUCCION_10X10.indexOf(startMarker);
  if (start === -1) return "";
  const nextStart = MATRIZ_SEDUCCION_10X10.indexOf(nextMarker, start);
  return nextStart > 0
    ? MATRIZ_SEDUCCION_10X10.substring(start, nextStart)
    : MATRIZ_SEDUCCION_10X10.substring(start);
}

export function extractLeyRedaccionCapa1(): string {
  const capa2Marker = "??? CAPA 2:";
  const capa2Start = LEY_REDACCION_ESCRITOR.indexOf(capa2Marker);
  return capa2Start > 0
    ? LEY_REDACCION_ESCRITOR.substring(0, capa2Start)
    : LEY_REDACCION_ESCRITOR.substring(0, 8000);
}

export function extractLeyRedaccionFicha(codeNum: number): string {
  const fichaKey = `FICHA C${codeNum} �`;
  const nextFichaKey = `FICHA C${codeNum + 1} �`;
  const fichaStart = LEY_REDACCION_ESCRITOR.indexOf(fichaKey);
  if (fichaStart === -1) return "";
  const fichaEnd =
    codeNum < 10 ? LEY_REDACCION_ESCRITOR.indexOf(nextFichaKey, fichaStart) : -1;
  const ficha =
    fichaEnd > 0
      ? LEY_REDACCION_ESCRITOR.substring(fichaStart, fichaEnd)
      : LEY_REDACCION_ESCRITOR.substring(fichaStart);
  return `??? FICHA T�CNICA DEL C�DIGO (LEY REDACCI�N) ???\n${ficha}`;
}

export function extractPsicologia(codeNum: number): string {
  if (codeNum === 1) return PSICOLOGIA_MADUREZ_SEDUCCION;
  const bloque4Marker = "??? BLOQUE 4:";
  const bloque4Start = PSICOLOGIA_MADUREZ_SEDUCCION.indexOf(bloque4Marker);
  if (bloque4Start > 0) return PSICOLOGIA_MADUREZ_SEDUCCION.substring(0, bloque4Start);
  return PSICOLOGIA_MADUREZ_SEDUCCION;
}

export function extractLeyResistenciaCarril2(): string {
  const marker = "??? ESTRUCTURA DE RESPUESTA: LOS 3 CARRILES EN CASCADA ???";
  const endMarker = "??? REGLA DE BLOQUEO AUTOM�TICO ???";
  const start = LEY_RESISTENCIA_CASCADA.indexOf(marker);
  if (start === -1) return "";
  const end = LEY_RESISTENCIA_CASCADA.indexOf(endMarker, start);
  return end > 0
    ? LEY_RESISTENCIA_CASCADA.substring(start, end)
    : LEY_RESISTENCIA_CASCADA.substring(start, start + 3500);
}


/** Recorta la Ficha de Acabado a lo que cada carril puede usar. */
export function extractFichaForCarril(fichaText: string, carril: EditorialCarril): string {
  if (!fichaText?.trim()) return "";
  const metodo = "M\u00C9TODO";
  const stopLector = ["AL USUARIO", `${metodo} DE INTERVENCI\u00D3N`, `${metodo} DE`, "NOTA DEL", SECTION_LINE];
  const stopExtranjero = ["AL LECTOR", "AL USUARIO", metodo, "NOTA DEL", SECTION_LINE];
  const material = sliceFichaByRegex(
    fichaText,
    /MATERIAL DE OBSTRUCCI[\u00D3O]N:/i,
    ["AL EXTRA", "AL LECTOR", "LA BRECHA", SECTION_LINE]
  );
  if (carril === 1) {
    const extranjero = sliceFichaSection(fichaText, "AL EXTRA", stopExtranjero);
    const solucion = sliceFichaByRegex(
      fichaText,
      /SOLUCI[\u00D3O]N AUT[\u00C1A]RQUICA/i,
      [metodo, "NOTA DEL", "AL LECTOR", SECTION_LINE]
    );
    return ["=== FICHA EXTRACTO CARRIL 1 ===", material, extranjero, solucion].filter(Boolean).join("\n\n");
  }
  if (carril === 2) {
    const lector = sliceFichaSection(fichaText, "AL LECTOR", stopLector);
    const brecha = sliceFichaSection(fichaText, "LA BRECHA", ["CLIENTE", metodo, "AL USUARIO", SECTION_LINE]);
    const cliente = sliceFichaByRegex(fichaText, /CLIENTE/i, [metodo, "AL USUARIO", "NOTA DEL", SECTION_LINE]);
    return ["=== FICHA EXTRACTO CARRIL 2 ===", material, brecha, lector, cliente].filter(Boolean).join("\n\n");
  }
  return `=== FICHA CARRIL 3 COMPLETA ===\n${fichaText}`;
}

export function getFichaText(interfazId: string): string {
  return FICHA_BY_INTERFAZ[interfazId] || "";
}

/** Arquitectura del c�digo seg�n carril � sin mezclar peso de C3 en C1. */
export function getCodeArchitectureBundle(interfazId: string, carril: EditorialCarril): string {
  if (interfazId === "M02") {
    if (carril === 1) {
      return `
???????????? ARQUITECTURA C�DIGO 2 � CARRIL 1 (SOLO MENSAJE) ????????????
${IDENTIDAD_CODIGO_2}
??????????????????????????????????????????????????????
${AVERIADO_CODIGO_2}
??????????????????????????????????????????????????????
${REGLAS_ORO_PORTADOR}
${extractFichaForCarril(FICHA_ACABADO_CODIGO_2, 1)}
????????????????????????????????????????????????????????`;
    }
    if (carril === 2) {
      return `
???????????? ARQUITECTURA C�DIGO 2 � CARRIL 2 (LECTOR / CONSOLA) ????????????
${IDENTIDAD_CODIGO_2}
${AVERIADO_CODIGO_2}
${CONQUISTA_TERRITORIOS_M02}
${extractFichaForCarril(FICHA_ACABADO_CODIGO_2, 2)}
????????????????????????????????????????????????????????`;
    }
    return `
???????????? ARQUITECTURA ESPEC�FICA DEL C�DIGO 2 (M02 � MAESTRO) ????????????
${CONQUISTA_TERRITORIOS_M02}
${IDENTIDAD_CODIGO_2}
${AVERIADO_CODIGO_2}
${REGLAS_ORO_PORTADOR}
?? FICHA T�CNICA DE ACABADO ??
${FICHA_ACABADO_CODIGO_2}
????????????????????????????????????????????????????????`;
  }

  const b = CODE_BLOCKS[interfazId];
  if (!b) return "";

  if (carril === 1) {
    return `
???????????? ${b.nombre} � CARRIL 1 ????????????
${b.identidad}
${b.averiado}
${b.reglas}
${extractFichaForCarril(b.ficha, 1)}
????????????????????????????????????????????????????????`;
  }
  if (carril === 2) {
    return `
???????????? ${b.nombre} � CARRIL 2 ????????????
${b.identidad}
${b.averiado}
${extractFichaForCarril(b.ficha, 2)}
????????????????????????????????????????????????????????`;
  }
  return `
???????????? ${b.nombre} � CARRIL 3 (COMPLETO) ????????????
${b.identidad}
${b.averiado}
${b.reglas}
?? FICHA T�CNICA DE ACABADO ??
${b.ficha}
????????????????????????????????????????????????????????`;
}

export interface ChapterContextParams {
  tituloLibro: string;
  interfazId: string;
  interfaz: { nombre: string; zona: string; falla: string; mendigo: string; protocolo: string };
  subInterfazTitulo: string;
  subInterfazFalla?: string;
  subInterfazDescripcion?: string;
  capNum: number;
  coordenada: string;
  interfazNum: number;
  gradoLabel: string;
  creditosRef: number;
  densidadStr: string;
  dominiosProhibidos: string;
  vocabularioInterfaz: string;
  directrizSection: string;
  notasEvolucionSection: string;
  subInterfazTituloForZoom: string;
}

/** Metadatos del cap�tulo � sin matrices ni doctor. */
export function buildChapterContextCore(p: ChapterContextParams): string {
  const colorInterfaz = INTERFAZ_COLORES[p.interfazId] || "Dorado";
  const colorNote =
    p.interfazId === "M01"
      ? "El color cl�nico NO se usa en este carril."
      : `Color cl�nico de la interfaz (solo Carril 3): ${colorInterfaz}`;

  return `LIBRO: ${p.tituloLibro} � Interfaz ${p.interfazId}: ${p.interfaz.nombre}
Zona f�sica: ${p.interfaz.zona}
Falla principal: ${p.interfaz.falla}
El Mendigo aqu�: "${p.interfaz.mendigo}"
Protocolo de rescate: "${p.interfaz.protocolo}"
Coordenada aut�rquica: ${p.coordenada} (Libro ${p.interfazNum}, Cap�tulo ${p.capNum})

CAP�TULO: "${p.subInterfazTitulo}"
Falla espec�fica: "${p.subInterfazFalla || "Manifestaci�n de " + p.interfaz.falla}"
Descripci�n: "${p.subInterfazDescripcion || ""}"
Grado de valor: ${p.gradoLabel}
${p.densidadStr}

AUTARQU�A ABSOLUTA: PROHIBIDO mencionar o implicar: ${p.dominiosProhibidos}.
Solo el universo de ${p.interfazId}. ${colorNote}

VOCABULARIO OBLIGATORIO DE ${p.interfazId}: ${p.vocabularioInterfaz}.
PROHIBIDO: cortisol, dopamina, serotonina, sistema nervioso, hormonas, neurociencia, psicologismos.
La fisicalidad = sensaci�n estructural y corporal (tensi�n, rigidez, peso, sequ�a, grieta).
${p.directrizSection}${p.notasEvolucionSection}
PRINCIPIO RECTOR: solo limpiar, prevenir, mejorar. NUNCA producir, aprender, crear metas.
PROHIBIDO: autoayuda, positivismo, consejo de coach.
OBLIGATORIO: prosa cl�nica continua, sin listas ni bullets visibles.

LEY DE SEGREGACI�N � ZOOM sobre "${p.subInterfazTituloForZoom}":
Los 3 carriles son lentes progresivas del MISMO concepto � el objeto no cambia, la ventana s�.`;
}

/** Paquete de conocimiento inyectado solo en el carril correspondiente. */
export function buildKnowledgeForCarril(
  carril: EditorialCarril,
  interfazId: string,
  interfazNum: number
): string {
  const parts: string[] = [];

  parts.push(getCodeArchitectureBundle(interfazId, carril));

  if (carril === 1) {
    parts.push(extractCode10x10(interfazNum));
    parts.push(extractLeyRedaccionCapa1());
    if (interfazNum <= 2) parts.push(extractPsicologia(interfazNum));
    return parts.filter(Boolean).join("\n\n");
  }

  if (carril === 2) {
    parts.push(extractLeyRedaccionCapa1());
    parts.push(extractLeyRedaccionFicha(interfazNum));
    parts.push(extractPsicologia(interfazNum));
    parts.push(extractLeyResistenciaCarril2());
    return parts.filter(Boolean).join("\n\n");
  }

  parts.push(extractLeyRedaccionFicha(interfazNum));
  parts.push(extractMatrizSeduccion(interfazNum));
  parts.push(TABLA_OBSTRUCCION);
  parts.push(LEY_RESISTENCIA_CASCADA);
  return parts.filter(Boolean).join("\n\n");
}

/** Ensambla prompt = n�cleo + conocimiento del carril + tarea. */
export function assembleCarrilPrompt(
  core: string,
  carril: EditorialCarril,
  interfazId: string,
  interfazNum: number,
  taskBody: string
): string {
  const knowledge = buildKnowledgeForCarril(carril, interfazId, interfazNum);
  const creditosNote =
    carril === 3
      ? "\n(Referencia de cr�ditos/fianza solo en el cuerpo de la tarea � no repetir en carriles anteriores.)\n"
      : "";
  return `${core}\n\n???????? CONOCIMIENTO ROUTER � CARRIL ${carril} ????????\n${knowledge}${creditosNote}\n${taskBody}`;
}

// ?? Auditor�a Ficha (exportada para index) ?????????????????????????????????

export function extractFichaMarkers(text: string) {
  const materialMatch = text.match(/MATERIAL DE OBSTRUCCI[�O]N:\s*([^\n(]+)/i);
  const materialRaw = materialMatch ? materialMatch[1].trim() : null;
  const materialTerms = materialRaw
    ? materialRaw.split(/\s*\/\s*/).map((t) => t.trim().toLowerCase()).filter(Boolean)
    : [];
  const ganchoExtMatch = text.match(/AL EXTRA[�N]O \(Canal Mensaje\)[\s\S]*?Gancho:\s*([^\n.]+)/i);
  const ganchoLecMatch = text.match(/AL LECTOR \(Canal Portador\)[\s\S]*?Gancho:\s*([^\n.]+)/i);
  const ganchoUsrMatch = text.match(/AL USUARIO \(Canal Operador\)[\s\S]*?Gancho:\s*([^\n.]+)/i);
  return {
    material: materialRaw,
    materialTerms,
    ganchoC1: ganchoExtMatch ? ganchoExtMatch[1].trim().replace(/\.+$/, "") : null,
    ganchoC2: ganchoLecMatch ? ganchoLecMatch[1].trim().replace(/\.+$/, "") : null,
    ganchoC3: ganchoUsrMatch ? ganchoUsrMatch[1].trim().replace(/\.+$/, "") : null,
  };
}

export function checkCarrilFichaVocab(
  carrilText: string,
  materialTerms: string[],
  gancho: string | null
) {
  const lower = carrilText.toLowerCase();
  const materialFound =
    materialTerms.length === 0 || materialTerms.some((t) => lower.includes(t));
  const ganchoFound = !gancho || lower.includes(gancho.toLowerCase());
  return { materialFound, ganchoFound, passed: materialFound && ganchoFound };
}

export function buildFichaRegenPrompt(
  originalPrompt: string,
  currentContent: string,
  markers: ReturnType<typeof extractFichaMarkers>,
  gancho: string | null
): string {
  const lower = currentContent.toLowerCase();
  const missingParts: string[] = [];
  if (markers.materialTerms.length > 0 && !markers.materialTerms.some((t) => lower.includes(t))) {
    missingParts.push(`MATERIAL DE OBSTRUCCI�N: "${markers.material}"`);
  }
  if (gancho && !lower.includes(gancho.toLowerCase())) {
    missingParts.push(`GANCHO DEL CANAL: "${gancho}"`);
  }
  if (missingParts.length === 0) return originalPrompt;
  return `${originalPrompt}\n\nCORRECCI�N OBLIGATORIA � AUDITOR�A FICHA DE ACABADO:\nEl texto NO incluy�:\n${missingParts.map((p) => `� ${p}`).join("\n")}\nIntegra estos elementos en la reescritura sin alterar estructura ni tono.`;
}

// ?? Auditor�a de contaminaci�n entre carriles ?????????????????????????????

const C1_FORBIDDEN: { pattern: RegExp; label: string }[] = [
  { pattern: /\bconsola\b/i, label: "Consola" },
  { pattern: /\bdoctor\s*ia\b/i, label: "Doctor IA" },
  { pattern: /\bsistemicar\b/i, label: "Sistemicar" },
  { pattern: /\bcr[e�]ditos?\b/i, label: "cr�ditos" },
  { pattern: /\bespejo\s+del\b/i, label: "Espejo del" },
  { pattern: /\bsilueta\b/i, label: "Silueta" },
  { pattern: /\bc[o�]digo\s*21\b/i, label: "C�digo 21" },
  { pattern: /\bfianza\b/i, label: "fianza" },
];

const C2_FORBIDDEN: { pattern: RegExp; label: string }[] = [
  { pattern: /\bdoctor\s*ia\b/i, label: "Doctor IA" },
  { pattern: /\bcr[e�]ditos?\b/i, label: "cr�ditos" },
  { pattern: /\bfianza\b/i, label: "fianza" },
  { pattern: /\bintervenci[o�]n\s+quir[u�]rgic/i, label: "intervenci�n quir�rgica" },
];

export type ContaminationAudit = {
  passed: boolean;
  violations: string[];
  retried?: boolean;
};

export function auditCarrilContamination(
  carril: EditorialCarril,
  text: string
): ContaminationAudit {
  const rules = carril === 1 ? C1_FORBIDDEN : carril === 2 ? C2_FORBIDDEN : [];
  const violations: string[] = [];
  for (const { pattern, label } of rules) {
    if (pattern.test(text)) violations.push(label);
  }
  return { passed: violations.length === 0, violations };
}

export function buildContaminationRegenSuffix(
  carril: EditorialCarril,
  violations: string[]
): string {
  if (violations.length === 0) return "";
  const carrilName = carril === 1 ? "MENSAJE" : "LECTOR";
  return `\n\nCORRECCI�N OBLIGATORIA � CONTAMINACI�N DE CARRIL ${carril} (${carrilName}):\nEl texto incluy� t�rminos PROHIBIDOS en este carril: ${violations.join(", ")}.\nReescribe eliminando por completo esas referencias. Mant�n 1.000 palabras y el tono cl�nico.`;
}

export function estimatePromptChars(prompt: string): number {
  return Math.round(prompt.length / 3.5);
}
