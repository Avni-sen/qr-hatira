import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, timer } from 'rxjs';

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
  private refreshTimer: any = null;

  constructor(private http: HttpClient) {
    this.initializeToken();
    this.setupAutoRefresh();
  }

  private async initializeToken(): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; accessToken: string }>(
          'https://wedding-photo-share.vercel.app/api/get-token'
        )
      );

      if (response?.success && response.accessToken) {
        const expiresAt = Date.now() + 50 * 60 * 1000; // 50 dakika (güvenli)
        this.tokenSubject.next({
          accessToken: response.accessToken,
          expiresAt: expiresAt,
          tokenType: 'Bearer',
        });
        console.log('✅ Token başarıyla yüklendi');
      } else {
        console.error('❌ Token yüklenemedi:', response);
      }
    } catch (error) {
      console.error('❌ Token initialization error:', error);
    }
  }

  private setupAutoRefresh(): void {
    // Her 30 dakikada bir token'ı kontrol et ve gerekirse yenile
    this.refreshTimer = timer(0, 30 * 60 * 1000).subscribe(() => {
      this.checkAndRefreshToken();
    });
  }

  private async checkAndRefreshToken(): Promise<void> {
    const currentToken = this.tokenSubject.value;

    if (!currentToken) {
      console.log('🔄 Token yok, yeni token alınıyor...');
      await this.initializeToken();
      return;
    }

    if (this.isTokenExpiringSoon(currentToken)) {
      console.log('🔄 Token süresi dolmak üzere, yenileniyor...');
      await this.refreshToken();
    }
  }

  async getValidToken(): Promise<string> {
    const currentToken = this.tokenSubject.value;

    if (!currentToken || this.isTokenExpiringSoon(currentToken)) {
      console.log('🔄 Token geçersiz veya süresi dolmak üzere, yenileniyor...');
      await this.refreshToken();
    }

    const token = this.tokenSubject.value;
    if (!token) {
      throw new Error('Token alınamadı');
    }

    return token.accessToken;
  }

  private isTokenExpiringSoon(token: TokenInfo): boolean {
    const tenMinutes = 10 * 60 * 1000; // 10 dakika kala yenile
    return Date.now() + tenMinutes >= token.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    try {
      console.log('🔄 Token yenileniyor...');
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
        console.log('✅ Token başarıyla yenilendi');
      } else {
        console.error('❌ Token refresh failed:', response);
        throw new Error('Token refresh failed');
      }
    } catch (error) {
      console.error('❌ Token refresh error:', error);
      // Token yenileme başarısız olursa yeni token al
      await this.initializeToken();
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

  // Manuel token yenileme
  async forceRefresh(): Promise<void> {
    await this.refreshToken();
  }

  // Servis yok edilirken timer'ı temizle
  ngOnDestroy(): void {
    if (this.refreshTimer) {
      this.refreshTimer.unsubscribe();
    }
  }
}
