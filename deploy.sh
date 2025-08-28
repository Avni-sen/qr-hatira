#!/bin/bash

# Wedding Photo Share Deployment Script
echo "🚀 Wedding Photo Share - Deployment başlıyor..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker çalışmıyor. Lütfen Docker'ı başlatın."
    exit 1
fi

# Build and start the application
echo "📦 Docker image oluşturuluyor..."
docker-compose build

echo "🔄 Uygulamayı başlatıyor..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Servislerin hazır olması bekleniyor..."
sleep 30

# Health check
echo "🏥 Health check yapılıyor..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend hazır!"
else
    echo "❌ Backend hazır değil. Logları kontrol edin: docker-compose logs"
    exit 1
fi

if curl -f http://localhost:3000 > /dev/null 2>&1; then
    echo "✅ Frontend hazır!"
else
    echo "❌ Frontend hazır değil. Logları kontrol edin: docker-compose logs"
    exit 1
fi

echo ""
echo "🎉 Deployment tamamlandı!"
echo "📱 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo "📊 API Health: http://localhost:3001/api/health"
echo ""
echo "📝 Logları görüntülemek için: docker-compose logs -f"
echo "🛑 Uygulamayı durdurmak için: docker-compose down"
