# 🚀 GitHub ve Vercel Deployment Rehberi

## 📋 Adım 1: GitHub Repository Oluştur

1. **GitHub'a girin:** https://github.com
2. **New Repository** butonuna tıklayın
3. **Repository bilgileri:**
   - Repository name: `wedding-photo-share`
   - Description: `💕 Nişan fotoğraf paylaşım uygulaması - Angular + Node.js`
   - Public/Private: `Public` (Vercel ücretsiz plan için)
   - README.md eklemeyin (zaten var)
4. **Create Repository** butonuna tıklayın

## 📤 Adım 2: Local Repository'yi GitHub'a Bağla

GitHub'da repository oluşturduktan sonra terminalde şu komutları çalıştırın:

```bash
# GitHub repository'yi remote olarak ekle
git remote add origin https://github.com/YOUR_USERNAME/wedding-photo-share.git

# Ana branch'i main olarak ayarla
git branch -M main

# İlk push'u yap
git push -u origin main
```

**YOUR_USERNAME** yerine kendi GitHub kullanıcı adınızı yazın!

## 🌐 Adım 3: Vercel Deployment

### Otomatik Yöntem (Önerilen):

1. **Vercel'e girin:** https://vercel.com
2. **GitHub ile giriş** yapın
3. **New Project** → **Import Git Repository**
4. **wedding-photo-share** repository'sini seçin
5. **Deploy** butonuna tıklayın!

### Manuel Yöntem:

```bash
# Vercel CLI yükle
npm install -g vercel

# Login ol
vercel login

# Deploy et
vercel --prod
```

## ⚙️ Adım 4: Vercel Environment Variables

Vercel dashboard'da Project Settings → Environment Variables:

```
NODE_ENV=production
```

## 🔗 Adım 5: Custom Domain (Opsiyonel)

Vercel Project Settings → Domains → Add domain

## 📱 Test

Deployment tamamlandıktan sonra:

1. Vercel URL'ini açın
2. Fotoğraf yükleme testi yapın
3. Responsive tasarımı kontrol edin

## 🆘 Sorun Giderme

### Build Hatası

- `vercel logs` komutuyla logları kontrol edin
- Dependencies eksikse `package.json` kontrol edin

### CORS Hatası

- API functions'larda CORS headers kontrol edin
- Frontend'de API URL'i kontrol edin

### File Upload Hatası

- Vercel'de file size limit 50MB
- Serverless function timeout 30s max

---

**Başarılar! 🎉 Deployment tamamlandıktan sonra link'i bizimle paylaşın! 💕**
