/**
 * Origen HTTPS público para back_urls, webhooks y redirects (Mercado Pago, etc.).
 * Configura PUBLIC_APP_URL en producción (p. ej. https://sistemicar.app).
 * En Vercel: VERCEL_URL. En Netlify: URL o DEPLOY_PRIME_URL.
 */
export function getPublicAppBaseUrl(): string {
  const explicit = process.env.PUBLIC_APP_URL?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const netlify = process.env.URL?.trim() || process.env.DEPLOY_PRIME_URL?.trim();
  if (netlify) {
    const host = netlify.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  const vercel = process.env.VERCEL_URL?.trim();
  if (vercel) {
    const host = vercel.replace(/^https?:\/\//i, "");
    return `https://${host}`;
  }
  return "https://sistemicar.app";
}
