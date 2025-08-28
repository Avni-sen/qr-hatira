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
  guestId: number;
  guest: {
    firstName: string;
    lastName: string;
    fileCount: number;
  };
  uploadedFiles: Array<{
    id: number;
    originalName: string;
    fileName: string;
    fileSize: number;
    mimeType: string;
  }>;
}

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private readonly STORAGE_KEY = 'weddingUploads';
  private readonly API_URL = this.getApiUrl();

  constructor(private http: HttpClient) {}

  private getApiUrl(): string {
    // Production'da relative path kullan, development'ta localhost
    if (typeof window !== 'undefined') {
      const isProduction = window.location.hostname !== 'localhost';
      return isProduction ? '/api' : 'http://localhost:3001/api';
    }
    return '/api';
  }

  // Backend'e dosya yükleme
  uploadFiles(
    firstName: string,
    lastName: string,
    files: File[],
    qrCode?: string
  ): Observable<ApiResponse<UploadResponse>> {
    const formData = new FormData();
    formData.append('firstName', firstName);
    formData.append('lastName', lastName);
    if (qrCode) {
      formData.append('qrCode', qrCode);
    }

    // Dosyaları form data'ya ekle
    files.forEach((file) => {
      formData.append('files', file);
    });

    return this.http.post<ApiResponse<UploadResponse>>(
      `${this.API_URL}/upload`,
      formData
    );
  }

  // Backend'den yüklemeleri getir
  getUploadsFromBackend(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/uploads`);
  }

  // Backend'den istatistikleri getir
  getStatsFromBackend(): Observable<ApiResponse<any>> {
    return this.http.get<ApiResponse<any>>(`${this.API_URL}/stats`);
  }

  // Health check
  checkBackendHealth(): Observable<any> {
    return this.http.get(`${this.API_URL}/health`);
  }

  // Yükleme verilerini localStorage'a kaydet (fallback)
  saveUploadData(data: FileUploadData): void {
    const existingUploads = this.getAllUploads();
    existingUploads.push(data);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(existingUploads));
  }

  // Tüm yüklemeleri getir
  getAllUploads(): FileUploadData[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }

  // İstatistikleri getir
  getUploadStats() {
    const uploads = this.getAllUploads();
    return {
      totalUploads: uploads.length,
      totalFiles: uploads.reduce((sum, upload) => sum + upload.fileCount, 0),
      totalGuests: uploads.filter(
        (upload) => upload.guest.firstName || upload.guest.lastName
      ).length,
      recentUploads: uploads.slice(-5).reverse(),
    };
  }

  // Verileri temizle
  clearAllData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Dosya boyutunu formatla
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Tarih formatla
  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
