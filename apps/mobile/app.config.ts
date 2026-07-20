import type { ExpoConfig, ConfigContext } from 'expo/config'

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Misoa Market',
  slug: 'misoa-market',
  owner: 'isokjon',
  scheme: 'misoa-market',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  newArchEnabled: true,
  splash: {
    image: './assets/splash.png',
    resizeMode: 'contain',
    backgroundColor: '#FFFFFF',
  },
  notification: {
    icon: './assets/notification-icon.png',
    color: '#7C3AED',
    androidMode: 'default',
  },
  ios: {
    bundleIdentifier: 'uz.misoa.app',
    buildNumber: '1',
    appleTeamId: '47779M8Z2K',
    supportsTablet: false,
    infoPlist: {
      NSCameraUsageDescription: 'Kvitansiya rasmi yuklash uchun',
      NSPhotoLibraryUsageDescription: 'Galereyadagi rasmni tanlash uchun',
      NSUserNotificationsUsageDescription: 'Buyurtma holati haqida xabar olish uchun',
      LSApplicationQueriesSchemes: ['tg', 'telegram'],
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    googleServicesFile: './google-services.json',
    package: 'uz.misoa.app',
    versionCode: 1,
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#FF0071',
    },
    permissions: ['CAMERA', 'READ_EXTERNAL_STORAGE', 'RECEIVE_BOOT_COMPLETED', 'VIBRATE'],
  },
  plugins: [
    'expo-router',
    'expo-secure-store',
    'expo-font',
    [
      'expo-splash-screen',
      {
        image: './assets/splash.png',
        imageWidth: 400,
        resizeMode: 'cover',
        backgroundColor: '#FFFFFF',
      },
    ],
    [
      'expo-notifications',
      {
        icon: './assets/notification-icon.png',
        color: '#7C3AED',
        sounds: [],
      },
    ],
  ],
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'https://api.misoa.uz/api/v1',
    botUsername: process.env.EXPO_PUBLIC_BOT_USERNAME,
    eas: { projectId: '587f17a9-a943-43ed-8d06-2d040b255da9' },
  },
})
