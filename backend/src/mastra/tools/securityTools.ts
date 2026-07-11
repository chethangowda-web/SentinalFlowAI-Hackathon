import { createTool } from '@mastra/core/tools';
import { z } from 'zod';

export const scanConfigurationTool = createTool({
  id: 'scanConfiguration',
  description: 'Scan application configuration, deployment descriptors, network policies or credentials for security leaks, RBAC issues, or container vulnerabilities',
  inputSchema: z.object({
    configContent: z.string().describe('The configuration content as string (e.g. YAML, JSON, properties)'),
    configType: z.string().describe('The configuration format/type, e.g. "kubernetes", "dockerfile", "env", "json"'),
  }),
  outputSchema: z.any(),
  execute: async ({ configContent, configType }) => {
    const findings: string[] = [];
    const type = configType.toLowerCase();

    // 1. Secret Leak Detection
    const secretKeywords = [
      'password', 'passwd', 'secret', 'token', 'api_key', 'apikey', 'private_key', 'privatekey',
      'aws_access_key_id', 'aws_secret_access_key', 'client_secret', 'clientsecret'
    ];
    const lines = configContent.split('\n');
    lines.forEach((line, idx) => {
      for (const kw of secretKeywords) {
        const regex = new RegExp(`(${kw})[:=\\s]+["']?([^"']{8,})["']?`, 'i');
        const match = line.match(regex);
        if (match) {
          const val = match[2].trim().toLowerCase();
          if (!val.includes('placeholder') && !val.includes('env(') && !val.includes('$') && !val.includes('my-secret') && !val.includes('change-me')) {
            findings.push(`Potential secret leak on line ${idx + 1}: Key '${match[1]}' seems to contain a hardcoded credential value.`);
          }
        }
      }
    });

    // 2. Kubernetes Configuration Scan
    if (type.includes('kubernetes') || type.includes('k8s') || type.includes('yaml')) {
      if (configContent.includes('privileged: true')) {
        findings.push('Privileged container execution: Container is configured with privileged: true, which is high risk.');
      }
      if (configContent.includes('allowPrivilegeEscalation: true')) {
        findings.push('Privilege escalation allowed: Container configured with allowPrivilegeEscalation: true.');
      }
      if (!configContent.includes('readOnlyRootFilesystem: true')) {
        findings.push('Mutable root filesystem: Container does not configure readOnlyRootFilesystem: true.');
      }
      if (!configContent.includes('runAsNonRoot: true') && configContent.includes('runAsUser: 0')) {
        findings.push('Root user execution: Container is running explicitly as root (runAsUser: 0).');
      }
      if (configContent.includes('hostNetwork: true')) {
        findings.push('Host network namespace sharing: Pod shares the host network namespace (hostNetwork: true).');
      }
      if (configContent.includes('hostPID: true')) {
        findings.push('Host PID namespace sharing: Pod shares the host process ID namespace (hostPID: true).');
      }
      if (configContent.includes('kind: Deployment') || configContent.includes('kind: Pod')) {
        if (!configContent.includes('resources:') || !configContent.includes('limits:')) {
          findings.push('Missing resource limits: Deployment/Pod does not specify CPU/Memory limits, risking resource exhaustion.');
        }
      }
    }

    // 3. Dockerfile Scan
    if (type.includes('docker') || type.includes('dockerfile')) {
      if (configContent.includes('USER root') || (!configContent.includes('USER ') && !configContent.includes('user '))) {
        findings.push('Running container as Root: Dockerfile runs container as root by default. Use USER command.');
      }
      if (configContent.includes('ADD ') && !configContent.includes('COPY ')) {
        findings.push('ADD vs COPY: Use COPY instead of ADD to import local files unless you need tar extraction or URL fetching.');
      }
      if (configContent.includes('.env') || configContent.includes('id_rsa')) {
        findings.push('Sensitive file copy: Dockerfile copies sensitive files like .env or SSH keys.');
      }
    }

    const hasViolations = findings.length > 0;
    return {
      status: hasViolations ? 'warning' : 'success',
      findings,
      scannedType: configType,
      message: hasViolations ? `${findings.length} potential security concerns identified.` : 'Configuration scan completed with no security concerns.',
    };
  },
});
