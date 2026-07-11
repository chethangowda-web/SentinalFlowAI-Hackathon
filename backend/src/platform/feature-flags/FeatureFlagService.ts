import { dbClient } from '../../database/client/DatabaseClient';
import { randomUUID } from 'crypto';

export interface TargetingRule {
  environments?: string[];
  organizations?: string[];
  users?: string[];
  rolloutPercentage?: number; // 0 to 100
}

export interface FeatureFlag {
  id: string;
  name: string;
  enabled: boolean;
  rules: TargetingRule;
}

export class FeatureEvaluator {
  public static evaluate(
    flag: FeatureFlag,
    context: { environment: string; organizationId?: string; userId?: string }
  ): boolean {
    if (!flag.enabled) return false;

    const rules = flag.rules;

    // Filter environment
    if (rules.environments && rules.environments.length > 0) {
      if (!rules.environments.includes(context.environment)) {
        return false;
      }
    }

    // Filter organization
    if (rules.organizations && rules.organizations.length > 0) {
      if (!context.organizationId || !rules.organizations.includes(context.organizationId)) {
        return false;
      }
    }

    // Filter user
    if (rules.users && rules.users.length > 0) {
      if (!context.userId || !rules.users.includes(context.userId)) {
        return false;
      }
    }

    // Percentage rollout
    if (rules.rolloutPercentage !== undefined) {
      const hashInput = context.userId || context.organizationId || randomUUID();
      let hash = 0;
      for (let i = 0; i < hashInput.length; i++) {
        hash = (hash << 5) - hash + hashInput.charCodeAt(i);
        hash |= 0; // Convert to 32bit integer
      }
      const score = Math.abs(hash % 100);
      if (score >= rules.rolloutPercentage) {
        return false;
      }
    }

    return true;
  }
}

export class FeatureFlagService {
  public async getFlagValue(
    flagName: string,
    context: { environment: string; organizationId?: string; userId?: string }
  ): Promise<boolean> {
    const rows = await dbClient.query(
      `
      SELECT * FROM platform_feature_flags WHERE name = $1;
    `,
      [flagName]
    );

    if (!rows.length) {
      return false; // Default fallback to disabled if flag doesn't exist
    }

    const flag: FeatureFlag = {
      id: rows[0].id,
      name: rows[0].name,
      enabled: rows[0].enabled,
      rules: rows[0].rules || {},
    };

    return FeatureEvaluator.evaluate(flag, context);
  }

  public async setFlag(name: string, enabled: boolean, rules: TargetingRule = {}): Promise<void> {
    await dbClient.query(
      `
      INSERT INTO platform_feature_flags (id, name, enabled, rules)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (name) DO UPDATE
      SET enabled = EXCLUDED.enabled, rules = EXCLUDED.rules, updated_at = NOW();
    `,
      [randomUUID(), name, enabled, JSON.stringify(rules)]
    );
  }
}

export const featureFlagService = new FeatureFlagService();
export default featureFlagService;
