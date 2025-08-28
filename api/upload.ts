import { VercelRequest, VercelResponse } from '@vercel/node';
import multer from 'multer';
import { createGoogleDriveService } from './lib/google-drive';

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

    console.log(
      `📤 ${firstName} ${lastName} - ${files.length} dosya Google Drive'a yükleniyor...`
    );

    // Google Drive servisi başlat
    const driveService = createGoogleDriveService();

    // İsim-soyisim bazlı klasör oluştur veya bul
    const guestFolderId = await driveService.createOrFindGuestFolder(
      firstName,
      lastName
    );
    const folderLink = await driveService.getFolderLink(guestFolderId);

    // Dosyaları Google Drive'a yükle
    const driveFiles = files.map((file: any) => ({
      buffer: file.buffer,
      originalname: file.originalname,
      mimetype: file.mimetype,
      size: file.size,
    }));

    const uploadedFiles = await driveService.uploadFiles(
      driveFiles,
      guestFolderId
    );

    console.log(`✅ ${uploadedFiles.length} dosya başarıyla Google Drive'a yüklendi!`);

    return res.status(200).json({
      success: true,
      message: `${files.length} dosya başarıyla Google Drive'a yüklendi! Teşekkür ederiz ${firstName} ${lastName}! 💕`,
      data: {
        guest: {
          firstName,
          lastName,
          fileCount: files.length,
          uploadDate: new Date().toISOString(),
        },
        uploadedFiles: uploadedFiles.map(file => ({
          originalName: file.name.split('_').slice(1).join('_'),
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.mimeType,
          googleDriveLink: file.webViewLink,
        })),
        googleDriveFolder: {
          id: guestFolderId,
          link: folderLink,
        },
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
