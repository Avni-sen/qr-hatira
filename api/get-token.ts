import { VercelRequest, VercelResponse } from '@vercel/node';

function setCORS(res: VercelResponse) {
  // Daha liberal CORS ayarları
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, OPTIONS, PATCH'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin, User-Agent'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  res.setHeader('Access-Control-Allow-Credentials', 'false');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS'u her zaman ayarla
  setCORS(res);

  // OPTIONS request'i için
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Method kontrolü
  if (req.method !== 'GET') {
    console.log(`❌ Wrong method: ${req.method}`);
    return res.status(405).json({
      success: false,
      message: 'Sadece GET metoduna izin verilir',
      method: req.method,
    });
  }

  try {
    console.log('🔄 Token istek alındı - Environment kontrol ediliyor...');

    // Environment değişkenlerini kontrol et
    const accessToken = process.env['GOOGLE_ACCESS_TOKEN'];
    const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'];
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

    console.log('📋 Environment kontrol:', {
      hasAccessToken: !!accessToken,
      hasRefreshToken: !!refreshToken,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
    });

    // Eğer access token varsa direkt döndür
    if (
      accessToken &&
      accessToken.trim() !== '' &&
      accessToken !== 'YOUR_ACCESS_TOKEN_HERE'
    ) {
      console.log('✅ Mevcut access token kullanılıyor');
      return res.status(200).json({
        success: true,
        accessToken: accessToken.trim(),
        source: 'environment',
      });
    }

    // Access token yoksa refresh token ile yeni token al
    if (!refreshToken || !clientId || !clientSecret) {
      console.error('❌ Refresh token credentials eksik');
      return res.status(500).json({
        success: false,
        message: 'Server konfigürasyon hatası - Refresh credentials eksik',
        debug: {
          hasRefreshToken: !!refreshToken,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        },
      });
    }

    console.log(
      '🔄 Access token yok, refresh token ile yeni token alınıyor...'
    );

    // Google OAuth2 token refresh endpoint'i
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const requestBody = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    });

    console.log("📡 Google OAuth2 endpoint'ine istek gönderiliyor...");

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Wedding-Photo-Share/1.0',
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Google OAuth2 hatası:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText,
      });

      return res.status(500).json({
        success: false,
        message: 'Google OAuth2 token alınamadı',
        error: `${response.status}: ${response.statusText}`,
        details: errorText,
      });
    }

    const tokenData = await response.json();

    if (!tokenData.access_token) {
      console.error("❌ Access token response'da yok:", tokenData);
      return res.status(500).json({
        success: false,
        message: "Access token response'da bulunamadı",
        tokenData,
      });
    }

    console.log('✅ Yeni access token başarıyla alındı');

    return res.status(200).json({
      success: true,
      accessToken: tokenData.access_token,
      source: 'refresh',
      expiresIn: tokenData.expires_in,
    });
  } catch (error: any) {
    console.error('❌ Genel token alma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Token alınırken beklenmeyen hata oluştu',
      error: error.message,
      stack:
        process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
    });
  }
}
