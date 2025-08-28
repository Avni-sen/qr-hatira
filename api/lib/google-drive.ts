import { google } from 'googleapis';

export interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  parentFolderId?: string; // Ana wedding klasörü ID'si
}

export interface UploadedFile {
  id: string;
  name: string;
  webViewLink: string;
  webContentLink: string;
  size: string;
  mimeType: string;
}

export class GoogleDriveService {
  private drive: any;
  private parentFolderId: string;

  constructor(config: GoogleDriveConfig) {
    // JWT auth ile Google Drive API'sine bağlan
    const auth = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive.file']
    );

    this.drive = google.drive({ version: 'v3', auth });
    this.parentFolderId = config.parentFolderId || '';
  }

  /**
   * İsim-soyisim bazlı klasör oluştur veya bul
   */
  async createOrFindGuestFolder(
    firstName: string,
    lastName: string
  ): Promise<string> {
    // Klasör adını oluştur
    const folderName = this.generateFolderName(firstName, lastName);

    try {
      // Önce böyle bir klasör var mı kontrol et
      const existingFolder = await this.findFolder(folderName);
      if (existingFolder) {
        console.log(`📁 Mevcut klasör bulundu: ${folderName}`);
        return existingFolder.id;
      }

      // Yoksa yeni klasör oluştur
      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: this.parentFolderId ? [this.parentFolderId] : undefined,
      };

      const folder = await this.drive.files.create({
        resource: folderMetadata,
        fields: 'id',
      });

      console.log(
        `📁 Yeni klasör oluşturuldu: ${folderName} (ID: ${folder.data.id})`
      );
      return folder.data.id;
    } catch (error) {
      console.error('❌ Klasör oluşturma hatası:', error);
      throw new Error(`Klasör oluşturulamadı: ${error}`);
    }
  }

  /**
   * Klasör adı oluştur
   */
  private generateFolderName(firstName: string, lastName: string): string {
    // İsim ve soyisim varsa kullan
    if (firstName && lastName) {
      return `${firstName} ${lastName}`;
    } else if (firstName) {
      return firstName;
    } else if (lastName) {
      return lastName;
    } else {
      // İsim yoksa rastgele kod oluştur
      const randomCode = Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();
      return `Misafir_${randomCode}`;
    }
  }

  /**
   * Klasör ara
   */
  private async findFolder(folderName: string): Promise<any> {
    try {
      const query = `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      const parentQuery = this.parentFolderId
        ? ` and '${this.parentFolderId}' in parents`
        : '';

      const response = await this.drive.files.list({
        q: query + parentQuery,
        fields: 'files(id, name)',
      });

      return response.data.files && response.data.files.length > 0
        ? response.data.files[0]
        : null;
    } catch (error) {
      console.error('❌ Klasör arama hatası:', error);
      return null;
    }
  }

  /**
   * Dosyaları Google Drive'a yükle
   */
  async uploadFiles(
    files: Array<{
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
    }>,
    folderId: string
  ): Promise<UploadedFile[]> {
    const uploadedFiles: UploadedFile[] = [];

    for (const file of files) {
      try {
        const fileName = `${Date.now()}_${file.originalname}`;

        const fileMetadata = {
          name: fileName,
          parents: [folderId],
        };

        const media = {
          mimeType: file.mimetype,
          body: Buffer.from(file.buffer),
        };

        const uploadedFile = await this.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: 'id, name, size, mimeType, webViewLink, webContentLink',
        });

        // Dosyayı herkese açık yap (isteğe bağlı)
        await this.drive.permissions.create({
          fileId: uploadedFile.data.id,
          resource: {
            role: 'reader',
            type: 'anyone',
          },
        });

        uploadedFiles.push({
          id: uploadedFile.data.id,
          name: uploadedFile.data.name,
          webViewLink: uploadedFile.data.webViewLink,
          webContentLink: uploadedFile.data.webContentLink,
          size: uploadedFile.data.size,
          mimeType: uploadedFile.data.mimeType,
        });

        console.log(`📤 Dosya yüklendi: ${file.originalname} -> ${fileName}`);
      } catch (error) {
        console.error(`❌ Dosya yükleme hatası (${file.originalname}):`, error);
        throw new Error(`Dosya yüklenemedi: ${file.originalname}`);
      }
    }

    return uploadedFiles;
  }

  /**
   * Klasör linkini al
   */
  async getFolderLink(folderId: string): Promise<string> {
    try {
      const folder = await this.drive.files.get({
        fileId: folderId,
        fields: 'webViewLink',
      });
      return folder.data.webViewLink;
    } catch (error) {
      console.error('❌ Klasör link alma hatası:', error);
      return '';
    }
  }

  /**
   * Klasör istatistiklerini al
   */
  async getFolderStats(
    folderId: string
  ): Promise<{ fileCount: number; totalSize: number }> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields: 'files(size)',
      });

      const files = response.data.files || [];
      const fileCount = files.length;
      const totalSize = files.reduce((sum: number, file: any) => {
        return sum + (parseInt(file.size) || 0);
      }, 0);

      return { fileCount, totalSize };
    } catch (error) {
      console.error('❌ Klasör istatistik hatası:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }
}

/**
 * Environment variables'dan Google Drive servisini başlat
 */
export function createGoogleDriveService(): GoogleDriveService {
  const clientEmail = process.env.GOOGLE_DRIVE_CLIENT_EMAIL;
  const privateKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;
  const parentFolderId = process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID;

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Google Drive credentials bulunamadı. Environment variables kontrol edin.'
    );
  }

  return new GoogleDriveService({
    clientEmail,
    privateKey,
    parentFolderId,
  });
}
