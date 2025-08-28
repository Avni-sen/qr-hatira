import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileRouter } from './routes/fileRoutes';
import { initDatabase } from './config/database';

const app = express();
const PORT = process.env['PORT'] || 3001;

// Middleware
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
  })
);
app.use(
  cors({
    origin: process.env['FRONTEND_URL'] || 'http://localhost:4200',
    credentials: true,
  })
);
app.use(morgan('combined'));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files - uploaded files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API Routes
app.use('/api/files', fileRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Wedding Photo Share API',
  });
});

// Initialize database and start server
initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 Backend server ${PORT} portunda çalışıyor`);
      console.log(`📁 Upload klasörü: ${path.join(__dirname, '../uploads')}`);
      console.log(
        `🌐 CORS izin verilen origin: ${
          process.env['FRONTEND_URL'] || 'http://localhost:4200'
        }`
      );
    });
  })
  .catch((error) => {
    console.error('❌ Veritabanı başlatılamadı:', error);
    process.exit(1);
  });

export { app };
