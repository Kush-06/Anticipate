import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akshath.anticipate',
  appName: 'anticipate',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
  },
  plugins: {
    LocalNotifications: {
      presentationOptions: ['badge', 'banner', 'list'],
    },
  },
};

export default config;
