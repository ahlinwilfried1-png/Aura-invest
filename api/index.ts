import type { IncomingMessage, ServerResponse } from 'http';
import app from '../server';

const OFFICIAL_PAYMENT_GATEWAY_URL = 'https://tchin.tech/pay/cm63en28qn';

export default function handler(req: any, res: any) {
  // CORS & Preflight headers for cross-domain / custom domain support
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept');

  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  const urlPath = (req.url || '').split('?')[0];

  // If the user visits /api or / directly (like on airprods.online/api)
  if (urlPath === '' || urlPath === '/' || urlPath === '/api' || urlPath === '/api/') {
    res.setHeader('Content-Type', 'application/json');
    res.writeHead(200);
    res.end(JSON.stringify({
      status: 'ok',
      message: 'AirProds API Gateway is online and active on Vercel',
      service: 'AirProds Platform Services',
      paymentGateway: {
        active: true,
        redirectEndpoint: '/api/pay-redirect',
        target: process.env.PAYMENT_GATEWAY_URL || OFFICIAL_PAYMENT_GATEWAY_URL
      },
      endpoints: {
        health: '/api/health',
        payRedirect: '/api/pay-redirect',
        checkout: '/api/deposits/checkout',
        submitDeposit: '/api/deposits/submit',
        submitWithdrawal: '/api/withdrawals/submit'
      },
      timestamp: new Date().toISOString()
    }, null, 2));
    return;
  }

  // Handle direct payment redirect call if routed to /api
  if (urlPath === '/pay-redirect' || urlPath.startsWith('/pay-redirect/') || urlPath === '/api/pay-redirect' || urlPath.startsWith('/api/pay-redirect/')) {
    const targetUrl = process.env.PAYMENT_GATEWAY_URL || OFFICIAL_PAYMENT_GATEWAY_URL;
    res.writeHead(302, {
      Location: targetUrl,
      'Cache-Control': 'no-cache, no-store, must-revalidate'
    });
    res.end();
    return;
  }

  // Delegate all other API endpoints to the Express app
  return app(req, res);
}
