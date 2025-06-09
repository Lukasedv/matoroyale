import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Direction } from '../types/GameTypes';

export class NetworkManager extends EventTarget {
  private connection: HubConnection | null = null;
  private ws: WebSocket | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private useWebSocket = true; // Use WebSocket for local development

  constructor() {
    super();
  }

  async connect(): Promise<void> {
    if (this.useWebSocket) {
      await this.connectWebSocket();
    } else {
      await this.connectSignalR();
    }
  }

  private async connectWebSocket(): Promise<void> {
    const wsUrl = this.getWebSocketUrl();
    console.log('🔗 Connecting to WebSocket at:', wsUrl);

    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Connected to WebSocket');
      this.dispatchEvent(new CustomEvent('connected'));
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.handleMessage(data);
      } catch (error) {
        console.error('❌ Failed to parse WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      this.isConnected = false;
      console.log('🔌 WebSocket connection closed');
      this.dispatchEvent(new CustomEvent('disconnected'));
    };

    this.ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
      this.handleConnectionError();
    };
  }

  private async connectSignalR(): Promise<void> {
    const signalRUrl = this.getSignalRUrl();
    
    console.log('🔗 Connecting to SignalR at:', signalRUrl);

    this.connection = new HubConnectionBuilder()
      .withUrl(signalRUrl)
      .withAutomaticReconnect({
        nextRetryDelayInMilliseconds: retryContext => {
          return Math.min(1000 * Math.pow(2, retryContext.previousRetryCount), 30000);
        }
      })
      .configureLogging(LogLevel.Information)
      .build();

    this.setupEventHandlers();

    try {
      await this.connection.start();
      this.isConnected = true;
      this.reconnectAttempts = 0;
      console.log('✅ Connected to SignalR');
      this.dispatchEvent(new CustomEvent('connected'));
    } catch (error) {
      console.error('❌ Failed to connect to SignalR:', error);
      this.handleConnectionError();
      throw error;
    }
  }

  private handleMessage(data: any): void {
    console.log('📨 Received message:', data);
    
    switch (data.type) {
      case 'playerJoined':
        console.log('👤 Player joined:', data);
        this.dispatchEvent(new CustomEvent('playerJoined', { detail: data }));
        break;
      case 'gameUpdate':
        this.dispatchEvent(new CustomEvent('gameUpdate', { detail: data }));
        break;
      case 'roundStarted':
        this.dispatchEvent(new CustomEvent('roundStarted', { detail: data }));
        break;
      case 'roundEnded':
        this.dispatchEvent(new CustomEvent('roundEnded', { detail: data }));
        break;
      case 'arenaReset':
        this.dispatchEvent(new CustomEvent('arenaReset', { detail: data }));
        break;
      default:
        console.log('Unknown message type:', data.type);
    }
  }

  private setupEventHandlers(): void {
    this.setupSignalREventHandlers();
  }

  private setupSignalREventHandlers(): void {
    if (!this.connection) return;

    // Connection events
    this.connection.onclose((error) => {
      this.isConnected = false;
      console.log('🔌 SignalR connection closed', error);
      this.dispatchEvent(new CustomEvent('disconnected'));
    });

    this.connection.onreconnecting(() => {
      console.log('🔄 SignalR reconnecting...');
      this.dispatchEvent(new CustomEvent('reconnecting'));
    });

    this.connection.onreconnected(() => {
      console.log('✅ SignalR reconnected');
      this.isConnected = true;
      this.dispatchEvent(new CustomEvent('connected'));
    });

    // Game events
    this.connection.on('playerJoined', (data) => {
      console.log('👤 Player joined:', data);
      this.dispatchEvent(new CustomEvent('playerJoined', { detail: data }));
    });

    this.connection.on('gameUpdate', (data) => {
      this.dispatchEvent(new CustomEvent('gameUpdate', { detail: data }));
    });

    this.connection.on('roundStarted', (data) => {
      this.dispatchEvent(new CustomEvent('roundStarted', { detail: data }));
    });

    this.connection.on('roundEnded', (data) => {
      this.dispatchEvent(new CustomEvent('roundEnded', { detail: data }));
    });

    this.connection.on('arenaReset', (data) => {
      this.dispatchEvent(new CustomEvent('arenaReset', { detail: data }));
    });
  }

  async sendInput(direction: Direction): Promise<void> {
    if (!this.isConnected) {
      console.warn('⚠️  Cannot send input - not connected');
      return;
    }

    try {
      if (this.useWebSocket && this.ws) {
        this.ws.send(JSON.stringify({
          type: 'SendInput',
          direction: direction
        }));
      } else if (this.connection) {
        await this.connection.invoke('SendInput', direction);
      }
    } catch (error) {
      console.error('❌ Failed to send input:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.useWebSocket && this.ws) {
      this.ws.close();
      console.log('🔌 Disconnected from WebSocket');
    } else if (this.connection) {
      try {
        await this.connection.stop();
        console.log('🔌 Disconnected from SignalR');
      } catch (error) {
        console.error('❌ Error disconnecting:', error);
      }
    }
    this.isConnected = false;
  }

  private getSignalRUrl(): string {
    // In production, this would come from environment variables
    // For now, we'll use the engine URL or fallback to localhost
    const engineUrl = import.meta.env.VITE_ENGINE_URL || 'http://localhost:3001';
    return `${engineUrl}/gameHub`;
  }

  private getWebSocketUrl(): string {
    // Convert HTTP URL to WebSocket URL
    const engineUrl = import.meta.env.VITE_ENGINE_URL || 'http://localhost:3001';
    const wsUrl = engineUrl.replace('http://', 'ws://').replace('https://', 'wss://');
    return `${wsUrl}/gameHub`;
  }

  private handleConnectionError(): void {
    this.reconnectAttempts++;
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('❌ Max reconnection attempts reached');
      this.dispatchEvent(new CustomEvent('connectionFailed'));
      return;
    }

    // Attempt to reconnect with exponential backoff
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    console.log(`🔄 Retrying connection in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(console.error);
    }, delay);
  }

  // Custom event helper methods
  on(eventType: string, handler: (data?: any) => void): void {
    this.addEventListener(eventType, (event: Event) => {
      const customEvent = event as CustomEvent;
      handler(customEvent.detail);
    });
  }

  public getConnectionState(): string {
    if (!this.connection) return 'disconnected';
    return this.connection.state;
  }

  public isConnectionActive(): boolean {
    return this.isConnected && this.connection?.state === 'Connected';
  }
}
