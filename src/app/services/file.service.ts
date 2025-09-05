import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface FileUploadData {
  qrCode?: string;
  guest: {
    firstName: string;
    lastName: string;
  };
  fileCount: number;
  uploadDate: string;
  files: {
    name: string;
    size: number;
    type: string;
  }[];
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  uploadDate: string;
  guest: {
    firstName: string;
    lastName: string;
  };
  folder: {
    id: string;
    name: string;
    webViewLink: string;
  };
  uploadedFiles: {
    id: string;
    name: string;
    size: number;
    mimeType: string;
    webViewLink: string;
  }[];
  folderStats: {
    totalFiles: number;
    totalSize: number;
  };
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly STORAGE_KEY = 'weddingUploads';
  private readonly API_URL = this.getApiUrl();

  constructor(private http: HttpClient) {}

  private getApiUrl(): string {
    // Production'da Vercel API'sini kullan
    if (typeof window !== 'undefined') {
      const isLocalhost = window.location.hostname === 'localhost';
      return isLocalhost ? 'http://localhost:3000/api' : '/api';
    }
    return '/api';
  }

  // Google Drive'a dosya yükleme (gerçek versiyon)
  uploadFiles(
    firstName: string,
    lastName: string,
    files: File[],
    qrCode?: string
  ): Observable<ApiResponse<UploadResponse>> {
    // FormData oluştur - gerçek dosyalar ile
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);

    if (qrCode) {
      formData.append('qrCode', qrCode);
    }

    // Her dosyayı FormData'ya ekle
    files.forEach((file, index) => {
      formData.append('files', file, file.name);
    });

    // Multipart form data olarak gönder
    return this.http.post<ApiResponse<UploadResponse>>(
      `${this.API_URL}/upload`,
      formData
      // Content-Type header'ını manuel olarak set etme - browser otomatik ekleyecek
    );
  }

  // Health check
  checkBackendHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`);
  }

  // Local storage fallback methods
  saveUploadToStorage(uploadData: FileUploadData): void {
    try {
      const existingUploads = this.getUploadsFromStorage();
      existingUploads.push(uploadData);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingUploads));
    } catch (error) {
      console.error('❌ Error saving to local storage:', error);
    }
  }

  getUploadsFromStorage(): FileUploadData[] {
    try {
      const uploads = localStorage.getItem(this.STORAGE_KEY);
      return uploads ? JSON.parse(uploads) : [];
    } catch (error) {
      console.error('❌ Error reading from local storage:', error);
      return [];
    }
  }

  clearStorage(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  getStatsFromStorage(): { totalGuests: number; totalFiles: number } {
    const uploads = this.getUploadsFromStorage();
    return {
      totalGuests: uploads.length,
      totalFiles: uploads.reduce(
        (total, upload) => total + upload.fileCount,
        0
      ),
    };
  }

  // Dosya boyutunu formatla
  private formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
