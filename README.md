# SentinelFlow

SentinelFlow is an AI-powered SRE (Site Reliability Engineering) and Incident Response automation platform. It monitors system telemetry, detects anomalies, automatically triages incidents, and assists operators with intelligent runbook recommendations.

This repository was created for the SentinalFlowAI-Hackathon.

## Repository Structure

- `[backend/](file:///d:/SentinalFlow%20-%20Anti/SentinalFlow/backend)`: Node.js server powered by Mastra AI framework, executing workflows for anomaly detection, incident analysis, and SRE assistance.
- `[frontend/](file:///d:/SentinalFlow%20-%20Anti/SentinalFlow/frontend)`: React/Vite-based dashboard showing live telemetry, alerts, incident timelines, and AI recommendations.
- `[docs/](file:///d:/SentinalFlow%20-%20Anti/SentinalFlow/docs)`: Architecture diagrams and design details.

## Quick Start

Refer to the [SETUP.md](file:///d:/SentinalFlow%20-%20Anti/SentinalFlow/SETUP.md) for detailed instructions on running backend and frontend local environments.

### 1. Installation
Install dependencies at both workspace directories:
```bash
# In backend/
cd backend
pnpm install

# In frontend/
cd ../frontend
pnpm install
```

### 2. Environment Setup
Configure your backend `.env` variables based on `backend/.env.example`.

### 3. Run Applications
To run the backend development server:
```bash
cd backend
pnpm run dev
```

To run the frontend:
```bash
cd frontend
pnpm run dev
```
