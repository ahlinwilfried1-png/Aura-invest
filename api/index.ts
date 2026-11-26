import app from '../server';

export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // Restore original /api/... path when routed via Vercel rewrite (?__path=/api/...)
  try {
    const parsedUrl = new URL(req.url || '/', 'http://localhost');
    const pathParam = parsedUrl.searchParams.get('__path') || (req.query?.__path as string | undefined);
    if (pathParam && typeof pathParam === 'string') {
      parsedUrl.searchParams.delete('__path');
      const normalizedPath = pathParam.startsWith('/') ? pathParam : `/${pathParam}`;
      const qs = parsedUrl.searchParams.toString();
      req.url = qs ? `${normalizedPath}?${qs}` : normalizedPath;
    }
  } catch (_) {}

  const urlPath = (req.url || '').split('?')[0];

  if (urlPath === '' || urlPath === '/' || urlPath === '/api' || urlPath === '/api/') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Gold Speed API Gateway is online and active (Togo)',
      service: 'Gold Speed Platform Services',
      country: 'TG',
      endpoints: {
        health: '/api/health',
        login: '/api/auth/login',
        register: '/api/auth/register',
        submitDeposit: '/api/deposits/submit',
        submitWithdrawal: '/api/withdrawals/submit'
      },
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  return app(req, res);
}
