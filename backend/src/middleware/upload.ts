import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Upload klasörünün var olduğundan emin ol
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage konfigürasyonu
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Benzersiz dosya adı oluştur: timestamp-random-originalname
    const timestamp = Date.now();
    const randomNum = Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');

    const filename = `${timestamp}-${randomNum}-${sanitizedName}${ext}`;
    cb(null, filename);
  },
});

// Dosya filtresi - sadece resim ve video dosyalarına izin ver
const fileFilter = (
  req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
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
};

// Multer konfigürasyonu
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max file size
    files: 20, // Maksimum 20 dosya aynı anda
  },
});

// Error handler middleware
export const handleMulterError = (
  error: any,
  req: Express.Request,
  res: Express.Response,
  next: Express.NextFunction
) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'Dosya boyutu çok büyük. Maksimum 50MB yükleyebilirsiniz.',
        error: error.message,
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        message: 'Çok fazla dosya. Maksimum 20 dosya yükleyebilirsiniz.',
        error: error.message,
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({
        success: false,
        message: 'Beklenmeyen dosya alanı.',
        error: error.message,
      });
    }
  }

  if (error.message.includes('Desteklenmeyen dosya türü')) {
    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  // Diğer hatalar
  return res.status(500).json({
    success: false,
    message: 'Dosya yüklenirken bir hata oluştu.',
    error: error.message,
  });
};
