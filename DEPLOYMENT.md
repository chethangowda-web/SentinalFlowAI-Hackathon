# SentinelFlow Production Deployment

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          DNS (Cloudflare)                       │
│                   app.sentinelflow.io                           │
│                   api.sentinelflow.io                           │
└──────────────────────┬────────────────────┬─────────────────────┘
                       │                    │
                       ▼                    ▼
┌──────────────────────────┐    ┌──────────────────────────────┐
│     Vercel (CDN + SPA)   │    │     Render (Web Service)     │
│                          │    │                              │
│  ┌────────────────────┐  │    │  ┌────────────────────────┐  │
│  │  React SPA (built) │  │    │  │  Mastra AI Server     │  │
│  │  - Dashboard       │  │    │  │  - Express API        │  │
│  │  - Incidents       │  │    │  │  - 14 AI Agents       │  │
│  │  - Intelligence    │──┼────┼──│  - WebSocket Gateway  │  │
│  │  - Governance      │  │    │  │  - Background Jobs    │  │
│  │  - Learning Center │  │    │  │  - Event Bus          │  │
│  │  - Agents          │  │    │  │  - AI Orchestrator    │  │
│  │  - Runbooks        │  │    │  └──────┬──────┬──────┬──┘  │
│  └────────────────────┘  │    │         │      │      │      │
│  ┌────────────────────┐  │    │         │      │      │      │
│  │  Static Assets     │  │    │         │      │      │      │
│  │  (gzip/brotli)     │  │    │         │      │      │      │
│  └────────────────────┘  │    └─────────┼──────┼──────┼──────┘
└──────────────────────────┘              │      │      │
                                          │      │      │
                  ┌───────────────────────┼──────┼──────┼──────────┐
                  │                       │      │      │          │
                  ▼                       ▼      ▼      ▼          │
     ┌──────────────────┐    ┌──────────┐  ┌──────────┐           │
     │  Supabase        │    │  Qdrant  │  │ Enkrypt  │           │
     │  PostgreSQL      │    │  Vector  │  │ AI       │           │
     │  (with Pooler)   │    │  Cloud   │  │ Guard.   │           │
     └──────────────────┘    └──────────┘  └──────────┘           │
                                                                   │
     ┌─────────────────────────────────────────────────────────────┘
     │
     ▼
