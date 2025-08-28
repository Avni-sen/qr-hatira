import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {
  PhotoUploadComponent,
  GuestInfo,
} from './components/photo-upload/photo-upload.component';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, PhotoUploadComponent, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  title = 'wedding-photo-share';

  // Uygulama durumu
  showWelcome = true; // QR kod dışarıdan okunduğu için doğrudan hoş geldin göster
  showPhotoUpload = false;
  showSuccess = false;

  // QR kod artık dışarıdan okunuyor
  qrCodeData = '';

  startUpload() {
    this.showWelcome = false;
    this.showPhotoUpload = true;
  }

  onFilesUploaded(guestInfo: GuestInfo) {
    console.log('Dosyalar yüklendi:', guestInfo);

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

    console.log('Yükleme bilgileri kaydedildi:', uploadInfo);
  }

  resetApp() {
    this.showWelcome = true;
    this.showPhotoUpload = false;
    this.showSuccess = false;
    this.qrCodeData = '';
  }
}
