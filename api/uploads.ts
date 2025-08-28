import { VercelRequest, VercelResponse } from '@vercel/node';

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
    // Database olmadığı için direkt Google Drive ana klasör linkini ver
    const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;
    const parentFolderLink = parentFolderId
      ? `https://drive.google.com/drive/folders/${parentFolderId}`
      : null;

    return res.status(200).json({
      success: true,
      message: 'Google Drive klasörü bilgileri getirildi.',
      data: {
        note: "Artık tüm yüklemeler Google Drive'da saklanmaktadır. Detaylı listeleme için Google Drive ana klasörünü ziyaret edin.",
        googleDriveMainFolder: {
          id: parentFolderId,
          link: parentFolderLink,
        },
        instruction:
          'Her misafir için ayrı klasör oluşturulmaktadır. Ana klasörden tüm misafir klasörlerini görebilirsiniz.',
      },
    });
  } catch (error: any) {
    console.error('❌ Uploads endpoint hatası:', error);
    return res.status(500).json({
      success: false,
      message: 'Google Drive bilgileri getirilirken bir hata oluştu.',
      error: error.message,
    });
  }
}
