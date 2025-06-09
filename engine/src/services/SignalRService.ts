// SignalR Service for real-time communication
// Note: In production, this would connect to Azure SignalR Service
// For local development, we'll use WebSocket connections

import { WebSocket } from 'ws';

export class SignalRService {
  private connectionString: string;
  private hubName = 'gameHub';
  private connections = new Map<string, WebSocket>();
  private playerJoinedHandlers: ((connectionId: string) => void)[] = [];
  private playerLeftHandlers: ((connectionId: string) => void)[] = [];
  private playerInputHandlers: ((connectionId: string, direction: number) => void)[] = [];

  constructor() {
    this.connectionString = process.env.SIGNALR_CONNECTION_STRING || '';
    if (!this.connectionString) {
      console.warn('⚠️  SIGNALR_CONNECTION_STRING not set, using mock mode');
    }
  }

  async initialize(): Promise<void> {
    console.log('🔗 Initializing SignalR Service...');
    
    if (!this.connectionString) {
      console.log('📡 Running in mock mode (no SignalR connection)');
      return;
    }

    try {
      // In a real implementation, initialize SignalR connection here
      console.log('📡 SignalR Service initialized');
    } catch (error) {
      console.error('Failed to initialize SignalR:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    console.log('🔌 Shutting down SignalR Service...');
    this.connections.clear();
  }

  // Event handlers
  onPlayerJoined(handler: (connectionId: string) => void): void {
    console.log('📥 Player joined handler registered');
    this.playerJoinedHandlers.push(handler);
  }

  onPlayerLeft(handler: (connectionId: string) => void): void {
    console.log('📤 Player left handler registered');
    this.playerLeftHandlers.push(handler);
  }

  onPlayerInput(handler: (connectionId: string, direction: number) => void): void {
    console.log('🎮 Player input handler registered');
    this.playerInputHandlers.push(handler);
  }

  // Simulation methods for WebSocket integration
  simulatePlayerJoined(connectionId: string): void {
    this.playerJoinedHandlers.forEach(handler => handler(connectionId));
  }

  simulatePlayerLeft(connectionId: string): void {
    this.playerLeftHandlers.forEach(handler => handler(connectionId));
  }

  simulatePlayerInput(connectionId: string, direction: number): void {
    this.playerInputHandlers.forEach(handler => handler(connectionId, direction));
  }

  // Broadcasting methods
  async broadcast(method: string, data: any): Promise<void> {
    const message = JSON.stringify({
      type: method,
      ...data
    });

    if (!this.connectionString) {
      // Send to all WebSocket connections
      console.log(`📢 Broadcasting ${method} to ${this.connections.size} connections`);
      this.connections.forEach((ws, connectionId) => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(message);
        }
      });
      return;
    }

    try {
      // In real implementation, broadcast to all connected clients
      console.log(`📢 Broadcasting ${method} to ${this.connections.size} clients`);
    } catch (error) {
      console.error('Failed to broadcast:', error);
    }
  }

  async sendToConnection(connectionId: string, method: string, data: any): Promise<void> {
    const message = JSON.stringify({
      type: method,
      ...data
    });

    if (!this.connectionString) {
      // Send to specific WebSocket connection
      const ws = this.connections.get(connectionId);
      if (ws && ws.readyState === WebSocket.OPEN) {
        console.log(`📤 Sending ${method} to ${connectionId}`);
        ws.send(message);
      } else {
        console.warn(`⚠️  Connection ${connectionId} not found or not open`);
      }
      return;
    }

    try {
      // In real implementation, send to specific connection
      console.log(`📤 Sending ${method} to connection ${connectionId}`);
    } catch (error) {
      console.error('Failed to send to connection:', error);
    }
  }

  async sendToGroup(groupName: string, method: string, data: any): Promise<void> {
    if (!this.connectionString) {
      console.log(`📤 [MOCK] Sending ${method} to group ${groupName}:`, JSON.stringify(data).substring(0, 100) + '...');
      return;
    }

    try {
      // In real implementation, send to group
      console.log(`📤 Sending ${method} to group ${groupName}`);
    } catch (error) {
      console.error('Failed to send to group:', error);
    }
  }

  // Connection management
  addConnection(connectionId: string, ws: WebSocket): void {
    this.connections.set(connectionId, ws);
    console.log(`🔗 Connection added: ${connectionId} (total: ${this.connections.size})`);
  }

  removeConnection(connectionId: string): void {
    this.connections.delete(connectionId);
    console.log(`🔌 Connection removed: ${connectionId} (remaining: ${this.connections.size})`);
  }

  getConnectionCount(): number {
    return this.connections.size;
  }
}
