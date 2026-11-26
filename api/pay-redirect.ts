export default function handler(_req: any, res: any) {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.writeHead(410);
  res.end(JSON.stringify({
    success: false,
    error: 'Le paiement en ligne est désactivé. Veuillez effectuer un transfert TMoney ou Moov Money (Togo).'
  }));
}
