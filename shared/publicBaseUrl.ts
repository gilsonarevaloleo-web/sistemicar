/**
 * Origen HTTPS público para back_urls, webhooks y redirects (Mercado Pago, etc.).
 * Configura PUBLIC_APP_URL en producción (p. ej. https://sistemicar.app).
 * En Vercel, si no está definido, se usa https://VERCEL_URL.
 */
export function getPublicAppBaseUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return "https://sistemicar.app";
}
