import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  GoogleOAuthService,
  GoogleAuthUser,
} from '../../services/google-oauth.service';

@Component({
  selector: 'app-google-auth',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="google-auth-container">
      <div *ngIf="!isSignedIn" class="auth-section">
        <div class="auth-card">
          <div class="auth-header">
            <h3 class="text-xl font-semibold text-gray-800 mb-2">
              Google Drive'a Giriş Yapın
            </h3>
            <p class="text-gray-600 text-sm mb-4">
              Fotoğraflarınızı Google Drive'a yüklemek için giriş yapmanız
              gerekiyor.
            </p>
          </div>

          <button
            (click)="signIn()"
            [disabled]="isLoading"
            class="google-signin-btn"
          >
            <div class="flex items-center justify-center space-x-2">
              <svg class="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>{{
                isLoading ? 'Giriş yapılıyor...' : 'Google ile Giriş Yap'
              }}</span>
            </div>
          </button>
        </div>
      </div>

      <div *ngIf="isSignedIn && currentUser" class="user-info">
        <div class="user-card">
          <div class="flex items-center space-x-3 mb-3">
            <img
              *ngIf="currentUser.picture"
              [src]="currentUser.picture"
              [alt]="currentUser.name"
              class="w-10 h-10 rounded-full"
            />
            <div>
              <h4 class="font-medium text-gray-800">{{ currentUser.name }}</h4>
              <p class="text-sm text-gray-600">{{ currentUser.email }}</p>
            </div>
          </div>

          <div class="flex justify-between items-center">
            <div class="text-sm text-green-600 font-medium">
              ✅ Google Drive'a bağlandı
            </div>
            <button
              (click)="signOut()"
              class="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Çıkış Yap
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="errorMessage" class="error-message">
        <div class="bg-red-50 border border-red-200 rounded-lg p-3">
          <p class="text-red-600 text-sm">{{ errorMessage }}</p>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .google-auth-container {
        margin-bottom: 1.5rem;
      }

      .auth-card,
      .user-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .google-signin-btn {
        width: 100%;
        background: white;
        border: 2px solid #dadce0;
        border-radius: 8px;
        padding: 12px 16px;
        font-weight: 500;
        color: #3c4043;
        transition: all 0.2s ease;
        cursor: pointer;
      }

      .google-signin-btn:hover:not(:disabled) {
        border-color: #4285f4;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      .google-signin-btn:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .error-message {
        margin-top: 1rem;
      }
    `,
  ],
})
export class GoogleAuthComponent implements OnInit {
  @Output() authStateChanged = new EventEmitter<GoogleAuthUser | null>();

  isSignedIn = false;
  currentUser: GoogleAuthUser | null = null;
  isLoading = false;
  errorMessage = '';

  constructor(private googleAuth: GoogleOAuthService) {}

  ngOnInit() {
    this.googleAuth.currentUser$.subscribe((user) => {
      this.currentUser = user;
      this.isSignedIn = !!user;
      this.authStateChanged.emit(user);
    });
  }

  async signIn() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      await this.googleAuth.signIn();
    } catch (error: any) {
      this.errorMessage = error.message || 'Giriş yapılırken bir hata oluştu.';
      console.error('Sign-in error:', error);
    } finally {
      this.isLoading = false;
    }
  }

  signOut() {
    this.googleAuth.signOut();
  }
}
