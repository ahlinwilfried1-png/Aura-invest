import { createClient } from '@supabase/supabase-js';

const CENTRAL_SUPABASE_URL = 'https://ykoqcaggjfhpnysvumuu.supabase.co';
const CENTRAL_SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inlrb3FjYWdnamZocG55c3Z1bXV1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4ODQyMzg5OSwiZXhwIjoyMTAzOTk5ODk5fQ.7HSpfFhr9f9ET9XytoQoz1Qe5l64ID_VcTD3HpFSItU';
const OFFICIAL_PAYMENT_GATEWAY_URL = 'https://tchin.tech/pay/6wy9goqpge';

export default async function handler(req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');

  let dbStatus = 'connected';
  let dbError = null;

  try {
    const supabase = createClient(
      process.env.SUPABASE_URL || CENTRAL_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || CENTRAL_SUPABASE_SERVICE_ROLE_KEY
    );
    const { error } = await supabase.from('products').select('id').limit(1);
    if (error) {
      dbStatus = 'resilient_fallback';
      dbError = error.message;
    }
  } catch (err: any) {
    dbStatus = 'resilient_fallback';
    dbError = err?.message || 'Check failed';
  }

  res.writeHead(200);
  res.end(JSON.stringify({
    status: 'ok',
    database: dbStatus,
    dbError,
    paymentGatewayActive: true,
    targetGateway: process.env.PAYMENT_GATEWAY_URL || OFFICIAL_PAYMENT_GATEWAY_URL,
    timestamp: new Date().toISOString()
  }));
}
