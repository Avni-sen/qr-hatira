import { Injectable, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, firstValueFrom, interval, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';

export interface TokenInfo {
  accessToken: string;
  expiresAt: number;
  tokenType: string;
}

@Injectable({
  providedIn: 'root',
})
export class TokenManagerService implements OnDestroy {
  private readonly tokenSubject = new BehaviorSubject<TokenInfo | null>(null);
  public readonly token$ = this.tokenSubject.asObservable();
  private refreshTimer: Subscription | null = null;
  private readonly API_URL = environment.apiUrl;

  constructor(private readonly http: HttpClient) {
    // Async işlemi setTimeout ile constructor dışına taşı
    setTimeout(() => {
      this.initializeToken();
      this.setupAutoRefresh();
    }, 0);
  }

  private async initializeToken(): Promise<void> {
    try {
      console.log('🔄 Token başlatılıyor...');
      console.log('🌐 API URL:', this.API_URL);

      const response = await firstValueFrom(
        this.http.get<{
          success: boolean;
          accessToken: string;
          source?: string;
          error?: string;
        }>(`${this.API_URL}/get-token`, {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        })
      );

      console.log('📨 API Response:', {
        success: response?.success,
        hasToken: !!response?.accessToken,
        source: response?.source,
        error: response?.error,
      });

      if (response?.success && response.accessToken) {
        // Token süresini 55 dakika olarak ayarla (güvenli marj)
        const expiresAt = Date.now() + 55 * 60 * 1000;
        this.tokenSubject.next({
          accessToken: response.accessToken,
          expiresAt: expiresAt,
          tokenType: 'Bearer',
        });
        console.log(
          '✅ Token başarıyla yüklendi, kaynak:',
          response.source || 'bilinmiyor'
        );
      } else {
        console.error('❌ Token yüklenemedi:', response);
        throw new Error(
          `Token alınamadı: ${response?.error || 'Bilinmeyen hata'}`
        );
      }
    } catch (error: any) {
      console.error('❌ Token initialization error:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error,
      });

      // Network hatası mı kontrolü
      if (error.status === 0) {
        console.error('🌐 Network hatası - CORS veya bağlantı sorunu olabilir');
      } else if (error.status === 401) {
        console.error(
          '🔐 Authorization hatası - API credentials kontrol edilmeli'
        );
      } else if (error.status === 500) {
        console.error('🔧 Server hatası - Backend logları kontrol edilmeli');
      }

      // 10 saniye sonra tekrar dene
      setTimeout(() => this.initializeToken(), 10000);
    }
  }

  private setupAutoRefresh(): void {
    // Her 5 dakikada bir token durumunu kontrol et
    this.refreshTimer = interval(5 * 60 * 1000).subscribe(() => {
      this.checkAndRefreshToken();
    });

    // Sayfa yenilendiğinde de kontrol et
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => {
        this.checkAndRefreshToken();
      });
    }
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

    // Token yoksa veya süresi dolmuşsa yenile
    if (!currentToken || this.isTokenExpired(currentToken)) {
      console.log('🔄 Token geçersiz, yenileniyor...');
      await this.refreshToken();
    }
    // Token süresi dolmak üzereyse yenile
    else if (this.isTokenExpiringSoon(currentToken)) {
      console.log('🔄 Token süresi dolmak üzere, yenileniyor...');
      await this.refreshToken();
    }

    const token = this.tokenSubject.value;
    if (!token) {
      throw new Error('Token alınamadı');
    }

    return token.accessToken;
  }

  private isTokenExpired(token: TokenInfo): boolean {
    return Date.now() >= token.expiresAt;
  }

  private isTokenExpiringSoon(token: TokenInfo): boolean {
    // 5 dakika kala yenile
    const fiveMinutes = 5 * 60 * 1000;
    return Date.now() + fiveMinutes >= token.expiresAt;
  }

  private async refreshToken(): Promise<void> {
    try {
      console.log('🔄 Token yenileniyor...');
      console.log('🌐 Refresh API URL:', `${this.API_URL}/refresh-token`);

      const response = await firstValueFrom(
        this.http.post<{
          success: boolean;
          accessToken: string;
          expiresIn: number;
          tokenType: string;
          error?: string;
          details?: string;
          googleStatus?: number;
        }>(
          `${this.API_URL}/refresh-token`,
          {},
          {
            headers: {
              'Content-Type': 'application/json',
              Accept: 'application/json',
            },
          }
        )
      );

      console.log('📨 Refresh Response:', {
        success: response?.success,
        hasToken: !!response?.accessToken,
        expiresIn: response?.expiresIn,
        error: response?.error,
        googleStatus: response?.googleStatus,
      });

      if (response?.success && response.accessToken) {
        // expiresIn saniye cinsinden gelir, milisaniyeye çevir
        const expiresAt = Date.now() + (response.expiresIn - 300) * 1000; // 5 dakika güvenlik marjı
        this.tokenSubject.next({
          accessToken: response.accessToken,
          expiresAt: expiresAt,
          tokenType: response.tokenType || 'Bearer',
        });
        console.log(
          '✅ Token başarıyla yenilendi, süre:',
          response.expiresIn,
          'saniye'
        );
      } else {
        console.error('❌ Token refresh failed:', {
          success: response?.success,
          error: response?.error,
          details: response?.details,
          googleStatus: response?.googleStatus,
        });
        throw new Error(
          `Token refresh failed: ${response?.error || 'Bilinmeyen hata'}`
        );
      }
    } catch (error: any) {
      console.error('❌ Token refresh error:', {
        message: error.message,
        status: error.status,
        statusText: error.statusText,
        url: error.url,
        error: error,
      });

      // Hata türüne göre özel mesajlar
      if (error.status === 0) {
        console.error('🌐 Network hatası - API erişilemiyor');
      } else if (error.status === 401) {
        console.error(
          '🔐 Authorization hatası - Refresh token geçersiz olabilir'
        );
      } else if (error.status === 500) {
        console.error(
          '🔧 Server hatası - Google OAuth credentials kontrol edilmeli'
        );
      }

      // Token yenileme başarısız olursa yeni token almayı dene
      console.log('🔄 Refresh başarısız, yeni token almayı deniyorum...');
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
