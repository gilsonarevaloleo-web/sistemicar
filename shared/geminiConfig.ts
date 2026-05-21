/**
 * Modelos Gemini para servidor (callGemini) y cliente (REST directo).
 * Orden: primero el m�s capaz; fallbacks si quota o regi�n fallan.
 */
export const GEMINI_MODELS = [
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-2.0-flash",
] as const;

export type GeminiModelId = (typeof GEMINI_MODELS)[number];

/** Modelo por defecto para llamadas REST desde el navegador */
export const GEMINI_MODEL_CLIENT = "gemini-2.5-flash" as const;

export const GEMINI_GENERATE_CONTENT_BASE =
  "https://generativelanguage.googleapis.com/v1beta/models";

export function geminiGenerateContentUrl(model: string): string {
  return `${GEMINI_GENERATE_CONTENT_BASE}/${model}:generateContent`;
}
