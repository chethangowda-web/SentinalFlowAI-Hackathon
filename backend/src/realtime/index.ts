import { eventRegistry } from '../events/EventRegistry';

let realtimeInitialized = false;

export async function initializeRealtime(): Promise<void> {
  if (realtimeInitialized) {
    console.warn('[Realtime] Already initialized — skipping duplicate initialization');
    return;
  }
  realtimeInitialized = true;

  // Handlers are registered via @EventHandler decorators.
  // The RealtimeEventPublisher decorators auto-register during
  // initializeEventBus() -> eventRegistry.discoverDecoratedHandlers().
  // No manual registration needed here.

  // WebSocket Gateway will be auto-attached to the Mastra HTTP server
  // via monkey-patched http.createServer in mastra/index.ts
}
