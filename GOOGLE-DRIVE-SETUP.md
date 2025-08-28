# Google Drive API Kurulumu

## 🎯 Genel Bakış

Artık tüm fotoğraf ve videolar **Google Drive'da** saklanacak! Veritabanında sadece metadata (dosya isimleri, boyutları, linkler) tutulacak.

## 📂 Klasör Yapısı

Her misafir için otomatik klasör oluşturulur:

- **İsim + Soyisim** girildiyse: `"Ahmet Yılmaz"`
- **Sadece isim** girildiyse: `"Ahmet"`
- **İsim girilmezse**: `"Misafir_ABC123"` (rastgele kod)

## 🔧 Google Cloud Console Kurulumu

### 1. Google Cloud Project Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/) 'a git
2. Yeni proje oluştur: `"Wedding Photo Share"`
3. Proje ID'sini not al

### 2. Google Drive API'yi Aktif Et

1. **APIs & Services** > **Library** 'ye git
2. **Google Drive API** 'yi ara ve aktif et

### 3. Service Account Oluştur

1. **APIs & Services** > **Credentials** 'e git
2. **Create Credentials** > **Service Account** seç
3. Bilgileri doldur:
   - **Service account name**: `wedding-drive-service`
   - **Service account ID**: `wedding-drive-service`
   - **Description**: `Wedding photo uploads to Google Drive`

### 4. Service Account Key İndir

1. Oluşturulan service account'a tıkla
2. **Keys** sekmesine git
3. **Add Key** > **Create new key**
4. **JSON** formatını seç ve indir
5. Bu dosyayı güvenli bir yerde sakla!

### 5. Google Drive'da Ana Klasörü Paylaş

1. Google Drive'da ana klasör oluştur: `"Düğün Fotoğrafları - N&A"`
2. Bu klasöre sağ tık > **Share**
3. Service account email'ini ekle (JSON'da `client_email` alanı)
4. **Editor** yetkisi ver
5. Klasörün ID'sini al (URL'den):
   ```
   https://drive.google.com/drive/folders/[KLASÖR_ID_BURASI]
   ```

## 🔐 Environment Variables

Vercel'e şu environment variables'ları eklemen gerekiyor:

```bash
# Service Account JSON dosyasındaki bilgiler:
GOOGLE_DRIVE_CLIENT_EMAIL="wedding-drive-service@your-project.iam.gserviceaccount.com"
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC..."

# Ana klasör ID'si (isteğe bağlı):
GOOGLE_DRIVE_PARENT_FOLDER_ID="1234567890abcdefghijklmnop"
```

## 📋 Kurulum Adımları

### 1. JSON Dosyasını Aç

İndirdiğin JSON dosyasını text editörle aç ve şu bilgileri kopyala:

- `client_email`
- `private_key` (tüm \\n karakterleri dahil)

### 2. Vercel Environment Variables

```bash
# Client email ekle
vercel env add GOOGLE_DRIVE_CLIENT_EMAIL production

# Private key ekle (dikkat: tırnak içinde)
vercel env add GOOGLE_DRIVE_PRIVATE_KEY production

# Ana klasör ID'si (isteğe bağlı)
vercel env add GOOGLE_DRIVE_PARENT_FOLDER_ID production
```

### 3. Database Schema Güncelleme

```bash
# Yeni tabloları oluştur
curl -X POST https://your-app.vercel.app/api/init-db
```

## ✨ Özellikler

### 🎯 Otomatik Klasör Yönetimi

- Her misafir için benzersiz klasör
- İsim bazlı adlandırma
- Mevcut klasörleri otomatik bulma

### 🔒 Güvenlik

- Service account ile güvenli erişim
- Dosyalar herkese açık değil (isterseniz açık yapabilir)
- Sadı metadata veritabanında

### 📊 İstatistikler

- Toplam misafir sayısı
- Toplam dosya sayısı
- Toplam klasör sayısı
- Google Drive linkleri

## 🚀 Deployment

```bash
# Dependencies install et
npm install

# Deploy et
vercel --prod

# Database'i initialize et
curl -X POST https://your-app.vercel.app/api/init-db

# Test et
curl -X POST https://your-app.vercel.app/api/upload \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "files=@test-image.jpg"
```

## 🐛 Troubleshooting

### Environment Variables Kontrol

```bash
# Health check ile kontrol et
curl https://your-app.vercel.app/api/health
```

### Service Account Permissions

- Service account'un Google Drive'da editor yetkisi olduğundan emin ol
- Ana klasörün doğru paylaşıldığını kontrol et

### Private Key Format

- Private key'in `\n` karakterleri içerdiğinden emin ol
- Tırnak işaretleri içinde olmalı

## 📸 Sonuç

Artık tüm dosyalar Google Drive'da güvenle saklanacak ve kullanıcılar kendi klasörlerindeki fotoğrafları görüntüleyebilecek! 🎉
