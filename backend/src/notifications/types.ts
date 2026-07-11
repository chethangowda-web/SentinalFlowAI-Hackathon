export interface Notification {
  id: string;
  eventId: string;
  correlationId?: string;
  channel: string;
  recipient: string;
  status: 'QUEUED' | 'DELIVERED' | 'FAILED';
  attemptCount: number;
  providerName?: string;
  providerResponse?: any;
  errorMessage?: string;
  templateVersion?: string;
  renderedPayload?: string;
  retryHistory?: Array<{ attempt: number; error: string; timestamp: string }>;
  createdAt?: string;
  deliveredAt?: string;
  failedAt?: string;
}

export interface NotificationPreference {
  userId: string;
  slackWebhook?: string;
  teamsWebhook?: string;
  discordWebhook?: string;
  email?: string;
  webhookUrl?: string;
  preferences: Record<string, any>;
}

export interface ProviderResponse {
  success: boolean;
  providerResponse?: any;
  error?: string;
}

export interface EscalationPolicy {
  id: string;
  incidentId: string;
  currentLevel: number;
  maxLevel: number;
  status: 'ACTIVE' | 'ACKNOWLEDGED' | 'RESOLVED';
  lastEscalatedAt: string;
  nextEscalationAt?: string;
  policyData: {
    levels: Array<{
      level: number;
      timeoutMin: number;
      channels: string[];
      recipients: string[];
    }>;
  };
}
