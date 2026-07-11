import { registerApiRoute } from '@mastra/core/server';
import { config } from '../config/config';

const LANDING_PAGE_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>SentinelFlow — Enterprise AI SRE Platform</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #080b14;
    color: #e2e8f0;
    min-height: 100vh;
    line-height: 1.6;
  }
  .gradient-header {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
    border-bottom: 1px solid rgba(99, 102, 241, 0.2);
    padding: 0 1.5rem;
  }
  .header-inner {
    max-width: 1200px;
    margin: 0 auto;
    padding: 2rem 0 1.5rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .brand { display: flex; align-items: center; gap: 0.75rem; }
  .brand-icon {
    width: 44px; height: 44px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    border-radius: 12px;
    display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem;
    box-shadow: 0 0 20px rgba(99,102,241,0.3);
  }
  .brand-text h1 {
    font-size: 1.4rem; font-weight: 700; color: #f1f5f9; letter-spacing: -0.02em;
  }
  .brand-text span {
    font-size: 0.75rem; color: #6366f1; text-transform: uppercase; letter-spacing: 0.08em;
  }
  .header-meta { display: flex; align-items: center; gap: 1rem; flex-wrap: wrap; }
  .version-badge {
    background: rgba(99,102,241,0.15); border: 1px solid rgba(99,102,241,0.3);
    padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; color: #a5b4fc;
  }
  .env-badge {
    background: rgba(34,197,94,0.15); border: 1px solid rgba(34,197,94,0.3);
    padding: 0.3rem 0.75rem; border-radius: 20px; font-size: 0.75rem; color: #4ade80;
  }
  .main { max-width: 1200px; margin: 0 auto; padding: 1.5rem; }
  .status-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1rem; margin-bottom: 2rem; }
  .glass-card {
    background: rgba(30, 41, 59, 0.6);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(99, 102, 241, 0.12);
    border-radius: 14px;
    padding: 1.25rem;
    transition: border-color 0.2s, box-shadow 0.2s;
  }
  .glass-card:hover { border-color: rgba(99,102,241,0.35); box-shadow: 0 0 24px rgba(99,102,241,0.06); }
  .glass-card.highlight {
    background: linear-gradient(135deg, rgba(99,102,241,0.12), rgba(139,92,246,0.08));
    border-color: rgba(99,102,241,0.25);
  }
  .card-title {
    font-size: 0.7rem; text-transform: uppercase; letter-spacing: 0.06em;
    color: #64748b; margin-bottom: 0.75rem;
  }
  .card-value {
    font-size: 1.75rem; font-weight: 700; color: #f1f5f9; margin-bottom: 0.25rem;
  }
  .card-sub {
    font-size: 0.75rem; color: #64748b;
  }
  .status-badge {
    display: inline-flex; align-items: center; gap: 0.4rem;
    padding: 0.2rem 0.65rem; border-radius: 20px;
    font-size: 0.7rem; font-weight: 600;
  }
  .status-badge.healthy { background: rgba(34,197,94,0.15); color: #4ade80; }
  .status-badge.degraded { background: rgba(250,204,21,0.15); color: #facc15; }
  .status-badge.unhealthy { background: rgba(239,68,68,0.15); color: #f87171; }
  .status-badge.offline { background: rgba(100,116,139,0.15); color: #94a3b8; }
  .dot { width: 6px; height: 6px; border-radius: 50%; display: inline-block; }
  .dot.healthy { background: #22c55e; box-shadow: 0 0 8px rgba(34,197,94,0.5); }
  .dot.degraded { background: #facc15; box-shadow: 0 0 8px rgba(250,204,21,0.5); }
  .dot.unhealthy { background: #ef4444; box-shadow: 0 0 8px rgba(239,68,68,0.5); }
  .dot.offline { background: #64748b; box-shadow: 0 0 8px rgba(100,116,139,0.3); }
  .status-row { display: flex; align-items: center; justify-content: space-between; padding: 0.5rem 0; }
  .status-row + .status-row { border-top: 1px solid rgba(99,102,241,0.08); }
  .status-label { font-size: 0.8rem; color: #94a3b8; }
  .section-title {
    font-size: 0.85rem; font-weight: 600; color: #e2e8f0;
    margin-bottom: 1rem; display: flex; align-items: center; gap: 0.5rem;
  }
  .section-title .bar {
    width: 3px; height: 16px; background: linear-gradient(180deg, #6366f1, #8b5cf6);
    border-radius: 2px;
  }
  .endpoint-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(340px, 1fr)); gap: 0.5rem; margin-bottom: 2rem; }
  .endpoint-item {
    display: flex; align-items: center; gap: 0.75rem;
    background: rgba(15,23,42,0.6); border: 1px solid rgba(99,102,241,0.08);
    border-radius: 10px; padding: 0.7rem 1rem;
    font-family: 'SF Mono', SFMono-Regular, 'Cascadia Code', 'Fira Code', Menlo, Consolas, monospace;
    font-size: 0.78rem;
    transition: border-color 0.2s, background 0.2s;
    text-decoration: none; color: #e2e8f0;
  }
  .endpoint-item:hover { border-color: rgba(99,102,241,0.3); background: rgba(30,41,59,0.8); }
  .method-badge {
    font-size: 0.6rem; font-weight: 700; padding: 0.15rem 0.45rem;
    border-radius: 4px; text-transform: uppercase;
    flex-shrink: 0;
  }
  .method-badge.get { background: rgba(34,197,94,0.15); color: #4ade80; }
  .method-badge.post { background: rgba(59,130,246,0.15); color: #60a5fa; }
  .path-text { color: #94a3b8; }
  .link-group { display: flex; gap: 0.75rem; flex-wrap: wrap; margin-bottom: 2rem; }
  .link-btn {
    display: inline-flex; align-items: center; gap: 0.5rem;
    padding: 0.6rem 1.2rem; border-radius: 10px;
    background: rgba(30,41,59,0.8); border: 1px solid rgba(99,102,241,0.15);
    font-size: 0.8rem; color: #e2e8f0; text-decoration: none;
    transition: all 0.2s;
  }
  .link-btn:hover {
    background: rgba(99,102,241,0.15); border-color: rgba(99,102,241,0.35);
    box-shadow: 0 0 16px rgba(99,102,241,0.08);
  }
  .link-btn.primary {
    background: linear-gradient(135deg, rgba(99,102,241,0.25), rgba(139,92,246,0.15));
    border-color: rgba(99,102,241,0.35);
  }
  .link-btn.primary:hover { background: linear-gradient(135deg, rgba(99,102,241,0.35), rgba(139,92,246,0.25)); }
  .footer {
    text-align: center; padding: 2rem 1.5rem; font-size: 0.75rem; color: #475569;
    border-top: 1px solid rgba(99,102,241,0.08);
  }
  .skeleton {
    background: linear-gradient(90deg, rgba(99,102,241,0.06) 25%, rgba(99,102,241,0.12) 50%, rgba(99,102,241,0.06) 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 6px;
    height: 1rem;
    margin-bottom: 0.25rem;
  }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  @media (max-width: 640px) {
    .header-inner { flex-direction: column; align-items: flex-start; }
    .status-grid { grid-template-columns: 1fr; }
    .endpoint-grid { grid-template-columns: 1fr; }
  }
</style>
</head>
<body>
  <header class="gradient-header">
    <div class="header-inner">
      <div class="brand">
        <div class="brand-icon">🛡</div>
        <div class="brand-text">
          <h1>SentinelFlow</h1>
          <span>Enterprise AI SRE Platform</span>
        </div>
      </div>
      <div class="header-meta">
        <span class="version-badge" id="versionBadge">v1.0.0</span>
        <span class="env-badge" id="envBadge">development</span>
      </div>
    </div>
  </header>
  <main class="main">
    <div class="status-grid">
      <div class="glass-card highlight">
        <div class="card-title">Overall Health</div>
        <div id="overallHealth">
          <div class="skeleton" style="width:60%"></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title">Active Agents</div>
        <div id="activeAgents">
          <div class="skeleton" style="width:40%"></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title">Active Workflows</div>
        <div id="activeWorkflows">
          <div class="skeleton" style="width:40%"></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title">Total Runbooks</div>
        <div id="totalRunbooks">
          <div class="skeleton" style="width:40%"></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title">AI Confidence</div>
        <div id="aiConfidence">
          <div class="skeleton" style="width:40%"></div>
        </div>
      </div>
      <div class="glass-card">
        <div class="card-title">Uptime</div>
        <div id="uptime">
          <div class="skeleton" style="width:40%"></div>
        </div>
      </div>
    </div>
    <div class="section-title"><span class="bar"></span>Service Status</div>
    <div class="status-grid" id="serviceStatus">
      <div class="glass-card">
        <div class="card-title">PostgreSQL</div>
        <div id="dbStatus"><span class="status-badge offline"><span class="dot offline"></span>checking...</span></div>
      </div>
      <div class="glass-card">
        <div class="card-title">Qdrant</div>
        <div id="qdrantStatus"><span class="status-badge offline"><span class="dot offline"></span>checking...</span></div>
      </div>
      <div class="glass-card">
        <div class="card-title">Enkrypt AI</div>
        <div id="enkryptStatus"><span class="status-badge offline"><span class="dot offline"></span>checking...</span></div>
      </div>
      <div class="glass-card">
        <div class="card-title">Groq</div>
        <div id="groqStatus"><span class="status-badge offline"><span class="dot offline"></span>checking...</span></div>
      </div>
      <div class="glass-card">
        <div class="card-title">WebSocket</div>
        <div id="wsStatus"><span class="status-badge offline"><span class="dot offline"></span>checking...</span></div>
      </div>
    </div>
    <div class="section-title"><span class="bar"></span>REST API Endpoints</div>
    <div class="endpoint-grid">
      <a href="/health" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/health</span></a>
      <a href="/health/ready" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/health/ready</span></a>
      <a href="/custom/v1/dashboard/overview" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/platform/status</span></a>
      <a href="/custom/v1/dashboard/overview" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/dashboard</span></a>
      <a href="/custom/v1/incidents" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/incidents</span></a>
      <a href="/custom/v1/incidents" class="endpoint-item"><span class="method-badge post">POST</span><span class="path-text">/api/incidents</span></a>
      <a href="/custom/v1/agents" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/agents</span></a>
      <a href="/runbooks" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/runbooks</span></a>
      <a href="/custom/v1/governance/overview" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/governance</span></a>
      <a href="/custom/v1/learning/overview" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/learning</span></a>
      <a href="/custom/v1/intelligence/dashboard" class="endpoint-item"><span class="method-badge get">GET</span><span class="path-text">/api/reports</span></a>
    </div>
    <div class="section-title"><span class="bar"></span>Resources</div>
    <div class="link-group">
      <a href="/custom/v1/swagger.json" class="link-btn primary">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        Swagger / OpenAPI
      </a>
      <a href="https://www.postman.com" target="_blank" class="link-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 20l4-16m-4 0l-4 4h8"/></svg>
        Postman Collection
      </a>
      <a href="https://github.com/chethangowda-web/SentinalFlowAI-Hackathon" target="_blank" class="link-btn">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.73.083-.73 1.205.085 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.295 24 12c0-6.63-5.37-12-12-12"/></svg>
        GitHub Repository
      </a>
    </div>
    <div class="footer">
      SentinelFlow Enterprise AI SRE Platform &mdash; Built on Mastra AI Framework
    </div>
  </main>
  <script>
  const API = '';
  async function fetchJson(url) {
    try {
      const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
      return res.ok ? await res.json() : null;
    } catch { return null; }
  }
  function setStatus(id, status) {
    const el = document.getElementById(id);
    if (!el) return;
    const cls = typeof status === 'string' ? status : (status ? 'healthy' : 'unhealthy');
    const dot = document.createElement('span');
    dot.className = 'dot ' + cls;
    const txt = cls.charAt(0).toUpperCase() + cls.slice(1);
    el.innerHTML = '<span class="status-badge ' + cls + '">' + dot.outerHTML + txt + '</span>';
  }
  function setVal(id, val, sub) {
    const el = document.getElementById(id);
    if (!el) return;
    el.innerHTML = '<div class="card-value">' + val + '</div>' + (sub ? '<div class="card-sub">' + sub + '</div>' : '');
  }
  function setSkeleton(id) {
    const el = document.getElementById(id);
    if (el) el.innerHTML = '<div class="skeleton" style="width:60%"></div>';
  }
  async function loadData() {
    const [health, ready, deps, metrics] = await Promise.all([
      fetchJson(API + '/health'),
      fetchJson(API + '/health/ready'),
      fetchJson(API + '/health/dependencies'),
      fetchJson(API + '/health/metrics'),
    ]);

    // Overall health
    const h = health?.status || (ready?.status === 'healthy' ? 'healthy' : 'unknown');
    document.getElementById('overallHealth').innerHTML =
      '<div class="card-value"><span class="status-badge ' + h + '"><span class="dot ' + h + '"></span>' +
      h.charAt(0).toUpperCase() + h.slice(1) + '</span></div>';

    // Env + version (from ready endpoint)
    const env = ready?.environment || ready?.env || ready?.status || 'production';
    document.getElementById('envBadge').textContent = env;
    const ver = ready?.version || 'v1.0.0';
    document.getElementById('versionBadge').textContent = ver;

    // Auth-protected stats — show graceful fallback
    setVal('activeAgents', '<span style="font-size:0.7rem;color:#64748b">Requires auth</span>', 'Sign in to view agents');
    setVal('activeWorkflows', '<span style="font-size:0.7rem;color:#64748b">Requires auth</span>', 'Sign in to view workflows');
    setVal('totalRunbooks', '<span style="font-size:0.7rem;color:#64748b">Requires auth</span>', 'Sign in to view runbooks');
    setVal('aiConfidence', '<span style="font-size:0.7rem;color:#64748b">Requires auth</span>', 'Sign in for decision metrics');

    // Uptime
    const uptime = metrics?.uptime || 0;
    const days = Math.floor(uptime / 86400);
    const hours = Math.floor((uptime % 86400) / 3600);
    const mins = Math.floor((uptime % 3600) / 60);
    let uptimeStr = '';
    if (days > 0) uptimeStr += days + 'd ';
    uptimeStr += hours + 'h ' + mins + 'm';
    setVal('uptime', uptimeStr || '< 1m', 'Platform uptime');

    // Service statuses from /health/ready
    if (ready) {
      setStatus('dbStatus', ready.database || 'unknown');
      setStatus('qdrantStatus', ready.qdrant || 'offline');
      setStatus('wsStatus', ready.websocket || 'unknown');
      setStatus('groqStatus', ready.groq || 'unknown');
      setStatus('enkryptStatus', ready.enkrypt || 'offline');
    } else if (deps) {
      setStatus('dbStatus', deps.postgres || 'unknown');
    }
  }
  loadData();
  setInterval(loadData, 15000);
  </script>
</body>
</html>`;

export const landingPageRoute = registerApiRoute('/', {
  method: 'GET',
  handler: async (c) => {
    return c.html(LANDING_PAGE_HTML);
  },
});
