import { useAuthStore } from "@/store/authStore";

type MessageCallback = (data: any) => void;

export class WebSocketClient {
  private static instance: WebSocketClient | null = null;
  private ws: WebSocket | null = null;
  private url: string;
  private subscribers: Map<string, Set<MessageCallback>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 20;
  private reconnectInterval = 1000;
  private heartbeatInterval: any = null;

  private constructor(url: string) {
    this.url = url;
  }

  public static getInstance(url: string): WebSocketClient {
    if (!WebSocketClient.instance) {
      WebSocketClient.instance = new WebSocketClient(url);
    }
    return WebSocketClient.instance;
  }

  public connect() {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const token = useAuthStore.getState().token;

    this.ws = new WebSocket(
      `${this.url}?token=${encodeURIComponent(token ?? "")}`
    );

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.triggerEvent('status', { status: 'CONNECTED' });
    };

    this.ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pong') return;
        const topic = msg.type;
        const data = msg.payload;
        this.triggerEvent(topic, data);
      } catch (err) {
        console.error('Failed to parse WebSocket message:', err);
      }
    };

    this.ws.onclose = () => {
      this.stopHeartbeat();
      this.triggerEvent('status', { status: 'DISCONNECTED' });
      this.attemptReconnect();
    };

    this.ws.onerror = (err) => {
      console.error('WebSocket Error:', err);
    };
  }

  private roomRefCount: Map<string, number> = new Map();

  public subscribe(topic: string, callback: MessageCallback, room?: string) {
    const roomName = room ?? topic;
    if (!this.subscribers.has(topic)) {
      this.subscribers.set(topic, new Set());
    }
    this.subscribers.get(topic)!.add(callback);

    const count = this.roomRefCount.get(roomName) ?? 0;
    if (count === 0) {
      this.send({ type: 'subscribe', room: roomName });
    }
    this.roomRefCount.set(roomName, count + 1);

    return () => {
      const subs = this.subscribers.get(topic);
      if (subs) {
        subs.delete(callback);
        if (subs.size === 0) {
          this.subscribers.delete(topic);
        }
      }
      const newCount = (this.roomRefCount.get(roomName) ?? 1) - 1;
      if (newCount <= 0) {
        this.roomRefCount.delete(roomName);
        this.send({ type: 'unsubscribe', room: roomName });
      } else {
        this.roomRefCount.set(roomName, newCount);
      }
    };
  }

  public send(message: Record<string, any>) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  private triggerEvent(topic: string, data: any) {
    const subs = this.subscribers.get(topic);
    if (subs) {
      subs.forEach((cb) => cb(data));
    }
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.triggerEvent('status', { status: 'FAILED' });
      return;
    }

    // Exponential backoff with jitter
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts) + Math.random() * 1000,
      30000
    );

    setTimeout(() => {
      this.reconnectAttempts++;
      this.connect();
    }, delay);
  }

  private startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      this.send({ type: 'ping' });
    }, 15000);
  }

  private stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
  }
}
