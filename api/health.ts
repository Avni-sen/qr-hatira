import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Environment debug bilgisi
  console.log('Health check called');
  console.log('Environment variables:', {
    POSTGRES_URL: !!process.env.POSTGRES_URL,
    DATABASE_URL: !!process.env.DATABASE_URL,
    VERCEL: process.env.VERCEL,
  });

  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Wedding Photo Share API (Vercel)',
    environment: 'production',
    debug: {
      hasPostgresUrl: !!process.env.POSTGRES_URL,
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      isVercel: !!process.env.VERCEL,
    },
  });
}
