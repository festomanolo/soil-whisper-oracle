import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.manolo.soilwhispereroracle',
  appName: 'Mbolea Sahihi',
  webDir: 'dist',
  // Comment out the server configuration to use local build
  // server: {
  //   url: 'https://2075fd8e-bb7b-4074-91b5-99fe88577e65.manoloproject.com?forceHideBadge=true',
  //   cleartext: true
  // },
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
    appendUserAgent: 'MboleaSahihi/1.0',
    overrideUserAgent: undefined,
    backgroundColor: '#0b2416',
    useLegacyBridge: false,
    flavor: 'main',
    webSecurity: false
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#0b2416',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      spinnerColor: '#22c55e'
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: '#0b2416'
    },
    Keyboard: {
      resize: 'body',
      style: 'dark',
      resizeOnFullScreen: true
    }
  }
};

export default config;
