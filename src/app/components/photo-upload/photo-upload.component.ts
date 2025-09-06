import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GoogleDriveDirectService } from '../../services/google-drive-direct.service';

export interface UploadedFile {
  file: File;
  preview: string;
  name: string;
  size: number;
  type: string;
}

export interface GuestInfo {
  firstName: string;
  lastName: string;
  files: UploadedFile[];
}

@Component({
  selector: 'app-photo-upload',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './photo-upload.component.html',
  styleUrls: ['./photo-upload.component.scss'],
})
export class PhotoUploadComponent {
  @Output() filesUploaded = new EventEmitter<GuestInfo>();

  public guestInfo: GuestInfo = {
    firstName: '',
    lastName: '',
    files: [],
  };

  public isDragOver = false;
  public uploadProgress = 0;
  public isUploading = false;
  public errorMessage = '';
  public successMessage = '';
  public uploadedFileCount = 0;

  constructor(private readonly driveService: GoogleDriveDirectService) {}

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.processFiles(Array.from(input.files));
    }
  }

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onFileDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;

    if (event.dataTransfer?.files) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  private processFiles(files: File[]) {
    this.errorMessage = '';

    const validFiles = files.filter((file) => this.isValidFile(file));

    if (validFiles.length !== files.length) {
      this.errorMessage =
        'Bazı dosyalar desteklenmiyor. Sadece fotoğraf ve video dosyalarını yükleyebilirsiniz.';
    }

    validFiles.forEach((file) => {
      const uploadedFile: UploadedFile = {
        file,
        preview: '',
        name: file.name,
        size: file.size,
        type: file.type,
      };

      if (file.type.startsWith('image/')) {
        this.createImagePreview(file, uploadedFile);
      } else {
        uploadedFile.preview = '🎥'; // Video icon
      }

      this.guestInfo.files.push(uploadedFile);
    });
  }

  private isValidFile(file: File): boolean {
    const validTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/avi',
      'video/mov',
      'video/wmv',
      'video/webm',
    ];
    const maxSize = 50 * 1024 * 1024; // 50MB

    return validTypes.includes(file.type) && file.size <= maxSize;
  }

  private createImagePreview(file: File, uploadedFile: UploadedFile) {
    const reader = new FileReader();
    reader.onload = (e) => {
      uploadedFile.preview = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  removeFile(index: number) {
    this.guestInfo.files.splice(index, 1);
  }

  async uploadFiles() {
    if (this.guestInfo.files.length === 0) {
      this.errorMessage = 'Lütfen en az bir dosya seçin.';
      return;
    }

    if (!this.guestInfo.firstName.trim() || !this.guestInfo.lastName.trim()) {
      this.errorMessage = 'Lütfen ad ve soyad bilgilerini giriniz.';
      return;
    }

    this.isUploading = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.uploadProgress = 0;

    try {
      console.log('📤 Dosya yükleme başlatılıyor...');

      // Dosya listesini oluştur
      const files: File[] = this.guestInfo.files.map(
        (uploadedFile) => uploadedFile.file
      );

      // Kişiye özel klasör oluşturup tüm dosyaları yükle
      const results = await this.driveService.uploadFilesToPersonalFolder(
        files,
        this.guestInfo.firstName.trim(),
        this.guestInfo.lastName.trim()
      );

      // Başarılı upload
      this.uploadProgress = 100;
      this.uploadedFileCount = results.length;
      this.successMessage = `${results.length}/${files.length} dosya başarıyla ${this.guestInfo.firstName} ${this.guestInfo.lastName} klasörüne yüklendi! 🎉`;

      // Parent component'e bildirim gönder
      this.filesUploaded.emit(this.guestInfo);

      // 5 saniye sonra formu temizle
      setTimeout(() => {
        this.resetForm();
      }, 5000);
    } catch (error) {
      console.error('❌ Dosya yükleme hatası:', error);
      this.errorMessage =
        'Dosya yükleme sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      this.uploadProgress = 0;
    } finally {
      this.isUploading = false;
    }
  }

  private resetForm() {
    this.guestInfo = {
      firstName: '',
      lastName: '',
      files: [],
    };
    this.successMessage = '';
    this.errorMessage = '';
    this.uploadedFileCount = 0;
    this.uploadProgress = 0;
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
