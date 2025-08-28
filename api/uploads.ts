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
    // Tüm misafirleri ve dosyalarını getir
    const guestsResult = await sql`
      SELECT 
        g.id,
        g.first_name,
        g.last_name,
        g.qr_code,
        g.file_count,
        g.upload_date,
        g.created_at
      FROM guests g
      ORDER BY g.upload_date DESC
    `;

    const guests = guestsResult.rows;
    const totalGuests = guests.length;
    const totalFiles = guests.reduce((acc, guest) => acc + guest.file_count, 0);

    // Her misafir için dosyalarını getir
    const guestsWithFiles = await Promise.all(
      guests.map(async (guest) => {
        const photosResult = await sql`
          SELECT 
            id,
            original_name,
            file_name,
            file_size,
            mime_type,
            file_url,
            upload_date
          FROM photos 
          WHERE guest_id = ${guest.id}
          ORDER BY upload_date DESC
        `;

        return {
          id: guest.id,
          firstName: guest.first_name,
          lastName: guest.last_name,
          qrCode: guest.qr_code,
          fileCount: guest.file_count,
          uploadDate: guest.upload_date,
          files: photosResult.rows.map((photo) => ({
            id: photo.id,
            originalName: photo.original_name,
            fileName: photo.file_name,
            fileSize: photo.file_size,
            mimeType: photo.mime_type,
            fileUrl: photo.file_url,
            uploadDate: photo.upload_date,
          })),
        };
      })
    );

    return res.status(200).json({
      success: true,
      message: 'Yüklemeler başarıyla getirildi.',
      data: {
        totalGuests,
        totalFiles,
        guests: guestsWithFiles,
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
