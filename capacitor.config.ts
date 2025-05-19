
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.2075fd8ebb7b407491b599fe88577e65',
  appName: 'soil-whisper-oracle',
  webDir: 'dist',
  server: {
    url: 'https://2075fd8e-bb7b-4074-91b5-99fe88577e65.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: null,
      keystoreAlias: null,
      keystorePassword: null,
      keystoreAliasPassword: null,
      releaseType: null,
      signingType: null
    }
  }
};

export default config;
