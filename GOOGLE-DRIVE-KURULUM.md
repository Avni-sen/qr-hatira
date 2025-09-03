# 🎯 Google Drive Kurulum Rehberi

Bu proje artık fotoğraf ve videoları **Google Drive**'a yükleyecek şekilde konfigüre edilmiştir. Bu rehber, Google Drive API'sini nasıl kuracağınızı adım adım açıklar.

## 📋 Genel Bakış

- ✅ **Google Drive API entegrasyonu** tamamlandı
- ✅ **Otomatik klasör oluşturma** (misafir isimlerine göre)
- ✅ **Çoklu dosya yükleme** desteği
- ✅ **Gerçek zamanlı progress bar**
- ✅ **Google Drive linkleri** paylaşımı
- ✅ **Hata yönetimi** ve kullanıcı dostu mesajlar

## 🔧 Google Drive API Kurulumu

### Adım 1: Google Cloud Project Oluştur

1. [Google Cloud Console](https://console.cloud.google.com/)'a git
2. Yeni proje oluştur: **"Wedding Photo Share"**
3. Proje ID'sini not al

### Adım 2: Google Drive API'yi Aktifleştir

1. **APIs & Services** > **Library** bölümüne git
2. **"Google Drive API"** ara ve **Enable** et

### Adım 3: Service Account Oluştur

1. **APIs & Services** > **Credentials** bölümüne git
2. **Create Credentials** > **Service Account** seç
3. Bilgileri doldur:
   - **Service account name**: `wedding-drive-service`
   - **Service account ID**: `wedding-drive-service`
   - **Description**: `Wedding photo uploads to Google Drive`

### Adım 4: Service Account Key İndir

1. Oluşturulan service account'a tıkla
2. **Keys** sekmesine git
3. **Add Key** > **Create new key**
4. **JSON** formatını seç ve indir
5. Bu dosyayı güvenli bir yerde sakla!

### Adım 5: Google Drive'da Ana Klasör Hazırla

1. Google Drive'da ana klasör oluştur: **"Düğün Fotoğrafları - [İsimleriniz]"**
2. Bu klasöre sağ tık > **Share**
3. Service account email'ini ekle (JSON dosyasındaki `client_email`)
4. **Editor** yetkisi ver
5. Klasörün ID'sini al (URL'den):
   ```
   https://drive.google.com/drive/folders/[KLASÖR_ID_BURASI]
   ```

## 🔐 Environment Variables Kurulumu

### Vercel için Environment Variables

Vercel dashboard'unuza gidip şu environment variables'ları ekleyin:

```bash
# Service Account JSON dosyasından alacağınız bilgiler:
GOOGLE_DRIVE_CLIENT_EMAIL=wedding-drive-service@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQC...\n-----END PRIVATE KEY-----"

# Ana klasör ID'si (opsiyonel):
GOOGLE_DRIVE_PARENT_FOLDER_ID=1234567890abcdefghijklmnop
```

### Önemli Notlar:

- ⚠️ **Private Key**: Tüm `\\n` karakterleri dahil olmalı
- ⚠️ **Tırnak işaretleri**: Private key tırnak içinde olmalı
- ⚠️ **Client Email**: Service account'un email adresi

### Local Development için

`.env` dosyası oluşturun:

```bash
GOOGLE_DRIVE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_DRIVE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"
GOOGLE_DRIVE_PARENT_FOLDER_ID=your-google-drive-folder-id
```

## 🚀 Deployment

### 1. Vercel'e Deploy Et

```bash
npm run build
vercel --prod
```

### 2. Environment Variables'ları Ayarla

Vercel dashboard'da:

1. Project Settings > Environment Variables
2. Yukarıdaki 3 değişkeni ekle
3. Production, Preview, Development için aktif et

### 3. Test Et

```bash
# Health check
curl https://your-app.vercel.app/api/health

# Upload test (multipart form data)
curl -X POST https://your-app.vercel.app/api/upload \
  -F "firstName=Test" \
  -F "lastName=User" \
  -F "files=@test-image.jpg"
```

## 📱 Kullanım

### Misafirler için:

1. **İsim/Soyisim** gir (opsiyonel)
2. **Fotoğraf/Video** seç (drag & drop veya tıklayarak)
3. **Yükle** butonuna tıkla
4. **Google Drive linkini** al

### Klasör Yapısı:

```
📁 Düğün Fotoğrafları - N&A
  ├── 📁 Ahmet Yılmaz
  │   ├── 🖼️ IMG_001.jpg
  │   └── 🎥 VID_001.mp4
  ├── 📁 Ayşe Demir
  │   └── 🖼️ IMG_002.jpg
  └── 📁 Misafir_1234567890
      └── 🖼️ IMG_003.jpg
```

## 🔍 Troubleshooting

### Health Check ile Kontrol

```bash
curl https://your-app.vercel.app/api/health
```

Yanıt:

```json
{
  "status": "OK",
  "services": {
    "googleDrive": "configured",
    "storage": "google-drive"
  },
  "configuration": {
    "googleDriveEnabled": true,
    "parentFolderSet": true
  }
}
```

### Yaygın Hatalar

1. **"Google Drive konfigürasyonu eksik"**

   - Environment variables'ları kontrol et
   - Private key formatını kontrol et

2. **"Klasör oluşturulamadı"**

   - Service account'un ana klasöre erişimi var mı?
   - Parent folder ID doğru mu?

3. **"Dosya yüklenemedi"**
   - Dosya boyutu 50MB'dan küçük mü?
   - Dosya formatı destekleniyor mu?

## 📊 Özellikler

### ✅ Tamamlananlar:

- [x] Google Drive API entegrasyonu
- [x] Otomatik klasör oluşturma
- [x] Çoklu dosya yükleme
- [x] Progress bar
- [x] Hata yönetimi
- [x] Google Drive linkleri
- [x] Dosya boyutu kontrolü
- [x] Desteklenen format kontrolü

### 🎯 Gelecek Özellikler:

- [ ] QR kod ile hızlı erişim
- [ ] Fotoğraf galerisi görüntüleme
- [ ] Admin paneli
- [ ] İstatistikler sayfası
- [ ] Email bildirimleri

## 💡 Notlar

- Dosyalar Google Drive'da güvenle saklanır
- Her misafir kendi klasörüne erişebilir
- Ana klasör sahibi tüm fotoğrafları görebilir
- Sistem otomatik olarak klasör oluşturur
- Duplicate dosya isimleri otomatik handle edilir

---

🎉 **Artık düğün fotoğraflarınız Google Drive'da güvenle saklanacak!**
