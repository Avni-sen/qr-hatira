import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TokenInfo {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
}

@Injectable({
  providedIn: 'root',
})
export class TokenManagerService {
  private tokenSubject = new BehaviorSubject<TokenInfo | null>(null);
  public token$ = this.tokenSubject.asObservable();

  constructor(private http: HttpClient) {
    this.initializeToken();
  }

  private async initializeToken(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; accessToken: string }>(
          'https://wedding-photo-share.vercel.app/api/get-token'
        )
      );

      if (response?.success && response.accessToken) {
        const expiresAt = Date.now() + 60 * 60 * 1000; // 1 saat
        this.tokenSubject.next({
          accessToken: response.accessToken,
          expiresAt: expiresAt,
          tokenType: 'Bearer',
        });
      }
    } catch (error) {
      console.error('Token initialization error:', error);
    }
  }

  async getValidToken(): Promise<string> {
    const currentToken = this.tokenSubject.value;

    if (!currentToken || this.isTokenExpiringSoon(currentToken)) {
      await this.refreshToken();
    }

    const token = this.tokenSubject.value;
    if (!token) {
      throw new Error('Token alınamadı');
    }

    return token.accessToken;
  }

  private isTokenExpiringSoon(token: TokenInfo): boolean {
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes >= token.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post<{
          success: boolean;
          accessToken: string;
          expiresIn: number;
          tokenType: string;
        }>('https://wedding-photo-share.vercel.app/api/refresh-token', {})
      );

      if (response?.success && response.accessToken) {
        const expiresAt = Date.now() + response.expiresIn * 1000;
        this.tokenSubject.next({
          accessToken: response.accessToken,
          expiresAt: expiresAt,
          tokenType: response.tokenType,
        });
      } else {
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }

  getTokenStatus(): { isValid: boolean; expiresIn: number } {
    const token = this.tokenSubject.value;
    if (!token) {
      return { isValid: false, expiresIn: 0 };
    }

    const expiresIn = Math.max(0, token.expiresAt - Date.now());
    return {
      isValid: expiresIn > 0,
      expiresIn: Math.floor(expiresIn / 1000),
    };
  }
}
