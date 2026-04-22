import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nexlify.GymFlow',
  appName: 'GymFlow',
  webDir: 'dist',
  server: {
    // url: 'https://bf8ac745-24ae-4a08-9f89-f0f972c1915c.lovableproject.com?forceHideBadge=true',
    cleartext: true
  }
};

export default config;
