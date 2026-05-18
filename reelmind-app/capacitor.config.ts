import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.lggyx',
  appName: 'Peel',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
    hostname: 'localhost',
  },
  android: {
    allowMixedContent: true,
  },
  plugins: {
    CapacitorSQLite: {
      iosDatabaseLocation: 'Library/CapacitorDatabase',
      androidDatabaseLocation: 'default',
      androidIsEncryption: false,
      iosIsEncryption: false,
    },
  },
};

export default config;
