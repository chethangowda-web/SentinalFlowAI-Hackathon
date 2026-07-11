import { LoggerService } from '../../mastra/services/loggerService';

export interface CostEstimation {
  downtimeCost: number;
  revenueLoss: number;
  slaViolationCost: number;
  engineeringHoursCost: number;
  overallCost: number;
  slaBreachProbability: number;
  engineeringHours: number;
}

export class CostImpactEstimator {
  private log = new LoggerService('CostImpactEstimator');

  /**
   * Estimates financial impact of SRE downtime incidents.
   */
  public estimate(
    severity: string,
    environment: string,
    downtimeMinutes: number = 30
  ): CostEstimation {
    const sev = severity.toUpperCase();
    const env = environment.toLowerCase();

    // 1. Engineering hours based on severity
    let engineeringHours = 2;
    if (sev === 'CRITICAL') {
      engineeringHours = 12;
    } else if (sev === 'HIGH') {
      engineeringHours = 6;
    } else if (sev === 'MEDIUM') {
      engineeringHours = 4;
    }

    const hourlyRate = 150; // standard engineering rate in USD
    const engineeringHoursCost = engineeringHours * hourlyRate;

    // 2. Revenue Loss Rate
    let revenueLossRatePerMin = 0;
    if (env === 'production') {
      if (sev === 'CRITICAL') {
        revenueLossRatePerMin = 3000; // $3k/min
      } else if (sev === 'HIGH') {
        revenueLossRatePerMin = 800;  // $800/min
      } else if (sev === 'MEDIUM') {
        revenueLossRatePerMin = 150;  // $150/min
      }
    } else if (env === 'staging') {
      revenueLossRatePerMin = 10;
    }

    const revenueLoss = downtimeMinutes * revenueLossRatePerMin;

    // 3. SLA Violation Breach Probability & Penalty
    let slaBreachProbability = 0;
    let slaViolationCost = 0;

    if (env === 'production') {
      if (downtimeMinutes > 45) {
        slaBreachProbability = 0.95;
        slaViolationCost = 15000;
      } else if (downtimeMinutes > 15) {
        slaBreachProbability = 0.40;
        slaViolationCost = 5000;
      } else if (downtimeMinutes > 5) {
        slaBreachProbability = 0.10;
        slaViolationCost = 1000;
      }
    }

    const downtimeCost = revenueLoss + (slaBreachProbability * slaViolationCost);
    const overallCost = parseFloat((downtimeCost + engineeringHoursCost).toFixed(2));

    return {
      downtimeCost: parseFloat(downtimeCost.toFixed(2)),
      revenueLoss: parseFloat(revenueLoss.toFixed(2)),
      slaViolationCost: parseFloat((slaBreachProbability * slaViolationCost).toFixed(2)),
      engineeringHoursCost,
      overallCost,
      slaBreachProbability,
      engineeringHours,
    };
  }
}

export const costImpactEstimator = new CostImpactEstimator();
export default costImpactEstimator;
