import { VercelRequest, VercelResponse } from '@vercel/node';
import { environment } from '../src/environments/environment';

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
      environment.googleDriveClientEmail && environment.googleDrivePrivateKey
    );

    const health = {
      status: 'OK',
      timestamp: new Date().toISOString(),
      service: 'Wedding Photo Share API - Google Drive Edition',
      environment: environment.nodeEnv || 'production',
      message: 'API çalışıyor! 🎉',
      services: {
        api: 'healthy',
        googleDrive: googleDriveConfigured ? 'configured' : 'not configured',
        storage: 'google-drive',
      },
      configuration: {
        googleDriveEnabled: googleDriveConfigured,
        parentFolderSet: !!environment.googleDriveParentFolderId,
        googleOAuthConfigured: !!(
          environment.googleClientId &&
          environment.googleClientSecret &&
          environment.googleProjectId
        ),
        googleTokensConfigured: !!(
          environment.googleRefreshToken && environment.googleAccessToken
        ),
      },
    };

    if (!googleDriveConfigured) {
      // Google Drive not configured
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
