import { VercelRequest, VercelResponse } from '@vercel/node';

function setCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Sadece POST metoduna izin verilir',
    });
  }

  try {
    const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'];
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

    if (!refreshToken || !clientId || !clientSecret) {
      return res.status(500).json({
        success: false,
        message: 'Refresh token veya client bilgileri bulunamadı',
      });
    }

    // Google OAuth2 token refresh endpoint'i
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      throw new Error(`Token refresh failed: ${response.statusText}`);
    }

    const tokenData = await response.json();

    return res.status(200).json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in,
      tokenType: tokenData.token_type,
    });
  } catch (error: any) {
    console.error('❌ Token refresh hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Token yenileme sırasında bir hata oluştu',
      error: error.message,
    });
  }
}
