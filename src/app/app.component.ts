import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PhotoUploadComponent,
  GuestInfo,
} from './components/photo-upload/photo-upload.component';
import { CommonModule } from '@angular/common';
import { TokenManagerService } from './services/token-manager.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PhotoUploadComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'wedding-photo-share';

  // Token durumu
  tokenStatus = { isValid: false, expiresIn: 0 };

  // Math property for template
  Math = Math;

  // Uygulama durumu
  showWelcome = true; // QR kod dışarıdan okunduğu için doğrudan hoş geldin göster
  showPhotoUpload = false;
  showSuccess = false;

  // QR kod artık dışarıdan okunuyor
  qrCodeData = '';

  constructor(private tokenManager: TokenManagerService) {}

  ngOnInit() {
    // Token durumunu takip et
    this.tokenManager.token$.subscribe(() => {
      this.tokenStatus = this.tokenManager.getTokenStatus();
    });

    // Her 30 saniyede bir token durumunu kontrol et
    setInterval(() => {
      this.tokenStatus = this.tokenManager.getTokenStatus();
    }, 30000);
  }

  startUpload() {
    this.showWelcome = false;
    this.showPhotoUpload = true;
  }

  onFilesUploaded(guestInfo: GuestInfo) {
    // Başarı ekranına geç
    this.showPhotoUpload = false;
    this.showSuccess = true;

    // Yüklenen dosya bilgilerini localStorage'a kaydet
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

    // Mevcut yüklemeleri al
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
}
