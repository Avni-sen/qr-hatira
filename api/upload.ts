import { VercelRequest, VercelResponse } from '@vercel/node';
import { createGoogleDriveService } from './lib/google-drive';
import busboy from 'busboy';

interface UploadedFile {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
}

interface FormData {
  firstName: string;
  lastName: string;
  files: UploadedFile[];
}

// CORS middleware
function setCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

// Multipart form data parser
function parseMultipartData(req: VercelRequest): Promise<FormData> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const formData: FormData = {
      firstName: '',
      lastName: '',
      files: [],
    };

    bb.on('field', (fieldname: string, value: string) => {
      if (fieldname === 'firstName') formData.firstName = value;
      if (fieldname === 'lastName') formData.lastName = value;
    });

    bb.on('file', (fieldname: string, file: any, info: any) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        formData.files.push({
          buffer,
          fileName: filename || `file_${Date.now()}`,
          mimeType: mimeType || 'application/octet-stream',
          size: buffer.length,
        });
      });
    });

    bb.on('finish', () => {
      resolve(formData);
    });

    bb.on('error', (error: any) => {
      reject(error);
    });

    req.pipe(bb);
  });
}

// JSON format için basit parser
function parseJsonData(req: VercelRequest): FormData {
  const body = req.body;
  return {
    firstName: body.firstName || '',
    lastName: body.lastName || '',
    files: [], // JSON formatında dosya gönderilmez, sadece metadata
  };
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(res);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      message: 'Sadece POST metoduna izin verilir',
    });
  }

  try {
    console.log('📤 Google Drive upload isteği alındı');
    console.log('Content-Type:', req.headers['content-type']);

    // Google Drive service'i oluştur
    const driveService = createGoogleDriveService();

    let formData: FormData;

    // Content-Type'a göre veri parse et
    if (req.headers['content-type']?.includes('multipart/form-data')) {
      console.log('📁 Multipart form data parsing...');
      formData = await parseMultipartData(req);
    } else if (req.headers['content-type']?.includes('application/json')) {
      console.log('📄 JSON data parsing...');
      formData = parseJsonData(req);
    } else {
      throw new Error(
        'Desteklenmeyen Content-Type. multipart/form-data veya application/json kullanın.'
      );
    }

    console.log(`👤 Misafir: ${formData.firstName} ${formData.lastName}`);
    console.log(`📁 Dosya sayısı: ${formData.files.length}`);

    // Misafir klasörü oluştur veya bul
    const guestFolder = await driveService.createOrFindGuestFolder(
      formData.firstName,
      formData.lastName
    );

    let uploadResults: any[] = [];

    // Eğer dosyalar varsa Google Drive'a yükle
    if (formData.files.length > 0) {
      console.log("📤 Dosyalar Google Drive'a yükleniyor...");

      const filesToUpload = formData.files.map((file) => ({
        buffer: file.buffer,
        fileName: file.fileName,
        mimeType: file.mimeType,
      }));

      uploadResults = await driveService.uploadMultipleFiles(
        filesToUpload,
        guestFolder.id
      );

      console.log(`✅ ${uploadResults.length} dosya başarıyla yüklendi`);
    }

    // Klasör istatistiklerini al
    const folderStats = await driveService.getFolderStats(guestFolder.id);

    // Başarılı yanıt
    const response = {
      success: true,
      message: `${
        formData.files.length > 0
          ? formData.files.length + ' dosya'
          : 'Bilgiler'
      } başarıyla Google Drive'a yüklendi! 💕`,
      data: {
        uploadDate: new Date().toISOString(),
        guest: {
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
        folder: {
          id: guestFolder.id,
          name: guestFolder.name,
          webViewLink: guestFolder.webViewLink,
        },
        uploadedFiles: uploadResults,
        folderStats: {
          totalFiles: folderStats.fileCount,
          totalSize: folderStats.totalSize,
        },
      },
    };

    console.log('✅ Upload işlemi tamamlandı');
    return res.status(200).json(response);
  } catch (error: any) {
    console.error('❌ Upload hatası:', error);

    // Hata tipine göre farklı mesajlar
    let errorMessage = 'Dosya yükleme sırasında bir hata oluştu.';

    if (error.message.includes('Google Drive konfigürasyonu')) {
      errorMessage =
        'Google Drive bağlantısı kurulamadı. Lütfen sistem yöneticisine başvurun.';
    } else if (error.message.includes('Klasör oluşturulamadı')) {
      errorMessage = 'Klasör oluşturulamadı. Lütfen tekrar deneyin.';
    } else if (error.message.includes('Dosya yüklenemedi')) {
      errorMessage =
        'Dosyalar yüklenemedi. Dosya boyutunu kontrol edip tekrar deneyin.';
    }

    return res.status(500).json({
      success: false,
      message: errorMessage,
      error:
        process.env['NODE_ENV'] === 'development' ? error.message : undefined,
    });
  }
}

// Vercel runtime için config
export const config = {
  api: {
    bodyParser: false, // busboy kullanacağımız için disable et
  },
};
