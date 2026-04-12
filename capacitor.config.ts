import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gymflow.app',
  appName: 'GymFlow',
  webDir: 'php_app',
  server: {
    androidScheme: 'https'
  }
};

export default config;
