# SentinelFlow Disaster Recovery & SRE Operations Guide

This guide outlines the failover topologies, backup intervals, recovery validation procedures, and migration rollback triggers for the SentinelFlow enterprise platform.

---

## 1. Backup Policy & Schedule

All relational database states and vector indices are archived on a regular schedule to prevent data loss.

| Component | Target Storage | Interval | Retention Period | Verification |
| :--- | :--- | :--- | :--- | :--- |
| **PostgreSQL Database** | AWS S3 / Glacier | Every 6 hours | 30 days | Automated restore test daily |
| **Qdrant Vector Index** | AWS S3 | Daily | 14 days | Semantic search latency checks |
| **Secrets Engine** | HashiCorp Vault / Backup | Daily | 90 days | Encrypted keys decryption checks |

---

## 2. PostgreSQL Backup & Restore

### Automated Dump Trigger
To trigger a manual database archive dump:
```bash
pg_dump -U postgres -h postgres.sentinelflow.svc.cluster.local -d sentinelflow -F c -b -v -f /backups/sentinelflow-db-$(date +%F).dump
```

### Verification & Restore Procedure
To restore a PostgreSQL snapshot onto a clean environment:
```bash
pg_restore -U postgres -h postgres.sentinelflow.svc.cluster.local -d sentinelflow -v /backups/sentinelflow-db-SNAPSHOT.dump
```

---

## 3. Migration Rollbacks

If a database schema deployment causes software regressions:
1. Identify the version targeted for rollback.
2. Run the platform rollback helper:
   ```bash
   pnpm exec ts-node scripts/rollback_migration.ts --version 009
   ```
3. Verify liveness/readiness indicators:
   ```bash
   curl -f http://app.sentinelflow.ai/health/ready
   ```

---

## 4. Disaster Recovery Scenarios

### Scenario A: Database Connection Interruption
1. **Indicator**: Readiness checks return `postgres: unhealthy` with `degraded` HTTP status 503.
2. **Action**:
   * Verify Postgres state: `kubectl get pods -n sentinelflow -l app=postgres`
   * Trigger failover to hot standby if primary replica is down.

### Scenario B: Qdrant Vector Search Outage
1. **Indicator**: SRE context builder throws embedding similarity errors.
2. **Action**:
   * Restart Qdrant deployment: `kubectl rollout restart deployment qdrant -n sentinelflow`
   * Run semantic indexing verification.
