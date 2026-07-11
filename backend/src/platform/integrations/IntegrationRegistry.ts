import { dbClient } from '../../database/client/DatabaseClient';
import { randomUUID } from 'crypto';

export interface IIntegrationProvider {
  name: string;
  validateCredentials(config: Record<string, any>): Promise<boolean>;
  triggerAction(actionName: string, params: Record<string, any>): Promise<Record<string, any>>;
}

export class SlackProvider implements IIntegrationProvider {
  public name = 'Slack';

  public async validateCredentials(config: Record<string, any>): Promise<boolean> {
    return !!config.webhookUrl || !!config.token;
  }

  public async triggerAction(actionName: string, params: Record<string, any>): Promise<Record<string, any>> {
    if (actionName === 'sendMessage') {
      return { success: true, messageId: `slack-${randomUUID()}` };
    }
    throw new Error(`Unsupported Slack action: ${actionName}`);
  }
}

export class JiraProvider implements IIntegrationProvider {
  public name = 'Jira';

  public async validateCredentials(config: Record<string, any>): Promise<boolean> {
    return !!config.host && !!config.apiKey;
  }

  public async triggerAction(actionName: string, params: Record<string, any>): Promise<Record<string, any>> {
    if (actionName === 'createIssue') {
      return { success: true, issueKey: `SF-${Math.floor(Math.random() * 1000 + 1)}` };
    }
    throw new Error(`Unsupported Jira action: ${actionName}`);
  }
}

export class AWSProvider implements IIntegrationProvider {
  public name = 'AWS';

  public async validateCredentials(config: Record<string, any>): Promise<boolean> {
    return !!config.accessKeyId && !!config.secretAccessKey;
  }

  public async triggerAction(actionName: string, params: Record<string, any>): Promise<Record<string, any>> {
    if (actionName === 'describeInstances') {
      return { success: true, instances: [] };
    }
    throw new Error(`Unsupported AWS action: ${actionName}`);
  }
}

export class IntegrationRegistry {
  private providers: Map<string, IIntegrationProvider> = new Map();

  constructor() {
    this.registerProvider('slack', new SlackProvider());
    this.registerProvider('jira', new JiraProvider());
    this.registerProvider('aws', new AWSProvider());
  }

  public registerProvider(name: string, provider: IIntegrationProvider): void {
    this.providers.set(name.toLowerCase(), provider);
  }

  public async validateAndSave(name: string, providerName: string, config: Record<string, any>): Promise<void> {
    const provider = this.providers.get(providerName.toLowerCase());
    if (!provider) {
      throw new Error(`Integration provider not found: ${providerName}`);
    }

    const isValid = await provider.validateCredentials(config);
    if (!isValid) {
      throw new Error('Invalid credentials configuration for provider');
    }

    // Persist to Postgres database
    await dbClient.query(
      `
      INSERT INTO platform_integrations (id, name, provider, config, enabled)
      VALUES ($1, $2, $3, $4, TRUE)
      ON CONFLICT (name) DO UPDATE
      SET config = EXCLUDED.config, updated_at = NOW();
    `,
      [randomUUID(), name, providerName, JSON.stringify(config)]
    );
  }

  public async triggerAction(
    integrationName: string,
    actionName: string,
    params: Record<string, any>
  ): Promise<Record<string, any>> {
    const rows = await dbClient.query(
      `
      SELECT * FROM platform_integrations WHERE name = $1 AND enabled = TRUE;
    `,
      [integrationName]
    );

    if (!rows.length) {
      throw new Error(`Enabled integration not found: ${integrationName}`);
    }

    const integration = rows[0];
    const provider = this.providers.get(integration.provider.toLowerCase());
    if (!provider) {
      throw new Error(`Provider not loaded: ${integration.provider}`);
    }

    return provider.triggerAction(actionName, params);
  }
}

export const integrationRegistry = new IntegrationRegistry();
export default integrationRegistry;
