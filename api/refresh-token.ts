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
  if (req.method !== 'POST') {
    console.log(`❌ Wrong method: ${req.method}`);
    return res.status(405).json({
      success: false,
      message: 'Sadece POST metoduna izin verilir',
      method: req.method,
    });
  }

  try {
    console.log('🔄 Token refresh isteği alındı');

    // Environment değişkenlerini kontrol et
    const refreshToken = process.env['GOOGLE_REFRESH_TOKEN'];
    const clientId = process.env['GOOGLE_CLIENT_ID'];
    const clientSecret = process.env['GOOGLE_CLIENT_SECRET'];

    console.log('📋 Environment kontrol:', {
      hasRefreshToken: !!refreshToken,
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      refreshTokenLength: refreshToken ? refreshToken.length : 0,
      clientIdLength: clientId ? clientId.length : 0,
    });

    if (!refreshToken || !clientId || !clientSecret) {
      console.error('❌ Eksik environment variables:', {
        refreshToken: !!refreshToken,
        clientId: !!clientId,
        clientSecret: !!clientSecret,
      });
      return res.status(500).json({
        success: false,
        message: 'Server konfigürasyon hatası - Credentials eksik',
        debug: {
          hasRefreshToken: !!refreshToken,
          hasClientId: !!clientId,
          hasClientSecret: !!clientSecret,
        },
      });
    }

    // Refresh token'ın geçerli olup olmadığını kontrol et
    if (
      refreshToken.trim() === '' ||
      refreshToken === 'YOUR_REFRESH_TOKEN_HERE'
    ) {
      console.error('❌ Refresh token geçersiz');
      return res.status(500).json({
        success: false,
        message: 'Refresh token geçersiz',
      });
    }

    // Google OAuth2 token refresh endpoint'i
    const tokenUrl = 'https://oauth2.googleapis.com/token';

    const requestBody = new URLSearchParams({
      client_id: clientId.trim(),
      client_secret: clientSecret.trim(),
      refresh_token: refreshToken.trim(),
      grant_type: 'refresh_token',
    });

    console.log("📡 Google OAuth2 endpoint'ine refresh isteği gönderiliyor...");
    console.log('🔍 Request details:', {
      url: tokenUrl,
      clientIdStart: clientId.substring(0, 10) + '...',
      refreshTokenStart: refreshToken.substring(0, 10) + '...',
    });

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Wedding-Photo-Share/1.0',
        Accept: 'application/json',
      },
      body: requestBody,
    });

    const responseText = await response.text();
    console.log('📨 Google response status:', response.status);
    console.log(
      '📨 Google response headers:',
      Object.fromEntries(response.headers.entries())
    );

    if (!response.ok) {
      console.error('❌ Google token refresh hatası:', {
        status: response.status,
        statusText: response.statusText,
        responseText: responseText,
      });

      // Specific error handling
      let errorMessage = 'Token yenileme başarısız';
      if (response.status === 400) {
        errorMessage = 'Geçersiz refresh token veya client bilgileri';
      } else if (response.status === 401) {
        errorMessage = 'Yetkilendirme hatası - Credentials kontrol edilmeli';
      } else if (response.status === 403) {
        errorMessage = 'API erişimi reddedildi';
      }

      return res.status(500).json({
        success: false,
        message: errorMessage,
        error: `HTTP ${response.status}: ${response.statusText}`,
        details: responseText,
        googleStatus: response.status,
      });
    }

    let tokenData;
    try {
      tokenData = JSON.parse(responseText);
    } catch (parseError) {
      console.error('❌ JSON parse hatası:', parseError);
      return res.status(500).json({
        success: false,
        message: 'Google response parse edilemedi',
        responseText,
      });
    }

    if (!tokenData.access_token) {
      console.error("❌ Access token response'da yok:", tokenData);
      return res.status(500).json({
        success: false,
        message: "Access token response'da bulunamadı",
        tokenData,
      });
    }

    console.log(
      '✅ Token başarıyla yenilendi, süre:',
      tokenData.expires_in,
      'saniye'
    );

    return res.status(200).json({
      success: true,
      accessToken: tokenData.access_token,
      expiresIn: tokenData.expires_in || 3600, // Default 1 saat
      tokenType: tokenData.token_type || 'Bearer',
      refreshedAt: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('❌ Token refresh genel hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Token yenileme sırasında beklenmeyen hata oluştu',
      error: error.message,
      stack:
        process.env['NODE_ENV'] === 'development' ? error.stack : undefined,
    });
  }
}
