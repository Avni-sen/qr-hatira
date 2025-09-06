import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import { TokenManagerService } from './token-manager.service';

export interface DriveUploadResponse {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  webViewLink?: string;
  webContentLink?: string;
}

@Injectable({
  providedIn: 'root',
})
export class GoogleDriveDirectService {
  private readonly DRIVE_UPLOAD_URL =
    'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
  private readonly PARENT_FOLDER_ID = environment.googleDriveParentFolderId;

  constructor(
    private readonly http: HttpClient,
    private readonly tokenManager: TokenManagerService
  ) {}

  // Token manager'dan geçerli access token al
  private async getAccessToken(): Promise<string> {
    try {
      return await this.tokenManager.getValidToken();
    } catch (error) {
      console.error('❌ Token alınamadı:', error);
      throw new Error('Token alınamadı, lütfen sayfayı yenileyin');
    }
  }

  // Kişiye özel klasör oluşturup dosya yükle
  async uploadFilesToPersonalFolder(
    files: File[],
    firstName: string,
    lastName: string
  ): Promise<DriveUploadResponse[]> {
    const accessToken = await this.getAccessToken();

    // 1. Kişiye özel klasör oluştur
    const folderName = `${firstName} ${lastName}`;
    const personalFolder = await this.createFolder(
      folderName,
      this.PARENT_FOLDER_ID,
      accessToken
    );

    console.log(`📁 ${folderName} klasörü oluşturuldu: ${personalFolder.id}`);

    // 2. Tüm dosyaları bu klasöre yükle
    const uploadResults: DriveUploadResponse[] = [];
    let successCount = 0;

    for (const file of files) {
      try {
        console.log(`📤 ${file.name} yükleniyor...`);
        const result = await this.uploadFileToFolder(
          file,
          personalFolder.id,
          accessToken
        );
        uploadResults.push(result);
        successCount++;
        console.log(`✅ ${file.name} yüklendi`);
      } catch (error) {
        console.error(`❌ Yükleme hatası: ${file.name}`, error);
        // Hata olsa bile devam et
      }
    }

    console.log(`🎉 ${successCount}/${files.length} dosya başarıyla yüklendi`);
    return uploadResults;
  }

  // Klasör oluşturma
  private async createFolder(
    folderName: string,
    parentFolderId: string,
    accessToken: string
  ): Promise<DriveUploadResponse> {
    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    });

    try {
      const response = await firstValueFrom(
        this.http.post<DriveUploadResponse>(
          'https://www.googleapis.com/drive/v3/files',
          metadata,
          { headers }
        )
      );

      if (!response) {
        throw new Error('Klasör oluşturma yanıtı alınamadı');
      }

      return response;
    } catch (error) {
      console.error('❌ Klasör oluşturma hatası:', error);
      throw error;
    }
  }

  // Belirli klasöre dosya yükleme
  private async uploadFileToFolder(
    file: File,
    folderId: string,
    accessToken: string
  ): Promise<DriveUploadResponse> {
    const formData = new FormData();

    const metadata = {
      name: file.name,
      parents: [folderId],
    };

    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    formData.append('file', file);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
    });

    try {
      const response = await firstValueFrom(
        this.http.post<DriveUploadResponse>(this.DRIVE_UPLOAD_URL, formData, {
          headers,
        })
      );

      if (!response) {
        throw new Error('Dosya yükleme yanıtı alınamadı');
      }

      return response;
    } catch (error) {
      console.error(`❌ Dosya yükleme hatası: ${file.name}`, error);
      throw error;
    }
  }
}
