import sqlite3 from 'sqlite3';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../wedding_photos.db');

export const db = new sqlite3.Database(DB_PATH);

export interface GuestUpload {
  id?: number;
  firstName: string;
  lastName: string;
  uploadDate: string;
  fileCount: number;
  qrCode?: string;
}

export interface UploadedFile {
  id?: number;
  guestId: number;
  originalName: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  uploadDate: string;
}

export const initDatabase = (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Guests table
    db.run(
      `
      CREATE TABLE IF NOT EXISTS guests (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        firstName TEXT NOT NULL,
        lastName TEXT NOT NULL,
        uploadDate TEXT NOT NULL,
        fileCount INTEGER DEFAULT 0,
        qrCode TEXT,
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `,
      (err) => {
        if (err) {
          reject(err);
          return;
        }

        // Files table
        db.run(
          `
        CREATE TABLE IF NOT EXISTS uploaded_files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          guestId INTEGER NOT NULL,
          originalName TEXT NOT NULL,
          fileName TEXT NOT NULL,
          filePath TEXT NOT NULL,
          fileSize INTEGER NOT NULL,
          mimeType TEXT NOT NULL,
          uploadDate TEXT NOT NULL,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (guestId) REFERENCES guests (id)
        )
      `,
          (err) => {
            if (err) {
              reject(err);
              return;
            }

            console.log('✅ Veritabanı tabloları başarıyla oluşturuldu');
            resolve();
          }
        );
      }
    );
  });
};

export const insertGuest = (
  guest: Omit<GuestUpload, 'id'>
): Promise<number> => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO guests (firstName, lastName, uploadDate, fileCount, qrCode)
      VALUES (?, ?, ?, ?, ?)
    `);

    stmt.run(
      [
        guest.firstName,
        guest.lastName,
        guest.uploadDate,
        guest.fileCount,
        guest.qrCode || null,
      ],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );

    stmt.finalize();
  });
};

export const insertFile = (file: Omit<UploadedFile, 'id'>): Promise<number> => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO uploaded_files (guestId, originalName, fileName, filePath, fileSize, mimeType, uploadDate)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      [
        file.guestId,
        file.originalName,
        file.fileName,
        file.filePath,
        file.fileSize,
        file.mimeType,
        file.uploadDate,
      ],
      function (err) {
        if (err) {
          reject(err);
          return;
        }
        resolve(this.lastID);
      }
    );

    stmt.finalize();
  });
};

export const getAllGuests = (): Promise<GuestUpload[]> => {
  return new Promise((resolve, reject) => {
    db.all('SELECT * FROM guests ORDER BY createdAt DESC', (err, rows) => {
      if (err) {
        reject(err);
        return;
      }
      resolve(rows as GuestUpload[]);
    });
  });
};

export const getFilesByGuestId = (guestId: number): Promise<UploadedFile[]> => {
  return new Promise((resolve, reject) => {
    db.all(
      'SELECT * FROM uploaded_files WHERE guestId = ? ORDER BY createdAt DESC',
      [guestId],
      (err, rows) => {
        if (err) {
          reject(err);
          return;
        }
        resolve(rows as UploadedFile[]);
      }
    );
  });
};
