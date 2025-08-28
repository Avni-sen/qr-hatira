import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

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
    // Toplam misafir sayısı
    const guestsResult = await sql`SELECT COUNT(*) as total_guests FROM guests`;
    const totalGuests = parseInt(guestsResult.rows[0].total_guests);

    // Toplam dosya sayısı
    const filesResult = await sql`SELECT COUNT(*) as total_files FROM photos`;
    const totalFiles = parseInt(filesResult.rows[0].total_files);

    // Toplam dosya boyutu
    const sizeResult =
      await sql`SELECT SUM(file_size) as total_size FROM photos`;
    const totalSize = parseInt(sizeResult.rows[0].total_size || 0);

    // Son yükleme tarihi
    const lastUploadResult = await sql`
      SELECT upload_date FROM guests 
      ORDER BY upload_date DESC 
      LIMIT 1
    `;
    const lastUpload =
      lastUploadResult.rows.length > 0
        ? lastUploadResult.rows[0].upload_date
        : null;

    return res.status(200).json({
      success: true,
      message: 'İstatistikler başarıyla getirildi.',
      data: {
        totalGuests,
        totalFiles,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        lastUpload,
      },
    });
  } catch (error: any) {
    console.error('❌ Vercel stats hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
}
