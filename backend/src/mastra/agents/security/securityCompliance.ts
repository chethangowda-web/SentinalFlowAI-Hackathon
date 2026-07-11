import { Agent } from '@mastra/core/agent';
import { scanConfigurationTool } from '../../tools/securityTools';
import { agentResponseSchema } from '../../types/agent';
import { z } from 'zod';

export const securityCompliance = new Agent({
  id: 'security-compliance',
  name: 'Security Compliance',
  instructions: `You are the Security Compliance Agent of SentinelFlow.
Your job is to detect secrets, credential leaks, RBAC issues, privilege escalation, and container configuration vulnerabilities.`,
  model: 'groq/llama-3.1-8b-instant',
  tools: { scanConfigurationTool },
});

export const securityComplianceSchema = agentResponseSchema.extend({
  securityIssues: z.array(z.object({
    issueType: z.string(),
    severity: z.string(),
    description: z.string(),
    mitigation: z.string(),
  })),
  enkryptAiPayload: z.any(),
});

/**
 * Programmatic execution logic (Fast, Cheap SRE Platform Path)
 */
export async function executeSecurityComplianceProgrammatically(
  configContent: string,
  configType: string = 'kubernetes'
): Promise<z.infer<typeof securityComplianceSchema>> {
  try {
    // Run the scanConfigurationTool's execute logic
    const scanResult = await scanConfigurationTool.execute({ configContent, configType });
    const findings = scanResult.findings || [];

    const securityIssues = findings.map((f: string, idx: number) => {
      let severity = 'MEDIUM';
      let issueType = 'Configuration Misconfig';
      if (f.toLowerCase().includes('secret') || f.toLowerCase().includes('leak') || f.toLowerCase().includes('credential')) {
        severity = 'CRITICAL';
        issueType = 'Hardcoded Secret';
      } else if (f.toLowerCase().includes('privileged') || f.toLowerCase().includes('escalation')) {
        severity = 'HIGH';
        issueType = 'Privilege Escalation';
      }

      return {
        issueType,
        severity,
        description: f,
        mitigation: `Resolve the warning by externalizing secrets or disabling privileged flags.`,
      };
    });

    const status = securityIssues.length > 0 ? 'warning' : 'success';
    const confidence = 0.95;
    const summary = securityIssues.length > 0
      ? `Identified ${securityIssues.length} compliance and security violations in config.`
      : `Configuration scan completed successfully with 0 issues detected.`;

    const reasoning = `Ran rules-based static check for secret leaks, root access, host PID/network sharing, and resource configurations.`;
    const evidence = findings;

    // Enkrypt AI pre-processed payload containing details
    const enkryptAiPayload = {
      contentScanned: configContent.substring(0, 1000),
      findingsCount: findings.length,
      criticalFindings: securityIssues.filter(i => i.severity === 'CRITICAL' || i.severity === 'HIGH'),
      systemContext: {
        timestamp: new Date().toISOString(),
        isKubernetes: configType.toLowerCase().includes('k8s') || configType.toLowerCase().includes('kubernetes'),
      }
    };

    return {
      agent: 'Security Compliance',
      status,
      confidence,
      summary,
      reasoning,
      evidence,
      recommendations: securityIssues.map(i => i.mitigation),
      nextActions: securityIssues.length > 0 ? ['Audit current IAM credentials', 'Deploy updated configurations to staging'] : [],
      securityIssues,
      enkryptAiPayload,
    };
  } catch (err: any) {
    return {
      agent: 'Security Compliance',
      status: 'failure',
      confidence: 0.8,
      summary: `Failed to perform config compliance check programmatically: ${err?.message || String(err)}`,
      reasoning: 'Error running rules check engine on configuration input.',
      evidence: [err?.message || String(err)],
      recommendations: ['Ensure config content is a valid string.'],
      nextActions: [],
      securityIssues: [],
      enkryptAiPayload: null,
    };
  }
}
