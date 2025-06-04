
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.soilwhispereroracle',
  appName: 'AgriOracle - Soil Whisperer',
  webDir: 'dist',
  server: {
    url: 'https://2075fd8e-bb7b-4074-91b5-99fe88577e65.lovableproject.com?forceHideBadge=true',
    cleartext: true
  },
  android: {
    buildOptions: {
      keystorePath: undefined,
      keystoreAlias: undefined,
      keystorePassword: undefined,
      keystoreAliasPassword: undefined,
      releaseType: 'APK',
      signingType: 'apksigner'
    },
    minWebViewVersion: 60,
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
    appendUserAgent: 'AgriOracle/1.0',
    overrideUserAgent: undefined,
    backgroundColor: '#1d1915',
    useLegacyBridge: false,
    flavor: 'main',
    webSecurity: false,
    // Optimize for faster loading
    loggingBehavior: 'none',
    mixedContentMode: 'always_allow'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500, // Reduced splash time
      backgroundColor: '#1d1915',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#22c55e'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#1d1915'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
