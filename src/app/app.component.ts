import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PhotoUploadComponent,
  GuestInfo,
} from './components/photo-upload/photo-upload.component';
import { CommonModule } from '@angular/common';
import { TokenManagerService } from './services/token-manager.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PhotoUploadComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'wedding-photo-share';
  tokenStatus = { isValid: false, expiresIn: 0 };
  Math = Math;
  showWelcome = true;
  showPhotoUpload = false;
  showSuccess = false;
  qrCodeData = '';

  private tokenSubscription?: Subscription;
  private statusUpdateInterval?: ReturnType<typeof setInterval>;

  constructor(private readonly tokenManager: TokenManagerService) {}

  ngOnInit() {
    // Token değişikliklerini dinle
    this.tokenSubscription = this.tokenManager.token$.subscribe(() => {
      this.updateTokenStatus();
    });

    // Her 30 saniyede bir token durumunu güncelle
    this.statusUpdateInterval = setInterval(() => {
      this.updateTokenStatus();
    }, 30000);

    // İlk güncelleme
    this.updateTokenStatus();
  }

  ngOnDestroy() {
    if (this.tokenSubscription) {
      this.tokenSubscription.unsubscribe();
    }
    if (this.statusUpdateInterval) {
      clearInterval(this.statusUpdateInterval);
    }
  }

  private updateTokenStatus() {
    this.tokenStatus = this.tokenManager.getTokenStatus();
  }

  startUpload() {
    this.showWelcome = false;
    this.showPhotoUpload = true;
  }

  onFilesUploaded(guestInfo: GuestInfo) {
    this.showPhotoUpload = false;
    this.showSuccess = true;
    this.saveUploadInfo(guestInfo);
  }

  private saveUploadInfo(guestInfo: GuestInfo) {
    const uploadInfo = {
      qrCode: this.qrCodeData,
      guest: {
        firstName: guestInfo.firstName,
        lastName: guestInfo.lastName,
      },
      fileCount: guestInfo.files.length,
      uploadDate: new Date().toISOString(),
      files: guestInfo.files.map((file) => ({
        name: file.name,
        size: file.size,
        type: file.type,
      })),
    };

    const existingUploads = JSON.parse(
      localStorage.getItem('weddingUploads') || '[]'
    );
    existingUploads.push(uploadInfo);
    localStorage.setItem('weddingUploads', JSON.stringify(existingUploads));
  }

  resetApp() {
    this.showWelcome = true;
    this.showPhotoUpload = false;
    this.showSuccess = false;
    this.qrCodeData = '';
  }

  async refreshToken() {
    try {
      await this.tokenManager.forceRefresh();
      console.log('✅ Token manuel olarak yenilendi');
    } catch (error) {
      console.error('❌ Token yenileme hatası:', error);
    }
  }

  // Token durumu için yardımcı method'lar
  getTokenExpiryMinutes(): number {
    return Math.floor(this.tokenStatus.expiresIn / 60);
  }

  getTokenExpirySeconds(): number {
    return this.tokenStatus.expiresIn % 60;
  }

  isTokenExpiringSoon(): boolean {
    return this.tokenStatus.expiresIn < 300; // 5 dakikadan az
  }
}
