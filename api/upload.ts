import { VercelRequest, VercelResponse } from '@vercel/node';
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

// Vercel KV veya başka bir cloud storage kullanmak gerekebilir
// Şimdilik memory'de saklayalım (demo için)
const guestUploads: any[] = [];

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

    // Process files (Vercel'de bu noktada files cloud storage'a kaydedilmeli)
    const uploadedFiles = files.map((file: any) => ({
      id: uuidv4(),
      originalName: file.originalname,
      fileName: `${Date.now()}-${file.originalname}`,
      fileSize: file.size,
      mimeType: file.mimetype,
      // buffer: file.buffer, // Cloud storage'da kullanılacak
    }));

    const guestData = {
      id: uuidv4(),
      firstName,
      lastName,
      uploadDate: new Date().toISOString(),
      fileCount: files.length,
      qrCode: qrCode || null,
      files: uploadedFiles,
    };

    // Memory'ye kaydet (demo için - production'da database kullanın)
    guestUploads.push(guestData);

    console.log(
      `📤 ${firstName} ${lastName} - ${files.length} dosya yüklendi (Vercel)`
    );

    return res.status(200).json({
      success: true,
      message: `${files.length} dosya başarıyla yüklendi! Teşekkür ederiz ${firstName} ${lastName}! 💕`,
      data: {
        guestId: guestData.id,
        guest: {
          firstName,
          lastName,
          fileCount: files.length,
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