┌──────────┐
│ OpenAI / │
│ Groq     │
│ LLMs     │
└──────────┘
```

### Domain Strategy

| Domain | Target | Provider |
|--------|--------|----------|
| `app.sentinelflow.io` | Vercel (frontend) | Cloudflare DNS → Vercel |
| `api.sentinelflow.io` | Render (backend) | Cloudflare DNS → Render |
| `ws.sentinelflow.io` | Render (WebSocket) | CNAME to api.sentinelflow.io |

---

## Deployment Checklist

### Pre-Deployment

- [ ] All secrets rotated and stored in secure vault
- [ ] `JWT_SECRET` changed from default to strong random value
- [ ] Supabase PostgreSQL SSL enabled and connection pooler configured
- [ ] Qdrant Cloud cluster provisioned and API key generated
- [ ] Enkrypt AI account active and guardrail configured
- [ ] Groq API key active with sufficient quota
- [ ] HuggingFace API token active with inference access
- [ ] Domain DNS records pointed to Vercel and Render
- [ ] SSL/TLS certificates provisioned (auto by Vercel/Render)
- [ ] CORS origins configured for production domains
- [ ] Rate limiting thresholds tuned for expected traffic
- [ ] Monitoring and alerting configured (Render dashboard)
- [ ] Backups configured for Supabase PostgreSQL
- [ ] Team members added to Render and Vercel projects

### Deployment Steps

1. Push code to `main` branch → triggers GitHub Actions
2. CI/CD runs: lint → typecheck → test → build
3. Backend deployed to Render automatically
4. Frontend deployed to Vercel automatically
5. Post-deployment verification runs health checks
6. Manual smoke test of all pages and API endpoints

### Post-Deployment

- [ ] Verify `/health`, `/ready`, `/live` endpoints return 200
- [ ] Test user registration and login flow
- [ ] Verify JWT issuance and refresh token rotation
- [ ] Test WebSocket connection and real-time updates
- [ ] Verify Qdrant vector search (RAG memory)
- [ ] Verify Enkrypt AI guardrail scanning
- [ ] Verify AI agent responses (incident analysis, RCA, etc.)
- [ ] Verify dashboard loads with data
- [ ] Verify incident management CRUD operations
- [ ] Verify runbook execution
- [ ] Verify governance detectors and audit logs
- [ ] Verify learning center feedback loop
- [ ] Test notification delivery (email/slack/teams)
- [ ] Monitor error rates and response times
- [ ] Verify database migrations ran successfully
- [ ] Verify demo data seeded (if applicable)

---

## Environment Variables

See `.env.example` for the complete list with descriptions.

### Required Variables (Must Be Set)

| Variable | Description | Source |
|----------|-------------|--------|
| `NODE_ENV` | Environment (production/staging/development) | — |
| `PORT` | HTTP server port | — |
| `DATABASE_URL` | Supabase PostgreSQL connection string | Supabase Dashboard |
| `DB_SSL` | Database SSL (true for production) | — |
| `JWT_SECRET` | JWT signing secret (min 32 chars, random) | Generate |
| `GROQ_API_KEY` | Groq LLM API key | Groq Console |
| `HUGGINGFACE_API_KEY` | HuggingFace Inference API token | HuggingFace Settings |
| `QDRANT_URL` | Qdrant Cloud cluster URL | Qdrant Cloud |
| `QDRANT_API_KEY` | Qdrant Cloud API key | Qdrant Cloud |
| `QDRANT_COLLECTION` | Qdrant collection name | — |
| `ENKRYPTAI_API_KEY` | Enkrypt AI API key | Enkrypt AI Dashboard |
| `VITE_API_URL` | Backend API URL (https://api.sentinelflow.io) | — |
| `VITE_WS_URL` | WebSocket URL (wss://api.sentinelflow.io) | — |

### Render Secret Files

Store these as Render "Secret Files" for sensitive values:
- `DATABASE_URL`
- `GROQ_API_KEY`
- `HUGGINGFACE_API_KEY`
- `QDRANT_API_KEY`
- `ENKRYPTAI_API_KEY`
- `JWT_SECRET`
- `SMTP_PASS`
- `SLACK_WEBHOOK_URL`
- `TEAMS_WEBHOOK_URL`
- `DISCORD_WEBHOOK_URL`

---

## GitHub Actions CI/CD

File: `.github/workflows/deploy.yml`

### Pipeline Stages

1. **Quality Gate** (lint, typecheck, test)
2. **Build** (Mastra build or use pre-built output)
3. **Deploy Backend** → Render (via `johnbeynon/render-deploy-action`)
4. **Deploy Frontend** → Vercel (via `amondnet/vercel-action`)
5. **Verify** (health checks + page smoke tests)
6. **Rollback** (automatic on failure)

### GitHub Secrets Required

| Secret | Description |
|--------|-------------|
| `RENDER_API_KEY` | Render API key (Settings → API Keys) |
| `RENDER_SERVICE_ID` | Render service ID (from URL or API) |
| `VERCEL_TOKEN` | Vercel access token |
| `VERCEL_ORG_ID` | Vercel organization ID |
| `VERCEL_PROJECT_ID` | Vercel project ID |

---

## Docker Configuration

### Dockerfile

Multi-stage build:
1. **deps** - Install Node.js dependencies
2. **build** - Run Mastra build
3. **runner** - Minimal production image with built output

### docker-compose.yml

Services:
- `backend` - Mastra AI server (port 3000 API, 3001 WS)
- `frontend` - Nginx serving static SPA (port 80/443)

Usage:
```bash
docker compose --env-file .env up -d
```

---

## Production Security Checklist

- [ ] **HTTPS enforced** (Vercel/Render auto-manage TLS)
- [ ] **CORS restricted** to specific origins (not `*`)
- [ ] **Helmet.js** security headers configured (XSS, CSP, etc.)
- [ ] **Rate limiting** at application and infrastructure level
- [ ] **CSP headers** set to prevent XSS
- [ ] **Secure cookies** with `httpOnly`, `secure`, `sameSite=strict`
- [ ] **JWT expiration**: access 15min, refresh 7d
- [ ] **Refresh token rotation** on every refresh
- [ ] **Brute force protection** (5 attempts max)
- [ ] **Input validation** via Zod schemas
- [ ] **SQL injection protection** via parameterized queries
- [ ] **Secrets management**: never commit secrets; use env vars / secret files
- [ ] **Environment validation** on startup (Zod schema)
- [ ] **Dependency scanning** in CI
- [ ] **Audit logging** for all governance events
- [ ] **Enkrypt AI guardrails** for prompt and response scanning

---

## Monitoring Checklist

### Health Endpoints

| Endpoint | Purpose | Expected |
|----------|---------|----------|
| `GET /health` | Overall health + uptime | `200 OK` |
| `GET /ready` | Readiness (accepting traffic) | `200 OK` |
| `GET /live` | Liveness (process alive) | `200 OK` |
| `GET /health/dependencies` | External dependency status | `200 OK` |

### Metrics to Monitor

- **HTTP**: Request rate, latency (p50/p95/p99), error rate (5xx)
- **WebSocket**: Active connections, message rate, drop rate
- **Database**: Connection pool usage, query latency, active connections
- **Qdrant**: Query latency, collection size, vector count
- **AI**: Agent response time, token usage, error rate
- **Enkrypt**: Guardrail pass/fail rate, scan latency
- **JWT**: Issuance rate, refresh rate, invalid token rate

### Render Built-in Monitoring

- CPU / Memory usage
- Response time
- Throughput
- Error rate
- Instance count

### Logging

- Structured JSON logs via Pino
- Log levels: `fatal`, `error`, `warn`, `info`, `debug`, `trace`
- Production level: `info`
- Log shipping: Render log streams → external SIEM (optional)

---

## Rollback Strategy

### Automatic Rollback (CI/CD)

The GitHub Actions workflow automatically triggers rollback if:
- Backend health check fails after deployment
- Frontend verification fails
- Any deployment step errors

### Manual Rollback

**Render Backend:**
```bash
# Via Render Dashboard:
#   Select service → Events → Rollback to previous version

