import { VercelRequest, VercelResponse } from '@vercel/node';

// Demo data - production'da database kullanın
// Note: Memory storage resets on each function call
// Use external database for persistence
let guestUploads: any[] = [];

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({
      success: false,
      message: 'Sadece GET method desteklenir.',
    });
  }

  try {
    return res.status(200).json({
      success: true,
      message: 'Yüklemeler başarıyla getirildi.',
      data: {
        totalGuests: guestUploads.length,
        totalFiles: guestUploads.reduce(
          (acc, guest) => acc + guest.fileCount,
          0
        ),
        guests: guestUploads,
      },
    });
  } catch (error: any) {
    console.error('❌ Vercel uploads hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Yüklemeler getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
}
