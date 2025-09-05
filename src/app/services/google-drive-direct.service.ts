import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

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
  private readonly PARENT_FOLDER_ID = '13Z6EEbZKUBwfRnsoXJvrCQlweJL9phg0'; // Wedding photos folder

  constructor(private http: HttpClient) {}

  // Environment'dan access token al
  private getAccessToken(): string {
    return environment.googleAccessToken;
  }

  // Kişiye özel klasör oluşturup dosya yükle
  async uploadFilesToPersonalFolder(
    files: File[],
    firstName: string,
    lastName: string
  ): Promise<DriveUploadResponse[]> {
    const accessToken = this.getAccessToken();

    // 1. Kişiye özel klasör oluştur
    const folderName = `${firstName} ${lastName}`;
    const personalFolder = await this.createFolder(
      folderName,
      this.PARENT_FOLDER_ID,
      accessToken
    );

    // 2. Tüm dosyaları bu klasöre yükle
    const uploadResults: DriveUploadResponse[] = [];
    for (const file of files) {
      try {
        const result = await this.uploadFileToFolder(
          file,
          personalFolder.id,
          accessToken
        );
        uploadResults.push(result);
      } catch (error) {
        console.error(`❌ Yükleme hatası: ${file.name}`, error);
      }
    }

    return uploadResults;
  }

  // Doğrudan Google Drive API'sine dosya yükle (tek dosya)
  async uploadFileToDrive(
    file: File,
    fileName?: string
  ): Promise<Observable<DriveUploadResponse>> {
    const accessToken = this.getAccessToken();

    return this.uploadFileDirectly(file, this.PARENT_FOLDER_ID, accessToken);
  }

  // Klasör oluşturma
  async createFolder(
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

      return response!;
    } catch (error) {
      console.error('Klasör oluşturma hatası:', error);
      throw error;
    }
  }

  // Belirli klasöre dosya yükleme
  async uploadFileToFolder(
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

      return response!;
    } catch (error) {
      console.error('Dosya yükleme hatası:', error);
      throw error;
    }
  }

  // Doğrudan Google Drive API'sine yükleme (multipart upload)
  uploadFileDirectly(
    file: File,
    folderId: string,
    accessToken: string
  ): Observable<DriveUploadResponse> {
    // Multipart form data oluştur
    const formData = new FormData();

    // Metadata (JSON)
    const metadata = {
      name: file.name,
      parents: [this.PARENT_FOLDER_ID],
    };

    // Metadata'yı JSON blob olarak ekle
    formData.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' })
    );
    // Dosyayı ekle
    formData.append('file', file);

    const headers = new HttpHeaders({
      Authorization: `Bearer ${accessToken}`,
      // Content-Type'ı FormData otomatik set edecek, manuel ekleme
    });

    return this.http.post<DriveUploadResponse>(
      this.DRIVE_UPLOAD_URL,
      formData,
      {
        headers,
      }
    );
  }

  // Birden fazla dosya yükleme
  uploadMultipleFiles(
    files: File[],
    accessToken: string
  ): Observable<DriveUploadResponse[]> {
    const uploadPromises = files.map((file) =>
      firstValueFrom(
        this.uploadFileDirectly(file, this.PARENT_FOLDER_ID, accessToken)
      )
    );

    return new Observable((observer) => {
      Promise.all(uploadPromises)
        .then((results) => {
          observer.next(results as DriveUploadResponse[]);
          observer.complete();
        })
        .catch((error) => {
          observer.error(error);
        });
    });
  }
}
