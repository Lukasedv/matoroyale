import { HubConnectionBuilder, HubConnection, LogLevel } from '@microsoft/signalr';
import { Direction } from '../types/GameTypes';

export class NetworkManager extends EventTarget {
  private connection: HubConnection | null = null;
  private isConnected = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  constructor() {
    super();
  }

  async connect(): Promise<void> {
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

  private setupEventHandlers(): void {
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
    if (!this.isConnected || !this.connection) {
      console.warn('⚠️  Cannot send input - not connected');
      return;
    }

    try {
      await this.connection.invoke('SendInput', direction);
    } catch (error) {
      console.error('❌ Failed to send input:', error);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
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
