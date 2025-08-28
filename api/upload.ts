// Tek bağımlılık: googleapis
import { google } from 'googleapis';
import { PassThrough } from 'stream';

const SCOPE = ['https://www.googleapis.com/auth/drive'];

function getAuth() {
  const clientEmail = process.env['GOOGLE_CLIENT_EMAIL']!;
  const privateKey = process.env['GOOGLE_PRIVATE_KEY']!.replace(/\\n/g, '\n'); // Vercel için
  return new google.auth.JWT(clientEmail, undefined, privateKey, SCOPE);
}

function getDrive(auth: any) {
  return google.drive({ version: 'v3', auth });
}

async function ensureAnyoneReader(drive: any, fileId: string) {
  try {
    await drive.permissions.create({
      fileId,
      requestBody: { role: 'reader', type: 'anyone' },
    });
  } catch {
    // izin zaten varsa sessiz geç
  }
}

async function createFolder(
  drive: any,
  name: string,
  parentId?: string
): Promise<string> {
  const res = await drive.files.create({
    requestBody: {
      name,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : undefined,
    },
    fields: 'id',
  });
  const id = res.data.id as string;
  await ensureAnyoneReader(drive, id);
  return id;
}

async function findFolderByName(
  drive: any,
  name: string,
  parentId?: string
): Promise<string | null> {
  const safeName = name.replace(/'/g, "\\'");
  const qParts = [
    `mimeType='application/vnd.google-apps.folder'`,
    `name='${safeName}'`,
    `trashed=false`,
  ];
  if (parentId) qParts.push(`'${parentId}' in parents`);
  const q = qParts.join(' and ');

  const res = await drive.files.list({
    q,
    pageSize: 1,
    fields: 'files(id,name)',
  });
  return res.data.files?.[0]?.id || null;
}

export function createGoogleDriveService() {
  const auth = getAuth();
  const drive = getDrive(auth);
  const ROOT_FOLDER_ID = process.env['GOOGLE_DRIVE_FOLDER_ID']!; // ana klasör

  return {
    /** İsim-soyisim klasörünü bulur, yoksa oluşturur */
    async createOrFindGuestFolder(firstName: string, lastName: string) {
      const safe = `${firstName.trim()}_${lastName.trim()}`.replace(
        /\s+/g,
        '_'
      );
      const exist = await findFolderByName(drive, safe, ROOT_FOLDER_ID);
      if (exist) return exist;
      return await createFolder(drive, safe, ROOT_FOLDER_ID);
    },

    /** Klasör linki döndürür */
    async getFolderLink(folderId: string) {
      return `https://drive.google.com/drive/folders/${folderId}`;
    },

    /** Buffer ile dosya yükler (foto/video dahil) */
    async uploadFiles(
      files: {
        buffer: Buffer;
        originalname: string;
        mimetype: string;
        size: number;
      }[],
      parentFolderId: string
    ) {
      const results: Array<{
        id: string;
        name: string;
        size: number;
        mimeType: string;
        webViewLink: string;
      }> = [];

      for (const f of files) {
        const body = new PassThrough();
        body.end(f.buffer);

        const res = await drive.files.create({
          requestBody: {
            name: `${Date.now()}_${f.originalname}`,
            parents: [parentFolderId],
          },
          media: { mimeType: f.mimetype, body },
          fields: 'id,name,size,mimeType,webViewLink',
        });

        const id = res.data.id as string;
        await ensureAnyoneReader(drive, id);

        results.push({
          id,
          name: res.data.name as string,
          size: Number(res.data.size ?? f.size),
          mimeType: res.data.mimeType ?? f.mimetype,
          webViewLink: res.data.webViewLink as string,
        });
      }

      return results;
    },
  };
}
