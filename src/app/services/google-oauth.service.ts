import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GoogleAuthUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  accessToken: string;
}

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
export class GoogleOAuthService {
  private readonly CLIENT_ID =
    '174847816124-d5aukd19ghd6vmplapjiqiii3dlkjj08.apps.googleusercontent.com';
  private readonly REDIRECT_URI = window.location.origin;
  private readonly SCOPES = [
    'https://www.googleapis.com/auth/drive.file',
    'https://www.googleapis.com/auth/userinfo.profile',
    'https://www.googleapis.com/auth/userinfo.email',
  ].join(' ');

  private currentUser = new BehaviorSubject<GoogleAuthUser | null>(null);
  public currentUser$ = this.currentUser.asObservable();

  constructor(private http: HttpClient) {
    this.loadGoogleAPI();
  }

  private loadGoogleAPI(): void {
    // Google API'sini yükle
    if (typeof window !== 'undefined' && !window.gapi) {
      const script = document.createElement('script');
      script.src = 'https://apis.google.com/js/api.js';
      script.onload = () => {
        window.gapi.load('auth2', () => {
          window.gapi.auth2.init({
            client_id: this.CLIENT_ID,
          });
        });
      };
      document.head.appendChild(script);
    }
  }

  async signIn(): Promise<GoogleAuthUser> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.gapi) {
        reject(new Error('Google API not loaded'));
        return;
      }

      const authInstance = window.gapi.auth2.getAuthInstance();

      authInstance
        .signIn({
          scope: this.SCOPES,
        })
        .then((googleUser: any) => {
          const profile = googleUser.getBasicProfile();
          const authResponse = googleUser.getAuthResponse();

          const user: GoogleAuthUser = {
            id: profile.getId(),
            email: profile.getEmail(),
            name: profile.getName(),
            picture: profile.getImageUrl(),
            accessToken: authResponse.access_token,
          };

          this.currentUser.next(user);
          resolve(user);
        })
        .catch((error: any) => {
          console.error('Google Sign-In error:', error);
          reject(error);
        });
    });
  }

  signOut(): void {
    if (typeof window !== 'undefined' && window.gapi) {
      const authInstance = window.gapi.auth2.getAuthInstance();
      authInstance.signOut().then(() => {
        this.currentUser.next(null);
      });
    }
  }

  isSignedIn(): boolean {
    return this.currentUser.value !== null;
  }

  getCurrentUser(): GoogleAuthUser | null {
    return this.currentUser.value;
  }

  // Google Drive'a dosya yükleme
  async uploadFileToDrive(
    file: File,
    parentFolderId?: string
  ): Promise<DriveUploadResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Önce metadata ile dosyayı oluştur
    const metadata = {
      name: file.name,
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    });

    try {
      // Dosya metadata'sını oluştur
      const createResponse = await this.http
        .post<DriveUploadResponse>(
          'https://www.googleapis.com/drive/v3/files',
          metadata,
          { headers }
        )
        .toPromise();

      if (!createResponse?.id) {
        throw new Error('File creation failed');
      }

      // Dosya içeriğini yükle
      const uploadHeaders = new HttpHeaders({
        Authorization: `Bearer ${user.accessToken}`,
        'Content-Type': file.type || 'application/octet-stream',
      });

      const uploadResponse = await this.http
        .patch<DriveUploadResponse>(
          `https://www.googleapis.com/upload/drive/v3/files/${createResponse.id}?uploadType=media`,
          file,
          { headers: uploadHeaders }
        )
        .toPromise();

      return uploadResponse || createResponse;
    } catch (error) {
      console.error('Drive upload error:', error);
      throw error;
    }
  }

  // Klasör oluşturma
  async createFolder(
    name: string,
    parentFolderId?: string
  ): Promise<DriveUploadResponse> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const metadata = {
      name: name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined,
    };

    const headers = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
      'Content-Type': 'application/json',
    });

    try {
      const response = await this.http
        .post<DriveUploadResponse>(
          'https://www.googleapis.com/drive/v3/files',
          metadata,
          { headers }
        )
        .toPromise();

      return response!;
    } catch (error) {
      console.error('Folder creation error:', error);
      throw error;
    }
  }

  // Klasör arama
  async findFolder(
    name: string,
    parentFolderId?: string
  ): Promise<DriveUploadResponse | null> {
    const user = this.getCurrentUser();
    if (!user) {
      throw new Error('User not authenticated');
    }

    const query = `name='${name}' and mimeType='application/vnd.google-apps.folder'${
      parentFolderId ? ` and '${parentFolderId}' in parents` : ''
    } and trashed=false`;

    const headers = new HttpHeaders({
      Authorization: `Bearer ${user.accessToken}`,
    });

    try {
      const response = await this.http
        .get<{ files: DriveUploadResponse[] }>(
          `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
            query
          )}`,
          { headers }
        )
        .toPromise();

      return response?.files?.[0] || null;
    } catch (error) {
      console.error('Folder search error:', error);
      return null;
    }
  }

  // Klasör oluştur veya bul
  async createOrFindFolder(
    name: string,
    parentFolderId?: string
  ): Promise<DriveUploadResponse> {
    const existingFolder = await this.findFolder(name, parentFolderId);
    if (existingFolder) {
      return existingFolder;
    }
    return this.createFolder(name, parentFolderId);
  }
}

// Global gapi type declaration
declare global {
  interface Window {
    gapi: any;
  }
}
