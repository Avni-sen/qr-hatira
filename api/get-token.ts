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
    const accessToken = process.env['GOOGLE_ACCESS_TOKEN'];

    if (!accessToken) {
      return res.status(500).json({
        success: false,
        message: 'Access token bulunamadı',
      });
    }

    return res.status(200).json({
      success: true,
      accessToken: accessToken,
    });
  } catch (error: any) {
    console.error('❌ Token alma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Token alınırken bir hata oluştu',
      error: error.message,
    });
  }
}
