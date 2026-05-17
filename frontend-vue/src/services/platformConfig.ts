/**
 * Platform Configuration Helper
 * Use this to detect which platform the app is running on and configure accordingly
 */

export const Platform = {
  WEB: 'web',
  ANDROID: 'android',
  ELECTRON: 'electron'
} as const;

export type Platform = (typeof Platform)[keyof typeof Platform];

export interface PlatformConfig {
  platform: Platform;
  apiBaseUrl: string;
  appName: string;
  appVersion: string;
  isNative: boolean;
  isMobile: boolean;
  isDesktop: boolean;
}

export function getPlatformConfig(): PlatformConfig {
  const platform = (import.meta.env.VITE_PLATFORM as Platform) || Platform.WEB;
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
  const appName = import.meta.env.VITE_APP_NAME || 'Build IT';
  const appVersion = import.meta.env.VITE_APP_VERSION || '1.0.0';

  return {
    platform,
    apiBaseUrl,
    appName,
    appVersion,
    isNative: platform === Platform.ANDROID || platform === Platform.ELECTRON,
    isMobile: platform === Platform.ANDROID,
    isDesktop: platform === Platform.ELECTRON,
  };
}

export function getCurrentPlatform(): Platform {
  return (import.meta.env.VITE_PLATFORM as Platform) || Platform.WEB;
}

export function isPlatform(target: Platform): boolean {
  return getCurrentPlatform() === target;
}

export function isNativeApp(): boolean {
  const platform = getCurrentPlatform();
  return platform === Platform.ANDROID || platform === Platform.ELECTRON;
}

export function isMobileApp(): boolean {
  return isPlatform(Platform.ANDROID);
}

export function isDesktopApp(): boolean {
  return isPlatform(Platform.ELECTRON);
}

export function getAPIBaseUrl(): string {
  return import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
}

/**
 * Example usage in Vue components:
 * 
 * import { getPlatformConfig, isPlatform, Platform } from '@/services/platformConfig'
 * 
 * const config = getPlatformConfig()
 * console.log(`Running on: ${config.platform}`)
 * 
 * if (isPlatform(Platform.ELECTRON)) {
 *   // Desktop-specific code
 * }
 * 
 * if (isPlatform(Platform.ANDROID)) {
 *   // Mobile-specific code
 * }
 */
