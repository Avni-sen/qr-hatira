# 💕 Düğün Fotoğraf Paylaşım Uygulaması

## 🎯 Özellikler

### ✅ Tamamlanan Özellikler

- 🌐 QR kod ile dış giriş (masa/davetiye)
- 📸 Fotoğraf ve video yükleme (drag & drop destekli)
- 👤 İsim-soyisim girme (opsiyonel)
- 💾 Local dosya kaydetme (localStorage)
- 🎨 Modern ve responsive tasarım
- 💖 Düğün temalı UI/UX
- 📊 Yükleme istatistikleri

## 🚀 Kullanım

### 1. Uygulamayı Başlatma

```bash
cd wedding-photo-share
npm start
```

### 2. QR Kod Hazırlama

- **Düğün salonundaki masalara** QR kod yerleştirin
- **Davetiyelerinize** QR kod ekleyin
- **QR kod hedef URL'si**: `http://your-domain.com` (uygulamanızın adresi)
- QR kod oluşturmak için: [qr-code-generator.com](https://www.qr-code-generator.com/) gibi siteler kullanabilirsiniz

### 3. Misafirlerin Kullanımı

#### Adım 1: QR Kod Okutma

- Misafirler masa/davetiyedeki QR kodu **kendi telefonlarıyla** okutacak
- Doğrudan web sitesine yönlendirilecekler

#### Adım 2: Hoş Geldin Ekranı

- "Hoş Geldiniz!" mesajı görülecek
- "Fotoğraf Yüklemeye Başla" butonu

#### Adım 3: Fotoğraf/Video Yükleme

- İsim-soyisim girme (opsiyonel)
- Dosyaları sürükleyip bırakma veya seçme
- **Desteklenen formatlar**: JPG, PNG, GIF, MP4, AVI, MOV
- **Maksimum dosya boyutu**: 50MB

#### Adım 4: Onay

- Başarılı yükleme mesajı
- "Yeniden Başla" ile yeni yükleme

## 📁 Dosya Yapısı

```
src/app/
├── components/
│   └── photo-upload/        # Fotoğraf yükleme komponenti
├── services/
│   └── file.service.ts      # Dosya yönetim servisi
├── app.component.*          # Ana uygulama komponenti
└── styles.scss              # Global stiller
```

## 🛠️ Teknik Detaylar

### Kullanılan Teknolojiler

- **Angular 19** - Frontend framework
- **TailwindCSS** - Styling
- **TypeScript** - Programlama dili

### Veri Depolama

- Tüm yükleme verileri `localStorage` içinde saklanır
- Key: `weddingUploads`
- Format: JSON array

### LocalStorage Veri Yapısı

```json
[
  {
    "qrCode": "",
    "guest": {
      "firstName": "İsim",
      "lastName": "Soyisim"
    },
    "fileCount": 3,
    "uploadDate": "2024-01-01T12:00:00.000Z",
    "files": [
      {
        "name": "foto1.jpg",
        "size": 1024000,
        "type": "image/jpeg"
      }
    ]
  }
]
```

## 🎯 Uygulama Akışı

```
1. Misafir masa/davetiyedeki QR kodu okutmasını
2. ↓
3. Web sitesine yönlendirilir
4. ↓
5. "Hoş Geldiniz!" ekranı
6. ↓
7. "Fotoğraf Yüklemeye Başla" butonu
8. ↓
9. İsim-soyisim girme (opsiyonel)
10. ↓
11. Fotoğraf/video seçme ve yükleme
12. ↓
13. Başarı mesajı ve teşekkür
```

## 🔮 Gelecek Özellikler (Backend ile)

### Planlanacak Özellikler

- ☁️ Gerçek dosya yükleme (cloud storage)
- 🗄️ Veritabanı entegrasyonu
- 👥 Admin paneli
- 📊 Detaylı istatistikler
- 📧 Email bildirimleri
- 🔐 Güvenlik özellikleri
- 📱 PWA (Progressive Web App)

### Backend Teknoloji Önerileri

- **Node.js + Express** veya **NestJS**
- **MongoDB** veya **PostgreSQL**
- **AWS S3** veya **Google Cloud Storage**
- **Socket.io** (real-time updates)

## 🎨 Tasarım Özellikleri

- **Renk Paleti**: Pembe-mor gradient düğün teması
- **Responsive**: Mobil ve desktop uyumlu
- **Animasyonlar**: Kalp atışı animasyonu
- **Icons**: Emoji kullanımı ile modern görünüm
- **UX**: Sade ve kullanıcı dostu arayüz

## 📊 Veri Takibi

Console'da yükleme verilerini görmek için:

## 📄 Lisans

Bu proje kişisel kullanım için oluşturulmuştur.
