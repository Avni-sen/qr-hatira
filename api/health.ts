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
    // Environment variables'ları detaylı kontrol et
    const envVars = {
      GOOGLE_CLIENT_ID: process.env['GOOGLE_CLIENT_ID'],
      GOOGLE_CLIENT_SECRET: process.env['GOOGLE_CLIENT_SECRET'],
      GOOGLE_REFRESH_TOKEN: process.env['GOOGLE_REFRESH_TOKEN'],
      GOOGLE_ACCESS_TOKEN: process.env['GOOGLE_ACCESS_TOKEN'],
      GOOGLE_DRIVE_PARENT_FOLDER_ID:
        process.env['GOOGLE_DRIVE_PARENT_FOLDER_ID'],
      GOOGLE_PROJECT_ID: process.env['GOOGLE_PROJECT_ID'],
      NODE_ENV: process.env['NODE_ENV'],
    };

    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Wedding Photo Share API',
      message: 'API çalışıyor! 🎉',
      environment: {
        // Güvenlik için sadece varlığını kontrol et, değerleri gösterme
        hasGoogleClientId: !!envVars.GOOGLE_CLIENT_ID,
        hasGoogleClientSecret: !!envVars.GOOGLE_CLIENT_SECRET,
        hasGoogleRefreshToken: !!envVars.GOOGLE_REFRESH_TOKEN,
        hasGoogleAccessToken: !!envVars.GOOGLE_ACCESS_TOKEN,
        hasGoogleDriveParentFolder: !!envVars.GOOGLE_DRIVE_PARENT_FOLDER_ID,
        hasGoogleProjectId: !!envVars.GOOGLE_PROJECT_ID,
        nodeEnv: envVars.NODE_ENV || 'production',

        // Değerlerin uzunluklarını göster (debug için)
        lengths: {
          clientId: envVars.GOOGLE_CLIENT_ID?.length || 0,
          clientSecret: envVars.GOOGLE_CLIENT_SECRET?.length || 0,
          refreshToken: envVars.GOOGLE_REFRESH_TOKEN?.length || 0,
          accessToken: envVars.GOOGLE_ACCESS_TOKEN?.length || 0,
          parentFolderId: envVars.GOOGLE_DRIVE_PARENT_FOLDER_ID?.length || 0,
        },

        // İlk birkaç karakteri göster (debug için)
        previews: {
          clientId:
            envVars.GOOGLE_CLIENT_ID?.substring(0, 10) + '...' || 'undefined',
          refreshToken:
            envVars.GOOGLE_REFRESH_TOKEN?.substring(0, 10) + '...' ||
            'undefined',
          parentFolderId: envVars.GOOGLE_DRIVE_PARENT_FOLDER_ID || 'undefined',
        },
      },

      // Tüm environment variable isimlerini listele (değerleri değil)
      availableEnvVars: Object.keys(process.env).filter(
        (key) =>
          key.startsWith('GOOGLE_') ||
          key === 'NODE_ENV' ||
          key === 'VERCEL' ||
          key === 'VERCEL_ENV'
      ),
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
