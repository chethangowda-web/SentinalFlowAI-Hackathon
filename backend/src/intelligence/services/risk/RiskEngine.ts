import { DecisionContext, RiskAnalysis, RiskLevel } from '../../types';

export class RiskEngine {
  public calculate(context: DecisionContext): RiskAnalysis {
    const severity = context.incident.severity.toUpperCase();
    const environment = context.incident.environment.toLowerCase();

    // 1. Calculate Service Risk
    let serviceRisk: RiskLevel = 'LOW';
    if (environment === 'production') {
      if (severity === 'CRITICAL' || severity === 'HIGH') {
        serviceRisk = 'CRITICAL';
      } else {
        serviceRisk = 'HIGH';
      }
    } else if (environment === 'staging') {
      serviceRisk = 'MEDIUM';
    }

    // 2. Calculate Availability Risk
    let availabilityImpact = 'None';
    let availabilityRisk: RiskLevel = 'LOW';
    if (severity === 'CRITICAL') {
      availabilityImpact = 'Full Outage';
      availabilityRisk = 'CRITICAL';
    } else if (severity === 'HIGH') {
      availabilityImpact = 'Degraded Performance';
      availabilityRisk = 'HIGH';
    }

    // 3. Calculate Business Risk
    let businessRisk: RiskLevel = 'LOW';
    if (environment === 'production') {
      businessRisk = severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH';
    }

    // 4. Calculate Compliance Risk
    let complianceRisk: RiskLevel = 'LOW';
    if (severity === 'CRITICAL' && environment === 'production') {
      complianceRisk = 'HIGH';
    }

    // 5. Calculate Security Risk
    let securityRisk: RiskLevel = 'LOW';
    if (context.incident.title.toLowerCase().includes('security') || context.incident.title.toLowerCase().includes('auth')) {
      securityRisk = 'CRITICAL';
    }

    // 6. Customer Impact
    let customerImpact = 'None - Dev Environment';
    if (environment === 'production') {
      customerImpact = severity === 'CRITICAL' ? 'High - Live customer traffic impacted' : 'Medium - Degraded service response';
    }

    // 7. Calculate Overall Risk
    const levels: RiskLevel[] = [serviceRisk, availabilityRisk, businessRisk, complianceRisk, securityRisk];
    let overallRisk: RiskLevel = 'LOW';
    if (levels.includes('CRITICAL')) {
      overallRisk = 'CRITICAL';
    } else if (levels.includes('HIGH')) {
      overallRisk = 'HIGH';
    } else if (levels.includes('MEDIUM')) {
      overallRisk = 'MEDIUM';
    }

    const reasoning = `Overall risk is ${overallRisk} because the incident occurred in ${environment} with ${severity} severity, affecting ${availabilityImpact}.`;

    return {
      overallRisk,
      serviceRisk,
      infrastructureRisk: availabilityRisk,
      businessRisk,
      securityRisk,
      complianceRisk,
      customerImpact,
      availabilityImpact,
      reasoning,
    };
  }
}

export const riskEngine = new RiskEngine();
export default riskEngine;
