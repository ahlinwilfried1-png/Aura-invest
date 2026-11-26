import { Pool } from 'pg';
import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://szekyfonyjycwkpxzmub.supabase.co';

export default async function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let dbStatus = 'local_resilience';
  let dbError: string | null = null;
  let engine = 'none';

  const dbUrl = process.env.DATABASE_URL;
  if (dbUrl) {
    engine = 'supabase-postgresql';
    const pool = new Pool({
      connectionString: dbUrl,
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 6000,
    });
    try {
      await pool.query('SELECT 1');
      dbStatus = 'connected';
    } catch (err: any) {
      dbStatus = 'resilient_fallback';
      dbError = err?.message || 'PostgreSQL connection check failed';
    } finally {
      await pool.end().catch(() => {});
    }
  } else if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    engine = 'supabase-rest';
    try {
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      const { error } = await supabase.from('products').select('id').limit(1);
      if (error) {
        dbStatus = 'resilient_fallback';
        dbError = error.message;
      } else {
        dbStatus = 'connected';
      }
    } catch (err: any) {
      dbStatus = 'resilient_fallback';
      dbError = err?.message || 'Check failed';
    }
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'ok',
    database: dbStatus,
    engine,
    supabaseUrl: process.env.SUPABASE_URL || DEFAULT_SUPABASE_URL,
    dbError,
    country: 'TG',
    timestamp: new Date().toISOString()
  }));
}
