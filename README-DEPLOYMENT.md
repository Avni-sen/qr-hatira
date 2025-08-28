# 🎊 Wedding Photo Share - Deployment Rehberi

## 📋 Gereksinimler

- Docker ve Docker Compose
- 4GB+ RAM
- 10GB+ Disk alanı

## 🚀 Hızlı Deployment

### 1. Local Test

```bash
# Backend'i başlat
npm run backend:dev

# Yeni terminal'de frontend'i başlat
npm start

# Veya ikisini birden
npm run dev
```

### 2. Docker ile Production Deployment

```bash
# Tüm servisleri Docker ile başlat
./deploy.sh

# Veya manuel olarak
docker-compose up -d
```

## 🌐 Production Ortamı için

### 1. Domain/Server Ayarları

**Frontend URL'ini güncelle:**

```typescript
// src/app/services/file.service.ts
private readonly API_URL = 'https://your-domain.com/api';
```

**Backend CORS ayarları:**

```typescript
// backend/src/server.ts
origin: "https://your-domain.com";
```

### 2. Environment Variables

Production'da şu environment variable'ları ayarlayın:

```bash
NODE_ENV=production
FRONTEND_URL=https://your-domain.com
PORT=3001
```

### 3. Nginx Reverse Proxy (Önerilen)

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        client_max_body_size 50M;
    }

    # Uploaded files
    location /uploads/ {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

## 📊 Monitoring

### Health Check Endpoints

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001/api/health`

### Logları İzleme

```bash
# Tüm servis logları
docker-compose logs -f

# Sadece backend
docker-compose logs -f wedding-app

# Son 100 satır
docker-compose logs --tail=100 wedding-app
```

### Database Backup

```bash
# SQLite database backup
cp backend/wedding_photos.db wedding_photos_backup_$(date +%Y%m%d).db
```

## 🔧 Sorun Giderme

### Port Çakışması

```bash
# Kullanılan portları kontrol et
lsof -i :3000
lsof -i :3001

# Docker container'ları durdur
docker-compose down
```

### Disk Alanı

```bash
# Docker temizliği
docker system prune -a

# Upload klasörünü temizle (dikkatli!)
rm -rf backend/uploads/*
```

### Performance Tuning

```bash
# Docker memory limit ayarla
docker-compose up -d --memory=2g
```

## 📱 Cloud Deployment Seçenekleri

### 1. DigitalOcean App Platform

- `app.yaml` konfigürasyonu ekle
- Automatic SSL
- Managed database option

### 2. Heroku

- `Procfile` ekle
- PostgreSQL addon
- Cloudinary image storage

### 3. AWS/Vercel/Netlify

- Serverless functions
- S3 storage
- CloudFront CDN

## 🔐 Güvenlik

### Production Checklist

- [ ] HTTPS sertifikası
- [ ] CORS policy güncellendi
- [ ] File upload validation
- [ ] Rate limiting
- [ ] Database backup strategy
- [ ] Environment variables secured

## 📞 Destek

Sorun yaşarsanız:

1. `docker-compose logs` kontrol edin
2. Network connectivity test edin
3. Port availability kontrol edin

---

💕 **Mutlu nişanlar!** 🎊
