import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { GameEngine } from './game/GameEngine';
import { SignalRService } from './services/SignalRService';
import { TelemetryService } from './services/TelemetryService';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Initialize services
const telemetry = new TelemetryService();
const signalR = new SignalRService();
const gameEngine = new GameEngine(signalR, telemetry);

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
    
    app.listen(PORT, () => {
      console.log(`🎮 Mato Royale Engine running on port ${PORT}`);
      console.log(`🔗 Health check: http://localhost:${PORT}/health`);
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
