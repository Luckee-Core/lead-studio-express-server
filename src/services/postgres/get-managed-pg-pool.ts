import { Pool } from 'pg';

let managedPool: Pool | null = null;

/**
 * Builds a Supabase **direct** Postgres URI from `SUPABASE_URL` + `SUPABASE_DATABASE_PASSWORD`
 * (same project as the API URL: `https://<ref>.supabase.co` → `db.<ref>.supabase.co`).
 *
 * @returns Connection string, or null if env is missing or URL shape is unsupported
 */
const buildConnectionStringFromSupabaseEnv = (): string | null => {
  const password = process.env.SUPABASE_DATABASE_PASSWORD;
  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  if (!password || !supabaseUrl) return null;

  try {
    const { hostname } = new URL(supabaseUrl);
    if (!hostname.endsWith('.supabase.co')) {
      console.warn('⚠️ Cannot derive DB host from SUPABASE_URL (expected *.supabase.co)');
      return null;
    }
    const ref = hostname.replace(/\.supabase\.co$/i, '');
    if (!ref) return null;

    const dbHost = `db.${ref}.supabase.co`;
    const encodedPassword = encodeURIComponent(password);
    return `postgresql://postgres:${encodedPassword}@${dbHost}:5432/postgres?sslmode=require`;
  } catch {
    console.warn('⚠️ Invalid SUPABASE_URL for Postgres connection string derivation');
    return null;
  }
};

/**
 * Returns a singleton Postgres pool for raw SQL (migrations, DDL, COPY, etc.).
 *
 * Connection string resolution (first match wins):
 * 1. `DATABASE_URL` — full URI (recommended for pooler / non-default hosts).
 * 2. `SUPABASE_URL` + `SUPABASE_DATABASE_PASSWORD` — builds default Supabase **direct** URI.
 *
 * @returns Pool instance, or null if no usable connection config is present
 */
export const getManagedPgPool = (): Pool | null => {
  if (managedPool) return managedPool;

  const explicit = process.env.DATABASE_URL?.trim();
  const connectionString = explicit || buildConnectionStringFromSupabaseEnv();

  if (!connectionString) {
    console.warn(
      '⚠️ Postgres pool not configured (set DATABASE_URL or SUPABASE_URL + SUPABASE_DATABASE_PASSWORD)',
    );
    return null;
  }

  managedPool = new Pool({
    connectionString,
    max: Number(process.env.PG_POOL_MAX ?? 10),
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  managedPool.on('error', (err) => {
    console.error('❌ Postgres pool error:', err);
  });

  return managedPool;
};
