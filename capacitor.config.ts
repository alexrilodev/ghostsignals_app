import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ghostsignals.app',
  appName: 'Ghost Signals',
  webDir: 'www',
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    FirebaseAuthentication: {
      skipNativeAuth: false,
      providers: ['google.com', 'apple.com'],
    },
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 2000,
      backgroundColor: '#3880ff',
      showSpinner: true,
      spinnerColor: '#ffffff',
    },
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#3880ff',
  },
  ios: {
    backgroundColor: '#3880ff',
    contentInset: 'always',
  },
};

export default config;
