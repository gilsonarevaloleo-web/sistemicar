/** Resuelve con fallback si la promesa tarda más de ms. */
export function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ]);
}

/** Timeout + captura rechazos (evita falsos errores de red en móvil). */
export async function safeWithFallback<T>(
  promise: Promise<T>,
  fallback: T,
  ms?: number
): Promise<T> {
  try {
    if (ms != null) return await withTimeout(promise, ms, fallback);
    return await promise;
  } catch {
    return fallback;
  }
}
