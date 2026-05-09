import { Pool, QueryResult } from 'pg';

/**
 * PostgreSQL Database Client
 * Manages connections and provides query utilities
 */

let pool: Pool | null = null;

export function initDB() {
  if (pool) {
    return pool;
  }

  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  pool.on('error', (err: Error) => {
    console.error('Unexpected error on idle client', err);
  });

  return pool;
}

export function getPool(): Pool {
  if (!pool) {
    return initDB();
  }
  return pool;
}

export async function query(text: string, params?: any[]): Promise<QueryResult> {
  const client = getPool();
  return client.query(text, params);
}

export async function queryOne(text: string, params?: any[]): Promise<any | null> {
  const result = await query(text, params);
  return result.rows[0] || null;
}

export async function queryAll(text: string, params?: any[]): Promise<any[]> {
  const result = await query(text, params);
  return result.rows;
}

export async function close() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// Transaction helper
export async function transaction(callback: (client: any) => Promise<void>) {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    await callback(client);
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
