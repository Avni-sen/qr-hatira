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
    // Google Drive konfigürasyon kontrolü
    const googleDriveConfigured = !!(
      process.env.GOOGLE_DRIVE_CLIENT_EMAIL &&
      process.env.GOOGLE_DRIVE_PRIVATE_KEY
    );

    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Wedding Photo Share API - Google Drive Edition',
      environment: process.env.NODE_ENV || 'production',
      message: 'API çalışıyor! 🎉',
      services: {
        api: 'healthy',
        googleDrive: googleDriveConfigured ? 'configured' : 'not configured',
        storage: 'google-drive',
      },
      configuration: {
        googleDriveEnabled: googleDriveConfigured,
        parentFolderSet: !!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
      },
    };

    if (!googleDriveConfigured) {
      console.log(
        '⚠️ Google Drive not configured - missing environment variables'
      );
    } else {
      console.log('✅ Health check başarılı - Google Drive configured');
    }

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
