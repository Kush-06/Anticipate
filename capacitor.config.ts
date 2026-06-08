import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.akshath.anticipate',
  appName: 'anticipate',
  webDir: 'dist',
  ios: {
    contentInset: 'never',
  },
};

export default config;
