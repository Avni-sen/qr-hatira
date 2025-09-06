import { VercelRequest, VercelResponse } from '@vercel/node';

function setCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Sadece GET metoduna izin verilir',
    });
  }

  try {
    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Wedding Photo Share API',
      message: 'API çalışıyor! 🎉',
      environment: {
        hasGoogleClientId: !!process.env['GOOGLE_CLIENT_ID'],
        hasGoogleClientSecret: !!process.env['GOOGLE_CLIENT_SECRET'],
        hasGoogleRefreshToken: !!process.env['GOOGLE_REFRESH_TOKEN'],
        hasGoogleAccessToken: !!process.env['GOOGLE_ACCESS_TOKEN'],
        hasGoogleDriveParentFolder:
          !!process.env['GOOGLE_DRIVE_PARENT_FOLDER_ID'],
        nodeEnv: process.env['NODE_ENV'] || 'production',
      },
    };

    return res.status(200).json(health);
  } catch (error: any) {
    console.error('❌ Health check hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Health check başarısız',
      error: error.message,
    });
  }
}
