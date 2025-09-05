import { google } from 'googleapis';
import { environment } from '../../src/environments/environment';

export interface GoogleDriveConfig {
  clientEmail: string;
  privateKey: string;
  parentFolderId?: string;
}

export interface UploadedFileInfo {
  id: string;
  name: string;
  size: number;
  mimeType: string;
  webViewLink: string;
  webContentLink: string;
  createdTime: string;
}

export interface FolderInfo {
  id: string;
  name: string;
  webViewLink: string;
  createdTime: string;
}

export class GoogleDriveService {
  private drive: any;
  private parentFolderId?: string;

  constructor(config: GoogleDriveConfig) {
    // JWT authentication ile Google Drive API'sine bağlan
    const auth = new google.auth.JWT(
      config.clientEmail,
      undefined,
      config.privateKey.replace(/\\n/g, '\n'),
      ['https://www.googleapis.com/auth/drive.file']
    );

    this.drive = google.drive({ version: 'v3', auth });
    this.parentFolderId = config.parentFolderId;
  }

  /**
   * Misafir için klasör oluştur veya mevcut olanı bul
   */
  async createOrFindGuestFolder(
    firstName: string,
    lastName?: string
  ): Promise<FolderInfo> {
    const folderName = lastName
      ? `${firstName} ${lastName}`
      : firstName || `Misafir_${Date.now()}`;

    try {
      // Önce mevcut klasörü ara
      const existingFolder = await this.findFolder(folderName);
      if (existingFolder) {
        return existingFolder;
      }

      // Yoksa yeni klasör oluştur

      const folderMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: this.parentFolderId ? [this.parentFolderId] : undefined,
      };

      const response = await this.drive.files.create({
        requestBody: folderMetadata,
        fields: 'id, name, webViewLink, createdTime',
      });

      const folder = response.data;

      return {
        id: folder.id,
        name: folder.name,
        webViewLink: folder.webViewLink,
        createdTime: folder.createdTime,
      };
    } catch (error: any) {
      console.error('❌ Klasör oluşturma hatası:', error);
      throw new Error(`Klasör oluşturulamadı: ${error.message}`);
    }
  }

  /**
   * Klasör ara
   */
  private async findFolder(folderName: string): Promise<FolderInfo | null> {
    try {
      const query = this.parentFolderId
        ? `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and '${this.parentFolderId}' in parents and trashed=false`
        : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name, webViewLink, createdTime)',
      });

      const folders = response.data.files;
      if (folders && folders.length > 0) {
        return {
          id: folders[0].id,
          name: folders[0].name,
          webViewLink: folders[0].webViewLink,
          createdTime: folders[0].createdTime,
        };
      }

      return null;
    } catch (error: any) {
      console.error('❌ Klasör arama hatası:', error);
      return null;
    }
  }

  /**
   * Dosya yükle
   */
  async uploadFile(
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId: string
  ): Promise<UploadedFileInfo> {
    try {
      const fileMetadata = {
        name: fileName,
        parents: [folderId],
      };

      const media = {
        mimeType: mimeType,
        body: fileBuffer,
      };

      const response = await this.drive.files.create({
        requestBody: fileMetadata,
        media: media,
        fields:
          'id, name, size, mimeType, webViewLink, webContentLink, createdTime',
      });

      const file = response.data;

      return {
        id: file.id,
        name: file.name,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
      };
    } catch (error: any) {
      console.error(`❌ Dosya yükleme hatası (${fileName}):`, error);
      throw new Error(`Dosya yüklenemedi: ${error.message}`);
    }
  }

  /**
   * Birden fazla dosya yükle
   */
  async uploadMultipleFiles(
    files: { buffer: Buffer; fileName: string; mimeType: string }[],
    folderId: string
  ): Promise<UploadedFileInfo[]> {
    const uploadPromises = files.map((file) =>
      this.uploadFile(file.buffer, file.fileName, file.mimeType, folderId)
    );

    try {
      const results = await Promise.all(uploadPromises);
      return results;
    } catch (error: any) {
      console.error('❌ Toplu dosya yükleme hatası:', error);
      throw error;
    }
  }

  /**
   * Klasördeki dosyaları listele
   */
  async listFilesInFolder(folderId: string): Promise<UploadedFileInfo[]> {
    try {
      const response = await this.drive.files.list({
        q: `'${folderId}' in parents and trashed=false`,
        fields:
          'files(id, name, size, mimeType, webViewLink, webContentLink, createdTime)',
        orderBy: 'createdTime desc',
      });

      const files = response.data.files || [];
      return files.map((file: any) => ({
        id: file.id,
        name: file.name,
        size: parseInt(file.size || '0'),
        mimeType: file.mimeType,
        webViewLink: file.webViewLink,
        webContentLink: file.webContentLink,
        createdTime: file.createdTime,
      }));
    } catch (error: any) {
      console.error('❌ Dosya listeleme hatası:', error);
      throw new Error(`Dosyalar listelenemedi: ${error.message}`);
    }
  }

  /**
   * Dosya boyutunu formatla
   */
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Klasörün paylaşım linkini al
   */
  async getFolderShareLink(folderId: string): Promise<string> {
    try {
      const response = await this.drive.files.get({
        fileId: folderId,
        fields: 'webViewLink',
      });

      return response.data.webViewLink;
    } catch (error: any) {
      console.error('❌ Paylaşım linki alma hatası:', error);
      throw new Error(`Paylaşım linki alınamadı: ${error.message}`);
    }
  }

  /**
   * Klasör istatistiklerini al
   */
  async getFolderStats(
    folderId: string
  ): Promise<{ fileCount: number; totalSize: number }> {
    try {
      const files = await this.listFilesInFolder(folderId);
      const fileCount = files.length;
      const totalSize = files.reduce((sum, file) => sum + file.size, 0);

      return { fileCount, totalSize };
    } catch (error: any) {
      console.error('❌ Klasör istatistik hatası:', error);
      return { fileCount: 0, totalSize: 0 };
    }
  }
}

/**
 * Google Drive service instance oluştur
 */
export function createGoogleDriveService(): GoogleDriveService {
  const clientEmail = environment.googleDriveClientEmail;
  const privateKey = environment.googleDrivePrivateKey;
  const parentFolderId = environment.googleDriveParentFolderId;

  if (!clientEmail || !privateKey) {
    throw new Error(
      'Google Drive konfigürasyonu eksik. GOOGLE_DRIVE_CLIENT_EMAIL ve GOOGLE_DRIVE_PRIVATE_KEY environment variables gerekli.'
    );
  }

  return new GoogleDriveService({
    clientEmail,
    privateKey,
    parentFolderId,
  });
}
