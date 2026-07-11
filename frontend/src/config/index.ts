export const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_URL || 'https://api.sentinelflow.io',
    wsUrl:   import.meta.env.VITE_WS_URL  || 'wss://api.sentinelflow.io',
  },
  env:          import.meta.env.VITE_ENV          || 'production',
  buildVersion: import.meta.env.VITE_BUILD_VERSION || '1.0.0',
  isDev:        import.meta.env.DEV,
  isProd:       import.meta.env.PROD,
} as const;
