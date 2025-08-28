import { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Methods',
    'GET,OPTIONS,PATCH,DELETE,POST,PUT'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Google Drive environment debug bilgisi
  console.log('Health check called');
  console.log('Google Drive Environment variables:', {
    GOOGLE_DRIVE_CLIENT_EMAIL: !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
    GOOGLE_DRIVE_PRIVATE_KEY: !!process.env.GOOGLE_DRIVE_PRIVATE_KEY,
    GOOGLE_DRIVE_PARENT_FOLDER_ID: !!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
    VERCEL: process.env.VERCEL,
  });

  return res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Wedding Photo Share API - Google Drive (Vercel)',
    environment: 'production',
    googleDrive: {
      hasClientEmail: !!process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
      hasPrivateKey: !!process.env.GOOGLE_DRIVE_PRIVATE_KEY,
      hasParentFolder: !!process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID,
      parentFolderId: process.env.GOOGLE_DRIVE_PARENT_FOLDER_ID || 'Not set',
    },
    note: 'All photos and videos are stored in Google Drive',
  });
}
