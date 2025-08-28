import { Router } from 'express';
import {
  uploadFiles,
  getUploads,
  getGuestFiles,
  getStats,
} from '../controllers/fileController';
import { upload, handleMulterError } from '../middleware/upload';

const router = Router();

// POST /api/files/upload - Dosya yükleme
router.post(
  '/upload',
  upload.array('files', 20), // 'files' field name, maximum 20 files
  handleMulterError,
  uploadFiles
);

// GET /api/files/uploads - Tüm yüklemeleri getir
router.get('/uploads', getUploads);

// GET /api/files/guest/:guestId - Belirli misafirin dosyalarını getir
router.get('/guest/:guestId', getGuestFiles);

// GET /api/files/stats - İstatistikleri getir
router.get('/stats', getStats);

export { router as fileRouter };
