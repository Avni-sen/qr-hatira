import { VercelRequest, VercelResponse } from '@vercel/node';
import busboy from 'busboy';

interface UploadedFile {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
  size: number;
}

// CORS middleware
function setCORS(res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// Multipart form data parser
function parseMultipartData(req: VercelRequest): Promise<UploadedFile[]> {
  return new Promise((resolve, reject) => {
    const bb = busboy({ headers: req.headers });
    const files: UploadedFile[] = [];

    bb.on('file', (fieldname: string, file: any, info: any) => {
      const { filename, mimeType } = info;
      const chunks: Buffer[] = [];

      file.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      file.on('end', () => {
        const buffer = Buffer.concat(chunks);
        files.push({
          buffer,
          fileName: filename || `file_${Date.now()}`,
          mimeType: mimeType || 'application/octet-stream',
          size: buffer.length,
        });
      });
    });

    bb.on('finish', () => {
      resolve(files);
    });

    bb.on('error', (error: any) => {
      reject(error);
    });

    req.pipe(bb);
  });
}

// Google Drive'a dosya yükleme
async function uploadToGoogleDrive(file: UploadedFile, accessToken: string) {
  try {
    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=media',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': file.mimeType,
        },
        body: file.buffer,
      }
    );

    if (!response.ok) {
      throw new Error(`Google Drive upload failed: ${response.statusText}`);
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Google Drive upload error:', error);
    throw error;
  }
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
    console.log('📤 Google Drive direct upload isteği alındı');

    // Environment variables kontrolü
    const accessToken = process.env['GOOGLE_ACCESS_TOKEN'];
    if (!accessToken) {
      throw new Error('Google Access Token bulunamadı');
    }

    console.log('🔧 Access token bulundu, dosyalar parse ediliyor...');

    // Dosyaları parse et
    const files = await parseMultipartData(req);

    if (files.length === 0) {
      throw new Error('Yüklenecek dosya bulunamadı');
    }

    console.log(
      `📁 ${files.length} dosya bulundu, Google Drive'a yükleniyor...`
    );

    // Her dosyayı Google Drive'a yükle
    const uploadResults = [];
    for (const file of files) {
      console.log(`⬆️ Yükleniyor: ${file.fileName} (${file.size} bytes)`);

      const result = await uploadToGoogleDrive(file, accessToken);
      uploadResults.push({
        id: result.id,
        name: result.name || file.fileName,
        size: file.size,
        mimeType: file.mimeType,
        webViewLink: result.webViewLink,
        webContentLink: result.webContentLink,
      });
    }

    console.log(
      `✅ ${uploadResults.length} dosya başarıyla Google Drive'a yüklendi`
    );

    // Başarılı yanıt
    return res.status(200).json({
      success: true,
      message: `${files.length} dosya başarıyla Google Drive'a yüklendi! 🎉`,
      data: {
        uploadDate: new Date().toISOString(),
        uploadedFiles: uploadResults,
        totalFiles: uploadResults.length,
      },
    });
  } catch (error: any) {
    console.error('❌ Drive upload hatası:', error);

    let errorMessage = 'Dosya yükleme sırasında bir hata oluştu.';

    if (error.message.includes('Access Token')) {
      errorMessage =
        'Google Drive bağlantısı kurulamadı. Lütfen sistem yöneticisine başvurun.';
    } else if (error.message.includes('Google Drive upload failed')) {
      errorMessage = "Google Drive'a yükleme başarısız. Lütfen tekrar deneyin.";
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
