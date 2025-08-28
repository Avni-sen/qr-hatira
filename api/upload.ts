import { VercelRequest, VercelResponse } from '@vercel/node';
import { sql } from '@vercel/postgres';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';

// Vercel serverless function için upload handler
const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/heic',
      'image/heif',
      'video/mp4',
      'video/mpeg',
      'video/quicktime',
      'video/x-msvideo',
      'video/webm',
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          `Desteklenmeyen dosya türü: ${file.mimetype}. Sadece resim ve video dosyaları yükleyebilirsiniz.`
        )
      );
    }
  },
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 20,
  },
});

function runMiddleware(req: any, res: any, fn: any) {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}

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

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Sadece POST method desteklenir.',
    });
  }

  try {
    // Multer middleware'ini çalıştır
    await runMiddleware(req, res, upload.array('files', 20));

    const { firstName, lastName, qrCode } = req.body;
    const files = (req as any).files || [];

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'İsim ve soyisim gereklidir.',
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir dosya yüklemelisiniz.',
      });
    }

    // Guest'i Postgres'e kaydet
    const guestResult = await sql`
      INSERT INTO guests (first_name, last_name, qr_code, file_count)
      VALUES (${firstName}, ${lastName}, ${qrCode || null}, ${files.length})
      RETURNING id, first_name, last_name, upload_date
    `;

    const guest = guestResult.rows[0];
    const guestId = guest.id;

    console.log(
      `📤 ${firstName} ${lastName} - ${files.length} dosya Postgres'e kaydediliyor...`
    );

    // Her dosyayı Postgres'e kaydet
    const uploadedFiles = [];
    for (const file of files) {
      const fileName = `${Date.now()}-${uuidv4()}-${file.originalname}`;

      // TODO: Fotoğrafları cloud storage'a yükle (Vercel Blob, Cloudinary, vb.)
      // Şimdilik dosya bilgilerini kaydediyoruz
      const fileResult = await sql`
        INSERT INTO photos (guest_id, original_name, file_name, file_size, mime_type, file_url)
        VALUES (${guestId}, ${file.originalname}, ${fileName}, ${file.size}, ${
        file.mimetype
      }, ${`/temp/${fileName}`})
        RETURNING id, original_name, file_name, file_size, mime_type, upload_date
      `;

      const savedFile = fileResult.rows[0];
      uploadedFiles.push({
        id: savedFile.id,
        originalName: savedFile.original_name,
        fileName: savedFile.file_name,
        fileSize: savedFile.file_size,
        mimeType: savedFile.mime_type,
        uploadDate: savedFile.upload_date,
      });

      console.log(
        `📁 Dosya Postgres'e kaydedildi: ${file.originalname} -> ${fileName}`
      );
    }

    return res.status(200).json({
      success: true,
      message: `${files.length} dosya başarıyla yüklendi! Teşekkür ederiz ${firstName} ${lastName}! 💕`,
      data: {
        guestId,
        guest: {
          id: guestId,
          firstName,
          lastName,
          fileCount: files.length,
          uploadDate: guest.upload_date,
        },
        uploadedFiles,
      },
    });
  } catch (error: any) {
    console.error('❌ Vercel upload hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Dosyalar yüklenirken bir hata oluştu.',
      error: error.message,
    });
  }
}
