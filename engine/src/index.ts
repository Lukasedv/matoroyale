import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { GameEngine } from './game/GameEngine';
import { SignalRService } from './services/SignalRService';
import { TelemetryService } from './services/TelemetryService';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const telemetry = new TelemetryService();
const signalR = new SignalRService();
const gameEngine = new GameEngine(signalR, telemetry);

// Create WebSocket server for SignalR hub simulation
const wss = new WebSocketServer({ 
  server,
  path: '/gameHub'
});

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const connectionId = `ws-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  console.log(`🔗 New WebSocket connection: ${connectionId}`);
  
  // Add connection to SignalR service
  signalR.addConnection(connectionId, ws);
  
  // Notify game engine of new player
  signalR.simulatePlayerJoined(connectionId);
  
  // Handle incoming messages
  ws.on('message', (data) => {
    try {
      const message = JSON.parse(data.toString());
      console.log(`📨 Message from ${connectionId}:`, message);
      
      // Handle different message types
      switch (message.type) {
        case 'SendInput':
          signalR.simulatePlayerInput(connectionId, message.direction);
          break;
        default:
          console.log(`Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log(`🔌 WebSocket disconnected: ${connectionId}`);
    signalR.removeConnection(connectionId);
    signalR.simulatePlayerLeft(connectionId);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error(`❌ WebSocket error for ${connectionId}:`, error);
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    players: gameEngine.getPlayerCount(),
    gameState: gameEngine.getGameState(),
  });
});

// Game metrics endpoint
app.get('/metrics', (req, res) => {
  res.json(gameEngine.getMetrics());
});

// Admin endpoints for round management
app.post('/admin/start-round', (req, res) => {
  gameEngine.startRound();
  res.json({ message: 'Round started' });
});

app.post('/admin/end-round', (req, res) => {
  const results = gameEngine.endRound();
  res.json({ message: 'Round ended', results });
});

app.post('/admin/reset-arena', (req, res) => {
  gameEngine.resetArena();
  res.json({ message: 'Arena reset' });
});

// Initialize game engine and start server
async function startServer(): Promise<void> {
  try {
    await signalR.initialize();
    await gameEngine.initialize();
    
    server.listen(PORT, () => {
      console.log(`🎮 Mato Royale Engine running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 WebSocket hub: ws://localhost:${PORT}/gameHub`);
      telemetry.trackEvent('ServerStarted', { port: PORT.toString() });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    telemetry.trackException(error as Error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🛑 Shutting down gracefully...');
  await gameEngine.shutdown();
  await signalR.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await gameEngine.shutdown();
  await signalR.shutdown();
  process.exit(0);
});

startServer();