# Via Render API:
curl -X POST https://api.render.com/v1/services/$SERVICE_ID/deploys/$DEPLOY_ID/rollback \
  -H "Authorization: Bearer $RENDER_API_KEY"
```

**Vercel Frontend:**
```bash
# Via Vercel CLI:
npx vercel rollback

# Via Vercel Dashboard:
#   Select project → Deployments → ... → Rollback to stable
```

### Rollback Process

1. CI/CD detects failure → triggers rollback
2. Render: previous stable deployment restored
3. Vercel: previous production deployment restored
4. Notification sent to team
5. Root cause investigation begins

---

## Cost Estimation (Monthly)

| Service | Plan | Estimated Cost |
|---------|------|---------------|
| **Render** (Web Service) | Starter | $7-25/mo |
| **Vercel** (Frontend) | Hobby | Free |
| **Supabase** (PostgreSQL) | Pro | $25/mo |
| **Qdrant Cloud** | Free (1GB) | Free |
| **Qdrant Cloud** (Production) | Standard | $25-100/mo |
| **Enkrypt AI** | Developer | $0-50/mo |
| **Groq API** | Pay-as-you-go | $10-50/mo |
| **HuggingFace API** | Inference (pay-as-you-go) | $0-10/mo |
| **GitHub Actions** | Free (2000 min/mo) | Free |
| **Domain** (sentinelflow.io) | Annual | $10-15/yr |
| **Cloudflare** (DNS) | Free | Free |
| **Total (estimated)** | | **$75-275/mo** |

---

## Domain Configuration

### DNS Records

| Type | Name | Value |
|------|------|-------|
| CNAME | `app` | `cname.vercel-dns.com` |
| CNAME | `api` | `onrender.com` (or Render IP) |
| CNAME | `ws` | `api.sentinelflow.io` |

### SSL Configuration

- **Vercel**: Automatic SSL via Let's Encrypt (included)
- **Render**: Automatic SSL via Let's Encrypt (included)
- **Enforcement**: HSTS preload, TLS 1.2+ only

### CDN Configuration

- **Vercel Edge Network**: Global CDN for static assets
- **Cache rules**: Assets cached 1 year, HTML uncached
- **Brotli compression**: Enabled by default on Vercel
- **Render CDN**: Built-in CDN for API responses

---

## Final Deployment Verification Report

After deployment completes, run this verification:

```bash
# 1. Backend Health
curl https://api.sentinelflow.io/health
curl https://api.sentinelflow.io/ready
curl https://api.sentinelflow.io/live

# 2. API Endpoints
curl https://api.sentinelflow.io/custom/v1/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@sentinelflow.io","password":"test"}'

# 3. WebSocket (using wscat)
wscat -c wss://api.sentinelflow.io?token=YOUR_JWT_TOKEN

# 4. Frontend
curl -I https://app.sentinelflow.io
curl https://app.sentinelflow.io/login
curl https://app.sentinelflow.io/dashboard

# 5. Database
psql "$DATABASE_URL" -c "SELECT count(*) FROM incidents;"

# 6. Qdrant
curl -H "api-key: $QDRANT_API_KEY" "$QDRANT_URL/collections/$QDRANT_COLLECTION"

# 7. Enkrypt AI
curl -H "Authorization: Bearer $ENKRYPTAI_API_KEY" "$ENKRYPTAI_BASE_URL/v1/guardrails"
```

### Verification Criteria

| Component | Pass Criteria |
|-----------|--------------|
| Frontend | All pages load with HTTP 200 |
| Backend | `/health` returns 200 |
| API | Login succeeds, JWT returned |
| WebSocket | Connection upgrade succeeds |
| Database | Query returns results |
| Qdrant | Collection exists and accessible |
| Enkrypt | Guardrail endpoint responds |
| AI Pipeline | Agent returns analysis |
| Background Jobs | Scheduler starts without errors |
| Event Bus | Events published and consumed |
