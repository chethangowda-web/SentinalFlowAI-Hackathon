import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'staging', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3000),

  GROQ_API_KEY: z.string().min(1, 'GROQ_API_KEY is required'),

  HUGGINGFACE_API_KEY: z.string().min(1, 'HUGGINGFACE_API_KEY is required'),
  HUGGINGFACE_EMBEDDING_MODEL: z.string().default('BAAI/bge-large-en-v1.5'),

  QDRANT_URL: z.string().min(1, 'QDRANT_URL is required'),
  QDRANT_API_KEY: z.string().optional(),
  QDRANT_COLLECTION: z.string().min(1, 'QDRANT_COLLECTION is required'),

  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),

  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  DB_POOL_SIZE: z.coerce.number().default(20),
  DB_IDLE_TIMEOUT: z.coerce.number().default(10000),
  DB_CONNECTION_TIMEOUT: z.coerce.number().default(30000),
  DB_SSL: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),

  REDIS_URL: z.string().optional(),
  RABBITMQ_URL: z.string().optional(),

  PROMETHEUS_URL: z.string().optional(),
  GRAFANA_URL: z.string().optional(),
  GRAFANA_API_KEY: z.string().optional(),
  KUBERNETES_CONFIG_PATH: z.string().optional(),
  LOKI_URL: z.string().optional(),
  JAEGER_URL: z.string().optional(),

  ENKRYPTAI_API_KEY: z.string().default('sk-placeholder').refine(
    (val) => process.env.NODE_ENV !== 'production' || val !== 'sk-placeholder',
    { message: 'ENKRYPTAI_API_KEY must be set in production' }
  ),
  ENKRYPTAI_BASE_URL: z.string().default('https://api.enkryptai.com'),
  ENKRYPTAI_GUARDRAIL_NAME: z.string().optional(),
  ENKRYPTAI_TIMEOUT_MS: z.coerce.number().default(10000),

  JWT_SECRET: z.string().default('supersecret-change-me-in-production-1234567890'),
  JWT_ACCESS_EXPIRY: z.string().default('15m'),
  JWT_REFRESH_EXPIRY: z.string().default('7d'),
  BRUTE_FORCE_MAX_ATTEMPTS: z.coerce.number().default(5),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().optional(),
  SLACK_WEBHOOK_URL: z.string().optional(),
  TEAMS_WEBHOOK_URL: z.string().optional(),
  DISCORD_WEBHOOK_URL: z.string().optional(),
  WEBHOOK_URL: z.string().optional(),
  NOTIFICATION_RETRY_LIMIT: z.coerce.number().default(3),
  NOTIFICATION_QUEUE_SIZE: z.coerce.number().default(1000),
  NOTIFICATION_TIMEOUT: z.coerce.number().default(5000),
  WS_PORT: z.coerce.number().default(3001),
  WS_HEARTBEAT_INTERVAL: z.coerce.number().default(30000),
  WS_MAX_CONNECTIONS: z.coerce.number().default(1000),
  WS_MAX_PAYLOAD: z.coerce.number().default(1048576),
  WS_RATE_LIMIT: z.coerce.number().default(100),
});

let parsedEnv: z.infer<typeof envSchema>;

try {
  parsedEnv = envSchema.parse(process.env);
} catch (error) {
  if (error instanceof z.ZodError) {
    const formattedErrors = error.issues
      .map((issue) => `- ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    console.error(`[Config] Failed to validate environment variables:\n${formattedErrors}`);
  } else {
    console.error('[Config] Failed to validate environment variables with unknown error');
  }
  process.exit(1); // Fail fast
}

export const config = {
  server: {
    env: parsedEnv.NODE_ENV,
    port: parsedEnv.PORT,
  },
  groq: {
    apiKey: parsedEnv.GROQ_API_KEY,
  },
  embedding: {
    huggingFaceApiKey: parsedEnv.HUGGINGFACE_API_KEY,
    model: parsedEnv.HUGGINGFACE_EMBEDDING_MODEL,
  },
  qdrant: {
    url: parsedEnv.QDRANT_URL,
    apiKey: parsedEnv.QDRANT_API_KEY,
    collection: parsedEnv.QDRANT_COLLECTION,
  },
  db: {
    url: parsedEnv.DATABASE_URL,
    poolSize: parsedEnv.DB_POOL_SIZE,
    idleTimeoutMillis: parsedEnv.DB_IDLE_TIMEOUT,
    connectionTimeoutMillis: parsedEnv.DB_CONNECTION_TIMEOUT,
    ssl: parsedEnv.DB_SSL,
  },
  redis: {
    url: parsedEnv.REDIS_URL || 'redis://redis:6379',
  },
  rabbitmq: {
    url: parsedEnv.RABBITMQ_URL || 'amqp://guest:guest@rabbitmq:5672',
  },
  logging: {
    level: parsedEnv.LOG_LEVEL,
  },
  observability: {
    prometheusUrl: parsedEnv.PROMETHEUS_URL || 'http://prometheus:9090',
    grafanaUrl: parsedEnv.GRAFANA_URL || 'http://grafana:3000',
    grafanaApiKey: parsedEnv.GRAFANA_API_KEY,
    k8sConfigPath: parsedEnv.KUBERNETES_CONFIG_PATH,
    lokiUrl: parsedEnv.LOKI_URL || 'http://loki:3100',
    jaegerUrl: parsedEnv.JAEGER_URL || 'http://jaeger:16686',
  },
  notifications: {
    smtp: {
      host: parsedEnv.SMTP_HOST,
      port: parsedEnv.SMTP_PORT,
      user: parsedEnv.SMTP_USER,
      pass: parsedEnv.SMTP_PASS,
      from: parsedEnv.SMTP_FROM,
    },
    slackWebhookUrl: parsedEnv.SLACK_WEBHOOK_URL,
    teamsWebhookUrl: parsedEnv.TEAMS_WEBHOOK_URL,
    discordWebhookUrl: parsedEnv.DISCORD_WEBHOOK_URL,
    webhookUrl: parsedEnv.WEBHOOK_URL,
    retryLimit: parsedEnv.NOTIFICATION_RETRY_LIMIT,
    queueSize: parsedEnv.NOTIFICATION_QUEUE_SIZE,
    timeoutMs: parsedEnv.NOTIFICATION_TIMEOUT,
  },
  auth: {
    jwtSecret: parsedEnv.JWT_SECRET,
    accessExpiry: parsedEnv.JWT_ACCESS_EXPIRY,
    refreshExpiry: parsedEnv.JWT_REFRESH_EXPIRY,
    bruteForceMaxAttempts: parsedEnv.BRUTE_FORCE_MAX_ATTEMPTS,
  },
  websocket: {
    port: parsedEnv.WS_PORT,
    heartbeatInterval: parsedEnv.WS_HEARTBEAT_INTERVAL,
    maxConnections: parsedEnv.WS_MAX_CONNECTIONS,
    maxPayload: parsedEnv.WS_MAX_PAYLOAD,
    rateLimit: parsedEnv.WS_RATE_LIMIT,
  },
  security: {
    enkryptApiKey: parsedEnv.ENKRYPTAI_API_KEY,
    enkryptBaseUrl: parsedEnv.ENKRYPTAI_BASE_URL,
    enkryptGuardrailName: parsedEnv.ENKRYPTAI_GUARDRAIL_NAME,
    enkryptTimeoutMs: parsedEnv.ENKRYPTAI_TIMEOUT_MS,
  },
} as const;
