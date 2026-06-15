/** Evita repetir la misma voz de puerta/atención en ventanas cortas. */

const deliveredAtByKey = new Map<string, number>();

/** 3 min — cubre reintentos del navegador y doble disparo ciclo + timer. */
export const PUERTA_VOICE_DEDUP_MS = 3 * 60_000;

export function shouldDeliverPuertaVoiceOnce(key: string, nowMs = Date.now()): boolean {
  const tag = key.trim();
  if (!tag) return true;

  const prev = deliveredAtByKey.get(tag);
  if (prev != null && nowMs - prev < PUERTA_VOICE_DEDUP_MS) return false;

  deliveredAtByKey.set(tag, nowMs);

  if (deliveredAtByKey.size > 48) {
    for (const [k, at] of deliveredAtByKey) {
      if (nowMs - at > PUERTA_VOICE_DEDUP_MS) deliveredAtByKey.delete(k);
    }
  }

  return true;
}

export function resetPuertaVoiceDedup(): void {
  deliveredAtByKey.clear();
}

export function puertaVoiceKeyFromPhrase(phrase: string): string {
  let hash = 0;
  for (let i = 0; i < phrase.length; i += 1) {
    hash = (hash * 31 + phrase.charCodeAt(i)) | 0;
  }
  return `puerta-phrase-${Math.abs(hash)}`;
}
