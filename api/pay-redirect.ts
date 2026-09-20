import type { IncomingMessage, ServerResponse } from 'http';

const OFFICIAL_PAYMENT_GATEWAY_URL = 'https://tchin.tech/pay/cm63en28qn';

export default function handler(req: any, res: any) {
  // Extract deposit ID if present
  const depositId = req.query?.depositId || req.url?.split('/').pop()?.split('?')[0] || '';
  const targetUrl = process.env.PAYMENT_GATEWAY_URL || OFFICIAL_PAYMENT_GATEWAY_URL;

  console.log(`[Vercel Serverless Pay-Redirect]: depositId=${depositId} -> ${targetUrl}`);

  // Prevent browser caching of the redirect so subsequent deposits always go through freshly
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Access-Control-Allow-Origin', '*');

  // HTTP 302 Found redirect to official payment gateway
  res.writeHead(302, { Location: targetUrl });
  res.end();
}
