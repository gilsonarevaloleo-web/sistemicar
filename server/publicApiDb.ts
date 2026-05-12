import { createHash, randomBytes } from "crypto";
import pkg from "pg";
const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

export async function initPublicApiTables(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS public_api_keys (
      id SERIAL PRIMARY KEY,
      client_name VARCHAR(100) NOT NULL,
      key_hash VARCHAR(64) NOT NULL UNIQUE,
      key_prefix VARCHAR(8) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    CREATE TABLE IF NOT EXISTS public_api_usage (
      id SERIAL PRIMARY KEY,
      api_key_id INTEGER NOT NULL REFERENCES public_api_keys(id) ON DELETE CASCADE,
      code_detected VARCHAR(20),
      timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS buyer_email VARCHAR(200);
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS plan_id VARCHAR(50);
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS monthly_call_limit INTEGER;
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ;
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS mp_payment_id VARCHAR(100) UNIQUE;
    ALTER TABLE public_api_keys ADD COLUMN IF NOT EXISTS delivery_status VARCHAR(20) DEFAULT 'manual';
  `);
}

function hashKey(rawKey: string): string {
  return createHash("sha256").update(rawKey).digest("hex");
}

export interface ApiKey {
  id: number;
  client_name: string;
  key_prefix: string;
  active: boolean;
  created_at: string;
  usage_count?: number;
  buyer_email?: string | null;
  plan_id?: string | null;
  monthly_call_limit?: number | null;
  expires_at?: string | null;
  delivery_status?: string | null;
}

export interface CreateApiKeyOptions {
  buyerEmail?: string;
  planId?: string;
  monthlyCallLimit?: number;
  expiresAt?: Date;
  mpPaymentId?: string;
  deliveryStatus?: string;
}

export type PaymentKeyStatus = "pending" | "sent" | "failed" | "superseded" | "manual";

export async function getApiKeyByPaymentId(
  mpPaymentId: string
): Promise<{ exists: false } | { exists: true; status: PaymentKeyStatus; keyId: number; createdAt: Date }> {
  const result = await pool.query(
    `SELECT id, delivery_status, created_at FROM public_api_keys WHERE mp_payment_id = $1 LIMIT 1`,
    [mpPaymentId]
  );
  if (result.rows.length === 0) return { exists: false };
  const row = result.rows[0];
  return {
    exists: true,
    status: (row.delivery_status ?? "manual") as PaymentKeyStatus,
    keyId: row.id as number,
    createdAt: new Date(row.created_at),
  };
}

const PENDING_RECOVERY_MS = 5 * 60 * 1000; // treat pending as failed after 5 min

export function isPendingStuck(createdAt: Date): boolean {
  return Date.now() - createdAt.getTime() > PENDING_RECOVERY_MS;
}

export async function createApiKey(
  clientName: string,
  options: CreateApiKeyOptions = {}
): Promise<{ key: string; record: ApiKey }> {
  const raw = randomBytes(32).toString("hex");
  const prefix = raw.slice(0, 8);
  const hash = hashKey(raw);
  const result = await pool.query(
    `INSERT INTO public_api_keys
       (client_name, key_hash, key_prefix, buyer_email, plan_id, monthly_call_limit, expires_at, mp_payment_id, delivery_status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id, client_name, key_prefix, active, created_at, buyer_email, plan_id, monthly_call_limit, expires_at, delivery_status`,
    [
      clientName.trim().slice(0, 100),
      hash,
      prefix,
      options.buyerEmail ?? null,
      options.planId ?? null,
      options.monthlyCallLimit ?? null,
      options.expiresAt ? options.expiresAt.toISOString() : null,
      options.mpPaymentId ?? null,
      options.deliveryStatus ?? "manual",
    ]
  );
  return { key: raw, record: result.rows[0] };
}

export async function updateApiKeyDeliveryStatus(keyId: number, status: "pending" | "sent" | "failed" | "superseded"): Promise<void> {
  await pool.query(
    `UPDATE public_api_keys SET delivery_status = $1 WHERE id = $2`,
    [status, keyId]
  );
}

export async function supersedePreviousKey(keyId: number): Promise<void> {
  await pool.query(
    `UPDATE public_api_keys SET active = FALSE, delivery_status = 'superseded', mp_payment_id = NULL WHERE id = $1`,
    [keyId]
  );
}

export async function listApiKeys(): Promise<ApiKey[]> {
  const result = await pool.query(`
    SELECT k.id, k.client_name, k.key_prefix, k.active, k.created_at,
           k.buyer_email, k.plan_id, k.monthly_call_limit, k.expires_at, k.delivery_status,
           COUNT(u.id)::int AS usage_count
    FROM public_api_keys k
    LEFT JOIN public_api_usage u ON u.api_key_id = k.id
    GROUP BY k.id
    ORDER BY k.created_at DESC
  `);
  return result.rows;
}

export async function revokeApiKey(id: number): Promise<boolean> {
  const result = await pool.query(
    `UPDATE public_api_keys SET active = FALSE WHERE id = $1`,
    [id]
  );
  return (result.rowCount ?? 0) > 0;
}

export async function validateApiKey(
  rawKey: string
): Promise<{ valid: boolean; keyId?: number; monthlyCallLimit?: number | null }> {
  if (!rawKey || rawKey.length < 8) return { valid: false };
  const hash = hashKey(rawKey);
  const result = await pool.query(
    `SELECT id, monthly_call_limit, expires_at FROM public_api_keys WHERE key_hash = $1 AND active = TRUE`,
    [hash]
  );
  if (result.rows.length === 0) return { valid: false };
  const row = result.rows[0];
  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    await pool.query(`UPDATE public_api_keys SET active = FALSE WHERE id = $1`, [row.id]);
    return { valid: false };
  }
  return { valid: true, keyId: row.id, monthlyCallLimit: row.monthly_call_limit };
}

export async function getMonthlyUsageCount(apiKeyId: number): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*)::int AS cnt FROM public_api_usage
     WHERE api_key_id = $1 AND timestamp >= date_trunc('month', NOW())`,
    [apiKeyId]
  );
  return result.rows[0]?.cnt ?? 0;
}

export async function logApiUsage(apiKeyId: number, codeDetected: string): Promise<void> {
  await pool.query(
    `INSERT INTO public_api_usage (api_key_id, code_detected) VALUES ($1, $2)`,
    [apiKeyId, codeDetected]
  );
}

// ─── Sub-vehicle records (historical timing records) ───────────────────────

export async function initSubVehicleRecordsTable(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS sub_vehicle_records (
      id SERIAL PRIMARY KEY,
      user_id VARCHAR(200) NOT NULL,
      titulo TEXT NOT NULL,
      min_per_unit NUMERIC(10,4) NOT NULL,
      total_min NUMERIC(10,4) NOT NULL,
      tipo_reloj VARCHAR(50) NOT NULL,
      fecha BIGINT NOT NULL,
      status VARCHAR(20),
      sub_resumen TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sub_vehicle_records_user ON sub_vehicle_records(user_id);
    DO $$
    BEGIN
      IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'svr_user_titulo_fecha_unique'
      ) THEN
        BEGIN
          ALTER TABLE sub_vehicle_records DROP CONSTRAINT IF EXISTS sub_vehicle_records_user_id_fecha_key;
        EXCEPTION WHEN OTHERS THEN NULL;
        END;
        ALTER TABLE sub_vehicle_records ADD CONSTRAINT svr_user_titulo_fecha_unique UNIQUE (user_id, titulo, fecha);
      END IF;
    END $$;
  `);
}

export interface SubVehicleRecordRow {
  titulo: string;
  minPerUnit: number;
  totalMin: number;
  tipoReloj: string;
  fecha: number;
  status?: string;
  subResumen?: string;
}

export async function bulkSaveVehicleHistory(
  userId: string,
  entries: SubVehicleRecordRow[]
): Promise<void> {
  if (!entries.length) return;
  const titulos = entries.map(e => e.titulo);
  const minPerUnits = entries.map(e => e.minPerUnit);
  const totalMins = entries.map(e => e.totalMin);
  const tipoRelojes = entries.map(e => e.tipoReloj);
  const fechas = entries.map(e => e.fecha);
  const statuses = entries.map(e => e.status ?? null);
  const subResumenes = entries.map(e => e.subResumen ?? null);
  await pool.query(
    `INSERT INTO sub_vehicle_records
       (user_id, titulo, min_per_unit, total_min, tipo_reloj, fecha, status, sub_resumen)
     SELECT $1, t.titulo, t.min_per_unit, t.total_min, t.tipo_reloj, t.fecha, t.status, t.sub_resumen
     FROM UNNEST(
       $2::text[], $3::numeric[], $4::numeric[], $5::text[], $6::bigint[], $7::text[], $8::text[]
     ) AS t(titulo, min_per_unit, total_min, tipo_reloj, fecha, status, sub_resumen)
     ON CONFLICT ON CONSTRAINT svr_user_titulo_fecha_unique DO UPDATE SET
       min_per_unit = EXCLUDED.min_per_unit,
       total_min = EXCLUDED.total_min,
       tipo_reloj = EXCLUDED.tipo_reloj,
       status = EXCLUDED.status,
       sub_resumen = EXCLUDED.sub_resumen`,
    [userId, titulos, minPerUnits, totalMins, tipoRelojes, fechas, statuses, subResumenes]
  );
}

export async function getVehicleHistory(userId: string, titulo?: string): Promise<SubVehicleRecordRow[]> {
  const hasTitleFilter = titulo && titulo.trim().length > 0;
  const result = hasTitleFilter
    ? await pool.query(
        `SELECT titulo, min_per_unit, total_min, tipo_reloj, fecha, status, sub_resumen
         FROM sub_vehicle_records
         WHERE user_id = $1 AND LOWER(titulo) = LOWER($2)
         ORDER BY fecha ASC
         LIMIT 500`,
        [userId, titulo!.trim()]
      )
    : await pool.query(
        `SELECT titulo, min_per_unit, total_min, tipo_reloj, fecha, status, sub_resumen
         FROM (
           SELECT titulo, min_per_unit, total_min, tipo_reloj, fecha, status, sub_resumen
           FROM sub_vehicle_records
           WHERE user_id = $1
           ORDER BY fecha DESC
           LIMIT 500
         ) recent
         ORDER BY fecha ASC`,
        [userId]
      );
  return result.rows.map((r: Record<string, unknown>) => ({
    titulo: r.titulo as string,
    minPerUnit: parseFloat(r.min_per_unit as string),
    totalMin: parseFloat(r.total_min as string),
    tipoReloj: r.tipo_reloj as string,
    fecha: Number(r.fecha),
    status: (r.status as string) ?? undefined,
    subResumen: (r.sub_resumen as string) ?? undefined,
  }));
}
