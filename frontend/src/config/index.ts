export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'http://localhost:3000',
    wsUrl:   import.meta.env.VITE_WS_URL  || 'ws://localhost:3001',
  },
  env:          import.meta.env.VITE_ENV          || 'development',
  buildVersion: import.meta.env.VITE_BUILD_VERSION || '0.0.0',
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
} as const;
