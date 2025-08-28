import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,POST');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Sadece POST method desteklenir.',
    });
  }

  try {
    // Guests tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS guests (
        id SERIAL PRIMARY KEY,
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        qr_code VARCHAR(255),
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        file_count INTEGER DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Photos tablosu
    await sql`
      CREATE TABLE IF NOT EXISTS photos (
        id SERIAL PRIMARY KEY,
        guest_id INTEGER REFERENCES guests(id) ON DELETE CASCADE,
        original_name VARCHAR(255) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_size BIGINT NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        file_url TEXT,
        thumbnail_url TEXT,
        upload_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // İndexler
    await sql`CREATE INDEX IF NOT EXISTS idx_guests_upload_date ON guests(upload_date DESC)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_guest_id ON photos(guest_id)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_photos_upload_date ON photos(upload_date DESC)`;

    console.log('✅ Vercel Postgres tabloları başarıyla oluşturuldu');

    return res.status(200).json({
      success: true,
      message: 'Veritabanı tabloları başarıyla oluşturuldu! 🎉',
      tables: ['guests', 'photos'],
      indexes: [
        'idx_guests_upload_date',
        'idx_photos_guest_id',
        'idx_photos_upload_date',
      ],
    });
  } catch (error: any) {
    console.error('❌ Veritabanı oluşturma hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Veritabanı oluşturulurken bir hata oluştu.',
      error: error.message,
    });
  }
}
