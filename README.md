# 💕 Wedding Photo Share - Nişan Fotoğraf Paylaşım Uygulaması

Sevgili dostlarınızın düğün/nişan fotoğraflarını kolayca toplayabileceğiniz modern Angular web uygulaması.

## 🎊 Özellikler

- **Modern UI/UX** - TailwindCSS ile responsive tasarım
- **Dosya Yükleme** - Drag & drop ile kolay yükleme
- **Multiple Format** - Resim ve video desteği
- **Real-time Progress** - Yükleme durumu gösterimi
- **Güvenli** - Dosya tipi ve boyut validasyonu
- **Cloud Ready** - Vercel/Netlify deployment

## 🚀 Canlı Demo

**Frontend:** [https://wedding-photo-share.vercel.app](https://wedding-photo-share.vercel.app)

## 🛠️ Teknolojiler

### Frontend

- **Angular 19** - Modern framework
- **TypeScript** - Type safety
- **TailwindCSS** - Utility-first CSS
- **RxJS** - Reactive programming

### Backend

- **Node.js + Express** - API server
- **TypeScript** - Backend type safety
- **SQLite** - Local database
- **Multer** - File upload handling

### Deployment

- **Vercel** - Serverless functions
- **Docker** - Containerization
- **GitHub** - Version control

## 📱 Hızlı Başlangıç

### 1. Development (Local)

```bash
# Repository'yi klonla
git clone https://github.com/YOUR_USERNAME/wedding-photo-share.git
cd wedding-photo-share

# Dependencies yükle
npm install

# Backend + Frontend'i aynı anda başlat
npm run dev

# Veya ayrı ayrı:
npm run backend:dev  # Backend: http://localhost:3001
npm start           # Frontend: http://localhost:4200
```

### 2. Production Build

```bash
# Docker ile
./deploy.sh

# Veya manuel
npm run build:all
```

## 🌐 Vercel Deployment

### Otomatik Deployment

1. GitHub'a push edin
2. [Vercel](https://vercel.com)'e girin
3. Repository'yi import edin
4. Deploy butonuna tıklayın!

### Manuel Deployment

```bash
npm install -g vercel
vercel --prod
```

## 📂 Proje Yapısı

```
wedding-photo-share/
├── src/                    # Angular frontend
├── backend/               # Node.js backend
├── api/                   # Vercel serverless functions
├── public/               # Static assets
├── docker-compose.yml    # Docker setup
├── vercel.json          # Vercel configuration
└── README.md
```

## 🎨 Tasarım Özellikleri

- **Responsive Design** - Mobil/tablet/desktop uyumlu
- **Modern Gradient** - Pink/purple tema
- **Smooth Animations** - CSS transitions
- **User Feedback** - Progress bars ve notifications
- **Turkish Localization** - Türkçe arayüz

## 🔧 Konfigürasyon

### Environment Variables

```bash
# Development
FRONTEND_URL=http://localhost:4200
PORT=3001

# Production
FRONTEND_URL=https://your-domain.com
NODE_ENV=production
```

### Custom Domain

Vercel'de custom domain eklemek için:

1. Project Settings → Domains
2. Domain adını ekleyin
3. DNS kayıtlarını güncelleyin

## 📊 API Endpoints

- `POST /api/upload` - Dosya yükleme
- `GET /api/stats` - İstatistikler
- `GET /api/health` - Health check

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📄 Lisans

MIT License - detaylar için [LICENSE](LICENSE) dosyasına bakın.

## 💝 Teşekkürler

Bu projeyi nişan günümüz için geliştirdik. Sevgili dostlarımızın güzel anılarını bizimle paylaşması için!

**Nazmiye & Avni** 💕

---

### 🆘 Destek

Sorun yaşarsanız:

- [Issues](https://github.com/YOUR_USERNAME/wedding-photo-share/issues) açın
- [Deployment Guide](README-DEPLOYMENT.md) kontrol edin

**Mutlu günler! 🎉**
