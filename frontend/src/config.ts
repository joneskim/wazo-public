// Environment configuration
const isDesktop = process.env.REACT_APP_PLATFORM === 'desktop';
const isDevelopment = process.env.NODE_ENV === 'development';

// API base URL configuration
let apiBaseUrl = '';  // Default for production build (served from same origin)

if (isDesktop) {
  apiBaseUrl = 'http://localhost:3001';  // Desktop app always uses localhost
} else if (isDevelopment) {
  apiBaseUrl = 'http://localhost:3001';  // Development mode uses localhost
}

export const config = {
  apiBaseUrl,
  isDesktop,
  isDevelopment,
  // Add other configuration values here
} as const;

export type Config = typeof config;
