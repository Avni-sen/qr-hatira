import { VercelRequest, VercelResponse } from '@vercel/node';
import { createGoogleDriveService } from './lib/google-drive';

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
    const driveService = createGoogleDriveService();
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

    if (!parentFolderId) {
      return res.status(400).json({
        success: false,
        message: "Google Drive ana klasör ID'si ayarlanmamış.",
      });
    }

    const parentFolderLink = `https://drive.google.com/drive/folders/${parentFolderId}`;

    // Ana klasördeki misafir klasörlerini getir
    console.log('Ana klasördeki misafir klasörleri getiriliyor...');

    // Basit bir approach: ana klasördeki stats'ları al
    const folderStats = await driveService.getFolderStats(parentFolderId);

    return res.status(200).json({
      success: true,
      message: 'Google Drive yükleme bilgileri getirildi.',
      data: {
        googleDriveMainFolder: {
          id: parentFolderId,
          link: parentFolderLink,
        },
        stats: {
          totalFiles: folderStats.fileCount,
          totalSizeMB:
            Math.round((folderStats.totalSize / (1024 * 1024)) * 100) / 100,
          estimatedGuestFolders: Math.ceil(folderStats.fileCount / 5), // Ortalama 5 dosya per misafir
        },
        note: "Tüm fotoğraflar Google Drive'da misafir klasörlerinde saklanmaktadır.",
        instruction:
          'Ana klasöre giderek tüm misafir klasörlerini ve fotoğrafları görüntüleyebilirsiniz.',
      },
    });
  } catch (error: any) {
    console.error('❌ Google Drive uploads hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Google Drive yükleme bilgileri getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
}
