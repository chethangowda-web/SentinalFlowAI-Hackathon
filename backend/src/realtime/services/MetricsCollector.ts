export class MetricsCollector {
  private activeConnections = 0;
  private authenticatedUsers = new Set<string>();
  private activeRooms = 0;

  // Rolling latency statistics
  private totalBroadcasts = 0;
  private totalBroadcastDurationMs = 0;
  private rollingBroadcastLatencyMs = 0;

  private totalHeartbeats = 0;
  private totalHeartbeatDurationMs = 0;
  private rollingHeartbeatLatencyMs = 0;

  // Counts
  private messagesSent = 0;
  private messagesReceived = 0;
  private droppedConnections = 0;
  private failedSends = 0;
  private reconnectCount = 0;
  private rateLimitedClientsCount = 0;

  private startTime = Date.now();

  public incrementConnections(): void {
    this.activeConnections++;
  }

  public decrementConnections(): void {
    if (this.activeConnections > 0) this.activeConnections--;
  }

  public addUser(userId: string): void {
    this.authenticatedUsers.add(userId);
  }

  public getActiveUsersCount(): number {
    return this.authenticatedUsers.size;
  }

  public setActiveRooms(count: number): void {
    this.activeRooms = count;
  }

  public recordBroadcast(durationMs: number): void {
    this.totalBroadcasts++;
    this.totalBroadcastDurationMs += durationMs;
    this.rollingBroadcastLatencyMs = this.totalBroadcastDurationMs / this.totalBroadcasts;
  }

  public recordHeartbeat(durationMs: number): void {
    this.totalHeartbeats++;
    this.totalHeartbeatDurationMs += durationMs;
    this.rollingHeartbeatLatencyMs = this.totalHeartbeatDurationMs / this.totalHeartbeats;
  }

  public incrementSent(): void {
    this.messagesSent++;
  }

  public incrementReceived(): void {
    this.messagesReceived++;
  }

  public incrementDropped(): void {
    this.droppedConnections++;
  }

  public incrementFailedSends(): void {
    this.failedSends++;
  }

  public incrementReconnects(): void {
    this.reconnectCount++;
  }

  public incrementRateLimited(): void {
    this.rateLimitedClientsCount++;
  }

  public getStats() {
    const elapsedSeconds = (Date.now() - this.startTime) / 1000;
    return {
      activeConnections: this.activeConnections,
      authenticatedUsers: this.authenticatedUsers.size,
      activeRooms: this.activeRooms,
      averageBroadcastLatencyMs: parseFloat(this.rollingBroadcastLatencyMs.toFixed(2)),
      averageHeartbeatLatencyMs: parseFloat(this.rollingHeartbeatLatencyMs.toFixed(2)),
      messagesSent: this.messagesSent,
      messagesReceived: this.messagesReceived,
      messagesPerSec: parseFloat((this.messagesSent / (elapsedSeconds || 1)).toFixed(2)),
      droppedConnections: this.droppedConnections,
      failedSends: this.failedSends,
      reconnectCount: this.reconnectCount,
      rateLimitedClientsCount: this.rateLimitedClientsCount,
    };
  }

  public getPrometheusMetrics(): string {
    const stats = this.getStats();
    return [
      `# HELP realtime_active_connections Current active WebSocket connections`,
      `# TYPE realtime_active_connections gauge`,
      `realtime_active_connections ${stats.activeConnections}`,
      ``,
      `# HELP realtime_authenticated_users Number of unique authenticated users`,
      `# TYPE realtime_authenticated_users gauge`,
      `realtime_authenticated_users ${stats.authenticatedUsers}`,
      ``,
      `# HELP realtime_active_rooms Number of active subscription rooms`,
      `# TYPE realtime_active_rooms gauge`,
      `realtime_active_rooms ${stats.activeRooms}`,
      ``,
      `# HELP realtime_broadcast_latency_ms Rolling average broadcast latency in milliseconds`,
      `# TYPE realtime_broadcast_latency_ms gauge`,
      `realtime_broadcast_latency_ms ${stats.averageBroadcastLatencyMs}`,
      ``,
      `# HELP realtime_heartbeat_latency_ms Rolling average heartbeat response latency in milliseconds`,
      `# TYPE realtime_heartbeat_latency_ms gauge`,
      `realtime_heartbeat_latency_ms ${stats.averageHeartbeatLatencyMs}`,
      ``,
      `# HELP realtime_messages_sent_total Total messages sent by gateway`,
      `# TYPE realtime_messages_sent_total counter`,
      `realtime_messages_sent_total ${stats.messagesSent}`,
      ``,
      `# HELP realtime_messages_received_total Total messages received by gateway`,
      `# TYPE realtime_messages_received_total counter`,
      `realtime_messages_received_total ${stats.messagesReceived}`,
      ``,
      `# HELP realtime_messages_per_sec Average outgoing messages rate per second`,
      `# TYPE realtime_messages_per_sec gauge`,
      `realtime_messages_per_sec ${stats.messagesPerSec}`,
      ``,
      `# HELP realtime_dropped_connections_total Total connections dropped by server (heartbeat failure)`,
      `# TYPE realtime_dropped_connections_total counter`,
      `realtime_dropped_connections_total ${stats.droppedConnections}`,
      ``,
      `# HELP realtime_failed_sends_total Total failed payload send operations`,
      `# TYPE realtime_failed_sends_total counter`,
      `realtime_failed_sends_total ${stats.failedSends}`,
      ``,
      `# HELP realtime_reconnect_count_total Total session reconnections processed`,
      `# TYPE realtime_reconnect_count_total counter`,
      `realtime_reconnect_count_total ${stats.reconnectCount}`,
      ``,
      `# HELP realtime_rate_limited_clients_total Total clients blocked by rate limiting`,
      `# TYPE realtime_rate_limited_clients_total counter`,
      `realtime_rate_limited_clients_total ${stats.rateLimitedClientsCount}`,
    ].join('\n');
  }
}

export const metricsCollector = new MetricsCollector();
export default metricsCollector;
