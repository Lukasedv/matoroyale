// SignalR Service for real-time communication
// Note: In production, this would connect to Azure SignalR Service
// For now, we'll use a mock implementation for local development

export class SignalRService {
  private connectionString: string;
  private hubName = 'gameHub';
  private connections = new Map<string, any>();

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
    // Mock implementation - in reality this would listen to SignalR events
    console.log('📥 Player joined handler registered');
    
    // For demo purposes, simulate player joining after 2 seconds
    setTimeout(() => {
      const mockConnectionId = `mock-${Date.now()}`;
      handler(mockConnectionId);
    }, 2000);
  }

  onPlayerLeft(handler: (connectionId: string) => void): void {
    console.log('📤 Player left handler registered');
  }

  onPlayerInput(handler: (connectionId: string, direction: number) => void): void {
    console.log('🎮 Player input handler registered');
  }

  // Broadcasting methods
  async broadcast(method: string, data: any): Promise<void> {
    if (!this.connectionString) {
      console.log(`📢 [MOCK] Broadcasting ${method}:`, JSON.stringify(data).substring(0, 100) + '...');
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
    if (!this.connectionString) {
      console.log(`📤 [MOCK] Sending ${method} to ${connectionId}:`, JSON.stringify(data).substring(0, 100) + '...');
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
  addConnection(connectionId: string, context: any): void {
    this.connections.set(connectionId, context);
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
