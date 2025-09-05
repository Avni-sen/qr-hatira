export const environment = {
  production: false,
  googleClientId: process.env['GOOGLE_CLIENT_ID'] || '',
  googleDriveParentFolderId: process.env['GOOGLE_DRIVE_PARENT_FOLDER_ID'] || '',
  googleAccessToken: process.env['GOOGLE_ACCESS_TOKEN'] || '',
  googleRefreshToken: process.env['GOOGLE_REFRESH_TOKEN'] || '',
  nodeEnv: process.env['NODE_ENV'] || 'development',
  googleDriveClientEmail: process.env['GOOGLE_DRIVE_CLIENT_EMAIL'] || '',
  googleDrivePrivateKey: process.env['GOOGLE_DRIVE_PRIVATE_KEY'] || '',
  googleProjectId: process.env['GOOGLE_PROJECT_ID'] || '',
  googleClientSecret: process.env['GOOGLE_CLIENT_SECRET'] || '',
};
