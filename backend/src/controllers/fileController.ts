import { Request, Response } from 'express';
import {
  insertGuest,
  insertFile,
  getAllGuests,
  getFilesByGuestId,
} from '../config/database';
import path from 'path';

interface UploadRequest extends Request {
  files?: Express.Multer.File[];
  body: {
    firstName: string;
    lastName: string;
    qrCode?: string;
  };
}

export const uploadFiles = async (req: UploadRequest, res: Response) => {
  try {
    const { firstName, lastName, qrCode } = req.body;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!firstName || !lastName) {
      return res.status(400).json({
        success: false,
        message: 'İsim ve soyisim gereklidir.',
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'En az bir dosya yüklemelisiniz.',
      });
    }

    console.log(
      `📤 ${firstName} ${lastName} - ${files.length} dosya yükleniyor...`
    );

    // Guest bilgilerini veritabanına kaydet
    const guestData = {
      firstName,
      lastName,
      uploadDate: new Date().toISOString(),
      fileCount: files.length,
      qrCode: qrCode || null,
    };

    const guestId = await insertGuest(guestData);

    // Her dosyayı veritabanına kaydet
    const uploadedFiles = [];
    for (const file of files) {
      const fileData = {
        guestId,
        originalName: file.originalname,
        fileName: file.filename,
        filePath: file.path,
        fileSize: file.size,
        mimeType: file.mimetype,
        uploadDate: new Date().toISOString(),
      };

      const fileId = await insertFile(fileData);
      uploadedFiles.push({
        id: fileId,
        originalName: file.originalname,
        fileName: file.filename,
        fileSize: file.size,
        mimeType: file.mimetype,
      });

      console.log(
        `📁 Dosya kaydedildi: ${file.originalname} -> ${file.filename}`
      );
    }

    res.json({
      success: true,
      message: `${files.length} dosya başarıyla yüklendi! Teşekkür ederiz ${firstName} ${lastName}! 💕`,
      data: {
        guestId,
        guest: {
          firstName,
          lastName,
          fileCount: files.length,
        },
        uploadedFiles,
      },
    });
  } catch (error) {
    console.error('❌ Upload hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosyalar yüklenirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
};

export const getUploads = async (req: Request, res: Response) => {
  try {
    const guests = await getAllGuests();

    const guestsWithFiles = await Promise.all(
      guests.map(async (guest) => {
        const files = await getFilesByGuestId(guest.id!);
        return {
          ...guest,
          files,
        };
      })
    );

    res.json({
      success: true,
      message: 'Yüklemeler başarıyla getirildi.',
      data: {
        totalGuests: guests.length,
        totalFiles: guestsWithFiles.reduce(
          (acc, guest) => acc + guest.files.length,
          0
        ),
        guests: guestsWithFiles,
      },
    });
  } catch (error) {
    console.error('❌ Yüklemeleri getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Yüklemeler getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
};

export const getGuestFiles = async (req: Request, res: Response) => {
  try {
    const guestId = parseInt(req.params.guestId);

    if (isNaN(guestId)) {
      return res.status(400).json({
        success: false,
        message: 'Geçersiz misafir ID.',
      });
    }

    const files = await getFilesByGuestId(guestId);

    res.json({
      success: true,
      message: 'Dosyalar başarıyla getirildi.',
      data: {
        guestId,
        fileCount: files.length,
        files,
      },
    });
  } catch (error) {
    console.error('❌ Misafir dosyalarını getirme hatası:', error);
    res.status(500).json({
      success: false,
      message: 'Dosyalar getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
};

export const getStats = async (req: Request, res: Response) => {
  try {
    const guests = await getAllGuests();
    const totalFiles = await Promise.all(
      guests.map((guest) => getFilesByGuestId(guest.id!))
    );

    const flatFiles = totalFiles.flat();
    const totalSize = flatFiles.reduce((acc, file) => acc + file.fileSize, 0);

    res.json({
      success: true,
      message: 'İstatistikler başarıyla getirildi.',
      data: {
        totalGuests: guests.length,
        totalFiles: flatFiles.length,
        totalSizeMB: Math.round((totalSize / (1024 * 1024)) * 100) / 100,
        lastUpload: guests.length > 0 ? guests[0].uploadDate : null,
      },
    });
  } catch (error) {
    console.error('❌ İstatistik hatası:', error);
    res.status(500).json({
      success: false,
      message: 'İstatistikler getirilirken bir hata oluştu.',
      error: error instanceof Error ? error.message : 'Bilinmeyen hata',
    });
  }
};
