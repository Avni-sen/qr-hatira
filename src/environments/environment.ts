export const environment = {
  production: false,
  googleClientId:
    '174847816124-d5aukd19ghd6vmplapjiqiii3dlkjj08.apps.googleusercontent.com',
  googleDriveParentFolderId: '13Z6EEbZKUBwfRnsoXJvrCQlweJL9phg0', // Ana klasör ID'si buraya gelecek
  // Token'lar environment variables'dan alınacak
  googleAccessToken: process.env['GOOGLE_ACCESS_TOKEN'] || '',
  googleRefreshToken: process.env['GOOGLE_REFRESH_TOKEN'] || '',
};
